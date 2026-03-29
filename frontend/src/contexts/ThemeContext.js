import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Shared base typography and shape
const sharedTypography = {
  fontFamily: [
    'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
    'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
  ].join(','),
  button: { textTransform: 'none', fontWeight: 600, fontSize: '0.9375rem', letterSpacing: '0.01em' },
};

const sharedShape = { borderRadius: 12 };

const headingTypography = {
  h1: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
  h2: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.02em' },
  h3: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
  h4: { fontSize: '0.9375rem', fontWeight: 600 },
  h5: { fontSize: '0.875rem', fontWeight: 600 },
  h6: { fontSize: '0.8125rem', fontWeight: 600 },
  subtitle1: { fontSize: '0.875rem', fontWeight: 500 },
  subtitle2: { fontSize: '0.8125rem', fontWeight: 500 },
  body1: { fontSize: '0.875rem', lineHeight: 1.5 },
  body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
  caption: { fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.02em', lineHeight: 1.4 },
};

// Light theme builder
function buildLightTheme() {
  return createTheme({
    palette: {
      mode: 'light',
      primary:    { main: '#059669', light: '#10B981', dark: '#047857', contrastText: '#fff' },
      secondary:  { main: '#D97706', light: '#F59E0B', dark: '#B45309', contrastText: '#fff' },
      success:    { main: '#10B981', light: '#34D399', dark: '#059669', contrastText: '#fff' },
      warning:    { main: '#F59E0B', light: '#FBBF24', dark: '#D97706', contrastText: '#fff' },
      error:      { main: '#EF4444', light: '#F87171', dark: '#DC2626', contrastText: '#fff' },
      info:       { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB', contrastText: '#fff' },
      background: { default: '#FAFAF9', paper: '#FFFFFF' },
      text:       { primary: '#1C1917', secondary: '#57534E' },
      divider: '#E7E5E4',
    },
    typography: { ...sharedTypography, ...headingTypography },
    shape: sharedShape,
    shadows: [
      'none',
      '0px 1px 2px rgba(0,0,0,0.05)',
      '0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.06)',
      '0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -1px rgba(0,0,0,0.06)',
      '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -2px rgba(0,0,0,0.05)',
      '0px 20px 25px -5px rgba(0,0,0,0.1), 0px 10px 10px -5px rgba(0,0,0,0.04)',
      '0px 25px 50px -12px rgba(0,0,0,0.25)',
      '0px 2px 4px rgba(0,0,0,0.05)',
      '0px 4px 8px rgba(0,0,0,0.08)',
      '0px 8px 16px rgba(0,0,0,0.1)',
      '0px 12px 24px rgba(0,0,0,0.12)',
      '0px 16px 32px rgba(0,0,0,0.14)',
      '0px 20px 40px rgba(0,0,0,0.16)',
      '0px 24px 48px rgba(0,0,0,0.18)',
      '0px 28px 56px rgba(0,0,0,0.2)',
      '0px 32px 64px rgba(0,0,0,0.22)',
      '0px 36px 72px rgba(0,0,0,0.24)',
      '0px 40px 80px rgba(0,0,0,0.26)',
      '0px 44px 88px rgba(0,0,0,0.28)',
      '0px 48px 96px rgba(0,0,0,0.3)',
      '0px 52px 104px rgba(0,0,0,0.32)',
      '0px 56px 112px rgba(0,0,0,0.34)',
      '0px 60px 120px rgba(0,0,0,0.36)',
      '0px 64px 128px rgba(0,0,0,0.38)',
      '0px 68px 136px rgba(0,0,0,0.4)',
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: '#FAFAF9', color: '#1C1917', WebkitFontSmoothing: 'antialiased' },
          '::-webkit-scrollbar': { width: 6 },
          '::-webkit-scrollbar-thumb': { background: '#D6D3D1', borderRadius: 3 },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 10, padding: '10px 24px', fontWeight: 600,
            boxShadow: 'none', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            '&:hover': { boxShadow: '0px 4px 12px rgba(5,150,105,0.3)', transform: 'translateY(-1px)' },
            '&:active': { transform: 'translateY(0)' },
          },
          contained: {
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' },
          },
          outlined: { borderWidth: 2, '&:hover': { borderWidth: 2, backgroundColor: 'rgba(16,185,129,0.04)' } },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid rgba(231,229,228,0.8)',
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            '&:hover': { boxShadow: '0px 12px 40px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' },
          elevation1: { boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' },
          elevation2: { boxShadow: '0px 4px 16px rgba(0,0,0,0.06)' },
          elevation3: { boxShadow: '0px 8px 24px rgba(0,0,0,0.08)' },
        },
      },
      MuiAppBar: {
        styleOverrides: { root: { boxShadow: '0px 1px 3px rgba(0,0,0,0.05)', backgroundColor: '#FFFFFF', color: '#1E293B' } },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600, borderRadius: 8 }, filled: { boxShadow: '0px 2px 4px rgba(0,0,0,0.08)' } },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10, transition: 'all 0.2s',
              '&:hover': { boxShadow: '0px 2px 8px rgba(16,185,129,0.1)' },
              '&.Mui-focused': { boxShadow: '0px 4px 12px rgba(16,185,129,0.15)' },
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: '#FFFFFF',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D6D3D1' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#A8A29E' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#059669' },
          },
          input: { color: '#1C1917', WebkitTextFillColor: '#1C1917', '&::placeholder': { color: '#78716C', WebkitTextFillColor: '#78716C', opacity: 0.7 } },
        },
      },
      MuiInputBase: { styleOverrides: { input: { color: '#1C1917', WebkitTextFillColor: '#1C1917' } } },
      MuiInputLabel: {
        styleOverrides: { root: { color: '#57534E', '&.Mui-focused': { color: '#059669' } } },
      },
      MuiSelect: { styleOverrides: { select: { color: '#1C1917', WebkitTextFillColor: '#1C1917' }, icon: { color: '#57534E' } } },
      MuiIconButton: {
        styleOverrides: {
          root: { transition: 'all 0.2s', '&:hover': { backgroundColor: 'rgba(16,185,129,0.08)', transform: 'scale(1.05)' } },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { backgroundColor: '#1C1917', fontSize: '0.875rem', fontWeight: 500, padding: '8px 12px', borderRadius: 8, boxShadow: '0px 4px 12px rgba(0,0,0,0.15)' },
          arrow: { color: '#1C1917' },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10, margin: '2px 8px', transition: 'all 0.2s',
            '&:hover': { backgroundColor: 'rgba(16,185,129,0.04)' },
            '&.Mui-selected': { backgroundColor: 'rgba(16,185,129,0.08)', '&:hover': { backgroundColor: 'rgba(16,185,129,0.12)' } },
          },
        },
      },
      MuiDivider: { styleOverrides: { root: { borderColor: 'rgba(231,229,228,0.8)' } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 20 } } },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: '1px solid #E7E5E4', color: '#1C1917' },
          head: { fontWeight: 600, backgroundColor: '#F5F5F4', color: '#44403C', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' },
        },
      },
      MuiTableRow: {
        styleOverrides: { root: { '&:hover': { backgroundColor: '#FAFAF9' } } },
      },
      MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 500 } } },
      MuiDrawer: { styleOverrides: { paper: { borderRight: 'none' } } },
    },
  });
}

// Dark theme builder
function buildDarkTheme() {
  return createTheme({
    palette: {
      mode: 'dark',
      primary:    { main: '#10B981', light: '#34D399', dark: '#059669', contrastText: '#fff' },
      secondary:  { main: '#F59E0B', light: '#FBBF24', dark: '#D97706', contrastText: '#fff' },
      success:    { main: '#10B981', light: '#34D399', dark: '#059669', contrastText: '#fff' },
      warning:    { main: '#F59E0B', light: '#FBBF24', dark: '#D97706', contrastText: '#fff' },
      error:      { main: '#EF4444', light: '#F87171', dark: '#DC2626', contrastText: '#fff' },
      info:       { main: '#0EA5E9', light: '#38BDF8', dark: '#0284C7', contrastText: '#fff' },
      background: { default: '#09090B', paper: '#18181B' },
      text:       { primary: '#FAFAFA', secondary: '#A1A1AA' },
      divider: '#27272A',
    },
    typography: { ...sharedTypography, ...headingTypography },
    shape: sharedShape,
    shadows: [
      'none',
      '0px 1px 2px rgba(0,0,0,0.3)',
      '0px 1px 3px rgba(0,0,0,0.4), 0px 1px 2px rgba(0,0,0,0.3)',
      '0px 4px 6px -1px rgba(0,0,0,0.4), 0px 2px 4px -1px rgba(0,0,0,0.3)',
      '0px 10px 15px -3px rgba(0,0,0,0.4), 0px 4px 6px -2px rgba(0,0,0,0.3)',
      '0px 20px 25px -5px rgba(0,0,0,0.5), 0px 10px 10px -5px rgba(0,0,0,0.3)',
      '0px 25px 50px -12px rgba(0,0,0,0.6)',
      '0px 2px 4px rgba(0,0,0,0.3)',
      '0px 4px 8px rgba(0,0,0,0.35)',
      '0px 8px 16px rgba(0,0,0,0.4)',
      '0px 12px 24px rgba(0,0,0,0.45)',
      '0px 16px 32px rgba(0,0,0,0.5)',
      '0px 20px 40px rgba(0,0,0,0.55)',
      '0px 24px 48px rgba(0,0,0,0.6)',
      '0px 28px 56px rgba(0,0,0,0.6)',
      '0px 32px 64px rgba(0,0,0,0.6)',
      '0px 36px 72px rgba(0,0,0,0.6)',
      '0px 40px 80px rgba(0,0,0,0.6)',
      '0px 44px 88px rgba(0,0,0,0.6)',
      '0px 48px 96px rgba(0,0,0,0.6)',
      '0px 52px 104px rgba(0,0,0,0.6)',
      '0px 56px 112px rgba(0,0,0,0.6)',
      '0px 60px 120px rgba(0,0,0,0.6)',
      '0px 64px 128px rgba(0,0,0,0.6)',
      '0px 68px 136px rgba(0,0,0,0.6)',
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: '#09090B', color: '#FAFAFA', WebkitFontSmoothing: 'antialiased' },
          '::-webkit-scrollbar': { width: 6 },
          '::-webkit-scrollbar-thumb': { background: '#3F3F46', borderRadius: 3 },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 10, padding: '10px 24px', fontWeight: 600,
            boxShadow: 'none', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            '&:hover': { boxShadow: '0px 4px 12px rgba(16,185,129,0.3)', transform: 'translateY(-1px)' },
            '&:active': { transform: 'translateY(0)' },
          },
          contained: {
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' },
          },
          outlined: { borderColor: '#3F3F46', '&:hover': { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)' } },
        },
      },
      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
          root: {
            borderRadius: 16, border: '1px solid #27272A', backgroundColor: '#18181B',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            '&:hover': { boxShadow: '0 8px 25px rgba(0,0,0,0.4)', transform: 'translateY(-2px)', borderColor: '#3F3F46' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none', backgroundColor: '#18181B' },
          elevation1: { boxShadow: '0px 2px 8px rgba(0,0,0,0.3)' },
          elevation2: { boxShadow: '0px 4px 16px rgba(0,0,0,0.35)' },
          elevation3: { boxShadow: '0px 8px 24px rgba(0,0,0,0.4)' },
        },
      },
      MuiAppBar: {
        styleOverrides: { root: { boxShadow: '0px 1px 3px rgba(0,0,0,0.3)', backgroundColor: '#18181B', color: '#FAFAFA' } },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } } },
      MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10, transition: 'all 0.2s',
              '&:hover': { boxShadow: '0px 2px 8px rgba(16,185,129,0.15)' },
              '&.Mui-focused': { boxShadow: '0px 4px 12px rgba(16,185,129,0.2)' },
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3F3F46' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#52525B' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#10B981' },
          },
          input: { color: '#FAFAFA', '&::placeholder': { color: '#71717A', opacity: 1 } },
        },
      },
      MuiInputBase: { styleOverrides: { input: { color: '#FAFAFA' } } },
      MuiInputLabel: {
        styleOverrides: { root: { color: '#A1A1AA', '&.Mui-focused': { color: '#10B981' } } },
      },
      MuiSelect: {
        styleOverrides: { select: { color: '#FAFAFA' }, icon: { color: '#A1A1AA' } },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { transition: 'all 0.2s', '&:hover': { backgroundColor: 'rgba(16,185,129,0.12)', transform: 'scale(1.05)' } },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { backgroundColor: '#27272A', border: '1px solid #3F3F46', fontSize: '0.875rem', fontWeight: 500, padding: '8px 12px', borderRadius: 8, boxShadow: '0px 4px 12px rgba(0,0,0,0.3)' },
          arrow: { color: '#27272A' },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10, margin: '2px 8px', transition: 'all 0.2s',
            '&:hover': { backgroundColor: 'rgba(16,185,129,0.08)' },
            '&.Mui-selected': { backgroundColor: 'rgba(16,185,129,0.12)', '&:hover': { backgroundColor: 'rgba(16,185,129,0.16)' } },
          },
        },
      },
      MuiDivider: { styleOverrides: { root: { borderColor: '#27272A' } } },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 20, backgroundColor: '#18181B', border: '1px solid #27272A' } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: '1px solid #27272A', color: '#FAFAFA' },
          head: { fontWeight: 600, backgroundColor: '#09090B', color: '#A1A1AA', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' },
        },
      },
      MuiTableRow: {
        styleOverrides: { root: { '&:hover': { backgroundColor: 'rgba(39,39,42,0.5)' } } },
      },
      MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 500 } } },
      MuiMenu: { styleOverrides: { paper: { backgroundColor: '#27272A', border: '1px solid #3F3F46' } } },
      MuiMenuItem: { styleOverrides: { root: { '&:hover': { backgroundColor: 'rgba(16,185,129,0.12)' } } } },
      MuiPopover: { styleOverrides: { paper: { backgroundColor: '#27272A', border: '1px solid #3F3F46' } } },
      MuiSwitch: { styleOverrides: { track: { backgroundColor: '#52525B' } } },
      MuiDrawer: { styleOverrides: { paper: { borderRight: 'none' } } },
    },
  });
}

// Context: mode can be 'light', 'dark', or 'auto'
const ThemeContext = createContext({
  mode: 'auto',
  resolvedMode: 'light',
  setMode: () => {},
  toggleTheme: () => {},
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

function getSystemPreference() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function ThemeContextProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('tradeai_theme') || localStorage.getItem('themeMode');
    if (saved && ['light', 'dark', 'auto'].includes(saved)) return saved;
    return 'auto';
  });

  const [systemPref, setSystemPref] = useState(getSystemPreference);

  useEffect(() => {
    localStorage.setItem('tradeai_theme', mode);
  }, [mode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setSystemPref(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedMode = mode === 'auto' ? systemPref : mode;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedMode);
  }, [resolvedMode]);

  const theme = useMemo(() => {
    return resolvedMode === 'dark' ? buildDarkTheme() : buildLightTheme();
  }, [resolvedMode]);

  const contextValue = useMemo(() => ({
    mode,
    resolvedMode,
    setMode,
    toggleTheme: () => setMode(resolvedMode === 'dark' ? 'light' : 'dark'),
  }), [mode, resolvedMode]);

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
