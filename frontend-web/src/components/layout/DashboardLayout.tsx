import { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Avatar, Divider,
  IconButton, Chip, Tooltip,
} from '@mui/material'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth.api'
import { driverApi } from '@/api/driver.api'
import { rideApi } from '@/api/ride.api'
import { useRideStore } from '@/store/rideStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { Ride } from '@/types'

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
  const { setCurrentRide } = useRideStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const restorePendingRide = useCallback(async () => {
    if (!user || user.role !== 'DRIVER') return

    try {
      const pendingRide = await rideApi.getDriverPendingRide()
      if (pendingRide) {
        setCurrentRide(pendingRide)
      }
    } catch {
      // ignore transient restore errors
    }
  }, [user?.id, user?.role, setCurrentRide])

  const { subscribe } = useWebSocket({
    onConnect: restorePendingRide,
  })

  useEffect(() => {
    if (!user || user.role !== 'DRIVER') return

    let cancelled = false
    let unsubscribeNewRide: (() => void) | undefined

    const loadDriverRealtime = async () => {
      try {
        const [driver, rides] = await Promise.all([
          driverApi.getMe(),
          driverApi.getMyRides(),
        ])

        if (cancelled) return

        const activeRide = rides.find((ride) => ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED')
        if (activeRide) {
          setCurrentRide(activeRide)
        } else {
          await restorePendingRide()
        }

        unsubscribeNewRide = subscribe(`/topic/driver/${driver.id}/new-ride`, async (payload: Ride | string) => {
          if (typeof payload === 'string') {
            try {
              const ride = await rideApi.getById(payload)
              if (!cancelled) setCurrentRide(ride)
            } catch {
              // ignore transient fetch error
            }
            return
          }

          if (!cancelled) setCurrentRide(payload)
        })
      } catch {
        // ignore transient bootstrap errors
      }
    }

    loadDriverRealtime()

    return () => {
      cancelled = true
      unsubscribeNewRide?.()
    }
  }, [user?.id, user?.role, subscribe, setCurrentRide, restorePendingRide])

  const handleLogout = async () => {
    await authApi.logout().catch(() => {})
    clearAuth()
    navigate('/login')
  }

  const drawerContent = (
    <>
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

      <List sx={{ px: 1.5, py: 1.5, flex: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path)
                  if (isMobile) setMobileOpen(false)
                }}
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
    </>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { xs: 'flex', md: 'none' },
          bgcolor: '#0F172A',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Toolbar sx={{ minHeight: 56 }}>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Typography fontWeight={700} sx={{ flex: 1 }}>{title}</Typography>
          <Avatar sx={{ width: 32, height: 32, bgcolor: roleColor, fontSize: 12 }}>{user?.fullName?.[0]}</Avatar>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#0F172A',
            color: 'white',
            border: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
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
        {drawerContent}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: 'background.default',
          pt: { xs: '56px', md: 0 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
