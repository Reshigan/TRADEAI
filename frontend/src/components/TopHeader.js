import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import {
  Box,
  Typography,
  IconButton,
  Badge,
  Breadcrumbs,
  Link,
  Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  NavigateNext as BreadcrumbIcon,
} from '@mui/icons-material';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your trade spend performance' },
  '/promotions': { title: 'Promotions', subtitle: 'Manage and track promotional activities' },
  '/budgets': { title: 'Budgets', subtitle: 'Budget planning and allocation management' },
  '/budget-allocations': { title: 'Budget Allocations', subtitle: 'Allocate budgets across customers and channels' },
  '/trade-spends': { title: 'Trade Spends', subtitle: 'Manage marketing, cash co-op, and promotional spend' },
  '/accruals': { title: 'Accruals', subtitle: 'Track and manage trade spend accruals' },
  '/settlements': { title: 'Settlements', subtitle: 'Settle accruals and finalize payments' },
  '/approvals': { title: 'Approvals', subtitle: 'Review and manage approval workflows' },
  '/claims': { title: 'Claims', subtitle: 'Manage customer claims' },
  '/deductions': { title: 'Deductions', subtitle: 'Track and reconcile deductions' },
  '/pnl': { title: 'P&L Analysis', subtitle: 'Profit & loss by customer and promotion' },
  '/customer-360': { title: 'Customer 360', subtitle: 'Complete customer intelligence view' },
  '/advanced-reporting': { title: 'Reports', subtitle: 'Advanced reporting and analytics' },
  '/revenue-growth': { title: 'Revenue Growth', subtitle: 'Revenue growth management strategies' },
  '/executive-kpi': { title: 'Executive KPIs', subtitle: 'Key performance indicators dashboard' },
  '/demand-signals': { title: 'Demand Signals', subtitle: 'Market demand intelligence' },
  '/trade-calendar': { title: 'Trade Calendar', subtitle: 'Promotional calendar and scheduling' },
  '/scenarios': { title: 'Scenarios', subtitle: 'What-if scenario planning and analysis' },
  '/promotion-optimizer': { title: 'Promotion Optimizer', subtitle: 'AI-powered promotion optimization' },
  '/baselines': { title: 'Baselines', subtitle: 'Baseline sales management' },
  '/customers': { title: 'Customers', subtitle: 'Customer master data management' },
  '/products': { title: 'Products', subtitle: 'Product master data management' },
  '/system-config': { title: 'System Config', subtitle: 'System configuration and settings' },
  '/help': { title: 'Help Center', subtitle: 'Documentation and training resources' },
  '/notification-center': { title: 'Notifications', subtitle: 'Alerts and notification management' },
  '/document-management': { title: 'Documents', subtitle: 'Document management' },
  '/integration-hub': { title: 'Integrations', subtitle: 'Integration hub and connectors' },
  '/role-management': { title: 'Roles', subtitle: 'Role and permission management' },
  '/workflow-engine': { title: 'Workflows', subtitle: 'Workflow automation engine' },
  '/vendors': { title: 'Vendors', subtitle: 'Vendor management and tracking' },
  '/trading-terms': { title: 'Trading Terms', subtitle: 'Configure trading terms and conditions' },
  '/rebates': { title: 'Rebates', subtitle: 'Manage rebate programs' },
  '/campaigns': { title: 'Campaigns', subtitle: 'Campaign management and tracking' },
  '/users': { title: 'Users', subtitle: 'User management and roles' },
  '/settings': { title: 'Settings', subtitle: 'Manage your account and preferences' },
  '/forecasting': { title: 'Forecasting', subtitle: 'AI-powered predictive analytics' },
  '/simulation-studio': { title: 'Simulation Studio', subtitle: 'What-if scenario analysis' },
  '/predictive-analytics': { title: 'Predictive Analytics', subtitle: 'AI-driven predictions' },
  '/kamwallet': { title: 'KAM Wallet', subtitle: 'Key account manager budget wallet' },
};

const getPageInfo = (pathname) => {
  for (const [path, info] of Object.entries(pageTitles)) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      return info;
    }
  }
  return { title: 'TRADEAI', subtitle: 'Trade Spend Management Platform' };
};

const getBreadcrumbs = (pathname) => {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs = [{ label: 'Home', path: '/dashboard' }];
  let currentPath = '';
  for (const part of parts) {
    currentPath += '/' + part;
    const info = pageTitles[currentPath];
    if (info) {
      crumbs.push({ label: info.title, path: currentPath });
    }
  }
  return crumbs;
};

const TopHeader = ({ onMenuClick, user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const resp = await apiClient.get('/approvals/pending');
        const items = resp.data?.data || resp.data || [];
        setPendingCount(Array.isArray(items) ? items.length : 0);
      } catch (e) { /* ignore */ }
    };
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const breadcrumbs = getBreadcrumbs(location.pathname);
  const userInitial = user?.name?.[0] || user?.email?.[0] || 'U';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, sm: 3 },
        height: 56,
        minHeight: 56,
        borderBottom: '1px solid #E2E8F0',
        bgcolor: '#FFFFFF',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <IconButton
          onClick={onMenuClick}
          sx={{
            display: { xs: 'inline-flex', md: 'none' },
            width: 36,
            height: 36,
          }}
        >
          <MenuIcon sx={{ fontSize: 20, color: '#64748B' }} />
        </IconButton>

        <Breadcrumbs separator={<BreadcrumbIcon sx={{ fontSize: 16, color: '#94A3B8' }} />} sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}>
          {breadcrumbs.map((crumb, i) => (
            i < breadcrumbs.length - 1 ? (
              <Link
                key={crumb.path}
                underline="hover"
                onClick={() => navigate(crumb.path)}
                sx={{ fontSize: '0.8125rem', color: '#64748B', cursor: 'pointer', fontWeight: 500 }}
              >
                {crumb.label}
              </Link>
            ) : (
              <Typography key={crumb.path} sx={{ fontSize: '0.8125rem', color: '#0F172A', fontWeight: 600 }}>
                {crumb.label}
              </Typography>
            )
          ))}
        </Breadcrumbs>
      </Box>

      <Box
        onClick={() => {
          const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
          window.dispatchEvent(event);
        }}
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          bgcolor: '#F1F5F9',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          px: 2,
          py: 0.625,
          minWidth: 240,
          maxWidth: 320,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          '&:hover': {
            bgcolor: '#E2E8F0',
          },
        }}
      >
        <SearchIcon sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} />
        <Typography sx={{ fontSize: '0.8125rem', color: '#94A3B8', flex: 1 }}>
          Search...
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          <Box sx={{ px: 0.5, py: 0.125, bgcolor: '#FFFFFF', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.6875rem', color: '#64748B', lineHeight: 1.5, fontWeight: 500 }}>
            {navigator.platform?.includes('Mac') ? '\u2318' : 'Ctrl'}
          </Box>
          <Box sx={{ px: 0.5, py: 0.125, bgcolor: '#FFFFFF', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.6875rem', color: '#64748B', lineHeight: 1.5, fontWeight: 500 }}>
            K
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={() => navigate('/notification-center')}
          sx={{
            width: 36,
            height: 36,
          }}
        >
          <Badge badgeContent={pendingCount} color="error" invisible={pendingCount === 0} sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
            <NotificationsIcon sx={{ fontSize: 20, color: '#64748B' }} />
          </Badge>
        </IconButton>

        <Avatar
          onClick={() => navigate('/settings')}
          sx={{
            width: 32,
            height: 32,
            bgcolor: '#1E40AF',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            '&:hover': { opacity: 0.9 },
          }}
        >
          {userInitial.toUpperCase()}
        </Avatar>
      </Box>
    </Box>
  );
};

export default TopHeader;
