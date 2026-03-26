import { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, TextField, Button, Alert } from '@mui/material'
import { driverApi } from '@/api/driver.api'
import { appealApi } from '@/api/appeal.api'
import type { Driver } from '@/types'
import PageHeader from '@/components/common/PageHeader'

export default function DriverAppealsPage() {
  const [driver, setDriver] = useState<Driver | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    driverApi.getMe().then(setDriver).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!driver) {
      setError('Không tìm thấy hồ sơ tài xế')
      return
    }
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do kháng cáo')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await appealApi.create(driver.id, reason.trim())
      setSuccess('Đã gửi kháng cáo thành công')
      setReason('')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể gửi kháng cáo')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box p={{ xs: 2, md: 3 }} maxWidth={700} width="100%">
      <PageHeader title="Kháng cáo điểm uy tín" subtitle="Gửi yêu cầu xem xét lại trạng thái tài khoản" />

      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography fontWeight={700} mb={1}>Tạo kháng cáo</Typography>
          <Typography variant="body2" color="text.secondary" mb={2.5}>
            Đội ngũ quản trị sẽ xem xét và phản hồi trong mục quản trị.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

          <TextField
            label="Lý do kháng cáo"
            multiline
            rows={4}
            fullWidth
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi kháng cáo'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
