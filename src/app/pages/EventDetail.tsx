// src/app/pages/EventDetail.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEvent, listMembers, joinEvent, updateMemberSharing } from '../../mocks/api'
import { formatDateTimeISO } from '../../lib/date'
import { useCurrentUser } from '../../lib/useCurrentUser'
import type { Event, EventMember, LiveStatus } from '../../lib/types'
import { LiveMap } from '../../features/map/LiveMap'
import { useLivePoll } from '../../lib/useLivePoll'
import { useAlertChannel } from '../../lib/useAlertChannel'
import { AlertRulesPanel } from '../../features/events/AlertRulesPanel'
import { useGeoSend } from '../../lib/useGeoSend'

function formatAgo(iso?: string): string {
  if (!iso) return 'sem dados'
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return 'sem dados'
  const now = Date.now()
  const diffSec = Math.max(0, Math.round((now - t) / 1000))

  if (diffSec < 30) return 'agora'
  if (diffSec < 90) return 'há 1 min'
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `há ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `há ${diffH} h`
  const diffD = Math.round(diffH / 24)
  return `há ${diffD} d`
}

export function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useCurrentUser()

  const [event, setEvent] = useState<Event | null>(null)
  const [members, setMembers] = useState<EventMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [toggling, setToggling] = useState(false)

  useAlertChannel(currentUser?.id)

  const meMember = useMemo(
    () => members.find((m) => m.userId === currentUser?.id),
    [members, currentUser?.id],
  )

  const iAmMember = !!meMember
  const isActive = event?.status === 'active'
  const isScheduled = event?.status === 'scheduled'
  const isEnded = event?.status === 'ended'

  // Envio de geolocalização (cliente -> backend) + coords locais p/ overlay
  const { coords, error: geoError, isWatching, usingFallback, lastSentAt } = useGeoSend({
    enabled: !!(event && iAmMember && meMember?.locationSharingEnabled && isActive),
    eventId: id,
    userId: currentUser?.id,
    intervalMs: 5000,
    minDeltaMeters: 5,
  })

  // Receção periódica (backend -> cliente)
  const { live, loading: liveLoading, error: liveError } = useLivePoll(id, 5000)

  // Sobrepor a minha posição local no live (sem esperar roundtrip)
  const liveForMap = useMemo<LiveStatus[]>(() => {
    if (!coords || !currentUser?.id) return live
    return live.map((ls): LiveStatus =>
      ls.userId === currentUser.id
        ? {
            ...ls,
            lastLat: coords.latitude,
            lastLng: coords.longitude,
            lastAt: new Date().toISOString(),
          }
        : ls,
    )
  }, [live, coords, currentUser?.id])

  // Juntar membros + live e enriquecer com info útil
  const membersWithLive = useMemo(() => {
    return members
      .map((m) => {
        const ls = liveForMap.find((l) => l.userId === m.userId)
        let fenceText: string | null = null
        let distanceText: string | null = null

        if (!event?.hasGeofence || !event.center || !event.radiusM) {
          fenceText = 'Sem geofence'
        } else if (!ls || ls.fenceState === 'unknown') {
          fenceText = 'Estado do raio desconhecido'
        } else if (ls.fenceState === 'inside') {
          fenceText = 'Dentro do raio'
        } else if (ls.fenceState === 'outside') {
          fenceText = 'Fora do raio'
        }

        if (ls?.lastDistanceM != null) {
          distanceText = `${ls.lastDistanceM} m`
        }

        return {
          member: m,
          live: ls,
          fenceText,
          distanceText,
          isMe: m.userId === currentUser?.id,
        }
      })
      .sort((a, b) => {
        // Eu primeiro
        if (a.isMe && !b.isMe) return -1
        if (!a.isMe && b.isMe) return 1
        // depois por nome
        return (a.member.displayName || '').localeCompare(b.member.displayName || '')
      })
  }, [members, liveForMap, event, currentUser?.id])

  // Mensagem amigável sobre o estado da localização
  const locationStatus = useMemo(() => {
    // Evento terminado
    if (isEnded) {
      return {
        main: 'Localização desligada: este evento já terminou.',
        secondary: 'O mapa mostra apenas a última posição conhecida de cada participante, se existir.',
      }
    }

    // Evento ainda não começou
    if (isScheduled) {
      if (!iAmMember) {
        return {
          main: 'Evento ainda não está ativo.',
          secondary: 'Junta-te ao evento. Quando estiver em curso, a tua localização começará a ser partilhada.',
        }
      }
      if (!meMember?.locationSharingEnabled) {
        return {
          main: 'Evento ainda não está ativo e a tua partilha está pausada.',
          secondary: 'Quando o evento começar, podes ligar a partilha para enviares a tua posição.',
        }
      }
      return {
        main: 'Evento ainda não está ativo.',
        secondary: 'Assim que ficar em curso, a tua localização será enviada automaticamente para este evento.',
      }
    }

    // Evento ativo
    if (!iAmMember) {
      return {
        main: 'Não estás a participar neste evento.',
        secondary: 'Clica em "Entrar no evento" para começares a partilhar a tua localização com o grupo.',
      }
    }

    if (!meMember?.locationSharingEnabled) {
      return {
        main: 'Partilha de localização pausada.',
        secondary: 'Clica em "Retomar partilha" para voltares a enviar a tua posição para este evento.',
      }
    }

    if (geoError) {
      return {
        main: 'Não foi possível obter a tua localização.',
        secondary:
          'Confirma se deste permissão de localização ao navegador e se o GPS / localização do dispositivo estão ativos.',
      }
    }

    const modeParts: string[] = []
    if (isWatching) modeParts.push('modo contínuo (watch)')
    if (usingFallback) modeParts.push('intervalos periódicos')
    const modeText = modeParts.length > 0 ? modeParts.join(' + ') : 'modo automático'

    const last =
      lastSentAt != null
        ? `Último envio: ${formatDateTimeISO(lastSentAt)}.`
        : 'Ainda não temos nenhum envio registado.'

    return {
      main: 'A enviar a tua localização em tempo real para este evento.',
      secondary: `Modo: ${modeText}. ${last}`,
    }
  }, [
    isEnded,
    isScheduled,
    iAmMember,
    meMember?.locationSharingEnabled,
    geoError,
    isWatching,
    usingFallback,
    lastSentAt,
  ])

  useEffect(() => {
    let active = true
    async function load() {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const [e, ms] = await Promise.all([getEvent(id), listMembers(id)])
        if (!active) return
        if (!e) {
          setError('Evento não encontrado.')
          setEvent(null)
          setMembers([])
        } else {
          setEvent(e)
          setMembers(ms)
        }
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Erro ao carregar')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id])

  async function handleJoin() {
    if (!id || !currentUser || isEnded) return
    try {
      setJoining(true)
      const joined = await joinEvent(id, {
        userId: currentUser.id,
        displayName: currentUser.name ?? 'Tu',
        locationSharingEnabled: true,
        precisionBlurM: 0,
      })
      setMembers((prev) => {
        const exists = prev.some((m) => m.userId === joined.userId)
        return exists ? prev : [...prev, joined]
      })
    } finally {
      setJoining(false)
    }
  }

  async function toggleSharing() {
    if (!id || !currentUser || !meMember || isEnded) return
    try {
      setToggling(true)
      const updated = await updateMemberSharing(id, currentUser.id, {
        locationSharingEnabled: !meMember.locationSharingEnabled,
      })
      setMembers((prev) => prev.map((m) => (m.userId === updated.userId ? updated : m)))
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 h-64 animate-pulse rounded-2xl bg-white/5" />
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">Erro</h1>
        <p className="text-red-400">{error}</p>
        <Link to="/events/new" className="underline hover:text-white">
          Criar novo evento
        </Link>
      </section>
    )
  }

  if (!event) return null

  const geoHints =
    liveError // só usamos o erro de live aqui para não duplicar o geoError
      ? liveError
      : undefined

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <p className="text-sm text-white/60">
            {formatDateTimeISO(event.startsAt)} — {formatDateTimeISO(event.endsAt)}
          </p>
          {isScheduled && (
            <p className="mt-1 text-xs text-white/60">
              Este evento ainda não está ativo. A localização só será partilhada quando estiver em
              curso.
            </p>
          )}
          {isEnded && (
            <p className="mt-1 text-xs text-white/60">
              Este evento terminou. O mapa mostra apenas a última posição conhecida de cada
              participante, se disponível.
            </p>
          )}
        </div>
        <div className="text-sm">
          <span
            className={
              'rounded-full px-2 py-1 font-medium ' +
              (event.status === 'active'
                ? 'bg-emerald-500/15 text-emerald-300'
                : event.status === 'scheduled'
                ? 'bg-sky-500/15 text-sky-300'
                : 'bg-red-500/15 text-red-300')
            }
          >
            {event.status}
          </span>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Mapa real */}
        <article className="md:col-span-2 rounded-2xl border border-white/10 p-4">
          <h2 className="mb-3 font-semibold">Mapa</h2>

          <LiveMap event={event} members={members} live={liveForMap} meUserId={currentUser?.id} />

          {event.hasGeofence && event.center && event.radiusM ? (
            <p className="mt-3 text-sm text-white/70">
              Geofence: centro ({event.center.lat.toFixed(5)}, {event.center.lng.toFixed(5)}) · raio{' '}
              {event.radiusM} m
              {liveLoading && <span className="ml-2 opacity-70">(a atualizar…)</span>}
            </p>
          ) : (
            <p className="mt-3 text-sm text-white/50">
              Sem geofence neste evento.
              {liveLoading && <span className="ml-2 opacity-70">(a atualizar…)</span>}
            </p>
          )}

          {/* Estado de localização mais amigável */}
          <div className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/80">
            <div>{locationStatus.main}</div>
            {locationStatus.secondary && (
              <div className="mt-0.5 text-white/60">{locationStatus.secondary}</div>
            )}
          </div>

          {/* Erro de live (polling) */}
          {geoHints && (
            <div className="mt-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              {geoHints}
            </div>
          )}
        </article>

        {/* Lateral: Participantes / Controlo */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-white/10 p-4">
            <h3 className="mb-2 font-semibold">Participantes</h3>
            {membersWithLive.length === 0 ? (
              <p className="text-sm text-white/60">Ainda não há participantes.</p>
            ) : (
              <ul className="space-y-2 text-sm text-white/90">
                {membersWithLive.map(({ member, live: liveInfo, fenceText, distanceText, isMe }) => (
                  <li
                    key={member.userId}
                    className={
                      'flex flex-col gap-0.5 rounded-xl px-3 py-2 ' +
                      (isMe ? 'bg-white/5' : 'bg-transparent')
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">
                        {member.displayName}
                        {isMe ? ' (tu)' : ''}
                      </span>
                      <span
                        className={
                          'rounded-full px-2 py-0.5 text-[11px] font-medium ' +
                          (member.locationSharingEnabled
                            ? 'bg-emerald-500/10 text-emerald-200'
                            : 'bg-white/5 text-white/60')
                        }
                      >
                        {member.locationSharingEnabled ? 'partilha ON' : 'partilha OFF'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px] text-white/60">
                      <span className="truncate">
                        {fenceText}
                        {distanceText ? ` · ${distanceText}` : ''}
                      </span>
                      {liveInfo?.lastAt && (
                        <span className="shrink-0">{formatAgo(liveInfo.lastAt)}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 flex items-center justify-between">
              {!iAmMember ? (
                <button
                  onClick={handleJoin}
                  disabled={joining || isEnded}
                  className="rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-gray-900 disabled:cursor-not-allowed disabled:bg-white/50"
                >
                  {isEnded ? 'Evento terminado' : joining ? 'A entrar…' : 'Entrar no evento'}
                </button>
              ) : (
                <button
                  onClick={toggleSharing}
                  disabled={toggling || isEnded}
                  className="rounded-xl bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15 disabled:cursor-not-allowed"
                >
                  {isEnded
                    ? 'Evento terminado'
                    : meMember?.locationSharingEnabled
                    ? 'Pausar partilha'
                    : 'Retomar partilha'}
                </button>
              )}

              <Link to="/events" className="text-sm text-white/70 underline hover:text-white">
                Voltar à lista
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 p-4">
            <h3 className="mb-2 font-semibold">Alertas</h3>
            <AlertRulesPanel eventId={id!} members={members} />
          </div>
        </aside>
      </div>
    </section>
  )
}
