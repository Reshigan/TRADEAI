import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import Breadcrumbs from './common/Breadcrumbs';
import MegaMenu from './MegaMenu';
import MobileDrawer from './MobileDrawer';

const Layout = ({ children, user, onLogout }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* MegaMenu at the top */}
      <MegaMenu 
        user={user} 
        onLogout={onLogout}
        onMobileMenuToggle={handleMobileMenuToggle}
      />

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        onLogout={onLogout}
      />
      
      {/* Toolbar spacer for fixed AppBar */}
      <Toolbar />
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 1.5, sm: 2, md: 3 }, 
          width: '100%',
          bgcolor: 'background.default',
          overflow: 'hidden'
        }}
      >
        {!isMobile && <Breadcrumbs />}
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
