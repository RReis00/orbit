import { useEffect } from 'react'
import { eventBus } from './eventBus'
import { useToasts } from '../features/notifications/ToastsProvider'

type NotifyPayload = {
  type: 'enter' | 'exit'
  eventId: string
  actorUserId: string
  actorName?: string
  notifyUserId: string
  distanceM?: number
  whenISO: string
}

export function useAlertChannel(userId?: string) {
  const { addToast } = useToasts()

  useEffect(() => {
    if (!userId) return
    // cada user escuta o seu próprio canal
    const off = eventBus.on<NotifyPayload>(`notify:${userId}`, (p) => {
      const who = p.actorName ?? p.actorUserId.slice(0, 6)
      const what = p.type === 'exit' ? 'saiu do raio' : 'entrou no raio'
      const dist = p.distanceM != null ? ` · ~${p.distanceM} m do centro` : ''
      addToast({ title: 'Alerta de movimento', message: `${who} ${what}${dist}` })
    })
    return off
  }, [userId, addToast])
}
