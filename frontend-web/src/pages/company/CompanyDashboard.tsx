import { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, Chip, Grid, Divider, CircularProgress } from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import RouteIcon from '@mui/icons-material/Route'
import { companyApi } from '@/api/company.api'
import { driverApi } from '@/api/driver.api'
import { rideApi } from '@/api/ride.api'
import { walletApi } from '@/api/wallet.api'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate, rideStatusLabel, rideStatusColor } from '@/utils/format'
import StatCard from '@/components/common/StatCard'
import PageHeader from '@/components/common/PageHeader'
import type { TransportCompany, Ride } from '@/types'

export default function CompanyDashboard() {
  const { user } = useAuthStore()
  const [company, setCompany] = useState<TransportCompany | null>(null)
  const [recentRides, setRecentRides] = useState<Ride[]>([])
  const [stats, setStats] = useState({ drivers: 0, balance: 0, totalRides: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const companies = await companyApi.getAll()
        const myCompany = companies[0]
        if (!myCompany) return
        setCompany(myCompany)

        const [drivers, rides, wallet] = await Promise.all([
          driverApi.getByCompany(myCompany.id),
          rideApi.getByCompany(myCompany.id),
          walletApi.getMyWallet(),
        ])

        setRecentRides(rides.slice(0, 5))
        const completed = rides.filter((r) => r.status === 'COMPLETED')
        setStats({
          drivers: drivers.length,
          totalRides: completed.length,
          revenue: completed.reduce((s, r) => s + (r.companyRevenue || 0), 0),
          balance: wallet.balance,
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>

  return (
    <Box p={3}>
      <PageHeader
        title={company?.companyName || 'Dashboard'}
        subtitle="Tổng quan hoạt động công ty"
        action={
          company && (
            <Chip
              label={company.status === 'ACTIVE' ? 'Đang hoạt động' : company.status === 'PENDING' ? 'Chờ duyệt' : 'Tạm hoãn'}
              color={company.status === 'ACTIVE' ? 'success' : company.status === 'PENDING' ? 'warning' : 'error'}
            />
          )
        }
      />

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Số tài xế" value={stats.drivers} subtitle="Đang hoạt động" icon={PeopleIcon} color="#3B82F6" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Tổng chuyến" value={stats.totalRides} subtitle="Đã hoàn thành" icon={RouteIcon} color="#8B5CF6" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Doanh thu" value={formatCurrency(stats.revenue)} subtitle="Tổng tích lũy" icon={AttachMoneyIcon} color="#00A651" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Số dư ví" value={formatCurrency(stats.balance)} subtitle="Có thể rút" icon={AttachMoneyIcon} color="#F59E0B" />
        </Grid>
      </Grid>

      {/* Price config */}
      {company && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography fontWeight={600} mb={2}>Cấu hình giá cước hiện tại</Typography>
            <Box display="flex" gap={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">Giá per km</Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {formatCurrency(company.pricePerKm)}/km
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="caption" color="text.secondary">Tài xế nhận</Typography>
                <Typography variant="h5" fontWeight={700}>{company.driverRevenuePercent}%</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="caption" color="text.secondary">Công ty nhận</Typography>
                <Typography variant="h5" fontWeight={700}>{100 - company.driverRevenuePercent}%</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="caption" color="text.secondary">Phí sàn (Đất Mũi)</Typography>
                <Typography variant="h5" fontWeight={700} color="text.secondary">5%</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

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
          ) : recentRides.map((ride, i) => (
            <Box key={ride.id}>
              <Box px={3} py={2} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontWeight={500} fontSize={14}>{ride.destinationAddress}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ride.driverName} • {formatDate(ride.createdAt)}
                  </Typography>
                </Box>
                <Box textAlign="right" display="flex" gap={1.5} alignItems="center">
                  <Chip label={rideStatusLabel[ride.status]} color={rideStatusColor[ride.status]} size="small" />
                  {ride.companyRevenue && (
                    <Typography fontWeight={700} color="primary.main" fontSize={14}>
                      {formatCurrency(ride.companyRevenue)}
                    </Typography>
                  )}
                </Box>
              </Box>
              {i < recentRides.length - 1 && <Divider />}
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  )
}
