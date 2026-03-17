import { Box, Typography, Button } from '@mui/material'
import InboxIcon from '@mui/icons-material/Inbox'

interface Props {
  title?: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({
  title = 'Không có dữ liệu',
  description,
  action,
}: Props) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={8}
      gap={1.5}
    >
      <InboxIcon sx={{ fontSize: 56, color: 'grey.300' }} />
      <Typography variant="h6" color="text.secondary" fontWeight={500}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {description}
        </Typography>
      )}
      {action && (
        <Button variant="contained" onClick={action.onClick} sx={{ mt: 1 }}>
          {action.label}
        </Button>
      )}
    </Box>
  )
}
