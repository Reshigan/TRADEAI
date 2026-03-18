import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { tokens } from '../theme';

// GAP-15: Dark Mode / Theme Switching

const darkTokens = {
  colors: {
    primary: { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB', contrastText: '#fff' },
    secondary: { main: '#8B5CF6', light: '#A78BFA', dark: '#7C3AED', contrastText: '#fff' },
    success: { main: '#10B981', light: '#34D399', dark: '#059669' },
    warning: { main: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
    error: { main: '#EF4444', light: '#F87171', dark: '#DC2626' },
    info: { main: '#0EA5E9' },
    sidebar: { bg: '#0A111E', hover: '#131B2E', active: '#1E3A5F', text: '#64748B', textActive: '#FFFFFF', border: '#1E293B' },
    background: { default: '#0A111E', paper: '#111827', subtle: '#1E293B' },
    text: { primary: '#F1F5F9', secondary: '#94A3B8', disabled: '#475569' },
    divider: '#1E293B',
  },
};

function buildDarkTheme() {
  return createTheme({
    palette: {
      mode: 'dark',
      primary: darkTokens.colors.primary,
      secondary: { main: '#F1F5F9', light: '#E2E8F0', dark: '#CBD5E1' },
      success: darkTokens.colors.success,
      warning: darkTokens.colors.warning,
      error: darkTokens.colors.error,
      info: darkTokens.colors.info,
      background: darkTokens.colors.background,
      text: { primary: '#F1F5F9', secondary: '#94A3B8' },
      divider: darkTokens.colors.divider,
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
          body: { backgroundColor: '#0A111E', WebkitFontSmoothing: 'antialiased' },
          '::-webkit-scrollbar': { width: 6 },
          '::-webkit-scrollbar-thumb': { background: '#334155', borderRadius: 3 },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 8, padding: '8px 16px', minHeight: 38, textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' },
          contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
          outlined: { borderColor: '#334155', '&:hover': { borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)' } },
        },
      },
      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
          root: { borderRadius: 12, border: '1px solid #1E293B', backgroundColor: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 6, fontWeight: 600, fontSize: '0.75rem', height: 26 } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: '1px solid #1E293B', padding: '12px 16px', fontSize: '0.8125rem' },
          head: { fontWeight: 600, color: '#64748B', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', backgroundColor: '#0F172A' },
        },
      },
      MuiTableRow: {
        styleOverrides: { root: { '&:hover': { backgroundColor: '#1E293B' }, cursor: 'pointer' } },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'small' },
        styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 8, fontSize: '0.8125rem' } } },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 16, backgroundColor: '#111827', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' } },
      },
      MuiTab: {
        styleOverrides: { root: { textTransform: 'none', fontWeight: 500, fontSize: '0.8125rem', minHeight: 44 } },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
    },
  });
}

const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
  setMode: () => {},
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function ThemeContextProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    if (saved) return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  // Detect system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const saved = localStorage.getItem('themeMode');
      if (!saved) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => setMode(prev => prev === 'light' ? 'dark' : 'light');

  const theme = useMemo(() => {
    if (mode === 'dark') {
      const dt = buildDarkTheme();
      dt.sidebar = { width: 260, collapsedWidth: 68, bg: '#0A111E' };
      dt.ai = { main: '#8B5CF6', light: '#A78BFA' };
      dt.tokens = { ...tokens, colors: darkTokens.colors };
      dt.status = {
        draft:            { bg: '#1E293B', text: '#94A3B8', border: '#334155' },
        pending_approval: { bg: '#422006', text: '#FCD34D', border: '#854D0E' },
        pending:          { bg: '#422006', text: '#FCD34D', border: '#854D0E' },
        approved:         { bg: '#172554', text: '#93C5FD', border: '#1E40AF' },
        active:           { bg: '#052E16', text: '#6EE7B7', border: '#065F46' },
        completed:        { bg: '#1F2937', text: '#D1D5DB', border: '#374151' },
        cancelled:        { bg: '#450A0A', text: '#FCA5A5', border: '#991B1B' },
        rejected:         { bg: '#450A0A', text: '#FCA5A5', border: '#991B1B' },
        matched:          { bg: '#052E16', text: '#6EE7B7', border: '#065F46' },
        unmatched:        { bg: '#422006', text: '#FCD34D', border: '#854D0E' },
      };
      return dt;
    }
    // Light mode: use existing theme.js
    const lightTheme = require('../theme').default;
    return lightTheme;
  }, [mode]);

  const contextValue = useMemo(() => ({ mode, toggleTheme, setMode }), [mode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export default ThemeContext;
