import { useEffect, useRef, useState } from 'react'
import { postLocation } from '../mocks/api'

type Options = {
  enabled: boolean
  eventId?: string
  userId?: string
  intervalMs?: number // envio periódico se watchPosition não estiver disponível
  minDeltaMeters?: number // só envia se mexer pelo menos isto
}

function haversineMeters(a: GeolocationCoordinates, b: GeolocationCoordinates) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function useGeoSend({
  enabled,
  eventId,
  userId,
  intervalMs = 10000,
  minDeltaMeters = 25,
}: Options) {
  const [error, setError] = useState<string | null>(null)
  const last = useRef<GeolocationCoordinates | null>(null)
  const watchId = useRef<number | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || !eventId || !userId) {
      // limpar se desligar
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
      if (timer.current) {
        clearInterval(timer.current)
        timer.current = null
      }
      return
    }

    setError(null)

    const onPosition = async (pos: GeolocationPosition) => {
      const coords = pos.coords
      const prev = last.current
      const movedEnough = !prev || haversineMeters(prev, coords) >= minDeltaMeters
      if (!movedEnough) return
      last.current = coords
      try {
        await postLocation(eventId, {
          userId,
          lat: coords.latitude,
          lng: coords.longitude,
          accuracyM: coords.accuracy,
          source: 'foreground_web',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao enviar localização')
      }
    }

    const onError = (err: GeolocationPositionError) => {
      setError(err.message || 'Erro de geolocalização')
    }

    if ('geolocation' in navigator) {
      try {
        watchId.current = navigator.geolocation.watchPosition(onPosition, onError, {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        })
      } catch (e) {
        setError('watchPosition indisponível, a usar fallback por intervalo')
      }
    } else {
      setError('Geolocalização não suportada')
    }

    // fallback: envio periódico da última posição conhecida (se existir)
    if (!watchId.current) {
      timer.current = setInterval(async () => {
        if (!last.current) return
        try {
          const c = last.current
          await postLocation(eventId, {
            userId,
            lat: c.latitude,
            lng: c.longitude,
            accuracyM: c.accuracy,
            source: 'foreground_web',
          })
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Falha ao enviar localização')
        }
      }, intervalMs)
    }

    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
      if (timer.current) {
        clearInterval(timer.current)
        timer.current = null
      }
    }
  }, [enabled, eventId, userId, intervalMs, minDeltaMeters])

  return { error }
}
