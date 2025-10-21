import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createEvent } from '../../mocks/api'
import { useCurrentUser } from '../../lib/useCurrentUser'
import type { GeoPoint } from '../../lib/types'

export function EventNew() {
  const navigate = useNavigate()
  const { currentUser } = useCurrentUser()

  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [hasGeofence, setHasGeofence] = useState(false)
  const [center, setCenter] = useState<GeoPoint | null>(null)
  const [radiusM, setRadiusM] = useState<number>(300)
  const [loading, setLoading] = useState(false)

  const isValid =
    title.trim().length >= 1 &&
    title.trim().length <= 80 &&
    startsAt &&
    endsAt &&
    new Date(startsAt) < new Date(endsAt) &&
    (!hasGeofence || (center && radiusM > 0))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || !currentUser) return

    try {
      setLoading(true)
      const newEvent = await createEvent({
        title,
        startsAt,
        endsAt,
        hasGeofence,
        center: hasGeofence ? center! : undefined,
        radiusM: hasGeofence ? radiusM : undefined,
        createdBy: currentUser.id,
      })
      navigate(`/events/${newEvent.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Criar Evento</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título */}
        <div className="space-y-2">
          <label className="block text-sm text-white/80">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Pic-nic no Parque"
            className="w-full rounded-xl bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30"
          />
          <p className="text-xs text-white/50">1–80 caracteres</p>
        </div>

        {/* Datas */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm text-white/80">Início</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full rounded-xl bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-white/80">Fim</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full rounded-xl bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>

        {/* Geofence toggle */}
        <div className="flex items-center justify-between rounded-xl border border-white/10 p-4">
          <div>
            <p className="font-medium">Geofence (opcional)</p>
            <p className="text-sm text-white/60">Definir área limite (centro + raio)</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <span className="text-sm">Off</span>
            <input
              type="checkbox"
              checked={hasGeofence}
              onChange={(e) => setHasGeofence(e.target.checked)}
              className="h-5 w-10 cursor-pointer"
            />
            <span className="text-sm">On</span>
          </label>
        </div>

        {/* Se geofence ativa, mostrar inputs */}
        {hasGeofence && (
          <div className="space-y-4 rounded-xl border border-white/10 p-4">
            <div className="space-y-2">
              <label className="block text-sm text-white/80">Raio (metros)</label>
              <input
                type="number"
                min={1}
                value={radiusM}
                onChange={(e) => setRadiusM(Number(e.target.value))}
                className="w-full rounded-xl bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-white/80">Centro (lat, lng)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Lat"
                  value={center?.lat ?? ''}
                  onChange={(e) =>
                    setCenter({ lat: Number(e.target.value), lng: center?.lng ?? 0 })
                  }
                  className="rounded-xl bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Lng"
                  value={center?.lng ?? ''}
                  onChange={(e) =>
                    setCenter({ lat: center?.lat ?? 0, lng: Number(e.target.value) })
                  }
                  className="rounded-xl bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30"
                />
              </div>
              <p className="text-xs text-white/60">
                (Mais tarde isto será escolhido no mapa com um clique.)
              </p>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => history.back()}
            className="rounded-2xl px-4 py-2 text-white/80 hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!isValid || loading}
            className="rounded-2xl bg-white px-4 py-2 font-medium text-gray-900 disabled:cursor-not-allowed disabled:bg-white/50"
          >
            {loading ? 'A criar...' : 'Criar evento'}
          </button>
        </div>

        {!isValid && (
          <p className="text-sm text-red-400/90">
            Preenche o título, datas válidas e, se ligares a geofence, define centro e raio &gt; 0.
          </p>
        )}
      </form>
    </section>
  )
}
