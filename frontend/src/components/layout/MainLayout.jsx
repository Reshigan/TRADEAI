import React from 'react';
import { Box } from '@mui/material';
import Sidebar, { SIDEBAR_WIDTH } from '../Sidebar';
import Header from './Header';

export default function MainLayout({ user, onLogout, children, onOpenCommandPalette }) {
  const collapsed = localStorage.getItem('sidebar_collapsed') === 'true';
  const sidebarWidth = collapsed ? 64 : SIDEBAR_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar user={user} />
      <Box sx={{ flex: 1, ml: `${sidebarWidth}px`, transition: 'margin-left 0.2s ease', display: 'flex', flexDirection: 'column' }}>
        <Header user={user} onLogout={onLogout} onOpenCommandPalette={onOpenCommandPalette} />
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
