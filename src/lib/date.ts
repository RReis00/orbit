import type { Event, EventStatus } from './types'

export function deriveStatus(e: Pick<Event, 'startsAt' | 'endsAt'>, now = new Date()): EventStatus {
  const start = new Date(e.startsAt)
  const end = new Date(e.endsAt)
  if (now < start) return 'scheduled'
  if (now > end) return 'ended'
  return 'active'
}

export function formatDateTimeISO(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}
