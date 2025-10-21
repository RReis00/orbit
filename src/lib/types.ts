export type EventStatus = 'scheduled' | 'active' | 'ended'

export interface GeoPoint {
  lat: number
  lng: number
}

export interface Event {
  id: string
  title: string
  startsAt: string
  endsAt: string
  hasGeofence: boolean
  center?: GeoPoint
  radiusM?: number
  status: EventStatus
  createdBy: string
  createdAt: string
}

export interface EventMember {
  eventId: string
  userId: string
  displayName: string
  avatarUrl?: string
  locationSharingEnabled: boolean
  precisionBlurM: number
}

export interface LiveStatus {
  eventId: string
  userId: string
  lastAt: string
  lastLat: number
  lastLng: number
  fenceState: 'inside' | 'outside' | 'unknown'
  lastDistanceM?: number
}

export interface LocationUpdate {
  eventId: string
  userId: string
  timestamp: string
  lat: number
  lng: number
  accuracyM?: number
  source?: 'foreground_web' | 'background_ios' | 'background_android'
}

export type NotificationScope = 'event' | 'member'

export interface NotificationRule {
  ruleId: string
  eventId: string
  scope: NotificationScope
  targetUserId?: string
  notifyUserId: string
  onEnter: boolean
  onExit: boolean
  active: boolean
}
