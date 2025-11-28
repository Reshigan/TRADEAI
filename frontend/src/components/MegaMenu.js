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

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isManager = user?.role === 'manager' || isAdmin;
  const isKAM = user?.role === 'kam' || isManager;

  const megaMenuItems = [
    {
      key: 'mywork',
      label: 'My Work',
      icon: <DashboardIcon fontSize="small" />,
      sections: [
        {
          title: 'Daily Tasks',
          items: [
            isKAM && { text: 'My Dashboard', path: '/dashboard', description: 'Your personalized command center' },
            isKAM && { text: 'My Customers', path: '/customers', description: 'Customers assigned to you' },
            isKAM && { text: 'My Promotions', path: '/promotions', description: 'Promotions you manage' },
            isKAM && { text: 'My Wallet', path: '/kamwallet', badge: 'NEW', description: 'Your discretionary spend budget' },
          ].filter(Boolean)
        },
        {
          title: 'Quick Actions',
          items: [
            isKAM && { text: 'Create Promotion', path: '/promotions/new', description: 'Start a new promotion' },
            isKAM && { text: 'Submit Claim', path: '/claims/new', description: 'Submit a customer claim' },
            isManager && { text: 'Pending Approvals', path: '/approvals', badge: String(3), description: 'Items awaiting your approval' },
          ].filter(Boolean)
        }
      ].filter(section => section.items.length > 0)
    },

    {
      key: 'promotions',
      label: 'Promotions',
      icon: <LightbulbIcon fontSize="small" />,
      sections: [
        {
          title: 'Promotion Management',
          items: [
            { text: 'All Promotions', path: '/promotions', description: 'View and manage all promotions' },
            { text: 'Promotions Timeline', path: '/promotions-timeline', badge: 'NEW', description: 'Visual timeline view' },
            { text: 'Activity Calendar', path: '/activity-grid', description: 'Calendar view of activities' },
            { text: 'Create Promotion', path: '/promotions/new', description: 'Start a new promotion' },
          ]
        },
        {
          title: 'AI-Powered Tools',
          items: [
            { text: 'Promotion Planner', path: '/promotion-planner', badge: 'AI', description: 'AI-guided promotion planning' },
            { text: 'Performance Insights', path: '/analytics', badge: 'AI', description: 'AI-powered promotion insights' },
          ]
        }
      ]
    },

    {
      key: 'budgets',
      label: 'Budgets',
      icon: <RocketIcon fontSize="small" />,
      sections: [
        {
          title: 'Budget Management',
          items: [
            { text: 'All Budgets', path: '/budgets', description: 'View and manage all budgets' },
            { text: 'Budget Console', path: '/budget-console', badge: 'AI', description: 'Hierarchical budget allocation' },
            { text: 'Annual Planning', path: '/budgets/new-flow', description: 'Annual budget planning flow' },
          ]
        },
        {
          title: 'Trade Spend',
          items: [
            { text: 'Trade Spends', path: '/trade-spends', description: 'Manage trade spend activities' },
            { text: 'Trading Terms', path: '/trading-terms', description: 'Configure trading terms' },
          ]
        }
      ]
    },

    {
      key: 'insights',
      label: 'Insights',
      icon: <AnalyticsIcon fontSize="small" />,
      sections: [
        {
          title: 'Performance Analytics',
          items: [
            { text: 'Live Performance', path: '/realtime-dashboard', badge: 'LIVE', description: 'Real-time metrics dashboard' },
            { text: 'AI Insights', path: '/analytics', badge: 'AI', description: 'AI-powered insights & recommendations' },
            { text: 'Promotion Analytics', path: '/performance-analytics/promotion-effectiveness', badge: 'NEW', description: 'Promotion ROI & effectiveness' },
            { text: 'Budget Analytics', path: '/performance-analytics/budget-variance', badge: 'NEW', description: 'Budget utilization & variance' },
          ]
        },
        {
          title: 'Reports & Forecasting',
          items: [
            { text: 'Reports', path: '/reports', description: 'Comprehensive reporting' },
            { text: 'Forecasting', path: '/forecasting', description: 'Predictive analytics' },
            { text: 'Customer Segmentation', path: '/performance-analytics/customer-segmentation', badge: 'NEW', description: 'ABC customer analysis' },
          ]
        }
      ]
    },

    isManager && {
      key: 'approvals',
      label: 'Approvals',
      icon: <AssignmentIcon fontSize="small" />,
      sections: [
        {
          title: 'Approval Workflows',
          items: [
            { text: 'Pending Approvals', path: '/approvals', badge: String(3), description: 'Review and approve requests' },
            { text: 'Promotion Approvals', path: '/approvals?type=promotion', description: 'Approve promotions' },
            { text: 'Trade Spend Approvals', path: '/approvals?type=tradespend', description: 'Approve trade spends' },
            { text: 'Claim Approvals', path: '/approvals?type=claim', description: 'Approve customer claims' },
          ]
        },
        {
          title: 'History & Audit',
          items: [
            { text: 'Approval History', path: '/approvals/history', description: 'View approval history' },
          ]
        }
      ]
    },

    {
      key: 'claims',
      label: 'Claims',
      icon: <ReceiptIcon fontSize="small" />,
      sections: [
        {
          title: 'Claims Management',
          items: [
            { text: 'All Claims', path: '/claims', description: 'Manage customer claims' },
            { text: 'Deductions', path: '/deductions', description: 'Track and manage deductions' },
            { text: 'Reconciliation', path: '/deductions/reconciliation', description: 'Reconcile claims & deductions' },
          ]
        },
        {
          title: 'KAM Tools',
          items: [
            isKAM && { text: 'My Wallet', path: '/kamwallet', badge: 'NEW', description: 'Your discretionary spend budget' },
            isKAM && { text: 'Submit Claim', path: '/claims/new', description: 'Submit a new claim' },
          ].filter(Boolean)
        }
      ]
    },

    {
      key: 'planning',
      label: 'Planning',
      icon: <MonitorIcon fontSize="small" />,
      sections: [
        {
          title: 'AI-Powered Planning',
          items: [
            { text: 'Simulation Studio', path: '/simulation-studio', badge: 'AI', description: 'What-if scenario analysis' },
            { text: 'Scenario Planning', path: '/simulations', description: 'Multi-scenario planning' },
            { text: 'Predictive Analytics', path: '/predictive-analytics', badge: 'AI', description: 'Sales & ROI forecasting' },
          ]
        },
        {
          title: 'Optimization',
          items: [
            { text: 'Budget Optimization', path: '/budget-console', badge: 'AI', description: 'AI-powered budget reallocation' },
          ]
        }
      ]
    },

    {
      key: 'data',
      label: 'Data',
      icon: <DataIcon fontSize="small" />,
      sections: [
        {
          title: 'Master Data',
          items: [
            { text: 'Customers', path: '/customers', description: 'Manage customer master data' },
            { text: 'Products', path: '/products', description: 'Manage product master data' },
          ]
        },
        {
          title: 'Bulk Operations',
          items: [
            isAdmin && { text: 'Import Data', path: '/bulk-operations/import', badge: 'NEW', description: 'Bulk import customers/products' },
            isAdmin && { text: 'Export Data', path: '/bulk-operations/export', badge: 'NEW', description: 'Bulk export data' },
          ].filter(Boolean)
        }
      ]
    },

    isAdmin && {
      key: 'admin',
      label: 'Admin',
      icon: <SettingsIcon fontSize="small" />,
      sections: [
        {
          title: 'User Management',
          items: [
            { text: 'Users', path: '/users', description: 'Manage users and roles' },
            { text: 'Customer Assignment', path: '/customer-assignment', badge: 'NEW', description: 'Assign customers to KAMs' },
          ]
        },
        {
          title: 'System',
          items: [
            { text: 'Settings', path: '/settings', description: 'System configuration' },
            { text: 'Alerts', path: '/alerts', badge: 'NEW', description: 'System alerts & notifications' },
          ]
        }
      ]
    },
  ].filter(Boolean);

  return (
    <AppBar 
      position="fixed"
      data-testid="mega-menu"
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.1), 0 1px 2px 0 rgba(15, 23, 42, 0.06)'
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMobileMenuToggle}
          sx={{ mr: 2, display: { md: 'none' } }}
          aria-label="Open mobile menu"
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
              color: 'text.primary',
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
            color: 'text.primary',
            mx: 0.5,
            fontWeight: 600,
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 0.5,
            '&:hover': { 
              backgroundColor: 'action.hover',
              color: 'primary.main'
            }
          }}
        >
          <DashboardIcon fontSize="small" />
          Home
        </Button>

        {megaMenuItems.map((menuItem) => (
          <Box key={menuItem.key} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Button
              onMouseEnter={(e) => handleMenuOpen(e, menuItem.key)}
              sx={{
                color: 'text.primary',
                mx: 0.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                '&:hover': { 
                  backgroundColor: 'action.hover',
                  color: 'primary.main'
                }
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
                                    backgroundColor: item.badge === 'AI' ? '#667eea' : 
                                                     item.badge === 'NEW' ? '#10b981' :
                                                     item.badge === 'LIVE' ? '#ef4444' : '#f59e0b',
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
          aria-label="View notifications"
        >
          <Badge badgeContent={3} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <IconButton
          onClick={handleUserMenuOpen}
          sx={{ ml: 1 }}
          aria-label="Open user menu"
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: 'white' }}>
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
            <Chip 
              label={user?.role?.toUpperCase() || 'USER'} 
              size="small" 
              sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }}
            />
          </Box>
          <Divider />
          <MenuItem component={RouterLink} to="/dashboard" onClick={handleUserMenuClose}>
            <DashboardIcon fontSize="small" sx={{ mr: 1 }} />
            My Dashboard
          </MenuItem>
          {isAdmin && (
            <MenuItem component={RouterLink} to="/settings" onClick={handleUserMenuClose}>
              <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
              Settings
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
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              You have 3 unread notifications
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleNotificationsClose}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                🔴 Budget Alert
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Q4 Marketing budget at 95% utilization
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                2 minutes ago
              </Typography>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleNotificationsClose}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ✅ Approval Required
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                3 trade spends awaiting your approval
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                1 hour ago
              </Typography>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleNotificationsClose}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                📊 Performance Alert
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                "Summer Sale" promotion underperforming
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                3 hours ago
              </Typography>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem 
            component={RouterLink} 
            to="/alerts" 
            onClick={handleNotificationsClose}
            sx={{ justifyContent: 'center', color: 'primary.main', fontWeight: 600 }}
          >
            View All Alerts
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default MegaMenu;
