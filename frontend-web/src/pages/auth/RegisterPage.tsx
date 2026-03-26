import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, Link, ToggleButtonGroup, ToggleButton,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import PersonIcon from '@mui/icons-material/Person'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import BusinessIcon from '@mui/icons-material/Business'
import { authApi } from '@/api/auth.api'
import type { UserRole } from '@/types'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<UserRole>('CUSTOMER')
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phoneNumber: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.register({ ...form, role })
      navigate('/verify-email', { state: { email: form.email } })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại')
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
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 460, borderRadius: { xs: 3, sm: 4 } }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={4}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DirectionsCarIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Typography fontWeight={800} fontSize={18} color="primary.main">Đất Mũi Grab</Typography>
          </Box>

          <Typography variant="h5" fontWeight={700} mb={0.5}>Tạo tài khoản</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Chọn loại tài khoản phù hợp</Typography>

          {/* Role selector */}
          <ToggleButtonGroup
            value={role}
            exclusive
            onChange={(_, v) => v && setRole(v)}
            fullWidth
            sx={{
              mb: 3,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
              gap: 1,
              '& .MuiToggleButtonGroup-grouped': {
                border: '1px solid',
                borderColor: 'divider !important',
                borderRadius: '10px !important',
              },
            }}
          >
            {[
              { value: 'CUSTOMER', label: 'Khách hàng', icon: <PersonIcon fontSize="small" /> },
              { value: 'DRIVER', label: 'Tài xế', icon: <TwoWheelerIcon fontSize="small" /> },
              { value: 'TRANSPORT_COMPANY', label: 'Công ty', icon: <BusinessIcon fontSize="small" /> },
            ].map((r) => (
              <ToggleButton
                key={r.value}
                value={r.value}
                sx={{
                  flex: 1,
                  py: 1,
                  gap: 0.5,
                  fontSize: 13,
                  fontWeight: 500,
                  '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } },
                }}
              >
                {r.icon}{r.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            <TextField label="Họ và tên" fullWidth required value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <TextField label="Email" type="email" fullWidth required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField
              label="Số điện thoại"
              fullWidth
              required={role === 'DRIVER'}
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              helperText={role === 'DRIVER' ? 'Bắt buộc với tài xế' : ''}
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
              helperText="Tối thiểu 8 ký tự"
            />
            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ mt: 1 }}>
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" textAlign="center" mt={3}>
            Đã có tài khoản?{' '}
            <Link component={RouterLink} to="/login" fontWeight={600} color="primary.main">Đăng nhập</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
