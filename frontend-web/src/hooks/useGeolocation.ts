import { useState, useEffect, useRef, useCallback } from 'react'

interface GeoState {
  coords: [number, number] | null
  error: string | null
  loading: boolean
}

export function useGeolocation(watch = false) {
  const [state, setState] = useState<GeoState>({ coords: null, error: null, loading: true })
  const watchIdRef = useRef<number | null>(null)

  const onSuccess = useCallback((pos: GeolocationPosition) => {
    setState({
      coords: [pos.coords.latitude, pos.coords.longitude],
      error: null,
      loading: false,
    })
  }, [])

  const onError = useCallback((err: GeolocationPositionError) => {
    const message =
      err.code === err.PERMISSION_DENIED
        ? 'Bạn chưa cấp quyền vị trí. Vui lòng cho phép GPS để tiếp tục.'
        : err.code === err.POSITION_UNAVAILABLE
          ? 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.'
          : 'Hết thời gian lấy vị trí. Vui lòng thử lại.'

    setState({ coords: null, error: message, loading: false })
  }, [])

  const options: PositionOptions = { enableHighAccuracy: true, timeout: 10000 }

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ coords: null, error: 'Trình duyệt không hỗ trợ GPS', loading: false })
      return
    }

    setState((prev) => ({ ...prev, loading: true }))

    if (watch) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, options)
      return
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
  }, [watch, onSuccess, onError])

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ coords: null, error: 'Trình duyệt không hỗ trợ GPS', loading: false })
      return
    }

    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, options)
      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }
      }
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
    }
  }, [watch, onSuccess, onError])

  return {
    ...state,
    requestLocation,
  }
}
