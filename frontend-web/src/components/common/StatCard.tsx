import { Card, CardContent, Box, Typography, Avatar } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: SvgIconComponent
  color?: string
  trend?: { value: number; label: string }
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = '#00A651', trend }: Props) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} mt={0.5} mb={0.25}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{ color: trend.value >= 0 ? 'success.main' : 'error.main' }}
              >
                {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              bgcolor: `${color}15`,
              color: color,
            }}
          >
            <Icon fontSize="medium" />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  )
}
