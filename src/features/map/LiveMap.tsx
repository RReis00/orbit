// src/features/map/LiveMap.tsx
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import * as L from 'leaflet'
import type { Event, EventMember, LiveStatus } from '../../lib/types'
import { insideGeofence } from '../../lib/geo'
import { useEffect } from 'react'

// Corrige ícones default do Leaflet com Vite
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

function FitOnData({ event, live }: { event: Event; live: LiveStatus[] }) {
  const map = useMap()
  useEffect(() => {
    const latlngs: L.LatLngExpression[] = []
    if (event.hasGeofence && event.center) {
      latlngs.push([event.center.lat, event.center.lng])
    }
    live.forEach((ls) => latlngs.push([ls.lastLat, ls.lastLng]))
    if (latlngs.length > 0) {
      const bounds = L.latLngBounds(latlngs)
      map.fitBounds(bounds.pad(0.3), { animate: false })
    }
  }, [event, live, map])
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
  const center = event.center ?? { lat: 39.744, lng: -8.807 } // fallback
  return (
    <MapContainer
      key={`map-${event.id}`}
      center={[center.lat, center.lng]}
      zoom={15}
      style={{ height: '256px', width: '100%' }}
      className="rounded-xl overflow-hidden"
      scrollWheelZoom
    >
      <TileLayer
        // Podes trocar para MapTiler/OSM com key depois
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Círculo da geofence (se ativo) */}
      {event.hasGeofence && event.center && event.radiusM && (
        <Circle
          center={[event.center.lat, event.center.lng]}
          radius={event.radiusM}
          pathOptions={{ color: '#60a5fa', weight: 2, fillOpacity: 0.1 }}
        />
      )}

      {/* Markers dos participantes */}
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

      <FitOnData event={event} live={live} />
    </MapContainer>
  )
}
