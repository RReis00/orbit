import { db } from './db'

const userId = 'user-demo-1'
const now = new Date()
const start = new Date(now.getTime() + 5 * 60 * 1000)
const end = new Date(now.getTime() + 60 * 60 * 1000)

db.events.push({
  id: 'seed-1',
  title: 'Picnic no Parque',
  startsAt: start.toISOString(),
  endsAt: end.toISOString(),
  hasGeofence: true,
  center: { lat: 39.743, lng: -8.807 },
  radiusM: 500,
  status: 'scheduled',
  createdBy: userId,
  createdAt: now.toISOString(),
})

db.eventMembers.push({
  eventId: 'seed-1',
  userId,
  displayName: 'Tu',
  locationSharingEnabled: true,
  precisionBlurM: 0,
})

db.liveStatus.push({
  eventId: 'seed-1',
  userId,
  lastAt: now.toISOString(),
  lastLat: 39.743,
  lastLng: -8.807,
  fenceState: 'inside',
})
