import { useState, useEffect } from 'react'

interface GeoState {
  coords: [number, number] | null
  error: string | null
  loading: boolean
}

export function useGeolocation(watch = false) {
  const [state, setState] = useState<GeoState>({ coords: null, error: null, loading: true })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ coords: null, error: 'Trình duyệt không hỗ trợ GPS', loading: false })
      return
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setState({
        coords: [pos.coords.latitude, pos.coords.longitude],
        error: null,
        loading: false,
      })
    }

    const onError = (err: GeolocationPositionError) => {
      setState({ coords: null, error: err.message, loading: false })
    }

    const options: PositionOptions = { enableHighAccuracy: true, timeout: 10000 }

    if (watch) {
      const id = navigator.geolocation.watchPosition(onSuccess, onError, options)
      return () => navigator.geolocation.clearWatch(id)
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
    }
  }, [watch])

  return state
}
