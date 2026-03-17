import { Box, CircularProgress, Typography } from '@mui/material'

export default function LoadingScreen({ message = 'Đang tải...' }: { message?: string }) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={2}
    >
      <CircularProgress size={48} sx={{ color: 'primary.main' }} />
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  )
}
