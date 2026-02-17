import React, { useState } from 'react';
import { Box, CssBaseline, useMediaQuery, useTheme } from '@mui/material';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';
import TopHeader from './TopHeader';
import MobileDrawer from './MobileDrawer';

const Layout = ({ children, user, onLogout }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F3F4F6' }}>
      <CssBaseline />

      {!isMobile && <Sidebar user={user} onLogout={onLogout} />}

      <MobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        onLogout={onLogout}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: isMobile ? '100%' : `calc(100% - ${SIDEBAR_WIDTH}px)`,
        }}
      >
        <TopHeader onMenuClick={() => setMobileMenuOpen(true)} />

        <Box
          sx={{
            flex: 1,
            px: { xs: 2, sm: 3 },
            pb: 3,
            overflow: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
