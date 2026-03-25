import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  List, ListItem, ListItemButton, ListItemText, ListItemAvatar,
  Avatar, Chip, Divider, CircularProgress, Alert, Paper,
} from '@mui/material'
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet'
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

function MapAutoCenter({ position }: { position: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (!position) return
    map.flyTo(position, Math.max(map.getZoom(), 15), { duration: 0.8 })
  }, [map, position])

  return null
}

export default function BookRidePage() {
  const navigate = useNavigate()
  const { coords: myCoords } = useGeolocation()
  const { setCurrentRide } = useRideStore()

  const [selectMode, setSelectMode] = useState<SelectMode>(null)
  const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [destination, setDestination] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [pickupInput, setPickupInput] = useState('')
  const [destinationInput, setDestinationInput] = useState('')
  const [routePoints, setRoutePoints] = useState<[number, number][]>([])
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null)
  const [estimates, setEstimates] = useState<CompanyEstimate[]>([])
  const [selectedCompany, setSelectedCompany] = useState<CompanyEstimate | null>(null)
  const [focusPosition, setFocusPosition] = useState<[number, number] | null>(null)
  const [fetchedEstimates, setFetchedEstimates] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pickupSearching, setPickupSearching] = useState(false)
  const [destinationSearching, setDestinationSearching] = useState(false)
  const [booking, setBooking] = useState(false)
  const [checkingActiveRide, setCheckingActiveRide] = useState(true)
  const [error, setError] = useState('')

  const center: [number, number] = myCoords || [9.1770, 105.1524] // Cà Mau

  useEffect(() => {
    let cancelled = false

    const restoreActiveRide = async () => {
      try {
        const rides = await rideApi.getMyRides()
        if (cancelled) return

        const activeRide = rides.find((ride) => ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED')
        if (activeRide) {
          setCurrentRide(activeRide)
          navigate(`/customer/ride/${activeRide.id}`, { replace: true })
          return
        }
      } catch {
        // keep page usable if bootstrap call fails
      } finally {
        if (!cancelled) setCheckingActiveRide(false)
      }
    }

    restoreActiveRide()

    return () => {
      cancelled = true
    }
  }, [navigate, setCurrentRide])

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

  const geocodeAddress = async (query: string): Promise<{ lat: number; lng: number; address: string } | null> => {
    try {
      const encoded = encodeURIComponent(query.trim())
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`)
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) return null

      const item = data[0]
      const lat = Number(item.lat)
      const lng = Number(item.lon)
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null

      return {
        lat,
        lng,
        address: item.display_name || query,
      }
    } catch {
      return null
    }
  }

  const handleMapPick = async (lat: number, lng: number) => {
    const address = await reverseGeocode(lat, lng)
    if (selectMode === 'pickup') {
      setPickup({ lat, lng, address })
      setPickupInput(address)
    } else if (selectMode === 'destination') {
      setDestination({ lat, lng, address })
      setDestinationInput(address)
    }
    setSelectMode(null)
  }

  const applyAddressToPoint = async (mode: 'pickup' | 'destination') => {
    const rawInput = mode === 'pickup' ? pickupInput : destinationInput
    const query = rawInput.trim()
    if (!query) {
      setError(mode === 'pickup' ? 'Vui lòng nhập địa chỉ điểm đón' : 'Vui lòng nhập địa chỉ điểm đến')
      return
    }

    setError('')
    if (mode === 'pickup') setPickupSearching(true)
    else setDestinationSearching(true)

    try {
      const point = await geocodeAddress(query)
      if (!point) {
        setError(`Không tìm thấy địa chỉ cho ${mode === 'pickup' ? 'điểm đón' : 'điểm đến'}, vui lòng thử chi tiết hơn`)
        return
      }

      if (mode === 'pickup') {
        setPickup(point)
        setPickupInput(point.address)
      } else {
        setDestination(point)
        setDestinationInput(point.address)
      }
      setFocusPosition([point.lat, point.lng])
      setSelectMode(null)
    } finally {
      if (mode === 'pickup') setPickupSearching(false)
      else setDestinationSearching(false)
    }
  }

  // Fetch route when both points set
  useEffect(() => {
    if (!pickup || !destination) {
      setRoutePoints([])
      setRouteDistanceKm(null)
      setEstimates([])
      setSelectedCompany(null)
      setFetchedEstimates(false)
      return
    }

    setEstimates([])
    setSelectedCompany(null)
    setFetchedEstimates(false)

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
        const res = await fetch(url)
        const data = await res.json()
        if (data.routes?.[0]) {
          const route = data.routes[0]
          const coords = route.geometry.coordinates as [number, number][]
          setRoutePoints(coords.map(([lng, lat]) => [lat, lng]))
          if (typeof route.distance === 'number') {
            setRouteDistanceKm(route.distance / 1000)
          }
          return
        }

        setRouteDistanceKm(haversineDistance(pickup.lat, pickup.lng, destination.lat, destination.lng))
      } catch {
        setRouteDistanceKm(haversineDistance(pickup.lat, pickup.lng, destination.lat, destination.lng))
      }
    }
    fetchRoute()
  }, [pickup, destination])

  // Fetch estimates
  const fetchEstimates = async () => {
    if (!pickup || !destination) return
    setLoading(true)
    setError('')
    setFetchedEstimates(true)
    try {
      const data = await companyApi.getEstimates(pickup.lat, pickup.lng, destination.lat, destination.lng)
      setEstimates(data)
      if (data.length === 0) {
        setSelectedCompany(null)
      }
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
      setPickupInput('Vị trí của bạn')
      setFocusPosition([myCoords[0], myCoords[1]])
    }
  }

  if (checkingActiveRide) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="calc(100vh - 64px)">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Left panel */}
      <Box sx={{ width: 380, flexShrink: 0, overflow: 'auto', borderRight: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box p={3}>
          <Typography variant="h5" fontWeight={700} mb={0.5}>Đặt xe</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Nhấn vào bản đồ hoặc nhập địa chỉ để chọn điểm
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
            <Box mt={1} display="flex" gap={1}>
              <TextField
                size="small"
                fullWidth
                placeholder="Nhập địa chỉ điểm đón"
                value={pickupInput}
                onChange={(e) => setPickupInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void applyAddressToPoint('pickup')
                  }
                }}
              />
              <Button
                variant="outlined"
                onClick={() => void applyAddressToPoint('pickup')}
                disabled={pickupSearching}
                sx={{ minWidth: 84 }}
              >
                {pickupSearching ? <CircularProgress size={16} /> : 'Tìm'}
              </Button>
            </Box>
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
            <Box mt={1} display="flex" gap={1}>
              <TextField
                size="small"
                fullWidth
                placeholder="Nhập địa chỉ điểm đến"
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void applyAddressToPoint('destination')
                  }
                }}
              />
              <Button
                variant="outlined"
                color="error"
                onClick={() => void applyAddressToPoint('destination')}
                disabled={destinationSearching}
                sx={{ minWidth: 84 }}
              >
                {destinationSearching ? <CircularProgress size={16} /> : 'Tìm'}
              </Button>
            </Box>
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

          {routeDistanceKm !== null && (
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              Khoảng cách dự kiến: <strong>{routeDistanceKm.toFixed(2)} km</strong>
            </Alert>
          )}

          {fetchedEstimates && estimates.length === 0 && !loading && !error && (
            <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
              Hiện chưa có công ty vận tải ACTIVE để báo giá cho tuyến này.
            </Alert>
          )}

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
          <MapAutoCenter position={focusPosition} />
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
