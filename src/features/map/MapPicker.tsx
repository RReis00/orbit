// src/features/map/MapPicker.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Circle, Marker, useMap, useMapEvent } from 'react-leaflet'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GeoPoint } from '../../lib/types'

// Corrige ícones default do Leaflet (Vite) — igual ao LiveMap
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = defaultIcon

type Props = {
  open: boolean
  initialCenter?: GeoPoint | null
  radiusM: number
  onCancel: () => void
  onConfirm: (center: GeoPoint) => void
}

function clampLatLng(lat?: number, lng?: number): GeoPoint | null {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return null
  return {
    lat: Math.max(-90, Math.min(90, lat)),
    lng: Math.max(-180, Math.min(180, lng)),
  }
}

function FitToCircle({ center, enable }: { center?: GeoPoint | null; enable: boolean }) {
  const map = useMap()
  const fitted = useRef(false)
  useEffect(() => {
    if (!enable || fitted.current || !center) return
    const bounds = L.latLng(center.lat, center.lng).toBounds(1000) // caixa inicial
    map.fitBounds(bounds.pad(1), { animate: false, maxZoom: 17 })
    fitted.current = true
  }, [enable, center, map])
  return null
}

function ClickToSet({ setPoint }: { setPoint: (pt: GeoPoint) => void }) {
  useMapEvent('click', (e) => {
    const c = clampLatLng(e.latlng.lat, e.latlng.lng)
    if (c) setPoint(c)
  })
  return null
}

export function MapPickerModal({ open, initialCenter, radiusM, onCancel, onConfirm }: Props) {
  const [center, setCenter] = useState<GeoPoint | null>(initialCenter ?? null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCenter(initialCenter ?? null)
    setGeoError(null)
  }, [open, initialCenter])

  const mapCenter = useMemo(() => {
    if (center) return [center.lat, center.lng] as [number, number]
    // fallback: Leiria-ish para não ficar no (0,0)
    return [39.744, -8.807] as [number, number]
  }, [center])

  function handleUseMyLocation() {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocalização não suportada neste navegador.')
      return
    }
    setGeoLoading(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = clampLatLng(pos.coords.latitude, pos.coords.longitude)
        if (!c) setGeoError('Leitura inválida da posição.')
        else setCenter(c)
        setGeoLoading(false)
      },
      (err) => {
        setGeoError(err?.message || 'Não foi possível obter a tua localização.')
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      {/* modal */}
      <div className="relative z-10 w-[min(100vw-2rem,900px)] rounded-2xl border border-white/10 bg-[#0b0b0f] p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Escolher no mapa</h3>
          <button
            onClick={onCancel}
            className="rounded-xl bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
          >
            Fechar
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-white/70">
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={geoLoading}
            className="rounded-xl bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15 disabled:cursor-not-allowed"
          >
            {geoLoading ? 'A obter localização…' : 'Usar a minha localização'}
          </button>
          {center && (
            <span>
              Centro: ({center.lat.toFixed(5)}, {center.lng.toFixed(5)}) · Raio: {radiusM} m
            </span>
          )}
          {geoError && <span className="text-amber-300/80">{geoError}</span>}
        </div>

        <div className="rounded-xl overflow-hidden">
          <MapContainer
            center={mapCenter}
            zoom={center ? 15 : 13}
            style={{ height: 420, width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <ClickToSet setPoint={setCenter} />
            <FitToCircle center={center} enable={!initialCenter} />

            {center && (
              <>
                <Marker
                  position={[center.lat, center.lng]}
                  draggable
                  eventHandlers={{
                    dragend: (e) => {
                      const m = e.target as L.Marker
                      const p = m.getLatLng()
                      const c = clampLatLng(p.lat, p.lng)
                      if (c) setCenter(c)
                    },
                  }}
                />
                <Circle
                  center={[center.lat, center.lng]}
                  radius={radiusM}
                  pathOptions={{ color: '#60a5fa', weight: 2, fillOpacity: 0.1 }}
                />
              </>
            )}
          </MapContainer>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl px-3 py-1.5 text-sm text-white/80 hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            onClick={() => center && onConfirm(center)}
            disabled={!center}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-900 disabled:cursor-not-allowed disabled:bg-white/50"
          >
            Confirmar centro
          </button>
        </div>
      </div>
    </div>
  )
}
