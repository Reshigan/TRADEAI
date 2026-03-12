import React, { useState } from 'react';
import { Box, CssBaseline, useMediaQuery, useTheme, Drawer } from '@mui/material';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';
import Header from './Header';

export default function Layout({ children, user, onLogout }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = localStorage.getItem('sidebar_collapsed') === 'true';
  const sidebarWidth = collapsed ? 64 : SIDEBAR_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      <CssBaseline />
      {!isMobile && <Sidebar user={user} onLogout={onLogout} />}
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, bgcolor: '#0F172A', border: 'none' } }}>
        <Sidebar user={user} onLogout={onLogout} />
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, ml: isMobile ? 0 : `${sidebarWidth}px`, display: 'flex', flexDirection: 'column', minHeight: '100vh', width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`, transition: 'margin-left 0.2s ease, width 0.2s ease' }}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <Box sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: 3, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
