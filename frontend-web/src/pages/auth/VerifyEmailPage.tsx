import { useState } from 'react'
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom'
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Link } from '@mui/material'
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead'
import { authApi } from '@/api/auth.api'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as any)?.email || ''
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authApi.verifyEmail(email, otp)
      navigate('/login', { state: { verified: true } })
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP không hợp lệ hoặc đã hết hạn')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await authApi.resendOtp(email)
      setResent(true)
      setTimeout(() => setResent(false), 30000)
    } catch {}
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 400, borderRadius: 4 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <MarkEmailReadIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          </Box>

          <Typography variant="h5" fontWeight={700} mb={1}>Xác nhận email</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Mã OTP đã được gửi đến <strong>{email}</strong>
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {resent && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>Đã gửi lại OTP!</Alert>}

          <Box component="form" onSubmit={handleVerify} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Mã OTP (6 số)"
              fullWidth required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: 24, letterSpacing: 8 } }}
            />
            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
              {loading ? 'Đang xác nhận...' : 'Xác nhận'}
            </Button>
          </Box>

          <Button onClick={handleResend} disabled={resent} sx={{ mt: 2 }} size="small">
            Gửi lại OTP
          </Button>

          <Typography variant="body2" color="text.secondary" mt={2}>
            <Link component={RouterLink} to="/login" color="primary.main">← Quay lại đăng nhập</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
