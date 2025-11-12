// src/mocks/api.ts
import { db } from './db'
import type {
  Event,
  EventMember,
  LiveStatus,
  NotificationRule,
  LocationUpdate,
} from '../lib/types'
import { deriveStatus } from '../lib/date'
import { applyBlur, insideGeofence, distanceMeters } from '../lib/geo'
import { eventBus } from '../lib/eventBus'

function clampLatLng(lat?: number, lng?: number) {
  if (typeof lat === 'number' && typeof lng === 'number') {
    return {
      lat: Math.max(-90, Math.min(90, lat)),
      lng: Math.max(-180, Math.min(180, lng)),
    }
  }
  return undefined
}

/* ===================== Events ===================== */

export async function getEvent(id: string): Promise<Event | null> {
  const e = db.events.find((x) => x.id === id)
  if (!e) return null
  const status = deriveStatus(e)
  return { ...e, status }
}

export async function listEvents(): Promise<Event[]> {
  return db.events.map((e) => ({ ...e, status: deriveStatus(e) }))
}

export async function createEvent(
  data: Omit<Event, 'id' | 'status' | 'createdAt'>,
): Promise<Event> {
  const nowIso = new Date().toISOString()
  const center = data.hasGeofence ? clampLatLng(data.center?.lat, data.center?.lng) : undefined

  const event: Event = {
    ...data,
    center,
    id: crypto.randomUUID(),
    createdAt: nowIso,
    status: 'scheduled', // será derivado em get/list
  }
  db.events.push(event)
  return { ...event }
}

/* ===================== Members ===================== */

export async function listMembers(eventId: string): Promise<EventMember[]> {
  return db.eventMembers.filter((m) => m.eventId === eventId)
}

export async function joinEvent(
  eventId: string,
  member: Omit<EventMember, 'eventId'>,
): Promise<EventMember> {
  const event = db.events.find((e) => e.id === eventId)
  if (!event) throw new Error('Evento inexistente')

  const exists = db.eventMembers.find((m) => m.eventId === eventId && m.userId === member.userId)
  if (exists) return exists

  const newMember: EventMember = {
    ...member,
    eventId,
  }
  db.eventMembers.push(newMember)

  // cria liveStatus inicial se não existir
  const lsExists = db.liveStatus.find((ls) => ls.eventId === eventId && ls.userId === member.userId)
  if (!lsExists) {
    const baseLat = event.center?.lat ?? 39.73437
    const baseLng = event.center?.lng ?? -8.79928
    const now = new Date().toISOString()
    const ls: LiveStatus = {
      eventId,
      userId: member.userId,
      lastAt: now,
      lastLat: baseLat,
      lastLng: baseLng,
      fenceState: event.hasGeofence ? 'inside' : 'unknown',
      lastDistanceM:
        event.hasGeofence && event.center && event.radiusM
          ? Math.round(
              distanceMeters(
                { lat: baseLat, lng: baseLng },
                { lat: event.center.lat, lng: event.center.lng },
              ),
            )
          : undefined,
    }
    db.liveStatus.push(ls)
  }

  return newMember
}

export async function updateMemberSharing(
  eventId: string,
  userId: string,
  opts: Partial<Pick<EventMember, 'locationSharingEnabled' | 'precisionBlurM'>>,
): Promise<EventMember> {
  const m = db.eventMembers.find((x) => x.eventId === eventId && x.userId === userId)
  if (!m) throw new Error('Membro não encontrado')
  Object.assign(m, opts)
  return { ...m }
}

/* ===================== Live ===================== */

export async function getLiveStatus(eventId: string): Promise<LiveStatus[]> {
  return db.liveStatus.filter((ls) => ls.eventId === eventId)
}

/** Recebe uma posição e atualiza histórico + live_status (mock), emitindo alertas se cruzar o raio. */
export async function postLocation(
  eventId: string,
  data: Pick<LocationUpdate, 'userId' | 'lat' | 'lng' | 'accuracyM' | 'source'>,
): Promise<LiveStatus> {
  const event = db.events.find((e) => e.id === eventId)
  if (!event) throw new Error('Evento inexistente')

  const member = db.eventMembers.find((m) => m.eventId === eventId && m.userId === data.userId)
  if (!member) throw new Error('Membro não pertence a este evento')
  if (!member.locationSharingEnabled) {
    throw new Error('Partilha desativada para este membro')
  }

  const nowIso = new Date().toISOString()

  // aplica blur conforme preferência do membro
  const blurred = applyBlur({ lat: data.lat, lng: data.lng }, member.precisionBlurM || 0)

  // histórico (opcional no mock; útil p/ debug/replay)
  db.locationUpdates.push({
    eventId,
    userId: data.userId,
    timestamp: nowIso,
    lat: blurred.lat,
    lng: blurred.lng,
    accuracyM: data.accuracyM,
    source: data.source,
  })

  // atualiza/insere live_status
  let ls = db.liveStatus.find((x) => x.eventId === eventId && x.userId === data.userId)
  if (!ls) {
    ls = {
      eventId,
      userId: data.userId,
      lastAt: nowIso,
      lastLat: blurred.lat,
      lastLng: blurred.lng,
      fenceState: 'unknown',
      lastDistanceM: undefined,
    }
    db.liveStatus.push(ls)
  }

  // estado anterior
  const prevState = ls.fenceState

  // atualizar posição atual
  ls.lastAt = nowIso
  ls.lastLat = blurred.lat
  ls.lastLng = blurred.lng

  // calcula estado de geofence e distância se aplicável
  if (event.hasGeofence && event.center && event.radiusM) {
    const isInside = insideGeofence(
      { lat: blurred.lat, lng: blurred.lng },
      { lat: event.center.lat, lng: event.center.lng },
      event.radiusM,
    )
    ls.fenceState = isInside ? 'inside' : 'outside'
    ls.lastDistanceM = Math.round(
      distanceMeters(
        { lat: blurred.lat, lng: blurred.lng },
        { lat: event.center.lat, lng: event.center.lng },
      ),
    )
  } else {
    ls.fenceState = 'unknown'
    ls.lastDistanceM = undefined
  }

  // se mudou de estado (inside <-> outside), aplica regras e emite alertas
  const changed =
    prevState &&
    prevState !== 'unknown' &&
    ls.fenceState !== prevState &&
    ls.fenceState !== 'unknown'

  if (changed) {
    const type: 'enter' | 'exit' = ls.fenceState === 'inside' ? 'enter' : 'exit'
    const rules = db.notificationRules.filter((r) => r.eventId === eventId && r.active)

    const recipients = new Set<string>()
    for (const r of rules) {
      if (r.scope === 'event') {
        if ((type === 'enter' && r.onEnter) || (type === 'exit' && r.onExit)) {
          recipients.add(r.notifyUserId)
        }
      } else if (r.scope === 'member') {
        if (
          r.targetUserId === data.userId &&
          ((type === 'enter' && r.onEnter) || (type === 'exit' && r.onExit))
        ) {
          recipients.add(r.notifyUserId)
        }
      }
    }

    const actor = db.eventMembers.find((m) => m.eventId === eventId && m.userId === data.userId)

    const payload = {
      type,
      eventId,
      actorUserId: data.userId,
      actorName: actor?.displayName,
      distanceM: ls.lastDistanceM,
      whenISO: nowIso,
    }

    for (const notifyUserId of recipients) {
      eventBus.emit(`notify:${notifyUserId}`, { ...payload, notifyUserId })
    }
  }

  return { ...ls }
}

/* ===================== Rules ===================== */

export async function listRules(eventId: string): Promise<NotificationRule[]> {
  return db.notificationRules.filter((r) => r.eventId === eventId)
}

export async function createRule(
  eventId: string,
  data: Omit<NotificationRule, 'ruleId' | 'eventId'>,
): Promise<NotificationRule> {
  const rule: NotificationRule = {
    ...data,
    eventId,
    ruleId: crypto.randomUUID(),
  }
  db.notificationRules.push(rule)
  return { ...rule }
}

export async function toggleRule(ruleId: string, active: boolean): Promise<NotificationRule> {
  const r = db.notificationRules.find((x) => x.ruleId === ruleId)
  if (!r) throw new Error('Regra não encontrada')
  r.active = active
  return { ...r }
}
