import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import {
  People as UsersIcon,
  Business as CompaniesIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

const AdminLayout = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', label: 'Admin Dashboard', icon: <DashboardIcon /> },
    { path: '/admin/users', label: 'User Management', icon: <UsersIcon /> },
    { path: '/admin/companies', label: 'Companies', icon: <CompaniesIcon /> },
    { path: '/admin/security', label: 'Security', icon: <SecurityIcon /> },
    { path: '/admin/settings', label: 'Settings', icon: <SettingsIcon /> }
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#1976d2'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            <BackIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.email || 'Admin'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            mt: '64px'
          }
        }}
      >
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, px: 2 }}>
            ADMINISTRATION
          </Typography>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.main'
                      }
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive(item.path) ? 'primary.contrastText' : 'inherit',
                      minWidth: 40
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
            Admin users only
          </Typography>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: '64px',
          backgroundColor: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
