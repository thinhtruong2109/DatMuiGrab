import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, Divider, Link,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.login(form)
      setAuth(data.user, data.accessToken, data.refreshToken)
      const role = data.user.role
      if (role === 'CUSTOMER') navigate('/customer/book')
      else if (role === 'DRIVER') navigate('/driver')
      else if (role === 'TRANSPORT_COMPANY') navigate('/company')
      else if (role === 'ADMIN') navigate('/admin')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420, borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box display="flex" alignItems="center" gap={1.5} mb={4}>
            <Box
              sx={{
                width: 44, height: 44, borderRadius: 2.5,
                bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <DirectionsCarIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize={18} color="primary.main" lineHeight={1.2}>
                Đất Mũi Grab
              </Typography>
              <Typography fontSize={12} color="text.secondary">
                Nền tảng vận tải Cà Mau
              </Typography>
            </Box>
          </Box>

          <Typography variant="h5" fontWeight={700} mb={0.5}>
            Đăng nhập
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Chào mừng trở lại!
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Mật khẩu"
              type={showPw ? 'text' : 'password'}
              fullWidth
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw(!showPw)} edge="end">
                      {showPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ mt: 1 }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" color="text.secondary" textAlign="center">
            Chưa có tài khoản?{' '}
            <Link component={RouterLink} to="/register" fontWeight={600} color="primary.main">
              Đăng ký ngay
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
