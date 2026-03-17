import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Chip, Avatar,
  Button, TextField, IconButton, Divider, CircularProgress,
  Rating as MuiRating, Dialog, DialogContent, DialogTitle, DialogActions,
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
import { useWebSocket } from '@/hooks/useWebSocket'
import { useChatStore } from '@/store/chatStore'
import { useRideStore } from '@/store/rideStore'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, rideStatusLabel, rideStatusColor } from '@/utils/format'
import type { Ride, LocationPayload } from '@/types'

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
})

function MovingMarker({ position }: { position: [number, number] }) {
  const markerRef = useRef<L.Marker>(null)
  useEffect(() => {
    markerRef.current?.setLatLng(position)
  }, [position])
  return <Marker ref={markerRef} position={position} icon={driverIcon} />
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
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null)

  const { subscribe, send } = useWebSocket()

  // Load ride
  useEffect(() => {
    if (!rideId) return
    rideApi.getById(rideId).then(setRide)
  }, [rideId])

  // WebSocket subscriptions
  useEffect(() => {
    if (!rideId) return

    const unsubLoc = subscribe(`/topic/ride/${rideId}/location`, (loc: LocationPayload) => {
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
    <Box display="flex" alignItems="center" justifyContent="center" height="calc(100vh - 64px)">
      <CircularProgress />
    </Box>
  )

  const center: [number, number] = driverPos || [ride.pickupLat, ride.pickupLng]

  return (
    <Box display="flex" height="calc(100vh - 64px)">
      {/* Info panel */}
      <Box sx={{ width: 340, flexShrink: 0, overflow: 'auto', borderRight: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box p={3}>
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

          {ride.status === 'SEARCHING' && (
            <Box mt={3} textAlign="center">
              <CircularProgress size={32} sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Đang tìm tài xế...</Typography>
            </Box>
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
      <Box flex={1}>
        <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[ride.pickupLat, ride.pickupLng]} />
          <Marker position={[ride.destinationLat, ride.destinationLng]} />
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
