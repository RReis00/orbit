// src/app/pages/EventNew.tsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createEvent } from '../../mocks/api'
import { useCurrentUser } from '../../lib/useCurrentUser'
import type { GeoPoint } from '../../lib/types'
import { MapPickerModal } from '../../features/map/MapPicker'

function clampLatLng(lat?: number, lng?: number): GeoPoint | null {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return null
  return {
    lat: Math.max(-90, Math.min(90, lat)),
    lng: Math.max(-180, Math.min(180, lng)),
  }
}

export function EventNew() {
  const navigate = useNavigate()
  const { currentUser } = useCurrentUser()

  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [hasGeofence, setHasGeofence] = useState(false)
  const [center, setCenter] = useState<GeoPoint | null>(null)
  const [radiusM, setRadiusM] = useState<number>(150)
  const [loading, setLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [gettingCenter, setGettingCenter] = useState(false)

  const [pickerOpen, setPickerOpen] = useState(false)

  // validação
  const datesValid = useMemo(() => {
    if (!startsAt || !endsAt) return false
    const s = new Date(startsAt).getTime()
    const e = new Date(endsAt).getTime()
    return Number.isFinite(s) && Number.isFinite(e) && s < e
  }, [startsAt, endsAt])

  const centerValid = useMemo(() => {
    if (!hasGeofence) return true
    if (!center) return false
    return (
      typeof center.lat === 'number' &&
      typeof center.lng === 'number' &&
      center.lat >= -90 &&
      center.lat <= 90 &&
      center.lng >= -180 &&
      center.lng <= 180 &&
      radiusM > 0
    )
  }, [hasGeofence, center, radiusM])

  const isValid = title.trim().length >= 1 && title.trim().length <= 80 && datesValid && centerValid

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || !currentUser) return

    try {
      setLoading(true)
      const newEvent = await createEvent({
        title: title.trim(),
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

  // semear centro ao ativar geofence (best-effort)
  useEffect(() => {
    if (!hasGeofence || center) return
    if (!('geolocation' in navigator)) return
    setGettingCenter(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = clampLatLng(pos.coords.latitude, pos.coords.longitude)
        if (c) setCenter(c)
        setGettingCenter(false)
      },
      () => setGettingCenter(false),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    )
  }, [hasGeofence]) 

  function handleUseMyLocation() {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocalização não suportada neste navegador.')
      return
    }
    setGettingCenter(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = clampLatLng(pos.coords.latitude, pos.coords.longitude)
        if (!c) setGeoError('Leitura inválida da posição.')
        else setCenter(c)
        setGettingCenter(false)
      },
      (err) => {
        setGeoError(err?.message || 'Não foi possível obter a tua localização.')
        setGettingCenter(false)
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
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
            {/* Raio */}
            <div className="space-y-2">
              <label className="block text-sm text-white/80">Raio (metros)</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-center">
                <input
                  type="range"
                  min={10}
                  max={5000}
                  step={10}
                  value={radiusM}
                  onChange={(e) => setRadiusM(Number(e.target.value))}
                  className="col-span-2 w-full"
                />
                <input
                  type="number"
                  min={1}
                  value={radiusM}
                  onChange={(e) => setRadiusM(Math.max(1, Number(e.target.value) || 1))}
                  className="rounded-xl bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30"
                />
              </div>
              <p className="text-xs text-white/50">~ {(radiusM / 1000).toFixed(2)} km</p>
            </div>

            {/* Centro */}
            <div className="space-y-2">
              <label className="block text-sm text-white/80">Local do evento</label>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={gettingCenter}
                  className="rounded-xl bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15 disabled:cursor-not-allowed"
                >
                  {gettingCenter ? 'A obter localização…' : 'Usar a minha localização'}
                </button>

                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-gray-900"
                >
                  Escolher no mapa / morada
                </button>

                <button
                  type="button"
                  onClick={() => setCenter(null)}
                  className="rounded-xl bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
                >
                  Limpar local
                </button>
              </div>

              {geoError && <p className="text-xs text-amber-300/80">{geoError}</p>}
              {center && (
                <p className="text-xs text-white/60">
                  Centro definido em ({center.lat.toFixed(5)}, {center.lng.toFixed(5)})
                </p>
              )}
              {!center && (
                <p className="text-xs text-white/50">
                  Escolhe um local usando a tua localização ou pesquisando no mapa.
                </p>
              )}
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
            Preenche o título, datas válidas e, se ligares a geofence, escolhe um local e um raio
            &gt; 0.
          </p>
        )}
      </form>

      {/* Modal do MapPicker */}
      <MapPickerModal
        open={pickerOpen}
        initialCenter={center}
        radiusM={radiusM}
        onCancel={() => setPickerOpen(false)}
        onConfirm={(c) => {
          setCenter(c)
          setPickerOpen(false)
        }}
      />
    </section>
  )
}
