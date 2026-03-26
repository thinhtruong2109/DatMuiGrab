import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box, Card, CardContent, Typography, Button, Chip,
  Divider, Alert, IconButton, TextField, CircularProgress,
} from '@mui/material'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import SendIcon from '@mui/icons-material/Send'
import 'leaflet/dist/leaflet.css'
import { rideApi } from '@/api/ride.api'
import { chatService } from '@/services'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useChatStore } from '@/store/chatStore'
import { useRideStore } from '@/store/rideStore'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, rideStatusLabel, rideStatusColor } from '@/utils/format'
import type { Ride } from '@/types'

const STATUS_STEPS: Record<string, { next: string; label: string; color: 'primary' | 'success' }> = {
  SEARCHING: { next: 'DRIVER_ARRIVING', label: 'Nhận cuốc', color: 'primary' },
  MATCHED: { next: 'DRIVER_ARRIVING', label: 'Bắt đầu đến đón', color: 'primary' },
  DRIVER_ARRIVING: { next: 'IN_PROGRESS', label: 'Đã đón khách', color: 'primary' },
  IN_PROGRESS: { next: 'COMPLETED', label: 'Hoàn thành chuyến', color: 'success' },
}

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
})

function MovingMarker({ position }: { position: [number, number] }) {
  const markerRef = useRef<L.Marker>(null)
  const frameRef = useRef<number | null>(null)
  const currentPositionRef = useRef<[number, number]>(position)

  useEffect(() => {
    const start = currentPositionRef.current
    const end = position
    const startedAt = performance.now()
    const duration = 900

    if (frameRef.current) cancelAnimationFrame(frameRef.current)

    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const lat = start[0] + (end[0] - start[0]) * eased
      const lng = start[1] + (end[1] - start[1]) * eased
      markerRef.current?.setLatLng([lat, lng])

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        currentPositionRef.current = end
        frameRef.current = null
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [position])

  return <Marker ref={markerRef} position={position} icon={driverIcon} />
}

function RouteAutoFit({ points, fallbackCenter }: { points: [number, number][]; fallbackCenter: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] })
      return
    }

    map.flyTo(fallbackCenter, Math.max(map.getZoom(), 14), { duration: 0.8 })
  }, [map, points, fallbackCenter])

  return null
}

const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

async function getRoutePoints(start: [number, number], end: [number, number]) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
    const res = await fetch(url)
    const data = await res.json()
    if (data.routes?.[0]) {
      const route = data.routes[0]
      const coords = route.geometry.coordinates as [number, number][]
      return {
        points: coords.map(([lng, lat]) => [lat, lng] as [number, number]),
        distanceKm: typeof route.distance === 'number' ? route.distance / 1000 : haversineDistance(start[0], start[1], end[0], end[1]),
      }
    }
  } catch {
    // fallback below
  }

  return {
    points: [start, end],
    distanceKm: haversineDistance(start[0], start[1], end[0], end[1]),
  }
}

export default function DriverRidePage() {
  const { currentRide, setCurrentRide } = useRideStore()
  const { messages, addMessage, setMessages, clearMessages } = useChatStore()
  const { user } = useAuthStore()
  const { coords, error: geoError, loading: geoLoading, requestLocation } = useGeolocation(true)
  const coordsRef = useRef<[number, number] | null>(null)
  const currentRideRef = useRef<Ride | null>(null)
  const sendLocationRef = useRef<() => void>(() => {})
  const { subscribe, send } = useWebSocket({
    onConnect: () => {
      sendLocationRef.current()
    },
  })
  const [message, setMessage] = useState('')
  const [updating, setUpdating] = useState(false)
  const [activeRoutePoints, setActiveRoutePoints] = useState<[number, number][]>([])
  const [activeRouteDistanceKm, setActiveRouteDistanceKm] = useState<number | null>(null)

  const sendRideLocation = useCallback(() => {
    const latestRide = currentRideRef.current
    const latestCoords = coordsRef.current
    if (!latestRide || !latestCoords) return
    if (latestRide.status === 'COMPLETED' || latestRide.status === 'CANCELLED') return
    send(`/app/location/${latestRide.id}`, { lat: latestCoords[0], lng: latestCoords[1] })
  }, [send])

  useEffect(() => {
    coordsRef.current = coords
  }, [coords])

  useEffect(() => {
    currentRideRef.current = currentRide
  }, [currentRide])

  useEffect(() => {
    sendLocationRef.current = sendRideLocation
  }, [sendRideLocation])

  useEffect(() => {
    if (!currentRide) return
    clearMessages()
    chatService.getMessagesByRide(currentRide.id).then(setMessages).catch(() => {})
    const unsubChat = subscribe(`/topic/ride/${currentRide.id}/chat`, addMessage)
    const unsubStatus = subscribe(`/topic/ride/${currentRide.id}/status`, (updated: Ride) => {
      setCurrentRide(updated)
    })
    return () => {
      unsubChat()
      unsubStatus()
      clearMessages()
    }
  }, [currentRide?.id])

  // Send location while in ride
  useEffect(() => {
    if (!currentRide || !coords || currentRide.status === 'COMPLETED' || currentRide.status === 'CANCELLED') return
    sendRideLocation()
    const interval = setInterval(() => {
      sendRideLocation()
    }, 3000)
    return () => clearInterval(interval)
  }, [currentRide?.id, currentRide?.status, coords, sendRideLocation])

  useEffect(() => {
    if (!currentRide) {
      setActiveRoutePoints([])
      setActiveRouteDistanceKm(null)
      return
    }

    const pickupPoint: [number, number] = [currentRide.pickupLat, currentRide.pickupLng]
    const destinationPoint: [number, number] = [currentRide.destinationLat, currentRide.destinationLng]

    let start: [number, number] | null = null
    let end: [number, number] | null = null

    if (currentRide.status === 'MATCHED' || currentRide.status === 'DRIVER_ARRIVING') {
      if (coords) {
        start = coords
        end = pickupPoint
      }
    } else if (currentRide.status === 'IN_PROGRESS') {
      start = coords || pickupPoint
      end = destinationPoint
    } else if (currentRide.status === 'COMPLETED') {
      start = pickupPoint
      end = destinationPoint
    }

    if (!start || !end) {
      setActiveRoutePoints([])
      setActiveRouteDistanceKm(null)
      return
    }

    let cancelled = false
    getRoutePoints(start, end).then((result) => {
      if (cancelled) return
      setActiveRoutePoints(result.points)
      setActiveRouteDistanceKm(result.distanceKm)
    })

    return () => {
      cancelled = true
    }
  }, [currentRide, coords])

  const handleUpdateStatus = async () => {
    if (!currentRide) return
    const step = STATUS_STEPS[currentRide.status]
    if (!step) return
    setUpdating(true)
    try {
      const updated = await rideApi.updateStatus(currentRide.id, step.next as any)
      setCurrentRide(updated)
    } finally {
      setUpdating(false)
    }
  }

  const handleSend = () => {
    if (!message.trim() || !currentRide) return
    send(`/app/chat/${currentRide.id}`, { message })
    setMessage('')
  }

  if (geoLoading && !coords) {
    return (
      <Box p={3} display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={400}>
        <CircularProgress size={30} />
        <Typography color="text.secondary" mt={2}>Đang lấy vị trí GPS...</Typography>
      </Box>
    )
  }

  if (!coords) {
    return (
      <Box p={3} display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={400}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: 520, width: '100%' }}>
          {geoError || 'Chưa có vị trí GPS. Vui lòng cấp quyền vị trí để tiếp tục chạy xe.'}
        </Alert>
        <Button variant="contained" onClick={requestLocation}>Cấp quyền vị trí</Button>
      </Box>
    )
  }

  if (!currentRide) {
    return (
      <Box p={3} display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={400}>
        <Typography color="text.secondary" mb={1}>Không có chuyến đi đang hoạt động</Typography>
        <Typography variant="body2" color="text.secondary">Bật online để nhận cuốc mới</Typography>
      </Box>
    )
  }

  const step = STATUS_STEPS[currentRide.status]
  const mapCenter: [number, number] = coords || [currentRide.pickupLat, currentRide.pickupLng]
  const routePhaseLabel =
    currentRide.status === 'IN_PROGRESS'
      ? 'Lộ trình tới điểm đến'
      : currentRide.status === 'MATCHED' || currentRide.status === 'DRIVER_ARRIVING'
        ? 'Lộ trình tới điểm đón'
        : null
  const routeColor = currentRide.status === 'IN_PROGRESS' ? 'success.main' : 'primary.main'

  return (
    <Box p={3} display="flex" gap={3}>
      {/* Left: ride info + chat */}
      <Box flex={1} display="flex" flexDirection="column" gap={2}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>Chuyến đang thực hiện</Typography>
              <Chip label={rideStatusLabel[currentRide.status]} color={rideStatusColor[currentRide.status]} />
            </Box>

            <Box display="flex" flexDirection="column" gap={1} mb={2}>
              <Box display="flex" gap={1}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5, flexShrink: 0 }} />
                <Typography variant="body2">{currentRide.pickupAddress}</Typography>
              </Box>
              <Box display="flex" gap={1}>
                <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: 'error.main', mt: 0.5, flexShrink: 0 }} />
                <Typography variant="body2">{currentRide.destinationAddress}</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">Khách hàng</Typography>
              <Typography fontWeight={600}>{currentRide.customerName}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">Quãng đường</Typography>
              <Typography fontWeight={600}>{currentRide.distanceKm.toFixed(1)} km</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Thu nhập dự kiến</Typography>
              <Typography fontWeight={700} color="primary.main">
                {formatCurrency(currentRide.driverRevenue || currentRide.estimatedPrice * 0.75)}
              </Typography>
            </Box>

            {routePhaseLabel && activeRouteDistanceKm !== null && (
              <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                {routePhaseLabel}: <strong>{activeRouteDistanceKm.toFixed(2)} km</strong>
              </Alert>
            )}

            {step && (
              <Button
                variant="contained"
                color={step.color}
                fullWidth
                size="large"
                onClick={handleUpdateStatus}
                disabled={updating}
                sx={{ mt: 3 }}
              >
                {updating ? <CircularProgress size={20} color="inherit" /> : step.label}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Chat */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box px={2} py={1.5} borderBottom="1px solid" borderColor="divider">
              <Typography fontWeight={600} fontSize={14}>Chat với khách</Typography>
            </Box>
            <Box sx={{ height: 200, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {messages.map((msg) => (
                <Box key={msg.id} display="flex" justifyContent={msg.senderId === user?.id ? 'flex-end' : 'flex-start'}>
                  <Box sx={{
                    maxWidth: '75%', px: 1.5, py: 1, borderRadius: 2, fontSize: 13,
                    bgcolor: msg.senderId === user?.id ? 'primary.main' : 'grey.100',
                    color: msg.senderId === user?.id ? 'white' : 'text.primary',
                  }}>
                    {msg.message}
                  </Box>
                </Box>
              ))}
            </Box>
            <Box p={1.5} display="flex" gap={1} borderTop="1px solid" borderColor="divider">
              <TextField size="small" fullWidth placeholder="Nhắn tin..."
                value={message} onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <IconButton color="primary" onClick={handleSend}><SendIcon /></IconButton>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Right: map */}
      <Box sx={{ width: 480, height: 500, borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
        <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <RouteAutoFit points={activeRoutePoints} fallbackCenter={mapCenter} />
          <Marker position={[currentRide.pickupLat, currentRide.pickupLng]} />
          <Marker position={[currentRide.destinationLat, currentRide.destinationLng]} />
          {activeRoutePoints.length > 1 && (
            <Polyline positions={activeRoutePoints} pathOptions={{ color: routeColor }} weight={5} opacity={0.85} />
          )}
          {coords && <MovingMarker position={coords} />}
        </MapContainer>
      </Box>
    </Box>
  )
}
