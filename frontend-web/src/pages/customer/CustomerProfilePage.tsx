import { useState, useEffect } from 'react'
import { Box, Card, CardContent, TextField, Button, Typography, Avatar, Alert } from '@mui/material'
import { useAuthStore } from '@/store/authStore'
import { userService } from '@/services'
import PageHeader from '@/components/common/PageHeader'
import ChangePasswordCard from '@/components/common/ChangePasswordCard'

export default function CustomerProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({ fullName: user?.fullName || '', phoneNumber: user?.phoneNumber || '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    userService.getMe().then((me) => {
      updateUser(me)
      setForm({ fullName: me.fullName || '', phoneNumber: me.phoneNumber || '' })
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      const updated = await userService.updateMe(form)
      updateUser(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box p={{ xs: 2, md: 3 }} maxWidth={560} mx="auto" display="flex" flexDirection="column" gap={3}>
      <PageHeader title="Hồ sơ cá nhân" />
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box display="flex" alignItems="center" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} mb={3}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24 }}>
              {user?.fullName?.[0]}
            </Avatar>
            <Box>
              <Typography fontWeight={600}>{user?.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
            </Box>
          </Box>

          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>Đã lưu thay đổi!</Alert>}

          <Box display="flex" flexDirection="column" gap={2}>
            <TextField label="Họ và tên" fullWidth value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <TextField label="Số điện thoại" fullWidth value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
            <TextField label="Email" fullWidth value={user?.email} disabled />
            <Button variant="contained" onClick={handleSave} disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </Box>
        </CardContent>
      </Card>
      <ChangePasswordCard />
    </Box>
  )
}
