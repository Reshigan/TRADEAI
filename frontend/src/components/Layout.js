import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalance as BudgetIcon,
  Receipt as TradeSpendIcon,
  LocalOffer as PromotionIcon,
  People as CustomerIcon,
  Inventory as ProductIcon,
  BarChart as AnalyticsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Logout,
  ChevronLeft,
  Business as BusinessIcon,
  Description as ReportIcon,
  CalendarMonth as ActivityGridIcon
} from '@mui/icons-material';

import { AIAssistant, Walkthrough } from './common';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Budgets', icon: <BudgetIcon />, path: '/budgets' },
  { text: 'Trade Spends', icon: <TradeSpendIcon />, path: '/trade-spends' },
  { text: 'Promotions', icon: <PromotionIcon />, path: '/promotions' },
  { text: 'Activity Grid', icon: <ActivityGridIcon />, path: '/activity-grid' },
  { text: 'Customers', icon: <CustomerIcon />, path: '/customers' },
  { text: 'Products', icon: <ProductIcon />, path: '/products' },
  { text: 'Companies', icon: <BusinessIcon />, path: '/companies' },
  { text: 'Reports', icon: <ReportIcon />, path: '/reports' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const Layout = ({ children, user, onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [walkthroughFeature, setWalkthroughFeature] = useState('');
  
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Check if walkthrough should be shown based on current path
  useEffect(() => {
    const path = location.pathname;
    let feature = '';
    
    if (path === '/dashboard') feature = 'dashboard';
    else if (path.includes('/budgets')) feature = 'budgets';
    else if (path.includes('/trade-spends')) feature = 'trade-spends';
    else if (path.includes('/promotions')) feature = 'promotions';
    else if (path.includes('/activity-grid')) feature = 'activity-grid';
    else if (path.includes('/customers')) feature = 'customers';
    else if (path.includes('/products')) feature = 'products';
    else if (path.includes('/analytics')) feature = 'analytics';
    else if (path.includes('/settings')) feature = 'settings';
    
    // Check if user has seen this walkthrough before
    if (feature && !localStorage.getItem(`walkthrough_${feature}`)) {
      setWalkthroughFeature(feature);
      setWalkthroughOpen(true);
    }
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenNotificationsMenu = (event) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleCloseNotificationsMenu = () => {
    setAnchorElNotifications(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    onLogout();
  };

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img src="/images/modern-edgy-logo.svg" alt="Trade AI Logo" style={{ height: 32, marginRight: 8 }} />
          <Typography 
            variant="h6" 
            noWrap 
            component="div"
            sx={{ 
              background: 'linear-gradient(45deg, #00ffff, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              letterSpacing: '1px'
            }}
          >
            TRADE AI
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeft />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={isMobile ? handleDrawerToggle : undefined}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'primary.main' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Typography variant="body2" color="text.secondary">
          Trade AI Platform v2.1.3
        </Typography>
        <Typography variant="caption" color="text.secondary">
          © 2025 Trade AI Inc.
        </Typography>
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Notifications">
              <IconButton 
                color="inherit" 
                onClick={handleOpenNotificationsMenu}
                size="large"
              >
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="notifications-menu"
              anchorEl={anchorElNotifications}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElNotifications)}
              onClose={handleCloseNotificationsMenu}
            >
              <MenuItem onClick={handleCloseNotificationsMenu}>
                <Typography textAlign="center">Budget approval request</Typography>
              </MenuItem>
              <MenuItem onClick={handleCloseNotificationsMenu}>
                <Typography textAlign="center">New promotion created</Typography>
              </MenuItem>
              <MenuItem onClick={handleCloseNotificationsMenu}>
                <Typography textAlign="center">Trade spend limit reached</Typography>
              </MenuItem>
            </Menu>
            
            <Box sx={{ ml: 2 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt={user?.name || 'User'} src="/static/images/avatar/2.jpg" />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem>
                  <Box sx={{ px: 1 }}>
                    <Typography variant="subtitle1">{user?.name || 'User'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user?.role === 'admin' ? 'Administrator' : 
                       user?.role === 'manager' ? 'Manager' : 'Key Account Manager'}
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem component={RouterLink} to="/settings" onClick={handleCloseUserMenu}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography textAlign="center">Settings</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <Typography textAlign="center">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <Toolbar />
        {children}
      </Box>
      
      {/* AI Assistant */}
      <AIAssistant context={walkthroughFeature || location.pathname.split('/')[1] || 'dashboard'} />
      
      {/* Walkthrough */}
      <Walkthrough 
        open={walkthroughOpen} 
        onClose={() => setWalkthroughOpen(false)} 
        feature={walkthroughFeature}
        showTips={true}
      />
    </Box>
  );
};

export default Layout;