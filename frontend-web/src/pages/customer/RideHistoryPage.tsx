import { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Chip, Divider, CircularProgress,
} from '@mui/material'
import FmdGoodIcon from '@mui/icons-material/FmdGood'
import PlaceIcon from '@mui/icons-material/Place'
import { rideApi } from '@/api/ride.api'
import { formatCurrency, formatDate, rideStatusLabel, rideStatusColor } from '@/utils/format'
import type { Ride } from '@/types'
import EmptyState from '@/components/common/EmptyState'
import PageHeader from '@/components/common/PageHeader'

export default function RideHistoryPage() {
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    rideApi.getMyRides().then(setRides).finally(() => setLoading(false))
  }, [])

  return (
    <Box p={3} maxWidth={700} mx="auto">
      <PageHeader title="Lịch sử chuyến đi" subtitle={`${rides.length} chuyến`} />

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : rides.length === 0 ? (
        <EmptyState title="Chưa có chuyến đi nào" description="Đặt xe đầu tiên của bạn ngay!" />
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {rides.map((ride) => (
            <Card key={ride.id}>
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography fontWeight={600}>{ride.companyName}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatDate(ride.createdAt)}</Typography>
                  </Box>
                  <Chip
                    label={rideStatusLabel[ride.status]}
                    color={rideStatusColor[ride.status]}
                    size="small"
                  />
                </Box>

                <Box display="flex" flexDirection="column" gap={0.75} mb={2}>
                  <Box display="flex" gap={1} alignItems="flex-start">
                    <FmdGoodIcon sx={{ color: 'primary.main', fontSize: 18, mt: 0.2 }} />
                    <Typography variant="body2" color="text.secondary" noWrap>{ride.pickupAddress}</Typography>
                  </Box>
                  <Box display="flex" gap={1} alignItems="flex-start">
                    <PlaceIcon sx={{ color: 'error.main', fontSize: 18, mt: 0.2 }} />
                    <Typography variant="body2" color="text.secondary" noWrap>{ride.destinationAddress}</Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 1.5 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{ride.distanceKm.toFixed(1)} km</Typography>
                  <Typography fontWeight={700} color="primary.main">
                    {formatCurrency(ride.finalPrice || ride.estimatedPrice)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  )
}
