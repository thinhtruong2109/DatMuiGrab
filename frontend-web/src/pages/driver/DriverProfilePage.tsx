import { useState, useEffect } from 'react'
import { Box, Card, CardContent, TextField, Button, Typography, Avatar, Alert, Chip, Grid, MenuItem } from '@mui/material'
import StarIcon from '@mui/icons-material/Star'
import { driverApi } from '@/api/driver.api'
import { ratingApi } from '@/api/rating.api'
import { useAuthStore } from '@/store/authStore'
import type { Driver, Rating } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import ChangePasswordCard from '@/components/common/ChangePasswordCard'
import { formatDate } from '@/utils/format'

export default function DriverProfilePage() {
  const { user } = useAuthStore()
  const [driver, setDriver] = useState<Driver | null>(null)
  const [form, setForm] = useState({ vehiclePlate: '', vehicleType: 'Xe máy', vehicleModel: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [ratings, setRatings] = useState<Rating[]>([])

  useEffect(() => {
    driverApi.getMe().then((d) => {
      setDriver(d)
      setForm({ vehiclePlate: d.vehiclePlate || '', vehicleType: d.vehicleType || 'Xe máy', vehicleModel: d.vehicleModel || '' })
      ratingApi.getByDriver(d.id).then(setRatings).catch(() => setRatings([]))
    })
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      const updated = await driverApi.updateMe(form)
      setDriver(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box p={3} maxWidth={700} display="flex" flexDirection="column" gap={3}>
      <PageHeader title="Hồ sơ tài xế" />

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24 }}>
              {user?.fullName?.[0]}
            </Avatar>
            <Box>
              <Typography fontWeight={700} fontSize={18}>{user?.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              <Box display="flex" gap={1} mt={0.5}>
                <Chip
                  icon={<StarIcon sx={{ fontSize: '14px !important' }} />}
                  label={driver?.reputationScore !== null && driver?.reputationScore !== undefined
                    ? driver.reputationScore.toFixed(1) : 'Chưa có'}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
                <Chip
                  label={driver?.onlineStatus === 'ONLINE' ? 'Trực tuyến' : driver?.onlineStatus === 'BUSY' ? 'Đang chạy' : 'Ngoại tuyến'}
                  size="small"
                  color={driver?.onlineStatus === 'ONLINE' ? 'success' : driver?.onlineStatus === 'BUSY' ? 'warning' : 'default'}
                />
              </Box>
            </Box>
          </Box>

          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>Đã lưu thay đổi!</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Biển số xe" fullWidth value={form.vehiclePlate}
                onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField select label="Loại xe" fullWidth value={form.vehicleType}
                onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
                {['Xe máy', 'Ô tô 4 chỗ', 'Ô tô 7 chỗ'].map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Hãng & Model xe" fullWidth value={form.vehicleModel}
                onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" onClick={handleSave} disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography fontWeight={700} mb={2}>Đánh giá gần đây</Typography>
          {ratings.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Chưa có đánh giá nào</Typography>
          ) : (
            <Box display="flex" flexDirection="column" gap={1.5}>
              {ratings.slice(0, 5).map((rating) => (
                <Box key={rating.id} p={1.5} border="1px solid" borderColor="divider" borderRadius={2}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography fontWeight={600}>{rating.stars}★</Typography>
                    <Typography variant="caption" color="text.secondary">{formatDate(rating.createdAt)}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">{rating.comment || 'Không có nhận xét'}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <ChangePasswordCard />
    </Box>
  )
}
