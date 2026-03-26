import { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Chip, Divider, CircularProgress,
} from '@mui/material'
import FmdGoodIcon from '@mui/icons-material/FmdGood'
import PlaceIcon from '@mui/icons-material/Place'
import { rideApi } from '@/api/ride.api'
import { paymentApi } from '@/api/payment.api'
import { formatCurrency, formatDate, rideStatusLabel, rideStatusColor } from '@/utils/format'
import type { Ride } from '@/types'
import EmptyState from '@/components/common/EmptyState'
import PageHeader from '@/components/common/PageHeader'

export default function RideHistoryPage() {
  const [rides, setRides] = useState<Ride[]>([])
  const [paymentStatusMap, setPaymentStatusMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    rideApi.getMyRides()
      .then(async (data) => {
        setRides(data)
        const entries = await Promise.all(
          data.map(async (ride) => {
            try {
              const payment = await paymentApi.getByRide(ride.id)
              return [ride.id, payment.status] as const
            } catch {
              return [ride.id, 'N/A'] as const
            }
          })
        )
        setPaymentStatusMap(Object.fromEntries(entries))
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Box p={{ xs: 2, md: 3 }} maxWidth={700} mx="auto">
      <PageHeader title="Lịch sử chuyến đi" subtitle={`${rides.length} chuyến`} />

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : rides.length === 0 ? (
        <EmptyState title="Chưa có chuyến đi nào" description="Đặt xe đầu tiên của bạn ngay!" />
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {rides.map((ride) => (
            <Card key={ride.id}>
              <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                <Box display="flex" justifyContent="space-between" flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'flex-start' }} gap={1} mb={2}>
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
                    <Typography variant="body2" color="text.secondary">{ride.pickupAddress}</Typography>
                  </Box>
                  <Box display="flex" gap={1} alignItems="flex-start">
                    <PlaceIcon sx={{ color: 'error.main', fontSize: 18, mt: 0.2 }} />
                    <Typography variant="body2" color="text.secondary">{ride.destinationAddress}</Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 1.5 }} />
                <Box display="flex" justifyContent="space-between" flexDirection={{ xs: 'column', sm: 'row' }} gap={1}>
                  <Typography variant="body2" color="text.secondary">{ride.distanceKm.toFixed(1)} km</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      size="small"
                      label={`Thanh toán: ${paymentStatusMap[ride.id] || 'N/A'}`}
                      color={paymentStatusMap[ride.id] === 'SUCCESS' ? 'success' : paymentStatusMap[ride.id] === 'FAILED' ? 'error' : 'default'}
                    />
                    <Typography fontWeight={700} color="primary.main">
                      {formatCurrency(ride.finalPrice || ride.estimatedPrice)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  )
}
