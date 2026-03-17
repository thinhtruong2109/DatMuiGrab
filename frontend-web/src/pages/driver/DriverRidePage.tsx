import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Button, Chip,
  Divider, Alert, IconButton, TextField, CircularProgress,
} from '@mui/material'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import SendIcon from '@mui/icons-material/Send'
import 'leaflet/dist/leaflet.css'
import { rideApi } from '@/api/ride.api'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useChatStore } from '@/store/chatStore'
import { useRideStore } from '@/store/rideStore'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, rideStatusLabel, rideStatusColor } from '@/utils/format'
import type { Ride } from '@/types'

const STATUS_STEPS: Record<string, { next: string; label: string; color: 'primary' | 'success' }> = {
  MATCHED: { next: 'DRIVER_ARRIVING', label: 'Bắt đầu đến đón', color: 'primary' },
  DRIVER_ARRIVING: { next: 'IN_PROGRESS', label: 'Đã đón khách', color: 'primary' },
  IN_PROGRESS: { next: 'COMPLETED', label: 'Hoàn thành chuyến', color: 'success' },
}

export default function DriverRidePage() {
  const { currentRide, setCurrentRide } = useRideStore()
  const { messages, addMessage } = useChatStore()
  const { user } = useAuthStore()
  const { coords } = useGeolocation(true)
  const { subscribe, send } = useWebSocket()
  const [message, setMessage] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!currentRide) return
    const unsub = subscribe(`/topic/ride/${currentRide.id}/chat`, addMessage)
    return unsub
  }, [currentRide?.id])

  // Send location while in ride
  useEffect(() => {
    if (!currentRide || !coords || currentRide.status === 'COMPLETED' || currentRide.status === 'CANCELLED') return
    const interval = setInterval(() => {
      send(`/app/location/${currentRide.id}`, { lat: coords[0], lng: coords[1] })
    }, 3000)
    return () => clearInterval(interval)
  }, [currentRide?.id, currentRide?.status, coords])

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
          <Marker position={[currentRide.pickupLat, currentRide.pickupLng]} />
          <Marker position={[currentRide.destinationLat, currentRide.destinationLng]} />
          {coords && <Marker position={coords} />}
        </MapContainer>
      </Box>
    </Box>
  )
}
