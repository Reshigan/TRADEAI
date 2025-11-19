import React from 'react';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import Breadcrumbs from './common/Breadcrumbs';
import MegaMenu from './MegaMenu';

const Layout = ({ children, user, onLogout }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* MegaMenu at the top */}
      <MegaMenu 
        user={user} 
        onLogout={onLogout}
      />
      
      {/* Toolbar spacer for fixed AppBar */}
      <Toolbar />
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: '100%',
          bgcolor: 'background.default'
        }}
      >
        <Breadcrumbs />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
