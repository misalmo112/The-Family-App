import { createTheme, alpha } from '@mui/material/styles';

const colors = {
  teal: '#00c2a8',
  coral: '#ff6b4a',
  ink: '#1c1f2a',
  inkMuted: '#4a5166',
  bg0: '#f7f6f2',
  bg1: '#eaf7f3',
  bg2: '#fdefea',
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.teal,
      contrastText: '#0b121a',
    },
    secondary: {
      main: colors.coral,
    },
    background: {
      default: colors.bg0,
      paper: 'rgba(255, 255, 255, 0.72)',
    },
    text: {
      primary: colors.ink,
      secondary: colors.inkMuted,
    },
    divider: 'rgba(28, 31, 42, 0.08)',
  },
  typography: {
    fontFamily: '"Manrope", sans-serif',
    h1: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    h4: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  spacing: 8,
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.6)',
          color: colors.ink,
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(28,31,42,0.08)',
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(28,31,42,0.08)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 12px 40px rgba(10,15,25,0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          border: '1px solid rgba(28,31,42,0.08)',
          boxShadow: '0 18px 60px rgba(10,15,25,0.2)',
          backdropFilter: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          padding: '10px 18px',
          fontWeight: 600,
          minHeight: 44,
        },
        containedPrimary: {
          boxShadow: '0 8px 20px rgba(0,194,168,0.25)',
        },
        outlined: {
          borderColor: 'rgba(28,31,42,0.16)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          background: 'rgba(255,255,255,0.65)',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.teal,
            boxShadow: `0 0 0 3px ${alpha(colors.teal, 0.15)}`,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          background: 'rgba(0,194,168,0.12)',
          color: colors.ink,
          fontWeight: 600,
        },
      },
    },
  },
});

export default lightTheme;
