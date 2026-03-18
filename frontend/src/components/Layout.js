import React, { useState, useEffect, useCallback } from 'react';
import { Box, CssBaseline, useMediaQuery, useTheme, Drawer, BottomNavigation, BottomNavigationAction, Fab } from '@mui/material';
import { Dashboard, Receipt, CheckCircle, BarChart, Menu as MenuIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';
import Header from './Header';

// GAP-14: Mobile-first bottom navigation items
const mobileNavItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { label: 'Promotions', icon: <Receipt />, path: '/plan/promotions' },
  { label: 'Approvals', icon: <CheckCircle />, path: '/approve' },
  { label: 'Analytics', icon: <BarChart />, path: '/analyze/pnl' },
];

export default function Layout({ children, user, onLogout }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = localStorage.getItem('sidebar_collapsed') === 'true';
  const sidebarWidth = collapsed ? 64 : SIDEBAR_WIDTH;
  const navigate = useNavigate();
  const location = useLocation();

  // GAP-14: Pull-to-refresh on mobile
  const [pullStart, setPullStart] = useState(null);
  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) setPullStart(e.touches[0].clientY);
  }, []);
  const handleTouchEnd = useCallback((e) => {
    if (pullStart && e.changedTouches[0].clientY - pullStart > 100) {
      window.location.reload();
    }
    setPullStart(null);
  }, [pullStart]);

  useEffect(() => {
    if (isMobile) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isMobile, handleTouchStart, handleTouchEnd]);

  const bottomNavValue = mobileNavItems.findIndex(item => location.pathname.startsWith(item.path));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <CssBaseline />
      {!isMobile && <Sidebar user={user} onLogout={onLogout} />}
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, bgcolor: theme.sidebar?.bg || '#0F172A', border: 'none' } }}>
        <Sidebar user={user} onLogout={onLogout} />
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, ml: isMobile ? 0 : `${sidebarWidth}px`, display: 'flex', flexDirection: 'column', minHeight: '100vh', width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`, transition: 'margin-left 0.2s ease, width 0.2s ease', pb: isMobile ? '64px' : 0 }}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <Box sx={{ flex: 1, px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 2, md: 3 }, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {children}
        </Box>
      </Box>
      {/* GAP-14: Mobile bottom navigation */}
      {isMobile && (
        <>
          <Fab color="primary" size="small" onClick={() => setMobileOpen(true)}
            sx={{ position: 'fixed', bottom: 72, right: 16, zIndex: 1200 }}>
            <MenuIcon />
          </Fab>
          <BottomNavigation value={bottomNavValue} onChange={(_, newVal) => { if (mobileNavItems[newVal]) navigate(mobileNavItems[newVal].path); }}
            showLabels sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
            {mobileNavItems.map((item) => (
              <BottomNavigationAction key={item.label} label={item.label} icon={item.icon} />
            ))}
          </BottomNavigation>
        </>
      )}
    </Box>
  );
}
