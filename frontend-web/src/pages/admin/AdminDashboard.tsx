import { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, Chip, Divider, Grid, CircularProgress } from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import PeopleIcon from '@mui/icons-material/People'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import GavelIcon from '@mui/icons-material/Gavel'
import { companyApi } from '@/api/company.api'
import { appealApi } from '@/api/appeal.api'
import { formatDate } from '@/utils/format'
import type { TransportCompany, Appeal } from '@/types'
import StatCard from '@/components/common/StatCard'
import PageHeader from '@/components/common/PageHeader'

export default function AdminDashboard() {
  const [companies, setCompanies] = useState<TransportCompany[]>([])
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([companyApi.getAllAdmin(), appealApi.getAll()])
      .then(([c, a]) => { setCompanies(c); setAppeals(a) })
      .finally(() => setLoading(false))
  }, [])

  const active = companies.filter((c) => c.status === 'ACTIVE').length
  const pending = companies.filter((c) => c.status === 'PENDING').length
  const pendingAppeals = appeals.filter((a) => a.status === 'PENDING').length

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <PageHeader title="Tổng quan hệ thống" subtitle="Quản trị Đất Mũi Grab" />

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Công ty hoạt động" value={active} subtitle={`${pending} chờ duyệt`} icon={BusinessIcon} color="#3B82F6" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Tổng công ty" value={companies.length} icon={BusinessIcon} color="#8B5CF6" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Kháng cáo chờ" value={pendingAppeals} subtitle={`${appeals.length} tổng`} icon={GavelIcon} color="#EF4444" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Công ty pending" value={pending} icon={PeopleIcon} color="#F59E0B" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Pending companies */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box px={{ xs: 2, md: 3 }} py={2} borderBottom="1px solid" borderColor="divider" display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                <Typography fontWeight={600}>Công ty chờ duyệt</Typography>
                {pending > 0 && <Chip label={pending} size="small" color="warning" />}
              </Box>
              {companies.filter((c) => c.status === 'PENDING').length === 0 ? (
                <Box py={3} textAlign="center">
                  <Typography variant="body2" color="text.secondary">Không có công ty chờ duyệt</Typography>
                </Box>
              ) : (
                companies.filter((c) => c.status === 'PENDING').map((c, i, arr) => (
                  <Box key={c.id}>
                    <Box px={{ xs: 2, md: 3 }} py={2} display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1}>
                      <Box>
                        <Typography fontWeight={500} fontSize={14}>{c.companyName}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatDate(c.createdAt)}</Typography>
                      </Box>
                      <Chip label="Chờ duyệt" color="warning" size="small" />
                    </Box>
                    {i < arr.length - 1 && <Divider />}
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pending appeals */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box px={{ xs: 2, md: 3 }} py={2} borderBottom="1px solid" borderColor="divider" display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                <Typography fontWeight={600}>Kháng cáo chờ xử lý</Typography>
                {pendingAppeals > 0 && <Chip label={pendingAppeals} size="small" color="error" />}
              </Box>
              {appeals.filter((a) => a.status === 'PENDING').length === 0 ? (
                <Box py={3} textAlign="center">
                  <Typography variant="body2" color="text.secondary">Không có kháng cáo chờ xử lý</Typography>
                </Box>
              ) : (
                appeals.filter((a) => a.status === 'PENDING').slice(0, 5).map((a, i, arr) => (
                  <Box key={a.id}>
                    <Box px={{ xs: 2, md: 3 }} py={2}>
                      <Typography fontWeight={500} fontSize={14}>{a.driverName}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>{a.reason}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDate(a.createdAt)}</Typography>
                    </Box>
                    {i < arr.length - 1 && <Divider />}
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
