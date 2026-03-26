import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, CircularProgress, Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import BusinessIcon from '@mui/icons-material/Business'
import { driverApi } from '@/api/driver.api'
import { companyApi } from '@/api/company.api'
import { formatDate } from '@/utils/format'
import type { DriverCompanyRegistration, TransportCompany } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import EmptyState from '@/components/common/EmptyState'

const statusLabel: Record<string, string> = {
  PENDING: 'Chờ duyệt', ACTIVE: 'Đã duyệt', REJECTED: 'Từ chối', SUSPENDED: 'Tạm hoãn',
}
const statusColor: Record<string, any> = {
  PENDING: 'warning', ACTIVE: 'success', REJECTED: 'error', SUSPENDED: 'default',
}

export default function DriverRegistrationsPage() {
  const [registrations, setRegistrations] = useState<DriverCompanyRegistration[]>([])
  const [companies, setCompanies] = useState<TransportCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    companyId: '', licenseNumber: '', idCardNumber: '',
    phoneNumber: '', vehiclePlate: '', vehicleType: 'Xe máy', vehicleModel: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([driverApi.getMyRegistrations(), companyApi.getAll()])
      .then(([regs, comps]) => { setRegistrations(regs); setCompanies(comps) })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const reg = await driverApi.register(form)
      setRegistrations([...registrations, reg])
      setDialogOpen(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <PageHeader
        title="Đăng ký công ty"
        subtitle="Quản lý đăng ký chạy xe với các công ty vận tải"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Đăng ký mới
          </Button>
        }
      />

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : registrations.length === 0 ? (
        <EmptyState
          title="Chưa đăng ký công ty nào"
          description="Đăng ký để bắt đầu nhận cuốc xe"
          action={{ label: 'Đăng ký ngay', onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {registrations.map((reg) => (
            <Card key={reg.id}>
              <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'primary.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BusinessIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Box flex={1}>
                  <Typography fontWeight={600}>{reg.companyName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Đăng ký ngày {formatDate(reg.appliedAt)}
                  </Typography>
                  {reg.note && (
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      Ghi chú: {reg.note}
                    </Typography>
                  )}
                </Box>
                <Chip label={statusLabel[reg.status]} color={statusColor[reg.status]} sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Đăng ký công ty vận tải</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField select label="Công ty vận tải" fullWidth required
              value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
              {companies.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.companyName}</MenuItem>
              ))}
            </TextField>
            <TextField label="Số CMND/CCCD" fullWidth required value={form.idCardNumber}
              onChange={(e) => setForm({ ...form, idCardNumber: e.target.value })} />
            <TextField label="Số bằng lái xe" fullWidth required value={form.licenseNumber}
              onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
            <TextField label="Số điện thoại" fullWidth required value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
            <TextField label="Biển số xe" fullWidth required value={form.vehiclePlate}
              onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} />
            <TextField select label="Loại xe" fullWidth value={form.vehicleType}
              onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
              {['Xe máy', 'Ô tô 4 chỗ', 'Ô tô 7 chỗ'].map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
            <TextField label="Hãng xe & Model" fullWidth value={form.vehicleModel}
              onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Hủy</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi đăng ký'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
