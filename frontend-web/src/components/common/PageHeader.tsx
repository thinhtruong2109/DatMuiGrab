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
    <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} gap={1.5} mb={3}>
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
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>{action}</Box>}
    </Box>
  )
}
