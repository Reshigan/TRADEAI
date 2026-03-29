/**
 * TRADEAI Professional Design System
 * Enhanced theme with comprehensive design tokens, professional styling, and modern UI components
 */

import { createTheme } from '@mui/material/styles';

// Professional Design System - Single source of truth for all design tokens
const tokens = {
  colors: {
    // Primary Brand Colors - Indigo Palette
    primary: { 
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',
      500: '#6366F1',
      600: '#4F46E5',
      700: '#4338CA',
      800: '#3730A3',
      900: '#312E81',
      main: '#6366F1', 
      light: '#818CF8', 
      dark: '#4F46E5', 
      contrastText: '#fff' 
    },
    // Secondary - Purple
    secondary: { 
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA',
      500: '#8B5CF6',
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
      main: '#8B5CF6', 
      light: '#A78BFA', 
      dark: '#7C3AED', 
      contrastText: '#fff' 
    },
    // Accent - Cyan
    accent: {
      50: '#ECFEFF',
      100: '#CFFAFE',
      200: '#A5F3FC',
      300: '#67E8F9',
      400: '#22D3EE',
      500: '#06B6D4',
      600: '#0891B2',
      700: '#0E7490',
      800: '#155E75',
      900: '#164E63',
      main: '#06B6D4',
      light: '#22D3EE',
      dark: '#0891B2',
    },
    // Success - Emerald Green
    success: { 
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981',
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
      main: '#059669', 
      light: '#34D399', 
      dark: '#047857' 
    },
    // Warning - Amber
    warning: { 
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
      main: '#D97706', 
      light: '#FBBF24', 
      dark: '#B45309' 
    },
    // Error - Rose Red
    error: { 
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444',
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
      main: '#DC2626', 
      light: '#F87171', 
      dark: '#B91C1C' 
    },
    // Info - Sky Blue
    info: { 
      50: '#F0F9FF',
      100: '#E0F2FE',
      200: '#BAE6FD',
      300: '#7DD3FC',
      400: '#38BDF8',
      500: '#0EA5E9',
      600: '#0284C7',
      700: '#0369A1',
      800: '#075985',
      900: '#0C4A6E',
      main: '#0284C7' 
    },
    // Neutral Grays
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    // Sidebar Colors
    sidebar: { 
      bg: '#0F172A', 
      hover: '#1E293B', 
      active: '#1E3A5F', 
      text: '#94A3B8', 
      textActive: '#FFFFFF', 
      border: '#1E293B' 
    },
    // Background Colors
    background: { 
      default: '#F8FAFC', 
      paper: '#FFFFFF', 
      subtle: '#F1F5F9',
      elevated: '#FFFFFF',
      overlay: 'rgba(0, 0, 0, 0.5)'
    },
    // Text Colors
    text: { 
      primary: '#0F172A', 
      secondary: '#64748B', 
      tertiary: '#94A3B8',
      disabled: '#CBD5E1',
      inverse: '#FFFFFF'
    },
    // Border & Divider
    divider: '#E2E8F0',
    border: {
      light: '#F1F5F9',
      default: '#E2E8F0',
      dark: '#CBD5E1',
    }
  },
  spacing: {
    sidebar: { expanded: 280, collapsed: 72 },
    header: 64,
    headerMobile: 56,
    borderRadius: { sm: 6, md: 8, lg: 12, xl: 16, '2xl': 24, full: 9999 },
    pagePadding: { mobile: 16, tablet: 24, desktop: 32 },
    sectionSpacing: { sm: 24, md: 32, lg: 48 },
    cardPadding: { sm: 16, md: 20, lg: 24 },
  },
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    card: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
    cardHover: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
    cardElevated: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
    dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    popover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    tooltip: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  },
  transitions: {
    duration: { fastest: 100, faster: 150, fast: 200, normal: 250, slow: 300, slower: 350, slowest: 400 },
    easing: { 
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    },
  },
  zIndex: {
    hide: -1,
    mobileStepper: 1000,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
  breakpoints: {
    values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1536, '2xl': 1920 }
  }
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: tokens.colors.primary,
    secondary: tokens.colors.secondary,
    success: tokens.colors.success,
    warning: tokens.colors.warning,
    error: tokens.colors.error,
    info: tokens.colors.info,
    grey: tokens.colors.gray,
    background: tokens.colors.background,
    text: tokens.colors.text,
    divider: tokens.colors.divider,
    common: { black: '#000000', white: '#FFFFFF' },
    action: {
      active: tokens.colors.text.secondary,
      hover: 'rgba(99, 102, 241, 0.04)',
      hoverOpacity: 0.04,
      selected: 'rgba(99, 102, 241, 0.08)',
      selectedOpacity: 0.08,
      disabled: tokens.colors.text.disabled,
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
      disabledOpacity: 0.38,
      focus: 'rgba(99, 102, 241, 0.12)',
      focusOpacity: 0.12,
      activatedOpacity: 0.12,
    },
  },
  typography: {
    fontFamily: '"DM Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    htmlFontSize: 16,
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.02em' },
    h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
    subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.02em' },
    caption: { fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.02em', lineHeight: 1.4 },
    overline: { fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.6 },
  },
  shape: { 
    borderRadius: tokens.spacing.borderRadius.md,
    borderRadiusSm: tokens.spacing.borderRadius.sm,
    borderRadiusLg: tokens.spacing.borderRadius.lg,
    borderRadiusXl: tokens.spacing.borderRadius.xl,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box', margin: 0, padding: 0 },
        html: { scrollBehavior: 'smooth', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
        body: { backgroundColor: tokens.colors.background.default, color: tokens.colors.text.primary, WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
        '::-webkit-scrollbar': { width: 8, height: 8 },
        '::-webkit-scrollbar-track': { background: tokens.colors.background.default },
        '::-webkit-scrollbar-thumb': { background: tokens.colors.gray[400], borderRadius: 4, '&:hover': { background: tokens.colors.gray[500] } },
        '::selection': { backgroundColor: 'rgba(99, 102, 241, 0.2)', color: tokens.colors.text.primary },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, size: 'medium' },
      styleOverrides: {
        root: { 
          borderRadius: tokens.spacing.borderRadius.md, 
          padding: '10px 20px', 
          minHeight: 40,
          minWidth: 64,
          textTransform: 'none', 
          fontWeight: 600, 
          fontSize: '0.875rem',
          letterSpacing: '0.02em',
          transition: 'all 0.2s ease',
          '&:active': { transform: 'scale(0.98)' },
        },
        contained: { 
          boxShadow: tokens.shadows.sm,
          '&:hover': { boxShadow: tokens.shadows.md, transform: 'translateY(-1px)' },
        },
        outlined: { 
          borderColor: tokens.colors.border.default, 
          borderWidth: 1.5,
          '&:hover': { borderColor: tokens.colors.primary.main, backgroundColor: 'rgba(99,102,241,0.04)', borderWidth: 1.5 },
        },
        text: { '&:hover': { backgroundColor: 'rgba(99,102,241,0.04)' } },
        sizeSmall: { padding: '6px 14px', minHeight: 32, fontSize: '0.8125rem' },
        sizeLarge: { padding: '12px 28px', minHeight: 48, fontSize: '0.9375rem' },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: { 
          borderRadius: tokens.spacing.borderRadius.lg, 
          border: `1px solid ${tokens.colors.border.light}`, 
          boxShadow: tokens.shadows.card,
          transition: 'all 0.2s ease',
          '&:hover': { boxShadow: tokens.shadows.cardHover, borderColor: tokens.colors.border.default },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: { root: { padding: `${tokens.spacing.cardPadding.md}px`, '&:last-child': { paddingBottom: `${tokens.spacing.cardPadding.md}px` } } },
    },
    MuiChip: {
      styleOverrides: { 
        root: { borderRadius: tokens.spacing.borderRadius.md, fontWeight: 600, fontSize: '0.8125rem', height: 28 },
        sizeSmall: { height: 24, fontSize: '0.75rem' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${tokens.colors.border.light}`, padding: '14px 16px', fontSize: '0.875rem', color: tokens.colors.text.primary },
        head: { fontWeight: 600, color: tokens.colors.text.secondary, fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', backgroundColor: tokens.colors.background.subtle, borderBottom: `1px solid ${tokens.colors.border.default}` },
        sizeSmall: { padding: '10px 12px' },
      },
    },
    MuiTableRow: {
      styleOverrides: { 
        root: { 
          '&:hover': { backgroundColor: tokens.colors.background.subtle },
          '&:last-child td': { borderBottom: 0 },
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: { root: { borderRadius: tokens.spacing.borderRadius.lg, border: `1px solid ${tokens.colors.border.light}` } },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small', fullWidth: true },
      styleOverrides: { 
        root: { 
          '& .MuiOutlinedInput-root': { 
            borderRadius: tokens.spacing.borderRadius.md, 
            fontSize: '0.875rem',
            backgroundColor: tokens.colors.background.paper,
            transition: 'all 0.2s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: tokens.colors.primary.main, borderWidth: 1.5 },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: tokens.colors.primary.main, borderWidth: 2 },
          },
          '& .MuiInputLabel-root': { fontSize: '0.875rem', '&.Mui-focused': { color: tokens.colors.primary.main } },
        },
      },
    },
    MuiDialog: {
      styleOverrides: { 
        paper: { borderRadius: tokens.spacing.borderRadius.xl, boxShadow: tokens.shadows.modal, border: `1px solid ${tokens.colors.border.light}` },
        paperFullScreen: { borderRadius: 0 },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { padding: '20px 24px 16px', fontSize: '1.125rem', fontWeight: 600 } },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: '16px 24px' } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: '16px 24px', gap: 12 } },
    },
    MuiTab: {
      styleOverrides: { 
        root: { textTransform: 'none', fontWeight: 500, fontSize: '0.875rem', minHeight: 48, padding: '12px 16px', transition: 'all 0.2s ease', '&.Mui-selected': { fontWeight: 600 } },
      },
    },
    MuiTabs: {
      styleOverrides: { indicator: { height: 3, borderRadius: '3px 3px 0 0' } },
    },
    MuiPaper: {
      styleOverrides: { root: { borderRadius: tokens.spacing.borderRadius.lg, backgroundImage: 'none' } },
    },
    MuiAvatar: {
      styleOverrides: { root: { fontWeight: 600, fontSize: '0.875rem' }, rounded: { borderRadius: tokens.spacing.borderRadius.md } },
    },
    MuiBadge: {
      styleOverrides: { badge: { fontWeight: 600, fontSize: '0.6875rem', minWidth: 18, height: 18 } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: tokens.spacing.borderRadius.md, padding: '12px 16px' } },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: tokens.spacing.borderRadius.full, height: 8 } },
    },
    MuiSkeleton: {
      styleOverrides: { root: { borderRadius: tokens.spacing.borderRadius.md, transform: 'scale(1, 1)' } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: tokens.colors.gray[900], fontSize: '0.8125rem', fontWeight: 500, padding: '8px 12px', borderRadius: tokens.spacing.borderRadius.md, boxShadow: tokens.shadows.tooltip },
        arrow: { color: tokens.colors.gray[900] },
      },
    },
    MuiDrawer: {
      styleOverrides: { paper: { borderRight: `1px solid ${tokens.colors.border.light}`, boxShadow: tokens.shadows.lg } },
    },
    MuiAppBar: {
      styleOverrides: { root: { boxShadow: tokens.shadows.sm } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.spacing.borderRadius.md,
          margin: '4px 8px',
          padding: '10px 12px',
          '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.08)' },
          '&.Mui-selected': { backgroundColor: 'rgba(99, 102, 241, 0.12)', '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.16)' } },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: tokens.spacing.borderRadius.md,
          margin: '4px 8px',
          padding: '10px 12px',
          fontSize: '0.875rem',
          '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.08)' },
          '&.Mui-selected': { backgroundColor: 'rgba(99, 102, 241, 0.12)', '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.16)' } },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: tokens.spacing.borderRadius.md, transition: 'all 0.2s ease', '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.08)' } } },
    },
  },
});

// Extend theme with custom properties
theme.sidebar = { 
  width: tokens.spacing.sidebar.expanded, 
  collapsedWidth: tokens.spacing.sidebar.collapsed, 
  bg: tokens.colors.sidebar.bg,
  hover: tokens.colors.sidebar.hover,
  active: tokens.colors.sidebar.active,
  text: tokens.colors.sidebar.text,
  textActive: tokens.colors.sidebar.textActive,
  border: tokens.colors.sidebar.border,
};

theme.ai = { 
  main: '#6366F1', 
  light: '#818CF8',
  accent: '#06B6D4',
  gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)',
  gradientAccent: 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)',
};

theme.tokens = tokens;

theme.status = {
  draft:            { bg: tokens.colors.gray[100], text: tokens.colors.gray[700],  border: tokens.colors.border.default },
  pending_approval: { bg: tokens.colors.warning[100], text: tokens.colors.warning[800],  border: tokens.colors.warning[200] },
  pending:          { bg: tokens.colors.warning[100], text: tokens.colors.warning[800],  border: tokens.colors.warning[200] },
  approved:         { bg: tokens.colors.info[100], text: tokens.colors.info[800],  border: tokens.colors.info[200] },
  active:           { bg: tokens.colors.success[100], text: tokens.colors.success[800],  border: tokens.colors.success[200] },
  completed:        { bg: tokens.colors.gray[100], text: tokens.colors.gray[700],  border: tokens.colors.border.default },
  cancelled:        { bg: tokens.colors.error[100], text: tokens.colors.error[800],  border: tokens.colors.error[200] },
  rejected:         { bg: tokens.colors.error[100], text: tokens.colors.error[800],  border: tokens.colors.error[200] },
  matched:          { bg: tokens.colors.success[100], text: tokens.colors.success[800],  border: tokens.colors.success[200] },
  unmatched:        { bg: tokens.colors.warning[100], text: tokens.colors.warning[800],  border: tokens.colors.warning[200] },
  processing:       { bg: tokens.colors.info[100], text: tokens.colors.info[800],  border: tokens.colors.info[200] },
  failed:           { bg: tokens.colors.error[100], text: tokens.colors.error[800],  border: tokens.colors.error[200] },
};

theme.gradients = {
  primary: `linear-gradient(135deg, ${tokens.colors.primary[600]} 0%, ${tokens.colors.primary[700]} 100%)`,
  secondary: `linear-gradient(135deg, ${tokens.colors.secondary[600]} 0%, ${tokens.colors.secondary[700]} 100%)`,
  success: `linear-gradient(135deg, ${tokens.colors.success[500]} 0%, ${tokens.colors.success[600]} 100%)`,
  warning: `linear-gradient(135deg, ${tokens.colors.warning[400]} 0%, ${tokens.colors.warning[500]} 100%)`,
  error: `linear-gradient(135deg, ${tokens.colors.error[500]} 0%, ${tokens.colors.error[600]} 100%)`,
  ai: `linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)`,
};

export { tokens };
export default theme;
