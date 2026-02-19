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
  Badge,
  Fade,
  alpha
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
  Menu as MenuIcon,
  KeyboardArrowDown as ArrowDownIcon,
  AutoAwesome as AIIcon
} from '@mui/icons-material';
import { formatLabel } from '../utils/formatters';

const MegaMenu= ({ user, onLogout, onMobileMenuToggle }) => {
  const [anchorEl, setAnchorEl] = useState({});
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  const [closeTimeout, setCloseTimeout] = useState(null);

  const handleMenuOpen = (event, menuKey) => {
    // Clear any pending close timeout when opening a menu
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setAnchorEl({ ...anchorEl, [menuKey]: event.currentTarget });
  };

  const handleMenuClose = (menuKey) => {
    setAnchorEl({ ...anchorEl, [menuKey]: null });
  };

  const handleMenuCloseDelayed = (menuKey) => {
    // Add a delay before closing to allow mouse to move to submenu
    const timeout = setTimeout(() => {
      setAnchorEl((prev) => ({ ...prev, [menuKey]: null }));
    }, 150);
    setCloseTimeout(timeout);
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
            isKAM && { text: 'My Wallet', path: '/kamwallet', badge: 'NEW', description: 'Your discretionary spend budget' },
            isManager && { text: 'Pending Approvals', path: '/approvals', badge: String(3), description: 'Items awaiting your approval' },
          ].filter(Boolean)
        },
        {
          title: 'Quick Actions',
          items: [
            isKAM && { text: 'New Promotion', path: '/promotions/new', badge: 'AI', description: 'AI-guided promotion creation' },
            isKAM && { text: 'New Budget', path: '/budgets/new', badge: 'AI', description: 'AI-guided budget planning' },
            isKAM && { text: 'Submit Claim', path: '/claims/create', description: 'Submit a customer claim' },
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
            { text: 'New Promotion', path: '/promotions/new', badge: 'AI', description: 'AI-guided promotion creation' },
            { text: 'Promotion Planner', path: '/promotion-planner', badge: 'AI', description: 'AI-powered promotion planning' },
          ]
        },
        {
          title: 'Views & Calendar',
          items: [
            { text: 'Promotions Timeline', path: '/promotions-timeline', description: 'Visual timeline view' },
            { text: 'Activity Calendar', path: '/activity-grid', description: 'Calendar view of activities' },
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
            { text: 'New Budget', path: '/budgets/new', badge: 'AI', description: 'AI-guided budget planning' },
            { text: 'Budget Console', path: '/budget-console', badge: 'AI', description: 'AI-powered budget optimization' },
          ]
        },
        {
          title: 'Trade Spend',
          items: [
            { text: 'Trade Spends', path: '/trade-spends', description: 'Manage trade spend activities' },
            { text: 'New Trade Spend', path: '/trade-spends/new', badge: 'AI', description: 'AI-guided trade spend entry' },
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
          title: 'Analytics',
          items: [
            { text: 'Analytics Dashboard', path: '/analytics', badge: 'AI', description: 'AI-powered insights & recommendations' },
            { text: 'Live Performance', path: '/realtime-dashboard', badge: 'LIVE', description: 'Real-time metrics dashboard' },
            { text: 'Promotion Effectiveness', path: '/performance-analytics/promotion-effectiveness', description: 'Promotion ROI & effectiveness' },
            { text: 'Budget Variance', path: '/performance-analytics/budget-variance', description: 'Budget utilization & variance' },
          ]
        },
        {
          title: 'Reports & Forecasting',
          items: [
            { text: 'Reports', path: '/reports', description: 'Comprehensive reporting' },
            { text: 'Forecasting', path: '/forecasting', badge: 'AI', description: 'AI-powered predictive analytics' },
            { text: 'Customer Segmentation', path: '/performance-analytics/customer-segmentation', description: 'ABC customer analysis' },
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
          title: 'Claims & Deductions',
          items: [
            { text: 'All Claims', path: '/claims', description: 'Manage customer claims' },
            { text: 'Submit Claim', path: '/claims/create', description: 'Submit a new claim' },
            { text: 'Deductions', path: '/deductions', description: 'Track and manage deductions' },
            { text: 'Reconciliation', path: '/deductions/reconciliation', description: 'Reconcile claims & deductions' },
          ]
        },
        {
          title: 'Rebates',
          items: [
            { text: 'All Rebates', path: '/rebates', description: 'Manage rebate programs' },
            { text: 'New Rebate', path: '/rebates/new', description: 'Create a new rebate program' },
          ]
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
            { text: 'Predictive Analytics', path: '/predictive-analytics', badge: 'AI', description: 'Sales & ROI forecasting' },
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
            { text: 'New Customer', path: '/customers/new', badge: 'AI', description: 'AI-guided customer entry' },
            { text: 'Products', path: '/products', description: 'Manage product master data' },
            { text: 'New Product', path: '/products/new', badge: 'AI', description: 'AI-guided product entry' },
          ]
        },
        {
          title: 'Bulk Operations',
          items: [
            isAdmin && { text: 'Import/Export', path: '/data/import-export', description: 'Bulk import and export data' },
          ].filter(Boolean)
        }
      ].filter(section => section.items.length > 0)
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
            { text: 'Customer Assignment', path: '/customer-assignment', description: 'Assign customers to KAMs' },
          ]
        },
        {
          title: 'System',
          items: [
            { text: 'Settings', path: '/settings', description: 'System configuration' },
            { text: 'Alerts', path: '/alerts', description: 'System alerts & notifications' },
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

        <Box 
          component={RouterLink}
          to="/dashboard"
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mr: 4,
            textDecoration: 'none'
          }}
        >
          <img 
            src="/logo.svg" 
            alt="TRADEAI" 
            style={{ height: 36, width: 'auto' }}
          />
        </Box>

        <Button
          component={RouterLink}
          to="/dashboard"
          sx={{
            color: 'text.primary',
            mx: 0.5,
            px: 2,
            py: 1,
            fontWeight: 600,
            borderRadius: 2,
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 0.75,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': { 
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main',
              transform: 'translateY(-1px)',
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
                color: Boolean(anchorEl[menuItem.key]) ? 'primary.main' : 'text.primary',
                mx: 0.5,
                px: 2,
                py: 1,
                fontWeight: 600,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: Boolean(anchorEl[menuItem.key]) 
                  ? (theme) => alpha(theme.palette.primary.main, 0.08)
                  : 'transparent',
                '&:hover': { 
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                  transform: 'translateY(-1px)',
                }
              }}
            >
              {menuItem.icon}
              {menuItem.label}
              <ArrowDownIcon 
                fontSize="small" 
                sx={{ 
                  ml: -0.5,
                  transition: 'transform 0.2s ease',
                  transform: Boolean(anchorEl[menuItem.key]) ? 'rotate(180deg)' : 'rotate(0deg)',
                  opacity: 0.7
                }} 
              />
            </Button>
            <Menu
              anchorEl={anchorEl[menuItem.key]}
              open={Boolean(anchorEl[menuItem.key])}
              onClose={() => handleMenuClose(menuItem.key)}
              TransitionComponent={Fade}
              transitionDuration={200}
                            MenuListProps={{
                              onMouseLeave: () => handleMenuCloseDelayed(menuItem.key),
                              onMouseEnter: () => {
                                if (closeTimeout) {
                                  clearTimeout(closeTimeout);
                                  setCloseTimeout(null);
                                }
                              },
                            }}
              PaperProps={{
                elevation: 0,
                sx: {
                  mt: 1.5,
                  minWidth: 580,
                  maxWidth: 720,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.15), 0 8px 16px -8px rgba(15, 23, 42, 0.1)',
                  overflow: 'visible',
                  '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: -6,
                    left: 24,
                    width: 12,
                    height: 12,
                    bgcolor: 'background.paper',
                    transform: 'rotate(45deg)',
                    borderLeft: '1px solid',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }
                }
              }}
            >
              <Box sx={{ p: 2.5 }}>
                <Grid container spacing={3}>
                  {menuItem.sections.map((section, idx) => (
                    <Grid item xs={12} md={6} key={idx}>
                      <Typography
                        variant="overline"
                        sx={{
                          fontWeight: 700,
                          color: 'text.secondary',
                          mb: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          fontSize: '0.7rem',
                          letterSpacing: '0.08em'
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
                            borderRadius: 2,
                            mb: 0.5,
                            py: 1.25,
                            px: 1.5,
                            transition: 'all 0.15s ease',
                            '&:hover': { 
                              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.06),
                              transform: 'translateX(4px)',
                              '& .menu-item-text': {
                                color: 'primary.main',
                              }
                            }
                          }}
                        >
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography 
                                className="menu-item-text"
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600,
                                  transition: 'color 0.15s ease'
                                }}
                              >
                                {item.text}
                              </Typography>
                              {item.badge && (
                                <Chip
                                  label={item.badge}
                                  size="small"
                                  icon={item.badge === 'AI' ? <AIIcon sx={{ fontSize: '12px !important', color: 'white !important' }} /> : undefined}
                                  sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    borderRadius: 1,
                                    backgroundColor: item.badge === 'AI' ? '#6D28D9' : 
                                                     item.badge === 'NEW' ? '#10b981' :
                                                     item.badge === 'LIVE' ? '#ef4444' : '#f59e0b',
                                    color: 'white',
                                    '& .MuiChip-icon': {
                                      marginLeft: '4px',
                                      marginRight: '-2px'
                                    }
                                  }}
                                />
                              )}
                            </Box>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'text.secondary', 
                                fontSize: '0.75rem',
                                lineHeight: 1.4
                              }}
                            >
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
              label={formatLabel(user?.role) || 'User'} 
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
