import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Switch, FormControlLabel,
  Chip, Avatar, Divider, CircularProgress, Grid,
} from '@mui/material'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import StarIcon from '@mui/icons-material/Star'
import RouteIcon from '@mui/icons-material/Route'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import { driverApi } from '@/api/driver.api'
import { rideApi } from '@/api/ride.api'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useRideStore } from '@/store/rideStore'
import { formatCurrency, rideStatusLabel } from '@/utils/format'
import StatCard from '@/components/common/StatCard'
import PageHeader from '@/components/common/PageHeader'
import type { Driver, Ride } from '@/types'

export default function DriverDashboard() {
  const [driver, setDriver] = useState<Driver | null>(null)
  const [recentRides, setRecentRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const { coords } = useGeolocation(true)
  const { setCurrentRide } = useRideStore()
  const { subscribe, send } = useWebSocket()

  useEffect(() => {
    Promise.all([
      driverApi.getMe(),
      driverApi.getMyRides(),
    ]).then(([d, rides]) => {
      setDriver(d)
      setRecentRides(rides.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  // Send location every 3s when online
  useEffect(() => {
    if (!driver || driver.onlineStatus !== 'ONLINE' || !coords) return
    const interval = setInterval(() => {
      send('/app/location/broadcast', { lat: coords[0], lng: coords[1] })
    }, 3000)
    return () => clearInterval(interval)
  }, [driver?.onlineStatus, coords])

  // Listen for new ride requests
  useEffect(() => {
    if (!driver) return
    const unsub = subscribe(`/topic/driver/${driver.id}/new-ride`, async (payload: Ride | string) => {
      if (typeof payload === 'string') {
        try {
          const ride = await rideApi.getById(payload)
          setCurrentRide(ride)
        } catch {
          // ignore transient fetch error
        }
        return
      }

      setCurrentRide(payload)
    })
    return unsub
  }, [driver?.id])

  const handleToggleOnline = async () => {
    if (!driver) return
    setToggling(true)
    try {
      const newStatus = driver.onlineStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE'
      await driverApi.setStatus(newStatus)
      setDriver({ ...driver, onlineStatus: newStatus })
    } finally {
      setToggling(false)
    }
  }

  const completedRides = recentRides.filter((r) => r.status === 'COMPLETED').length
  const totalEarnings = recentRides
    .filter((r) => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + (r.driverRevenue || 0), 0)

  if (loading) return (
    <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
  )

  const statusColor = {
    ONLINE: '#10B981',
    OFFLINE: '#94A3B8',
    BUSY: '#F59E0B',
  }[driver?.onlineStatus || 'OFFLINE']

  return (
    <Box p={3}>
      <PageHeader
        title="Tổng quan"
        subtitle="Quản lý trạng thái và theo dõi hoạt động"
      />

      {/* Online toggle */}
      <Card sx={{ mb: 3, borderRadius: 3, border: '2px solid', borderColor: driver?.onlineStatus === 'ONLINE' ? 'primary.main' : 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 14, height: 14, borderRadius: '50%',
                  bgcolor: statusColor,
                  boxShadow: driver?.onlineStatus === 'ONLINE' ? `0 0 0 4px ${statusColor}30` : 'none',
                  animation: driver?.onlineStatus === 'ONLINE' ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { boxShadow: `0 0 0 4px ${statusColor}30` },
                    '50%': { boxShadow: `0 0 0 8px ${statusColor}10` },
                  },
                }}
              />
              <Box>
                <Typography fontWeight={700} fontSize={16}>
                  {driver?.onlineStatus === 'ONLINE' ? 'Đang trực tuyến' :
                    driver?.onlineStatus === 'BUSY' ? 'Đang chạy cuốc' : 'Ngoại tuyến'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {driver?.onlineStatus === 'ONLINE' ? 'Đang hiển thị cho khách hàng' :
                    driver?.onlineStatus === 'BUSY' ? 'Đang thực hiện chuyến đi' : 'Bật online để nhận cuốc'}
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={driver?.onlineStatus === 'ONLINE'}
                  onChange={handleToggleOnline}
                  disabled={toggling || driver?.onlineStatus === 'BUSY'}
                  color="success"
                  size="medium"
                />
              }
              label=""
              sx={{ mr: 0 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Điểm uy tín"
            value={driver?.reputationScore !== null && driver?.reputationScore !== undefined
              ? driver.reputationScore.toFixed(1) : 'Chưa có'}
            subtitle={driver?.totalRatings ? `${driver.totalRatings} đánh giá` : 'Chưa có đánh giá'}
            icon={StarIcon}
            color="#F59E0B"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Chuyến gần đây"
            value={recentRides.length}
            subtitle={`${completedRides} hoàn thành`}
            icon={RouteIcon}
            color="#3B82F6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Thu nhập gần đây"
            value={formatCurrency(totalEarnings)}
            subtitle="5 chuyến gần nhất"
            icon={AttachMoneyIcon}
            color="#00A651"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Loại xe"
            value={driver?.vehicleType || '—'}
            subtitle={driver?.vehiclePlate || ''}
            icon={DirectionsCarIcon}
            color="#8B5CF6"
          />
        </Grid>
      </Grid>

      {/* Recent rides */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box px={3} py={2} borderBottom="1px solid" borderColor="divider">
            <Typography fontWeight={600}>Chuyến đi gần đây</Typography>
          </Box>
          {recentRides.length === 0 ? (
            <Box py={4} textAlign="center">
              <Typography color="text.secondary">Chưa có chuyến đi nào</Typography>
            </Box>
          ) : (
            recentRides.map((ride, i) => (
              <Box key={ride.id}>
                <Box px={3} py={2} display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight={500} fontSize={14}>{ride.destinationAddress}</Typography>
                    <Typography variant="caption" color="text.secondary">{ride.companyName}</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography fontWeight={700} color="primary.main" fontSize={14}>
                      {formatCurrency(ride.driverRevenue || 0)}
                    </Typography>
                    <Chip label={rideStatusLabel[ride.status]} size="small" sx={{ fontSize: 11 }} />
                  </Box>
                </Box>
                {i < recentRides.length - 1 && <Divider />}
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
