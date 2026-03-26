import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert,
  Slider, InputAdornment, Divider,
} from '@mui/material'
import { companyApi } from '@/api/company.api'
import { formatCurrency } from '@/utils/format'
import type { TransportCompany } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import ChangePasswordCard from '@/components/common/ChangePasswordCard'
import { useAuthStore } from '@/store/authStore'

export default function CompanySettingsPage() {
  const { user } = useAuthStore()
  const [company, setCompany] = useState<TransportCompany | null>(null)
  const [pricePerKm, setPricePerKm] = useState(15000)
  const [driverPercent, setDriverPercent] = useState(75)
  const [description, setDescription] = useState('')
  const [onboarding, setOnboarding] = useState({
    companyName: '',
    licenseNumber: '',
    address: '',
    description: '',
    pricePerKm: 15000,
    driverRevenuePercent: 75,
  })
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    companyApi.getAll().then((companies) => {
      const c = companies.find((item) => item.userId === user?.id) || companies[0]
      if (!c) return
      setCompany(c)
      setPricePerKm(c.pricePerKm)
      setDriverPercent(c.driverRevenuePercent)
      setDescription(c.description || '')
    })
  }, [user?.id])

  const handleUpdatePrice = async () => {
    if (!company) return
    setLoading(true)
    try {
      await companyApi.updatePrice(company.id, pricePerKm)
      setSuccess('Đã cập nhật giá cước!')
      setTimeout(() => setSuccess(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateInfo = async () => {
    if (!company) return
    setLoading(true)
    try {
      const updated = await companyApi.update(company.id, { driverRevenuePercent: driverPercent, description })
      setCompany(updated)
      setSuccess('Đã cập nhật thông tin!')
      setTimeout(() => setSuccess(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  const examplePrice = pricePerKm * 3.5 * 1.05

  const handleCreateCompany = async () => {
    setLoading(true)
    try {
      const created = await companyApi.create(onboarding)
      setCompany(created)
      setPricePerKm(created.pricePerKm)
      setDriverPercent(created.driverRevenuePercent)
      setDescription(created.description || '')
      setSuccess('Đã tạo hồ sơ công ty thành công. Vui lòng chờ Admin duyệt.')
    } catch (err: any) {
      setSuccess('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box p={{ xs: 2, md: 3 }} maxWidth={760} width="100%" display="flex" flexDirection="column" gap={3}>
      <PageHeader title="Cài đặt công ty" />

      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

      {!company && (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography fontWeight={700} mb={0.5}>Đăng ký công ty vận tải</Typography>
            <Typography variant="body2" color="text.secondary" mb={2.5}>
              Tạo hồ sơ onboarding để Admin phê duyệt kích hoạt.
            </Typography>

            <Box display="flex" flexDirection="column" gap={2}>
              <TextField label="Tên công ty" value={onboarding.companyName} onChange={(e) => setOnboarding({ ...onboarding, companyName: e.target.value })} fullWidth />
              <TextField label="Số giấy phép" value={onboarding.licenseNumber} onChange={(e) => setOnboarding({ ...onboarding, licenseNumber: e.target.value })} fullWidth />
              <TextField label="Địa chỉ" value={onboarding.address} onChange={(e) => setOnboarding({ ...onboarding, address: e.target.value })} fullWidth />
              <TextField label="Mô tả" value={onboarding.description} onChange={(e) => setOnboarding({ ...onboarding, description: e.target.value })} fullWidth multiline rows={3} />
              <TextField label="Giá per km" type="number" value={onboarding.pricePerKm} onChange={(e) => setOnboarding({ ...onboarding, pricePerKm: Number(e.target.value) })} fullWidth />
              <TextField label="Tỉ lệ tài xế (%)" type="number" value={onboarding.driverRevenuePercent} onChange={(e) => setOnboarding({ ...onboarding, driverRevenuePercent: Number(e.target.value) })} fullWidth />
              <Box>
                <Button variant="contained" onClick={handleCreateCompany} disabled={loading} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  {loading ? 'Đang tạo...' : 'Tạo hồ sơ công ty'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Price config */}
      {company && <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography fontWeight={700} mb={0.5}>Giá cước</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Thay đổi giá ngay lập tức — chỉ áp dụng cho chuyến đặt mới
          </Typography>

          <TextField
            label="Giá per km (VND)"
            type="number"
            fullWidth
            value={pricePerKm}
            onChange={(e) => setPricePerKm(Number(e.target.value))}
            InputProps={{ endAdornment: <InputAdornment position="end">đ/km</InputAdornment> }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Ví dụ chuyến 3.5km: khách trả{' '}
              <strong style={{ color: '#00A651' }}>{formatCurrency(examplePrice)}</strong>
              {' '}(đã bao gồm 5% phí sàn)
            </Typography>
          </Box>

          <Button variant="contained" onClick={handleUpdatePrice} disabled={loading} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Cập nhật giá
          </Button>
        </CardContent>
      </Card>}

      {/* Revenue split */}
      {company && <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography fontWeight={700} mb={0.5}>Chia doanh thu</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Tỉ lệ chia từ phần 95% sau khi trừ phí sàn
          </Typography>

          <Typography variant="body2" fontWeight={600} mb={1}>
            Tài xế nhận: {driverPercent}% — Công ty nhận: {100 - driverPercent}%
          </Typography>
          <Slider
            value={driverPercent}
            onChange={(_, v) => setDriverPercent(v as number)}
            min={50} max={90} step={5}
            marks={[
              { value: 50, label: '50%' },
              { value: 70, label: '70%' },
              { value: 90, label: '90%' },
            ]}
            sx={{ mb: 3 }}
          />

          <Divider sx={{ mb: 2 }} />

          <TextField
            label="Mô tả công ty"
            multiline rows={3} fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button variant="contained" onClick={handleUpdateInfo} disabled={loading} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Lưu cài đặt
          </Button>
        </CardContent>
      </Card>}

      <ChangePasswordCard />
    </Box>
  )
}
