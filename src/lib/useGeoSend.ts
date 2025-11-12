// src/lib/useGeoSend.ts
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
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// ✅ filtro resiliente a leituras mockadas do DevTools
function passesFilters(pos: GeolocationPosition, maxAcc = 1000, maxStaleMs = 15000) {
  const c = pos.coords
  if (typeof c.accuracy === 'number' && c.accuracy > maxAcc) return false

  // Só valida “staleness” se o timestamp parecer epoch ms (>= ~2001)
  const t = typeof pos.timestamp === 'number' ? pos.timestamp : 0
  const looksEpochMs = t > 1e12
  if (looksEpochMs) {
    const isStale = Date.now() - t > maxStaleMs
    if (isStale) return false
  }
  return true
}

export function useGeoSend({
  enabled,
  eventId,
  userId,
  intervalMs = 10000,
  minDeltaMeters = 25,
}: Options) {
  const [error, setError] = useState<string | null>(null)
  const [coordsState, setCoordsState] = useState<GeolocationCoordinates | null>(null)

  const last = useRef<GeolocationCoordinates | null>(null)
  const watchId = useRef<number | null>(null)
  const timer = useRef<number | null>(null)

  // (extra) estado útil para UI/diagnóstico
  const [usingFallback, setUsingFallback] = useState(false)
  const [lastSentAt, setLastSentAt] = useState<string | null>(null)

  useEffect(() => {
    // cleanup helper
    const stopAll = () => {
      if (watchId.current != null) {
        try { navigator.geolocation.clearWatch(watchId.current) } catch {}
        watchId.current = null
      }
      if (timer.current) {
        clearInterval(timer.current)
        timer.current = null
      }
      setUsingFallback(false)
    }

    if (!enabled || !eventId || !userId) {
      stopAll()
      return
    }

    setError(null)

    const geoOpts: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 5000, // mais estável no DEV (e poupa bateria em prod)
      timeout: 15000,
    }

    // ✅ Fallback correto: pede posição “real” a cada tick (não reenvia a última)
    const startIntervalFallback = () => {
      if (timer.current) return
      setUsingFallback(true)
      timer.current = setInterval(() => {
        if (!('geolocation' in navigator)) return
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            if (!passesFilters(pos)) return
            const c = pos.coords
            const prev = last.current
            const movedEnough = !prev || haversineMeters(prev, c) >= minDeltaMeters
            if (!movedEnough) return

            last.current = c
            setCoordsState(c)
            try {
              await postLocation(eventId!, {
                userId: userId!,
                lat: c.latitude,
                lng: c.longitude,
                accuracyM: c.accuracy,
                source: 'foreground_web',
              })
              setLastSentAt(new Date().toISOString())
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Falha ao enviar localização')
            }
          },
          (err) => setError(err.message || 'Erro de geolocalização'),
          geoOpts
        )
      }, intervalMs) as unknown as number
    }

    const onPosition = async (pos: GeolocationPosition) => {
      if (!passesFilters(pos)) return
      const c = pos.coords

      const prev = last.current
      const movedEnough = !prev || haversineMeters(prev, c) >= minDeltaMeters
      if (!movedEnough) return

      last.current = c
      setCoordsState(c)

      try {
        await postLocation(eventId!, {
          userId: userId!,
          lat: c.latitude,
          lng: c.longitude,
          accuracyM: c.accuracy,
          source: 'foreground_web',
        })
        setLastSentAt(new Date().toISOString())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao enviar localização')
      }
    }

    // ✅ Trata erros por código (evita cair sempre em fallback)
    const onError = (err: GeolocationPositionError) => {
      // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
      setError(err.message || 'Erro de geolocalização')

      if (err.code === err.PERMISSION_DENIED) {
        // Permissão negada → não vale a pena insistir nem fallback
        return
      }
      if (err.code === err.POSITION_UNAVAILABLE) {
        // Comum ao trocar o Sensors → ativa fallback
        startIntervalFallback()
        return
      }
      if (err.code === err.TIMEOUT) {
        // Timeout pontual → mantém o watch, sem fallback imediato
        return
      }
    }

    // Page Visibility: pausa/resume para poupar ruído e bateria
    const rearmWatch = () => {
      if (!('geolocation' in navigator)) return
      try {
        navigator.geolocation.getCurrentPosition(onPosition, onError, geoOpts) // “semente”
        watchId.current = navigator.geolocation.watchPosition(onPosition, onError, geoOpts)
      } catch {
        setError('watchPosition indisponível, a usar fallback por intervalo')
        startIntervalFallback()
      }
    }

    const onVisibility = () => {
      if (document.hidden) {
        if (watchId.current != null) {
          try { navigator.geolocation.clearWatch(watchId.current) } catch {}
          watchId.current = null
        }
      } else {
        if (watchId.current == null) {
          rearmWatch()
        }
      }
    }

    if ('geolocation' in navigator) {
      rearmWatch()
    } else {
      setError('Geolocalização não suportada')
    }

    // se por alguma razão o watch não ficar ativo, ativa fallback
    if (!watchId.current) startIntervalFallback()

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      stopAll()
    }
  }, [enabled, eventId, userId, intervalMs, minDeltaMeters])

  return {
    error,
    coords: coordsState,
    // extras úteis para debugging/UI:
    isWatching: watchId.current != null,
    usingFallback,
    lastSentAt,
  }
}
