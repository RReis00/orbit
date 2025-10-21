import type { Event, EventMember, LiveStatus, LocationUpdate, NotificationRule } from '../lib/types'

export const db = {
  events: [] as Event[],
  eventMembers: [] as EventMember[],
  liveStatus: [] as LiveStatus[],
  locationUpdates: [] as LocationUpdate[],
  notificationRules: [] as NotificationRule[],
}
