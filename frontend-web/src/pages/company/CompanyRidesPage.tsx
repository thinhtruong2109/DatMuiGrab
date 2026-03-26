import { useState, useEffect } from 'react'
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Chip, CircularProgress,
} from '@mui/material'
import { rideApi } from '@/api/ride.api'
import { companyApi } from '@/api/company.api'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate, rideStatusLabel, rideStatusColor } from '@/utils/format'
import type { Ride } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import EmptyState from '@/components/common/EmptyState'

export default function CompanyRidesPage() {
  const { user } = useAuthStore()
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    companyApi.getAll().then(async (companies) => {
      const company = companies.find((item) => item.userId === user?.id) || companies[0]
      if (!company) return
      const r = await rideApi.getByCompany(company.id)
      setRides(r)
    }).finally(() => setLoading(false))
  }, [user?.id])

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <PageHeader title="Lịch sử chuyến đi" subtitle={`${rides.length} chuyến`} />

      {rides.length === 0 ? <EmptyState title="Chưa có chuyến đi nào" /> : (
        <TableContainer component={Card} sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 780 }}>
            <TableHead>
              <TableRow>
                <TableCell>Điểm đến</TableCell>
                <TableCell>Tài xế</TableCell>
                <TableCell>Khách hàng</TableCell>
                <TableCell>Quãng đường</TableCell>
                <TableCell>Doanh thu</TableCell>
                <TableCell>Ngày</TableCell>
                <TableCell>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rides.map((ride) => (
                <TableRow key={ride.id} hover>
                  <TableCell>
                    <Typography fontSize={14} fontWeight={500} noWrap sx={{ maxWidth: { xs: 140, sm: 200 } }}>
                      {ride.destinationAddress}
                    </Typography>
                  </TableCell>
                  <TableCell>{ride.driverName || '—'}</TableCell>
                  <TableCell>{ride.customerName}</TableCell>
                  <TableCell>{ride.distanceKm.toFixed(1)} km</TableCell>
                  <TableCell>
                    <Typography fontWeight={600} color="primary.main">
                      {ride.companyRevenue ? formatCurrency(ride.companyRevenue) : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(ride.createdAt)}</TableCell>
                  <TableCell>
                    <Chip label={rideStatusLabel[ride.status]} color={rideStatusColor[ride.status]} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
