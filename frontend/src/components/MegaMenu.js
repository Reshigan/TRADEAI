import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Menu,
  MenuItem,
  Grid,
  Typography,
  Chip,
  IconButton,
  Avatar,
  Divider,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Lightbulb as LightbulbIcon,
  RocketLaunch as RocketIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as MonitorIcon,
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  Storage as DataIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

const MegaMenu = ({ user, onLogout, onMobileMenuToggle }) => {
  const [anchorEl, setAnchorEl] = useState({});
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);

  const handleMenuOpen = (event, menuKey) => {
    setAnchorEl({ ...anchorEl, [menuKey]: event.currentTarget });
  };

  const handleMenuClose = (menuKey) => {
    setAnchorEl({ ...anchorEl, [menuKey]: null });
  };

  const handleUserMenuOpen = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorElUser(null);
  };

  const handleNotificationsOpen = (event) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setAnchorElNotifications(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    onLogout();
  };

  const megaMenuItems = [
    {
      key: 'plan',
      label: 'Plan',
      icon: <LightbulbIcon fontSize="small" />,
      sections: [
        {
          title: 'AI-Powered Planning',
          items: [
            { text: 'Promotion Planner', path: '/promotion-planner', badge: 'AI', description: 'AI-guided promotion planning' },
            { text: 'Budget Console', path: '/budget-console', badge: 'AI', description: 'Hierarchical budget allocation' },
            { text: 'Simulation Studio', path: '/simulation-studio', badge: 'AI', description: 'What-if scenario analysis' },
          ]
        },
        {
          title: 'Traditional Planning',
          items: [
            { text: 'Annual Planning', path: '/budgets/new-flow', description: 'Annual budget planning flow' },
            { text: 'All Budgets', path: '/budgets', description: 'View and manage all budgets' },
          ]
        }
      ]
    },
    {
      key: 'execute',
      label: 'Execute',
      icon: <RocketIcon fontSize="small" />,
      sections: [
        {
          title: 'Promotion Management',
          items: [
            { text: 'Promotions Timeline', path: '/promotions-timeline', badge: 'NEW', description: 'Visual promotion timeline' },
            { text: 'Activity Calendar', path: '/activity-grid', description: 'Calendar view of activities' },
            { text: 'All Promotions', path: '/promotions', description: 'View and manage promotions' },
          ]
        },
        {
          title: 'Trade Management',
          items: [
            { text: 'Trade Spends', path: '/trade-spends', description: 'Manage trade spend activities' },
            { text: 'Trading Terms', path: '/trading-terms', description: 'Configure trading terms' },
          ]
        }
      ]
    },
    {
      key: 'analyze',
      label: 'Analyze',
      icon: <AnalyticsIcon fontSize="small" />,
      sections: [
        {
          title: 'Performance Analytics',
          items: [
            { text: 'Live Performance', path: '/realtime-dashboard', badge: 'LIVE', description: 'Real-time performance metrics' },
            { text: 'AI Insights', path: '/analytics', description: 'AI-powered insights and recommendations' },
            { text: 'Reports', path: '/reports', description: 'Comprehensive reporting' },
            { text: 'Forecasting', path: '/forecasting', description: 'Predictive analytics and forecasting' },
          ]
        }
      ]
    },
    {
      key: 'optimize',
      label: 'Optimize',
      icon: <MonitorIcon fontSize="small" />,
      sections: [
        {
          title: 'Optimization Tools',
          items: [
            { text: 'Simulation Studio', path: '/simulation-studio', badge: 'AI', description: 'Scenario simulation and optimization' },
            { text: 'Budget Reallocation', path: '/budget-console', description: 'AI-powered budget reallocation' },
            { text: 'Scenario Planning', path: '/simulations', description: 'Multi-scenario planning' },
          ]
        }
      ]
    },
    {
      key: 'approvals',
      label: 'Approvals',
      icon: <AssignmentIcon fontSize="small" />,
      sections: [
        {
          title: 'Approval Management',
          items: [
            { text: 'Pending Approvals', path: '/approvals', badge: 'NEW', description: 'Review and approve requests' },
          ]
        }
      ]
    },
    {
      key: 'claims',
      label: 'Claims & Deductions',
      icon: <ReceiptIcon fontSize="small" />,
      sections: [
        {
          title: 'Financial Management',
          items: [
            { text: 'Claims', path: '/claims', badge: 'NEW', description: 'Manage customer claims' },
            { text: 'Deductions', path: '/deductions', badge: 'NEW', description: 'Track and manage deductions' },
            { text: 'Reconciliation', path: '/deductions/reconciliation', badge: 'NEW', description: 'Reconcile claims and deductions' },
            { text: 'KAM Wallet', path: '/kamwallet', badge: 'NEW', description: 'Manage KAM discretionary spend' },
          ]
        }
      ]
    },
    {
      key: 'data',
      label: 'Master Data',
      icon: <DataIcon fontSize="small" />,
      sections: [
        {
          title: 'Master Files',
          items: [
            { text: 'Customers', path: '/customers', description: 'Manage customer master data' },
            { text: 'Products', path: '/products', description: 'Manage product master data' },
          ]
        }
      ]
    },
  ];

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMobileMenuToggle}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/dashboard"
            sx={{
              textDecoration: 'none',
              color: 'white',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            🚀 TRADE AI
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          to="/dashboard"
          sx={{
            color: 'white',
            mx: 0.5,
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 0.5,
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <DashboardIcon fontSize="small" />
          Command Center
        </Button>

        {megaMenuItems.map((menuItem) => (
          <Box key={menuItem.key} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Button
              onMouseEnter={(e) => handleMenuOpen(e, menuItem.key)}
              sx={{
                color: 'white',
                mx: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              {menuItem.icon}
              {menuItem.label}
            </Button>
            <Menu
              anchorEl={anchorEl[menuItem.key]}
              open={Boolean(anchorEl[menuItem.key])}
              onClose={() => handleMenuClose(menuItem.key)}
              MenuListProps={{
                onMouseLeave: () => handleMenuClose(menuItem.key),
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 600,
                  maxWidth: 800,
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ p: 2 }}>
                <Grid container spacing={3}>
                  {menuItem.sections.map((section, idx) => (
                    <Grid item xs={12} md={6} key={idx}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          color: 'primary.main',
                          mb: 1,
                          textTransform: 'uppercase',
                          fontSize: '0.75rem'
                        }}
                      >
                        {section.title}
                      </Typography>
                      {section.items.map((item, itemIdx) => (
                        <MenuItem
                          key={itemIdx}
                          component={RouterLink}
                          to={item.path}
                          onClick={() => handleMenuClose(menuItem.key)}
                          sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.08)' }
                          }}
                        >
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {item.text}
                              </Typography>
                              {item.badge && (
                                <Chip
                                  label={item.badge}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    backgroundColor: item.badge === 'AI' ? '#667eea' : '#f59e0b',
                                    color: 'white'
                                  }}
                                />
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                              {item.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Menu>
          </Box>
        ))}

        <Box sx={{ flexGrow: 1 }} />

        <IconButton
          color="inherit"
          onClick={handleNotificationsOpen}
          sx={{ mr: 1 }}
        >
          <Badge badgeContent={3} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <IconButton
          onClick={handleUserMenuOpen}
          sx={{ ml: 1 }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'white', color: 'primary.main' }}>
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorElUser}
          open={Boolean(anchorElUser)}
          onClose={handleUserMenuClose}
          PaperProps={{
            sx: { mt: 1, minWidth: 200 }
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.name || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <MenuItem component={RouterLink} to="/settings" onClick={handleUserMenuClose}>
              <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
              Settings
            </MenuItem>
          )}
          {user?.role === 'super_admin' && (
            <MenuItem component={RouterLink} to="/companies" onClick={handleUserMenuClose}>
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
          onClose={handleNotificationsClose}
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
          <MenuItem onClick={handleNotificationsClose}>
            <Box>
              <Typography variant="body2">New approval request</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                2 minutes ago
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleNotificationsClose}>
            <Box>
              <Typography variant="body2">Budget reallocation complete</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                1 hour ago
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleNotificationsClose}>
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
  );
};

export default MegaMenu;
