export type LatLng = { lat: number; lng: number }

export function distanceMeters(a: LatLng, b: LatLng) {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinDlat = Math.sin(dLat / 2)
  const sinDlng = Math.sin(dLng / 2)
  const h = sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlng * sinDlng
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function insideGeofence(point: LatLng, center: LatLng, radiusM: number): boolean {
  return distanceMeters(point, center) <= radiusM
}

export function applyBlur(p: LatLng, meters: number): LatLng {
  if (!meters || meters <= 0) return p

  const dLat = meters / 111320
  const dLng = meters / (111320 * Math.cos((p.lat * Math.PI) / 180) || 1)
  const round = (value: number, step: number) => Math.round(value / step) * step
  return { lat: round(p.lat, dLat), lng: round(p.lng, dLng) }
}
