import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  List, ListItem, ListItemButton, ListItemText, ListItemAvatar,
  Avatar, Chip, Divider, CircularProgress, Alert, Paper,
} from '@mui/material'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import FmdGoodIcon from '@mui/icons-material/FmdGood'
import PlaceIcon from '@mui/icons-material/Place'
import 'leaflet/dist/leaflet.css'

import { companyApi } from '@/api/company.api'
import { rideApi } from '@/api/ride.api'
import { useRideStore } from '@/store/rideStore'
import { useGeolocation } from '@/hooks/useGeolocation'
import { formatCurrency } from '@/utils/format'
import type { CompanyEstimate } from '@/types'

// Fix leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
})

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
})

type SelectMode = 'pickup' | 'destination' | null

function MapClickHandler({ mode, onPick }: { mode: SelectMode; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (mode) onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function BookRidePage() {
  const navigate = useNavigate()
  const { coords: myCoords } = useGeolocation()
  const { setCurrentRide } = useRideStore()

  const [selectMode, setSelectMode] = useState<SelectMode>(null)
  const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [destination, setDestination] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [routePoints, setRoutePoints] = useState<[number, number][]>([])
  const [estimates, setEstimates] = useState<CompanyEstimate[]>([])
  const [selectedCompany, setSelectedCompany] = useState<CompanyEstimate | null>(null)
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')

  const center: [number, number] = myCoords || [9.1770, 105.1524] // Cà Mau

  // Reverse geocode using nominatim
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      const data = await res.json()
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
  }

  const handleMapPick = async (lat: number, lng: number) => {
    const address = await reverseGeocode(lat, lng)
    if (selectMode === 'pickup') {
      setPickup({ lat, lng, address })
    } else if (selectMode === 'destination') {
      setDestination({ lat, lng, address })
    }
    setSelectMode(null)
  }

  // Fetch route when both points set
  useEffect(() => {
    if (!pickup || !destination) return
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
        const res = await fetch(url)
        const data = await res.json()
        if (data.routes?.[0]) {
          const coords = data.routes[0].geometry.coordinates as [number, number][]
          setRoutePoints(coords.map(([lng, lat]) => [lat, lng]))
        }
      } catch {}
    }
    fetchRoute()
  }, [pickup, destination])

  // Fetch estimates
  const fetchEstimates = async () => {
    if (!pickup || !destination) return
    setLoading(true)
    setError('')
    try {
      const data = await companyApi.getEstimates(pickup.lat, pickup.lng, destination.lat, destination.lng)
      setEstimates(data)
    } catch {
      setError('Không thể lấy danh sách công ty, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async () => {
    if (!pickup || !destination || !selectedCompany) return
    setBooking(true)
    try {
      const ride = await rideApi.book({
        companyId: selectedCompany.companyId,
        pickupLat: pickup.lat, pickupLng: pickup.lng, pickupAddress: pickup.address,
        destinationLat: destination.lat, destinationLng: destination.lng, destinationAddress: destination.address,
      })
      setCurrentRide(ride)
      navigate(`/customer/ride/${ride.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đặt xe thất bại, vui lòng thử lại')
    } finally {
      setBooking(false)
    }
  }

  const useMyLocation = () => {
    if (myCoords) {
      setPickup({ lat: myCoords[0], lng: myCoords[1], address: 'Vị trí của bạn' })
    }
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Left panel */}
      <Box sx={{ width: 380, flexShrink: 0, overflow: 'auto', borderRight: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box p={3}>
          <Typography variant="h5" fontWeight={700} mb={0.5}>Đặt xe</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Nhấn vào bản đồ hoặc dùng nút bên dưới để chọn điểm
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          {/* Pickup */}
          <Box mb={2}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase" letterSpacing="0.05em">
              Điểm đón
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                mt: 0.75, p: 1.5, borderRadius: 2, cursor: 'pointer',
                borderColor: selectMode === 'pickup' ? 'primary.main' : 'divider',
                bgcolor: selectMode === 'pickup' ? 'primary.50' : 'background.paper',
                '&:hover': { borderColor: 'primary.main' },
              }}
              onClick={() => setSelectMode(selectMode === 'pickup' ? null : 'pickup')}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <FmdGoodIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography fontSize={14} color={pickup ? 'text.primary' : 'text.secondary'} noWrap>
                  {pickup?.address || 'Nhấn để chọn điểm đón trên bản đồ'}
                </Typography>
              </Box>
            </Paper>
            <Button
              size="small"
              startIcon={<MyLocationIcon />}
              onClick={useMyLocation}
              sx={{ mt: 0.5, fontSize: 12 }}
            >
              Dùng vị trí hiện tại
            </Button>
          </Box>

          {/* Destination */}
          <Box mb={3}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase" letterSpacing="0.05em">
              Điểm đến
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                mt: 0.75, p: 1.5, borderRadius: 2, cursor: 'pointer',
                borderColor: selectMode === 'destination' ? 'error.main' : 'divider',
                bgcolor: selectMode === 'destination' ? '#fff5f5' : 'background.paper',
                '&:hover': { borderColor: 'error.main' },
              }}
              onClick={() => setSelectMode(selectMode === 'destination' ? null : 'destination')}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <PlaceIcon sx={{ color: 'error.main', fontSize: 20 }} />
                <Typography fontSize={14} color={destination ? 'text.primary' : 'text.secondary'} noWrap>
                  {destination?.address || 'Nhấn để chọn điểm đến trên bản đồ'}
                </Typography>
              </Box>
            </Paper>
          </Box>

          {selectMode && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              Nhấn vào bản đồ để chọn {selectMode === 'pickup' ? 'điểm đón' : 'điểm đến'}
            </Alert>
          )}

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={fetchEstimates}
            disabled={!pickup || !destination || loading}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Xem giá & Chọn công ty'}
          </Button>

          {/* Company list */}
          {estimates.length > 0 && (
            <Box mt={3}>
              <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
                Chọn công ty vận tải
              </Typography>
              <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {estimates.map((est) => (
                  <ListItemButton
                    key={est.companyId}
                    onClick={() => setSelectedCompany(est)}
                    selected={selectedCompany?.companyId === est.companyId}
                    sx={{
                      borderRadius: 2, border: '1px solid',
                      borderColor: selectedCompany?.companyId === est.companyId ? 'primary.main' : 'divider',
                      '&.Mui-selected': { bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.50' } },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                        <DirectionsCarIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography fontWeight={600} fontSize={14}>{est.companyName}</Typography>}
                      secondary={`${est.distanceKm.toFixed(1)} km`}
                    />
                    <Typography fontWeight={700} color="primary.main">
                      {formatCurrency(est.estimatedPrice)}
                    </Typography>
                  </ListItemButton>
                ))}
              </List>

              {selectedCompany && (
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleBooking}
                  disabled={booking}
                  sx={{ mt: 2 }}
                >
                  {booking ? <CircularProgress size={20} color="inherit" /> : `Đặt xe với ${selectedCompany.companyName}`}
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Map */}
      <Box flex={1} position="relative">
        {selectMode && (
          <Box
            sx={{
              position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000, bgcolor: 'white', px: 3, py: 1.5, borderRadius: 3,
              boxShadow: 4, border: '2px solid',
              borderColor: selectMode === 'pickup' ? 'primary.main' : 'error.main',
            }}
          >
            <Typography fontWeight={600} fontSize={14}>
              {selectMode === 'pickup' ? '🟢 Nhấn chọn điểm đón' : '🔴 Nhấn chọn điểm đến'}
            </Typography>
          </Box>
        )}

        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapClickHandler mode={selectMode} onPick={handleMapPick} />

          {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />}
          {destination && <Marker position={[destination.lat, destination.lng]} icon={destIcon} />}
          {routePoints.length > 0 && (
            <Polyline positions={routePoints} color="#00A651" weight={4} opacity={0.8} />
          )}
        </MapContainer>
      </Box>
    </Box>
  )
}
