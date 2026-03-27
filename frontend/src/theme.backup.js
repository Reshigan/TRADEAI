import { createTheme } from '@mui/material/styles';

// Single source of truth for all design tokens
const tokens = {
  colors: {
    primary: { main: '#2563EB', light: '#3B82F6', dark: '#1D4ED8', contrastText: '#fff' },
    secondary: { main: '#7C3AED', light: '#8B5CF6', dark: '#6D28D9', contrastText: '#fff' },
    success: { main: '#059669', light: '#34D399', dark: '#047857' },
    warning: { main: '#D97706', light: '#FBBF24', dark: '#B45309' },
    error: { main: '#DC2626', light: '#F87171', dark: '#B91C1C' },
    info: { main: '#0284C7' },
    sidebar: { bg: '#0F172A', hover: '#1E293B', active: '#1E3A5F', text: '#94A3B8', textActive: '#FFFFFF', border: '#1E293B' },
    background: { default: '#F8FAFC', paper: '#FFFFFF', subtle: '#F1F5F9' },
    text: { primary: '#0F172A', secondary: '#64748B', disabled: '#94A3B8' },
    divider: '#E2E8F0',
  },
  spacing: {
    sidebar: { expanded: 260, collapsed: 68 },
    header: 56,
    borderRadius: { sm: 6, md: 8, lg: 12, xl: 16 },
  },
  shadows: {
    card: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
    dropdown: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    modal: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
  },
};

const theme = createTheme({
  palette: {
    primary: tokens.colors.primary,
    secondary: { main: '#0F172A', light: '#1E293B', dark: '#020617' },
    success: tokens.colors.success,
    warning: tokens.colors.warning,
    error: tokens.colors.error,
    info: tokens.colors.info,
    background: tokens.colors.background,
    text: { primary: '#0F172A', secondary: '#475569' },
    divider: tokens.colors.divider,
  },
  typography: {
    fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.02em' },
    h3: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: '0.875rem', lineHeight: 1.5 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.02em', lineHeight: 1.4 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#F8FAFC', WebkitFontSmoothing: 'antialiased' },
        '::-webkit-scrollbar': { width: 6 },
        '::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 3 },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, padding: '8px 16px', minHeight: 38, textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' },
        contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        outlined: { borderColor: '#E2E8F0', '&:hover': { borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.04)' } },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: { borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: tokens.shadows.card },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 6, fontWeight: 600, fontSize: '0.75rem', height: 26 } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: '1px solid #F1F5F9', padding: '12px 16px', fontSize: '0.8125rem' },
        head: { fontWeight: 600, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', backgroundColor: '#F8FAFC' },
      },
    },
    MuiTableRow: {
      styleOverrides: { root: { '&:hover': { backgroundColor: '#F1F5F9' }, cursor: 'pointer' } },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 8, fontSize: '0.8125rem' } } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 16, boxShadow: tokens.shadows.modal } },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 500, fontSize: '0.8125rem', minHeight: 44 } },
    },
  },
});

theme.sidebar = { width: 260, collapsedWidth: 68, bg: '#0F172A' };
theme.ai = { main: '#7C3AED', light: '#8B5CF6' };
theme.tokens = tokens;
theme.status = {
  draft:            { bg: '#F1F5F9', text: '#475569',  border: '#E2E8F0' },
  pending_approval: { bg: '#FEF3C7', text: '#92400E',  border: '#FDE68A' },
  pending:          { bg: '#FEF3C7', text: '#92400E',  border: '#FDE68A' },
  approved:         { bg: '#DBEAFE', text: '#1E40AF',  border: '#93C5FD' },
  active:           { bg: '#D1FAE5', text: '#065F46',  border: '#6EE7B7' },
  completed:        { bg: '#F3F4F6', text: '#374151',  border: '#D1D5DB' },
  cancelled:        { bg: '#FEE2E2', text: '#991B1B',  border: '#FCA5A5' },
  rejected:         { bg: '#FEE2E2', text: '#991B1B',  border: '#FCA5A5' },
  matched:          { bg: '#D1FAE5', text: '#065F46',  border: '#6EE7B7' },
  unmatched:        { bg: '#FEF3C7', text: '#92400E',  border: '#FDE68A' },
};

export { tokens };
export default theme;
