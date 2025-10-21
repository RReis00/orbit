import { db } from './db'
import type { Event, EventMember, LiveStatus, NotificationRule } from '../lib/types'
import { deriveStatus } from '../lib/date'

function clampLatLng(lat?: number, lng?: number) {
  if (typeof lat === 'number' && typeof lng === 'number') {
    return {
      lat: Math.max(-90, Math.min(90, lat)),
      lng: Math.max(-180, Math.min(180, lng)),
    }
  }
  return undefined
}

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
    status: 'scheduled',
  }
  db.events.push(event)
  return { ...event }
}

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

  const lsExists = db.liveStatus.find((ls) => ls.eventId === eventId && ls.userId === member.userId)
  if (!lsExists) {
    const baseLat = event.center?.lat ?? 39.744
    const baseLng = event.center?.lng ?? -8.807
    const now = new Date().toISOString()
    const ls: LiveStatus = {
      eventId,
      userId: member.userId,
      lastAt: now,
      lastLat: baseLat,
      lastLng: baseLng,
      fenceState: event.hasGeofence ? 'inside' : 'unknown',
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

export async function getLiveStatus(eventId: string): Promise<LiveStatus[]> {
  return db.liveStatus.filter((ls) => ls.eventId === eventId)
}

export async function listRules(eventId: string): Promise<NotificationRule[]> {
  return db.notificationRules.filter((r) => r.eventId === eventId)
}
