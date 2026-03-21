import { useState } from 'react'
import { Card, CardContent, Typography, TextField, Button, Alert, Box } from '@mui/material'
import { userService } from '@/services'

export default function ChangePasswordCard() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!form.currentPassword || !form.newPassword) {
      setError('Vui lòng nhập đầy đủ thông tin')
      return
    }

    if (form.newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('Xác nhận mật khẩu không khớp')
      return
    }

    setLoading(true)
    try {
      await userService.changePassword(form.currentPassword, form.newPassword)
      setSuccess('Đổi mật khẩu thành công')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể đổi mật khẩu, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography fontWeight={700} mb={0.5}>Đổi mật khẩu</Typography>
        <Typography variant="body2" color="text.secondary" mb={2.5}>
          Cập nhật mật khẩu để tăng cường bảo mật tài khoản
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Mật khẩu hiện tại"
            type="password"
            fullWidth
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          />
          <TextField
            label="Mật khẩu mới"
            type="password"
            fullWidth
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          />
          <TextField
            label="Xác nhận mật khẩu mới"
            type="password"
            fullWidth
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
          <Box>
            <Button variant="contained" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
