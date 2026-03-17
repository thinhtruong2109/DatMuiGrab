import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Avatar, Divider,
  IconButton, Menu, MenuItem, Chip, Tooltip,
} from '@mui/material'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonIcon from '@mui/icons-material/Person'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth.api'

const DRAWER_WIDTH = 240

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  chip?: string
}

interface Props {
  navItems: NavItem[]
  title: string
  roleColor?: string
  roleLabel?: string
}

export default function DashboardLayout({ navItems, title, roleColor = '#00A651', roleLabel }: Props) {
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
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#0F172A',
            color: 'white',
            border: 'none',
          },
        }}
      >
        {/* Logo */}
        <Box px={2.5} py={3} display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: 2,
              bgcolor: roleColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <DirectionsCarIcon sx={{ fontSize: 20, color: 'white' }} />
          </Box>
          <Box>
            <Typography fontWeight={800} fontSize={15} color="white" lineHeight={1.2}>
              Đất Mũi Grab
            </Typography>
            {roleLabel && (
              <Typography fontSize={11} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {roleLabel}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />

        {/* Nav items */}
        <List sx={{ px: 1.5, py: 1.5, flex: 1 }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    bgcolor: active ? `${roleColor}25` : 'transparent',
                    '&:hover': { bgcolor: active ? `${roleColor}30` : 'rgba(255,255,255,0.06)' },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: active ? roleColor : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      color: active ? 'white' : 'rgba(255,255,255,0.65)',
                    }}
                  />
                  {item.chip && (
                    <Chip
                      label={item.chip}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 11,
                        bgcolor: roleColor,
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>

        {/* User section */}
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />
        <Box px={2} py={2} display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: roleColor, fontSize: 13 }}>
            {user?.fullName?.[0]}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography fontSize={13} fontWeight={600} color="white" noWrap>
              {user?.fullName}
            </Typography>
            <Typography fontSize={11} sx={{ color: 'rgba(255,255,255,0.45)' }} noWrap>
              {user?.email}
            </Typography>
          </Box>
          <Tooltip title="Đăng xuất">
            <IconButton size="small" onClick={handleLogout} sx={{ color: 'rgba(255,255,255,0.4)' }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box component="main" sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.default' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
