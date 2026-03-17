import { Box, Typography, Breadcrumbs, Link } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

interface Crumb { label: string; to?: string }

interface Props {
  title: string
  subtitle?: string
  breadcrumbs?: Crumb[]
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, breadcrumbs, action }: Props) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
      <Box>
        {breadcrumbs && (
          <Breadcrumbs sx={{ mb: 0.5 }}>
            {breadcrumbs.map((crumb, i) =>
              crumb.to ? (
                <Link
                  key={i}
                  component={RouterLink}
                  to={crumb.to}
                  underline="hover"
                  color="text.secondary"
                  fontSize={13}
                >
                  {crumb.label}
                </Link>
              ) : (
                <Typography key={i} fontSize={13} color="text.primary" fontWeight={500}>
                  {crumb.label}
                </Typography>
              )
            )}
          </Breadcrumbs>
        )}
        <Typography variant="h4">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  )
}
