import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#00A651',
      light: '#33B871',
      dark: '#007A3D',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF6B35',
      light: '#FF8A5E',
      dark: '#CC4E1E',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A2E',
      secondary: '#64748B',
    },
    error: { main: '#EF4444' },
    warning: { main: '#F59E0B' },
    success: { main: '#10B981' },
    info: { main: '#3B82F6' },
    grey: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
    },
  },
  typography: {
    fontFamily: '"Be Vietnam Pro", sans-serif',
    h1: { fontWeight: 800, fontSize: '2.5rem', letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.01em' },
    h3: { fontWeight: 700, fontSize: '1.5rem' },
    h4: { fontWeight: 600, fontSize: '1.25rem' },
    h5: { fontWeight: 600, fontSize: '1.125rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { fontWeight: 600, textTransform: 'none', fontSize: '0.9375rem' },
    caption: { fontSize: '0.75rem', color: '#64748B' },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0px 1px 3px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)',
    '0px 4px 6px rgba(0,0,0,0.05), 0px 2px 4px rgba(0,0,0,0.04)',
    '0px 10px 15px rgba(0,0,0,0.07), 0px 4px 6px rgba(0,0,0,0.05)',
    '0px 20px 25px rgba(0,0,0,0.08), 0px 10px 10px rgba(0,0,0,0.04)',
    '0px 25px 50px rgba(0,0,0,0.12)',
    ...Array(19).fill('none'),
  ] as any,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': { boxShadow: '0px 4px 12px rgba(0,166,81,0.3)' },
        },
        contained: {
          '&:hover': { boxShadow: '0px 4px 12px rgba(0,166,81,0.35)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 6px rgba(0,0,0,0.05), 0px 2px 4px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            '& fieldset': { borderColor: '#E2E8F0' },
            '&:hover fieldset': { borderColor: '#00A651' },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0,0,0,0.06)',
          backgroundColor: '#ffffff',
          color: '#1A1A2E',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: '1px solid #E2E8F0' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: '#F8FAFC',
            fontWeight: 600,
            color: '#64748B',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
    },
  },
})

export default theme
