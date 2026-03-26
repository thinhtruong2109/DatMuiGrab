import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Chip, Avatar,
  Button, TextField, IconButton, Divider, CircularProgress,
  Rating as MuiRating, Dialog, DialogContent, DialogTitle, DialogActions, Alert,
} from '@mui/material'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import SendIcon from '@mui/icons-material/Send'
import PhoneIcon from '@mui/icons-material/Phone'
import ChatIcon from '@mui/icons-material/Chat'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import 'leaflet/dist/leaflet.css'

import { rideApi } from '@/api/ride.api'
import { ratingApi } from '@/api/rating.api'
import { paymentApi } from '@/api/payment.api'
import { chatService } from '@/services'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useChatStore } from '@/store/chatStore'
import { useRideStore } from '@/store/rideStore'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, rideStatusLabel, rideStatusColor } from '@/utils/format'
import type { Ride, LocationPayload } from '@/types'

const SEARCH_TIMEOUT_SECONDS = 120

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

export default function RideTrackingPage() {
  const { rideId } = useParams<{ rideId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { messages, addMessage, setMessages, clearMessages } = useChatStore()
  const { driverLocation, setDriverLocation } = useRideStore()

  const [ride, setRide] = useState<Ride | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [ratingOpen, setRatingOpen] = useState(false)
  const [stars, setStars] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [driverPos, setDriverPos] = useState<[number, number] | null>(
    driverLocation ? [driverLocation.lat, driverLocation.lng] : null,
  )
  const [activeRoutePoints, setActiveRoutePoints] = useState<[number, number][]>([])
  const [activeRouteDistanceKm, setActiveRouteDistanceKm] = useState<number | null>(null)
  const [searchingSecondsLeft, setSearchingSecondsLeft] = useState(SEARCH_TIMEOUT_SECONDS)
  const [searchTimeoutNotice, setSearchTimeoutNotice] = useState('')
  const timeoutCancellationTriggeredRef = useRef(false)
  const searchingStartedAtRef = useRef<number | null>(null)

  const { subscribe, send } = useWebSocket()

  const handleSearchTimeout = useCallback(async () => {
    if (!ride || timeoutCancellationTriggeredRef.current) return

    timeoutCancellationTriggeredRef.current = true
    const timeoutReason = 'Không có tài xế nhận cuốc trong 2 phút'

    try {
      const updatedRide = await rideApi.cancel(ride.id, timeoutReason)
      setRide(updatedRide)
    } catch {
      setRide((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          status: 'CANCELLED',
          cancelReason: timeoutReason,
        }
      })
    } finally {
      setSearchTimeoutNotice(`${timeoutReason}. Yêu cầu tìm xe đã được hủy.`)
    }
  }, [ride])

  // Load ride
  useEffect(() => {
    if (!rideId) return
    timeoutCancellationTriggeredRef.current = false
    searchingStartedAtRef.current = null
    setSearchingSecondsLeft(SEARCH_TIMEOUT_SECONDS)
    setSearchTimeoutNotice('')
    clearMessages()
    rideApi.getById(rideId).then(setRide)
    chatService.getMessagesByRide(rideId).then(setMessages).catch(() => {})
    return () => clearMessages()
  }, [rideId])

  // WebSocket subscriptions
  useEffect(() => {
    if (!rideId) return

    const unsubLoc = subscribe(`/topic/ride/${rideId}/location`, (loc: LocationPayload) => {
      setDriverLocation(loc)
      setDriverPos([loc.lat, loc.lng])
    })

    const unsubChat = subscribe(`/topic/ride/${rideId}/chat`, (msg) => {
      addMessage(msg)
    })

    const unsubStatus = subscribe(`/topic/ride/${rideId}/status`, (updated: Ride) => {
      setRide(updated)
      if (updated.status === 'COMPLETED') setRatingOpen(true)
    })

    return () => { unsubLoc(); unsubChat(); unsubStatus() }
  }, [rideId])

  useEffect(() => {
    if (!ride) {
      setActiveRoutePoints([])
      setActiveRouteDistanceKm(null)
      return
    }

    const pickupPoint: [number, number] = [ride.pickupLat, ride.pickupLng]
    const destinationPoint: [number, number] = [ride.destinationLat, ride.destinationLng]

    let start: [number, number] | null = null
    let end: [number, number] | null = null

    if (ride.status === 'MATCHED' || ride.status === 'DRIVER_ARRIVING') {
      if (driverPos) {
        start = driverPos
        end = pickupPoint
      }
    } else if (ride.status === 'IN_PROGRESS') {
      start = driverPos || pickupPoint
      end = destinationPoint
    } else if (ride.status === 'COMPLETED') {
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
  }, [ride, driverPos])

  useEffect(() => {
    if (!ride) return

    if (ride.status !== 'SEARCHING') {
      searchingStartedAtRef.current = null
      timeoutCancellationTriggeredRef.current = false
      setSearchingSecondsLeft(SEARCH_TIMEOUT_SECONDS)
      if (ride.status !== 'CANCELLED') {
        setSearchTimeoutNotice('')
      }
      return
    }

    if (searchingStartedAtRef.current === null) {
      searchingStartedAtRef.current = Date.now()
      timeoutCancellationTriggeredRef.current = false
    }

    const deadline = searchingStartedAtRef.current + SEARCH_TIMEOUT_SECONDS * 1000

    const updateCountdown = () => {
      const remainingMs = deadline - Date.now()
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
      setSearchingSecondsLeft(remainingSeconds)

      if (remainingMs <= 0 && !timeoutCancellationTriggeredRef.current) {
        void handleSearchTimeout()
      }
    }

    updateCountdown()
    const intervalId = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(intervalId)
  }, [ride, handleSearchTimeout])

  const countdownLabel = `${Math.floor(searchingSecondsLeft / 60)}:${(searchingSecondsLeft % 60)
    .toString()
    .padStart(2, '0')}`

  const handleSendMessage = () => {
    if (!message.trim() || !rideId) return
    send(`/app/chat/${rideId}`, { message })
    setMessage('')
  }

  const handlePayAndRate = async () => {
    if (!rideId || !stars) return
    try {
      await paymentApi.pay(rideId, 'CASH')
      await ratingApi.create({ rideId, stars, comment })
    } finally {
      setRatingOpen(false)
      navigate('/customer/history')
    }
  }

  if (!ride) return (
    <Box display="flex" alignItems="center" justifyContent="center" height="calc(100dvh - 56px)">
      <CircularProgress />
    </Box>
  )

  const center: [number, number] = driverPos || [ride.pickupLat, ride.pickupLng]
  const routePhaseLabel =
    ride.status === 'IN_PROGRESS'
      ? 'Đang di chuyển đến điểm đến'
      : ride.status === 'MATCHED' || ride.status === 'DRIVER_ARRIVING'
        ? 'Tài xế đang đến điểm đón'
        : null
  const routeColor = ride.status === 'IN_PROGRESS' ? 'success.main' : 'primary.main'

  return (
    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} height={{ xs: 'auto', md: 'calc(100dvh - 64px)' }} minHeight={{ xs: 'calc(100dvh - 56px)', md: 'auto' }}>
      {/* Info panel */}
      <Box
        sx={{
          width: { xs: '100%', md: 340 },
          flexShrink: 0,
          overflow: 'auto',
          borderRight: { xs: 'none', md: '1px solid' },
          borderTop: { xs: '1px solid', md: 'none' },
          borderColor: 'divider',
          bgcolor: 'background.paper',
          order: { xs: 2, md: 1 },
          maxHeight: { xs: 'none', md: '100%' },
        }}
      >
        <Box p={{ xs: 2, sm: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={700}>Chuyến đi của bạn</Typography>
            <Chip
              label={rideStatusLabel[ride.status] || ride.status}
              color={rideStatusColor[ride.status] || 'default'}
              size="small"
            />
          </Box>

          {/* Driver info */}
          {ride.driverName && (
            <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <DirectionsCarIcon />
                  </Avatar>
                  <Box flex={1}>
                    <Typography fontWeight={600}>{ride.driverName}</Typography>
                    <Typography variant="body2" color="text.secondary">{ride.driverVehiclePlate}</Typography>
                  </Box>
                  <Box display="flex" gap={0.5}>
                    <IconButton size="small" color="primary" href={`tel:${ride.driverPhone}`}>
                      <PhoneIcon />
                    </IconButton>
                    <IconButton size="small" color="primary" onClick={() => setChatOpen(true)}>
                      <ChatIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Route */}
          <Box mb={2} display="flex" flexDirection="column" gap={1}>
            <Box display="flex" gap={1} alignItems="flex-start">
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.6, flexShrink: 0 }} />
              <Typography variant="body2" color="text.secondary">{ride.pickupAddress}</Typography>
            </Box>
            <Box sx={{ width: 1, height: 20, bgcolor: 'divider', ml: '4.5px' }} />
            <Box display="flex" gap={1} alignItems="flex-start">
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: 'error.main', mt: 0.6, flexShrink: 0 }} />
              <Typography variant="body2" color="text.secondary">{ride.destinationAddress}</Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Quãng đường</Typography>
            <Typography fontWeight={600}>{ride.distanceKm.toFixed(1)} km</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="body2" color="text.secondary">Giá ước tính</Typography>
            <Typography fontWeight={700} color="primary.main">{formatCurrency(ride.estimatedPrice)}</Typography>
          </Box>

          {routePhaseLabel && activeRouteDistanceKm !== null && (
            <Card variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography fontSize={12} color="text.secondary">{routePhaseLabel}</Typography>
                <Typography fontWeight={700}>{activeRouteDistanceKm.toFixed(2)} km</Typography>
              </CardContent>
            </Card>
          )}

          {ride.status === 'SEARCHING' && (
            <Box mt={3} textAlign="center">
              <CircularProgress size={32} sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Đang tìm tài xế...</Typography>
              <Typography variant="caption" color="text.secondary">Thời gian còn lại: {countdownLabel}</Typography>
            </Box>
          )}

          {searchTimeoutNotice && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {searchTimeoutNotice}
            </Alert>
          )}

          {['SEARCHING', 'MATCHED', 'DRIVER_ARRIVING'].includes(ride.status) && (
            <Button
              variant="outlined"
              color="error"
              fullWidth
              size="small"
              sx={{ mt: 2 }}
              onClick={() => rideApi.cancel(ride.id, 'Khách hàng hủy').then(() => navigate('/customer/book'))}
            >
              Hủy chuyến
            </Button>
          )}
        </Box>

        {/* Chat panel */}
        {chatOpen && (
          <Box borderTop="1px solid" borderColor="divider">
            <Box p={2} bgcolor="grey.50">
              <Typography variant="subtitle2" fontWeight={600}>Chat với tài xế</Typography>
            </Box>
            <Box sx={{ height: 240, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {messages.map((msg) => (
                <Box
                  key={msg.id}
                  display="flex"
                  justifyContent={msg.senderId === user?.id ? 'flex-end' : 'flex-start'}
                >
                  <Box
                    sx={{
                      maxWidth: '75%', px: 1.5, py: 1, borderRadius: 2, fontSize: 13,
                      bgcolor: msg.senderId === user?.id ? 'primary.main' : 'grey.100',
                      color: msg.senderId === user?.id ? 'white' : 'text.primary',
                    }}
                  >
                    {msg.message}
                  </Box>
                </Box>
              ))}
            </Box>
            <Box p={1.5} display="flex" gap={1} borderTop="1px solid" borderColor="divider">
              <TextField
                size="small" fullWidth placeholder="Nhắn tin..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <IconButton color="primary" onClick={handleSendMessage}>
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {/* Map */}
      <Box flex={1} order={{ xs: 1, md: 2 }} sx={{ height: { xs: '45dvh', sm: '50dvh', md: '100%' } }}>
        <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <RouteAutoFit points={activeRoutePoints} fallbackCenter={center} />
          <Marker position={[ride.pickupLat, ride.pickupLng]} />
          <Marker position={[ride.destinationLat, ride.destinationLng]} />
          {activeRoutePoints.length > 1 && (
            <Polyline positions={activeRoutePoints} pathOptions={{ color: routeColor }} weight={5} opacity={0.85} />
          )}
          {driverPos && <MovingMarker position={driverPos} />}
        </MapContainer>
      </Box>

      {/* Rating dialog */}
      <Dialog open={ratingOpen} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Chuyến đi hoàn thành! 🎉</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Đánh giá tài xế để giúp cải thiện dịch vụ
          </Typography>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <MuiRating
              value={stars}
              onChange={(_, v) => setStars(v)}
              size="large"
            />
            <TextField
              label="Nhận xét (tùy chọn)"
              multiline rows={3} fullWidth
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Box display="flex" justifyContent="space-between" width="100%">
              <Typography variant="body2">Tổng tiền:</Typography>
              <Typography fontWeight={700} color="primary.main">
                {formatCurrency(ride.finalPrice || ride.estimatedPrice)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => { setRatingOpen(false); navigate('/customer/history') }} color="inherit">
            Bỏ qua
          </Button>
          <Button variant="contained" onClick={handlePayAndRate} disabled={!stars}>
            Thanh toán & Đánh giá
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
