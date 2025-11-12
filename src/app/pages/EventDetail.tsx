import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEvent, listMembers, joinEvent, updateMemberSharing } from '../../mocks/api'
import { formatDateTimeISO } from '../../lib/date'
import { useCurrentUser } from '../../lib/useCurrentUser'
import type { Event, EventMember } from '../../lib/types'
import { LiveMap } from '../../features/map/LiveMap'
import { useLivePoll } from '../../lib/useLivePoll'
import { useAlertChannel } from '../../lib/useAlertChannel'
import { AlertRulesPanel } from '../../features/events/AlertRulesPanel'
import { useGeoSend } from '../../lib/useGeoSend'

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

  useGeoSend({
    enabled: !!(event && meMember?.locationSharingEnabled && event.status === 'active'),
    eventId: id,
    userId: currentUser?.id,
    intervalMs: 5000,
    minDeltaMeters: 5,
  })

  const { live, loading: liveLoading } = useLivePoll(id, 5000)

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
    if (!id || !currentUser) return
    try {
      setJoining(true)
      const joined = await joinEvent(id, {
        userId: currentUser.id,
        displayName: currentUser.name ?? 'Tu',
        locationSharingEnabled: true,
        precisionBlurM: 0,
      })
      setMembers((prev) => {
        const exists = prev.find((m) => m.userId === joined.userId)
        return exists ? prev : [...prev, joined]
      })
    } finally {
      setJoining(false)
    }
  }

  async function toggleSharing() {
    if (!id || !currentUser || !meMember) return
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

  const iAmMember = !!meMember

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <p className="text-sm text-white/60">
            {formatDateTimeISO(event.startsAt)} — {formatDateTimeISO(event.endsAt)}
          </p>
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
          <LiveMap event={event} members={members} live={live} meUserId={currentUser?.id} />
          {event.hasGeofence && event.center && event.radiusM ? (
            <p className="mt-3 text-sm text-white/70">
              Geofence: centro ({event.center.lat.toFixed(5)}, {event.center.lng.toFixed(5)}) · raio{' '}
              {event.radiusM} m
              {liveLoading && <span className="ml-2 opacity-70">(a atualizar…)</span>}
            </p>
          ) : (
            <p className="mt-3 text-sm text-white/50">
              Sem geofence neste evento.{' '}
              {liveLoading && <span className="ml-2 opacity-70">(a atualizar…)</span>}
            </p>
          )}
        </article>

        {/* Lateral: Participantes / Controlo */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-white/10 p-4">
            <h3 className="mb-2 font-semibold">Participantes</h3>
            {members.length === 0 ? (
              <p className="text-sm text-white/60">Ainda não há participantes.</p>
            ) : (
              <ul className="space-y-2 text-sm text-white/90">
                {members.map((m) => (
                  <li key={m.userId} className="flex items-center justify-between">
                    <span className="truncate">{m.displayName}</span>
                    <span className="text-xs text-white/60">
                      partilha: {m.locationSharingEnabled ? 'ligada' : 'desligada'}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 flex items-center justify-between">
              {!iAmMember ? (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-gray-900 disabled:cursor-not-allowed disabled:bg-white/50"
                >
                  {joining ? 'A entrar…' : 'Entrar no evento'}
                </button>
              ) : (
                <button
                  onClick={toggleSharing}
                  disabled={toggling}
                  className="rounded-xl bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15 disabled:cursor-not-allowed"
                >
                  {meMember?.locationSharingEnabled ? 'Pausar partilha' : 'Retomar partilha'}
                </button>
              )}

              <Link to="/events/new" className="text-sm text-white/70 underline hover:text-white">
                Criar outro evento
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
