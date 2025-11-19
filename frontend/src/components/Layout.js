import React from 'react';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import Breadcrumbs from './common/Breadcrumbs';
import MegaMenu from './MegaMenu';

const Layout = ({ children, user, onLogout }) => {

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* MegaMenu at the top */}
      <MegaMenu 
        user={user} 
        onLogout={onLogout}
        onMobileMenuToggle={handleDrawerToggle}
      />
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              top: 64,
              height: 'calc(100% - 64px)'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              top: 64,
              height: 'calc(100% - 64px)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: '100%',
          minHeight: '100vh',
          bgcolor: 'background.default',
          mt: '64px'
        }}
      >
        <Breadcrumbs />
        {children}
        <QuickActions />
      </Box>
      
      {/* AI Assistant - Powered by Llama3.2 */}
      <AIAssistant />
      
      {/* <Walkthrough 
        open={walkthroughOpen} 
        onClose={() => setWalkthroughOpen(false)} 
        feature={walkthroughFeature}
        showTips={true}
      /> */}
    </Box>
  );
};

export default Layout;
