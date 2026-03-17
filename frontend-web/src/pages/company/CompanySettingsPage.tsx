import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert,
  Slider, InputAdornment, Divider,
} from '@mui/material'
import { companyApi } from '@/api/company.api'
import { formatCurrency } from '@/utils/format'
import type { TransportCompany } from '@/types'
import PageHeader from '@/components/common/PageHeader'

export default function CompanySettingsPage() {
  const [company, setCompany] = useState<TransportCompany | null>(null)
  const [pricePerKm, setPricePerKm] = useState(15000)
  const [driverPercent, setDriverPercent] = useState(75)
  const [description, setDescription] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    companyApi.getAll().then((companies) => {
      const c = companies[0]
      if (!c) return
      setCompany(c)
      setPricePerKm(c.pricePerKm)
      setDriverPercent(c.driverRevenuePercent)
      setDescription(c.description || '')
    })
  }, [])

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

  return (
    <Box p={3} maxWidth={640}>
      <PageHeader title="Cài đặt công ty" />

      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

      {/* Price config */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
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

          <Button variant="contained" onClick={handleUpdatePrice} disabled={loading}>
            Cập nhật giá
          </Button>
        </CardContent>
      </Card>

      {/* Revenue split */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
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

          <Button variant="contained" onClick={handleUpdateInfo} disabled={loading}>
            Lưu cài đặt
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
