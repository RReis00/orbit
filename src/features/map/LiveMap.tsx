// src/features/map/LiveMap.tsx
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import * as L from 'leaflet'
import { useEffect, useMemo, useRef } from 'react'
import type { Event, EventMember, LiveStatus } from '../../lib/types'
import { insideGeofence } from '../../lib/geo'

// Corrige ícones default do Leaflet (Vite)
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

function FitOnce({ points, enable }: { points: L.LatLngExpression[]; enable: boolean }) {
  const map = useMap()
  const hasFitOnce = useRef(false)
  const userInteracted = useRef(false)

  // Se o utilizador mexer, não voltamos a auto-fit
  useEffect(() => {
    const onStart = () => {
      userInteracted.current = true
    }
    map.on('movestart', onStart)
    map.on('zoomstart', onStart)
    return () => {
      map.off('movestart', onStart)
      map.off('zoomstart', onStart)
    }
  }, [map])

  // Faz fit só 1x (ou até o utilizador mexer)
  useEffect(() => {
    if (!enable || userInteracted.current || hasFitOnce.current || points.length === 0) return
    const bounds = L.latLngBounds(points as L.LatLngExpression[])
    map.fitBounds(bounds.pad(0.3), { animate: false, maxZoom: 17 })
    hasFitOnce.current = true
  }, [enable, points, map])

  return null
}

export function LiveMap({
  event,
  members,
  live,
  meUserId,
}: {
  event: Event
  members: EventMember[]
  live: LiveStatus[]
  meUserId?: string
}) {
  const center = event.center ?? { lat: 39.744, lng: -8.807 }

  // Pontos a considerar para o fit inicial (geofence + posições live)
  const fitPoints = useMemo(() => {
    const pts: L.LatLngExpression[] = []
    if (event.hasGeofence && event.center) {
      pts.push([event.center.lat, event.center.lng])
    }
    for (const ls of live) pts.push([ls.lastLat, ls.lastLng])
    return pts
  }, [event.hasGeofence, event.center, live])

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={15}
      style={{ height: '256px', width: '100%' }}
      className="rounded-xl overflow-hidden"
      scrollWheelZoom
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Geofence (se ativo) */}
      {event.hasGeofence && event.center && event.radiusM && (
        <Circle
          center={[event.center.lat, event.center.lng]}
          radius={event.radiusM}
          pathOptions={{ color: '#60a5fa', weight: 2, fillOpacity: 0.1 }}
        />
      )}

      {/* Marcadores dos participantes */}
      {live.map((ls) => {
        const member = members.find((m) => m.userId === ls.userId)
        const label = member?.displayName ?? ls.userId.slice(0, 6)
        const you = ls.userId === meUserId
        const inside =
          event.hasGeofence && event.center && event.radiusM
            ? insideGeofence(
                { lat: ls.lastLat, lng: ls.lastLng },
                { lat: event.center.lat, lng: event.center.lng },
                event.radiusM,
              )
            : undefined

        return (
          <Marker key={`${ls.eventId}-${ls.userId}`} position={[ls.lastLat, ls.lastLng]}>
            <Popup>
              <div className="text-sm">
                <div className="font-medium">
                  {label}
                  {you ? ' (tu)' : ''}
                </div>
                {inside !== undefined && (
                  <div className={inside ? 'text-emerald-400' : 'text-red-400'}>
                    {inside ? 'Dentro do raio' : 'Fora do raio'}
                  </div>
                )}
                <div className="opacity-70">
                  Atualizado: {new Date(ls.lastAt).toLocaleTimeString()}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* Fit inicial suave e sem “reset” de zoom */}
      <FitOnce points={fitPoints} enable={true} />
    </MapContainer>
  )
}
