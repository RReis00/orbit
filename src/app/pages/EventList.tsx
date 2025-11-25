// src/app/pages/EventList.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listEvents } from '../../mocks/api'
import type { Event } from '../../lib/types'
import { formatDateTimeISO } from '../../lib/date'

function statusBadge(status: Event['status']) {
  const base = 'rounded-full px-2 py-0.5 text-xs font-medium'
  if (status === 'active') return base + ' bg-emerald-500/15 text-emerald-300'
  if (status === 'scheduled') return base + ' bg-sky-500/15 text-sky-300'
  return base + ' bg-red-500/15 text-red-300'
}

type EventGroupProps = {
  title: string
  events: Event[]
}

function EventGroup({ title, events }: EventGroupProps) {
  if (events.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-white/80">{title}</h2>
      <div className="space-y-2">
        {events.map((e) => (
          <Link
            key={e.id}
            to={`/events/${e.id}`}
            className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm hover:border-white/30 hover:bg-white/10"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium truncate">{e.title}</span>
              <span className={statusBadge(e.status)}>{e.status}</span>
            </div>
            <div className="text-xs text-white/60">
              {formatDateTimeISO(e.startsAt)} — {formatDateTimeISO(e.endsAt)}
            </div>
            {e.hasGeofence && e.center && e.radiusM && (
              <div className="text-xs text-white/60">
                Geofence: raio {e.radiusM} m · centro ({e.center.lat.toFixed(4)},{' '}
                {e.center.lng.toFixed(4)})
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}

export function EventList() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const evts = await listEvents()
        if (!active) return
        setEvents(evts)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Erro ao carregar eventos.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const grouped = useMemo(() => {
    const scheduled = events.filter((e) => e.status === 'scheduled')
    const active = events.filter((e) => e.status === 'active')
    const ended = events.filter((e) => e.status === 'ended')
    return { scheduled, active, ended }
  }, [events])

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Eventos</h1>
          <p className="text-sm text-white/60">
            Vê os teus eventos ativos, futuros e passados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/events/new')}
          className="self-start rounded-2xl bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-white/90"
        >
          Criar novo evento
        </button>
      </header>

      {/* Loading / erro / vazio */}
      {loading && (
        <div className="space-y-3">
          <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
          <div className="space-y-2">
            <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          Ainda não tens eventos.{' '}
          <button
            type="button"
            onClick={() => navigate('/events/new')}
            className="underline hover:text-white"
          >
            Cria o primeiro.
          </button>
        </div>
      )}

      {/* Listas por estado */}
      {!loading && !error && events.length > 0 && (
        <div className="space-y-6">
          <EventGroup title="Ativos" events={grouped.active} />
          <EventGroup title="Agendados" events={grouped.scheduled} />
          <EventGroup title="Terminados" events={grouped.ended} />
        </div>
      )}
    </section>
  )
}
