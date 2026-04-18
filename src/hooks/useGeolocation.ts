import { useState, useEffect } from 'react'

export type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied'

interface GeolocationResult {
  status: GeoStatus
  coords: [number, number] | null
}

export function useGeolocation(): GeolocationResult {
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [coords, setCoords] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('denied')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords([pos.coords.latitude, pos.coords.longitude])
        setStatus('granted')
      },
      () => setStatus('denied'),
      { timeout: 8000, maximumAge: 300_000 }
    )
  }, [])

  return { status, coords }
}
