import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary:   { main: '#2563EB', light: '#3B82F6', dark: '#1D4ED8', contrastText: '#fff' },
    secondary: { main: '#0F172A', light: '#1E293B', dark: '#020617' },
    success:   { main: '#059669', light: '#10B981', dark: '#047857' },
    warning:   { main: '#D97706', light: '#F59E0B', dark: '#B45309' },
    error:     { main: '#DC2626', light: '#EF4444', dark: '#B91C1C' },
    info:      { main: '#0284C7' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text:      { primary: '#0F172A', secondary: '#475569' },
    divider: '#E2E8F0',
  },
  typography: {
    fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em' },
    h2: { fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.02em' },
    h3: { fontSize: '1.125rem', fontWeight: 600 },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem' },
    caption: { fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.02em' },
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
        root: { borderRadius: 8, padding: '8px 16px', minHeight: 38 },
        outlined: { borderColor: '#E2E8F0' },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: { borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 6, fontWeight: 500, fontSize: '0.75rem', height: 26 } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: '1px solid #F1F5F9', padding: '12px 16px', fontSize: '0.8125rem' },
        head: { fontWeight: 600, color: '#94A3B8', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', backgroundColor: '#F8FAFC' },
      },
    },
    MuiTableRow: {
      styleOverrides: { root: { '&:hover': { backgroundColor: '#F1F5F9' }, cursor: 'pointer' } },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 8 } } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 16 } },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 500, minHeight: 44 } },
    },
  },
});

theme.sidebar = { width: 256, collapsedWidth: 64, bg: '#0F172A' };
theme.ai = { main: '#7C3AED', light: '#8B5CF6' };
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

export default theme;
