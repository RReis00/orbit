import { useEffect, useState } from 'react'
import type { LiveStatus } from './types'
import { getLiveStatus } from '../mocks/api'

export function useLivePoll(eventId?: string, intervalMs = 2000) {
  const [live, setLive] = useState<LiveStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    let active = true
    let timer: ReturnType<typeof setTimeout>

    const tick = async () => {
      try {
        setLoading(true)
        const ls = await getLiveStatus(eventId)
        if (!active) return
        setLive(ls)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Erro ao obter live')
      } finally {
        if (active) setLoading(false)
      }
      timer = setTimeout(tick, intervalMs)
    }

    tick()
    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [eventId, intervalMs])

  return { live, loading, error }
}
