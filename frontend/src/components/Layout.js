import React, { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Collapse
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as BudgetIcon,
  Receipt as TradeSpendIcon,
  LocalOffer as PromotionIcon,
  People as CustomerIcon,
  Inventory as ProductIcon,
  BarChart as AnalyticsIcon,
  Settings as SettingsIcon,
  ChevronLeft,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Business as BusinessIcon,
  Description as ReportIcon,
  CalendarMonth as ActivityGridIcon,
  Assignment as TradingTermsIcon,
  Psychology as SimulationIcon,
  Timeline as ForecastingIcon,
  ExpandLess,
  ExpandMore,
  Psychology as AIIcon,
  Lightbulb as LightbulbIcon,
  Rocket as RocketIcon,
  Storage as DataIcon,
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import QuickActions from './common/QuickActions';
import Breadcrumbs from './common/Breadcrumbs';
import AIAssistant from './AIAssistant/AIAssistant';
import newLogo from '../assets/new_logo.svg';
import { useCompanyType } from '../contexts/CompanyTypeContext';

// TEMPORARILY DISABLE COMMON COMPONENTS TO TEST
// import { Walkthrough } from './common';

const drawerWidth = 240;

const getMenuItems = (user, labels, features) => {
  const baseItems = [
    { text: '🏠 Command Center', icon: <AIIcon />, path: '/dashboard', badge: 'AI' },
    {
      text: `💰 ${labels.fundingPlanning}`,
      icon: <BudgetIcon />,
      subItems: [
        { text: labels.fundingOverview, icon: <AssessmentIcon />, path: '/funding-overview', badge: 'NEW' },
        { text: 'Annual Budgets', icon: <BudgetIcon />, path: '/budgets' },
        { text: 'Budget Planning', icon: <LightbulbIcon />, path: '/budgets/new-flow' },
        { text: 'Budget Console', icon: <BudgetIcon />, path: '/budget-console', badge: 'AI' },
        { text: 'Trading Terms', icon: <TradingTermsIcon />, path: '/trading-terms' },
        { text: 'KAM Wallets', icon: <ReceiptIcon />, path: '/kamwallet' },
      ]
    },
    {
      text: `📋 ${labels.activityPlanning}`,
      icon: <LightbulbIcon />,
      subItems: [
        { text: 'Promotion Planner', icon: <PromotionIcon />, path: '/promotion-planner', badge: 'AI' },
        { text: 'All Promotions', icon: <PromotionIcon />, path: '/promotions' },
        { text: 'Activity Calendar', icon: <ActivityGridIcon />, path: '/activity-grid' },
        { text: 'Simulation Studio', icon: <SimulationIcon />, path: '/simulation-studio', badge: 'AI' },
      ]
    },
    {
      text: '✅ Approvals & Commitments',
      icon: <AssignmentIcon />,
      subItems: [
        { text: 'Pending Approvals', icon: <AssignmentIcon />, path: '/approvals', badge: 'AI' },
        { text: 'Budget Commitments', icon: <BudgetIcon />, path: '/budget-console' },
      ]
    },
    {
      text: `🚀 ${labels.execution}`,
      icon: <RocketIcon />,
      subItems: [
        { text: 'Active Promotions', icon: <ActivityGridIcon />, path: '/promotions-timeline', badge: 'LIVE' },
        { text: 'Trade Spend Capture', icon: <TradeSpendIcon />, path: '/trade-spends' },
        { text: 'Activity Timeline', icon: <ActivityGridIcon />, path: '/activity-grid' },
        { text: 'Live Performance', icon: <DashboardIcon />, path: '/realtime-dashboard', badge: 'LIVE' },
      ]
    },
    {
      text: `💵 ${labels.claimsSettlement}`,
      icon: <ReceiptIcon />,
      subItems: [
        { text: labels.claims, icon: <ReceiptIcon />, path: '/claims' },
        { text: labels.reconciliationHub, icon: <AssessmentIcon />, path: '/reconciliation-hub', badge: 'AI' },
        { text: labels.deductions, icon: <ReceiptIcon />, path: '/deductions' },
        { text: 'Settlements', icon: <AssessmentIcon />, path: '/deductions/reconciliation' },
      ]
    },
    {
      text: `📊 ${labels.performanceInsights}`,
      icon: <AnalyticsIcon />,
      subItems: [
        { text: 'Budget vs Actual', icon: <AssessmentIcon />, path: '/budget-console' },
        { text: 'ROI Analysis', icon: <AnalyticsIcon />, path: '/analytics', badge: 'AI' },
        { text: 'AI Recommendations', icon: <AIIcon />, path: '/ai-insights', badge: 'AI' },
        { text: 'Reports', icon: <ReportIcon />, path: '/reports' },
        { text: 'Forecasting', icon: <ForecastingIcon />, path: '/forecasting', badge: 'AI' },
      ]
    },
    {
      text: '📚 Master Data',
      icon: <DataIcon />,
      subItems: [
        { text: 'Import Center', icon: <DataIcon />, path: '/import-center', badge: 'NEW' },
        { text: labels.customers, icon: <CustomerIcon />, path: '/customers' },
        { text: 'Customer Hierarchy', icon: <CustomerIcon />, path: '/hierarchy/customers', badge: 'NEW' },
        { text: 'Products', icon: <ProductIcon />, path: '/products' },
        { text: 'Product Hierarchy', icon: <ProductIcon />, path: '/hierarchy/products', badge: 'NEW' },
        ...(features.showVendors ? [{ text: 'Vendors', icon: <BusinessIcon />, path: '/vendors', badge: 'NEW' }] : []),
      ]
    },
  ];

  // Add Companies menu item only for super admin
  if (user?.role === 'super_admin') {
    baseItems.push({ text: 'Companies', icon: <BusinessIcon />, path: '/companies' });
  }

  // Add Settings - accessible by admin and super_admin
  if (user?.role === 'admin' || user?.role === 'super_admin') {
    baseItems.push({ text: 'Settings', icon: <SettingsIcon />, path: '/settings' });
  }

  return baseItems;
};

const Layout = ({ children, user, onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  const [openSections, setOpenSections] = useState({
    'Trade Management': true,
    'Master Data': true,
    'Analytics & Insights': true,
    '🚀 AI-Powered Flows': true
  });
  
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { labels, features } = useCompanyType();
  const menuItems = getMenuItems(user, labels, features);

  const toggleSection = (sectionName) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, minHeight: 64 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img src={newLogo} alt="Trade AI Logo" style={{ height: 32, marginRight: 8 }} />
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
      </Box>
      <Divider />
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            {item.subItems ? (
              // Collapsible Section
              <>
                <ListItemButton
                  onClick={() => toggleSection(item.text)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: '#00ffff', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  />
                  {openSections[item.text] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={openSections[item.text]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => (
                      <ListItemButton
                        key={subItem.text}
                        component={RouterLink}
                        to={subItem.path}
                        selected={location.pathname === subItem.path}
                        onClick={isMobile ? handleDrawerToggle : undefined}
                        sx={{
                          pl: 4,
                          py: 1,
                          borderRadius: 1,
                          mb: 0.5,
                          '&.Mui-selected': {
                            bgcolor: 'rgba(0, 255, 255, 0.08)',
                            borderLeft: '3px solid',
                            borderColor: '#00ffff',
                            '&:hover': {
                              bgcolor: 'rgba(0, 255, 255, 0.12)',
                            }
                          }
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 36,
                            color: location.pathname === subItem.path ? '#00ffff' : 'text.secondary',
                          }}
                        >
                          {subItem.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={subItem.text}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: location.pathname === subItem.path ? 600 : 'normal',
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </>
            ) : (
              // Regular Menu Item
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={location.pathname === item.path}
                onClick={isMobile ? handleDrawerToggle : undefined}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(0, 255, 255, 0.08)',
                    borderLeft: '3px solid',
                    borderColor: '#00ffff',
                    '&:hover': {
                      bgcolor: 'rgba(0, 255, 255, 0.12)',
                    }
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname === item.path ? '#00ffff' : 'inherit',
                    minWidth: 40
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: location.pathname === item.path ? 600 : 'normal',
                  }}
                />
              </ListItemButton>
            )}
          </React.Fragment>
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
      
      {/* Top AppBar - Simple header with logo, user menu, notifications */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <img src={newLogo} alt="Trade AI Logo" style={{ height: 32, marginRight: 12 }} />
            <Typography
              variant="h6"
              component={RouterLink}
              to="/dashboard"
              sx={{
                textDecoration: 'none',
                color: 'primary.main',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              TRADE AI
            </Typography>
          </Box>

          <IconButton
            color="inherit"
            onClick={handleOpenNotificationsMenu}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton onClick={handleOpenUserMenu}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: 'white' }}>
              {user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorElUser}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
            PaperProps={{
              sx: { mt: 1, minWidth: 200 }
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.name || 'User'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <MenuItem component={RouterLink} to="/settings" onClick={handleCloseUserMenu}>
                <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                Settings
              </MenuItem>
            )}
            {user?.role === 'super_admin' && (
              <MenuItem component={RouterLink} to="/companies" onClick={handleCloseUserMenu}>
                <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
                Companies
              </MenuItem>
            )}
            <Divider />
            <MenuItem onClick={handleLogout}>
              Logout
            </MenuItem>
          </Menu>

          <Menu
            anchorEl={anchorElNotifications}
            open={Boolean(anchorElNotifications)}
            onClose={handleCloseNotificationsMenu}
            PaperProps={{
              sx: { mt: 1, minWidth: 320, maxHeight: 400 }
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleCloseNotificationsMenu}>
              <Box>
                <Typography variant="body2">New approval request</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  2 minutes ago
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleCloseNotificationsMenu}>
              <Box>
                <Typography variant="body2">Budget reallocation complete</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  1 hour ago
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleCloseNotificationsMenu}>
              <Box>
                <Typography variant="body2">Promotion performance alert</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  3 hours ago
                </Typography>
              </Box>
            </MenuItem>
          </Menu>
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
          width: '100%',
          minHeight: '100vh',
          bgcolor: 'background.default',
          mt: 8
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
