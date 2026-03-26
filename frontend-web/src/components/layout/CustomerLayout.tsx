import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, Box, Avatar, Menu, MenuItem,
  IconButton, Chip, Divider, ListItemIcon,
} from '@mui/material'
import MapIcon from '@mui/icons-material/Map'
import HistoryIcon from '@mui/icons-material/History'
import PersonIcon from '@mui/icons-material/Person'
import LogoutIcon from '@mui/icons-material/Logout'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth.api'

const NAV_ITEMS = [
  { label: 'Đặt xe', path: '/customer/book', icon: <MapIcon fontSize="small" /> },
  { label: 'Lịch sử', path: '/customer/history', icon: <HistoryIcon fontSize="small" /> },
]

export default function CustomerLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleLogout = async () => {
    await authApi.logout().catch(() => {})
    clearAuth()
    navigate('/login')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1.5, sm: 2 } }}>
          <Box display="flex" alignItems="center" gap={1} mr={{ xs: 1.5, sm: 4 }}>
            <DirectionsCarIcon sx={{ color: 'primary.main' }} />
            <Typography
              variant="h6"
              fontWeight={800}
              color="primary.main"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              Đất Mũi Grab
            </Typography>
          </Box>

          <Box
            display="flex"
            gap={0.5}
            flex={1}
            sx={{ overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}
          >
            {NAV_ITEMS.map((item) => (
              <Chip
                key={item.path}
                label={item.label}
                icon={item.icon}
                onClick={() => navigate(item.path)}
                variant={location.pathname.startsWith(item.path) ? 'filled' : 'outlined'}
                color={location.pathname.startsWith(item.path) ? 'primary' : 'default'}
                sx={{ fontWeight: 500, flexShrink: 0 }}
              />
            ))}
          </Box>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
              {user?.fullName?.[0]}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box px={2} py={1}>
              <Typography fontWeight={600}>{user?.fullName}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { navigate('/customer/profile'); setAnchorEl(null) }}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              Hồ sơ cá nhân
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
              Đăng xuất
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="main">
        <Outlet />
      </Box>
    </Box>
  )
}
