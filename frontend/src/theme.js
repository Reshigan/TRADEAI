import { createTheme } from '@mui/material/styles';

/**
 * TRADEAI Enterprise Design System
 * Fortune 10 inspired color palette and typography
 * 
 * Design Principles:
 * - Restraint: Muted, professional colors with strategic accent use
 * - Consistency: Unified spacing, typography, and component styling
 * - Hierarchy: Clear visual hierarchy through weight, size, and color
 */

// Enterprise status colors - more muted and professional
const statusColors = {
  ai: '#6366F1',        // Indigo for AI features
  new: '#059669',       // Emerald for new features
  live: '#DC2626',      // Red for live/real-time
  beta: '#2563EB',      // Blue for beta features
  experimental: '#D97706', // Amber for experimental
  degraded: '#DC2626',  // Red for degraded status
  production: '#059669', // Emerald for production ready
};

// Enterprise neutral palette
const neutrals = {
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#E5E5E5',
  300: '#D4D4D4',
  400: '#A3A3A3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1E40AF', // Deep enterprise blue (more mature than startup blue)
      light: '#3B82F6',
      dark: '#1E3A8A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#059669', // Professional emerald green
      light: '#10B981',
      dark: '#047857',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC2626',
      light: '#EF4444',
      dark: '#B91C1C',
    },
    warning: {
      main: '#D97706',
      light: '#F59E0B',
      dark: '#B45309',
    },
    info: {
      main: '#0284C7',
      light: '#0EA5E9',
      dark: '#0369A1',
    },
    success: {
      main: '#059669',
      light: '#10B981',
      dark: '#047857',
    },
    background: {
      default: '#FAFAFA', // Softer, more neutral background
      paper: '#FFFFFF',
      subtle: '#F5F5F5',  // Subtle background for sections
      elevated: '#FFFFFF', // For elevated cards
    },
    text: {
      primary: '#171717', // Near black for maximum readability
      secondary: '#525252', // Medium gray for secondary text
      disabled: '#A3A3A3',
      hint: '#737373',
    },
    divider: '#E5E5E5',
    action: {
      active: '#1E40AF',
      hover: 'rgba(30, 64, 175, 0.04)',
      selected: 'rgba(30, 64, 175, 0.08)',
      disabled: '#A3A3A3',
      disabledBackground: '#F5F5F5',
      focus: 'rgba(30, 64, 175, 0.12)',
    },
    // Custom colors
    status: statusColors,
    neutral: neutrals,
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightSemiBold: 600,
    fontWeightBold: 700,
    h1: {
      fontSize: '2.25rem', // 36px
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
      color: '#171717',
    },
    h2: {
      fontSize: '1.875rem', // 30px
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.02em',
      color: '#171717',
    },
    h3: {
      fontSize: '1.5rem', // 24px
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.015em',
      color: '#171717',
    },
    h4: {
      fontSize: '1.25rem', // 20px
      fontWeight: 600,
      lineHeight: 1.35,
      letterSpacing: '-0.01em',
      color: '#171717',
    },
    h5: {
      fontSize: '1.125rem', // 18px
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#171717',
    },
    h6: {
      fontSize: '1rem', // 16px
      fontWeight: 600,
      lineHeight: 1.5,
      color: '#171717',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#404040',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
      color: '#525252',
    },
    body1: {
      fontSize: '0.9375rem', // 15px - slightly larger for readability
      lineHeight: 1.6,
      color: '#404040',
    },
    body2: {
      fontSize: '0.875rem', // 14px
      lineHeight: 1.57,
      color: '#525252',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: '#737373',
    },
    overline: {
      fontSize: '0.6875rem', // 11px
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: '#737373',
    },
  },
  shape: {
    borderRadius: 8, // Slightly less rounded for enterprise feel
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
    '0 1px 3px 0 rgba(15, 23, 42, 0.1), 0 1px 2px 0 rgba(15, 23, 42, 0.06)',
    '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06)',
    '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
    '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 10px 10px -5px rgba(15, 23, 42, 0.04)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
  ],
  spacing: 8, // Base spacing unit (8px)
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#D4D4D4 #F5F5F5',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 6,
            height: 6,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 3,
            backgroundColor: '#D4D4D4',
            minHeight: 24,
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#A3A3A3',
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            backgroundColor: '#F5F5F5',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 0 0 #E5E5E5',
          borderBottom: '1px solid #E5E5E5',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
          fontWeight: 500,
          boxShadow: 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            boxShadow: 'none',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          },
        },
        containedPrimary: {
          backgroundColor: '#1E40AF',
          '&:hover': {
            backgroundColor: '#1E3A8A',
          },
        },
        outlined: {
          borderColor: '#E5E5E5',
          color: '#404040',
          '&:hover': {
            borderColor: '#D4D4D4',
            backgroundColor: '#FAFAFA',
          },
        },
        text: {
          color: '#525252',
          '&:hover': {
            backgroundColor: '#F5F5F5',
          },
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '0.9375rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          border: '1px solid #E5E5E5',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          '&:hover': {
            borderColor: '#D4D4D4',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        outlined: {
          border: '1px solid #E5E5E5',
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        },
        elevation2: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
        filled: {
          backgroundColor: '#F5F5F5',
          color: '#525252',
          '&:hover': {
            backgroundColor: '#E5E5E5',
          },
        },
        outlined: {
          borderColor: '#E5E5E5',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            '& fieldset': {
              borderColor: '#E5E5E5',
            },
            '&:hover fieldset': {
              borderColor: '#D4D4D4',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1E40AF',
              borderWidth: 1,
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '& fieldset': {
            borderColor: '#E5E5E5',
          },
          '&:hover fieldset': {
            borderColor: '#D4D4D4',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#1E40AF',
            borderWidth: 1,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: 6,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          border: '1px solid #E5E5E5',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          marginTop: 4,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          margin: '2px 6px',
          padding: '8px 12px',
          fontSize: '0.875rem',
          '&:hover': {
            backgroundColor: '#F5F5F5',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(30, 64, 175, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(30, 64, 175, 0.12)',
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #E5E5E5',
          boxShadow: 'none',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid #E5E5E5',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#FAFAFA',
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.75rem',
            color: '#525252',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid #E5E5E5',
            padding: '12px 16px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #F5F5F5',
          padding: '12px 16px',
          fontSize: '0.875rem',
        },
        sizeSmall: {
          padding: '8px 12px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#FAFAFA',
          },
          '&:last-child td': {
            borderBottom: 'none',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.875rem',
        },
        colorDefault: {
          backgroundColor: '#E5E5E5',
          color: '#525252',
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 500,
          fontSize: '0.6875rem',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #E5E5E5',
        },
        indicator: {
          height: 2,
          backgroundColor: '#1E40AF',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          color: '#737373',
          '&.Mui-selected': {
            color: '#1E40AF',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: '#E5E5E5',
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
        standardInfo: {
          backgroundColor: '#EFF6FF',
          color: '#1E40AF',
        },
        standardSuccess: {
          backgroundColor: '#ECFDF5',
          color: '#047857',
        },
        standardWarning: {
          backgroundColor: '#FFFBEB',
          color: '#B45309',
        },
        standardError: {
          backgroundColor: '#FEF2F2',
          color: '#B91C1C',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          fontWeight: 600,
          padding: '20px 24px 16px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px 20px',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#262626',
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '6px 12px',
          borderRadius: 4,
        },
        arrow: {
          color: '#262626',
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        separator: {
          color: '#A3A3A3',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#E5E5E5',
        },
      },
    },
  },
});

export default theme;
