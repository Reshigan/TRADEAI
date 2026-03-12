import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Tooltip,
  Avatar,
  Typography,
  Collapse,
  Badge,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as PlanIcon,
  Campaign as ExecuteIcon,
  CheckCircle as ApproveIcon,
  Receipt as SettleIcon,
  Insights as AnalyzeIcon,
  Storage as DataIcon,
  AdminPanelSettings as AdminIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpIcon,
  Logout as LogoutIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const SIDEBAR_WIDTH = 260;

const getNavGroups = (userRole) => {
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  const groups = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      key: 'plan',
      label: 'Plan',
      icon: <PlanIcon />,
      children: [
        { label: 'Budgets', path: '/budgets' },
        { label: 'Allocations', path: '/budget-allocations' },
        { label: 'Trade Calendar', path: '/trade-calendar' },
        { label: 'Scenarios', path: '/scenarios' },
        { label: 'KAM Wallet', path: '/kamwallet' },
      ],
    },
    {
      key: 'execute',
      label: 'Execute',
      icon: <ExecuteIcon />,
      children: [
        { label: 'Promotions', path: '/promotions' },
        { label: 'Trade Spends', path: '/trade-spends' },
        { label: 'Campaigns', path: '/campaigns' },
        { label: 'Optimizer', path: '/promotion-optimizer' },
      ],
    },
    {
      key: 'approve',
      label: 'Approve',
      icon: <ApproveIcon />,
      path: '/approvals',
      badge: true,
    },
    {
      key: 'settle',
      label: 'Settle',
      icon: <SettleIcon />,
      children: [
        { label: 'Claims', path: '/claims' },
        { label: 'Deductions', path: '/deductions' },
        { label: 'Reconciliation', path: '/deductions/reconciliation' },
        { label: 'Accruals', path: '/accruals' },
        { label: 'Settlements', path: '/settlements' },
      ],
    },
    {
      key: 'analyze',
      label: 'Analyze',
      icon: <AnalyzeIcon />,
      children: [
        { label: 'P&L', path: '/pnl' },
        { label: 'Customer 360', path: '/customer-360' },
        { label: 'Reports', path: '/advanced-reporting' },
        { label: 'Executive KPIs', path: '/executive-kpi' },
        { label: 'RGM', path: '/revenue-growth' },
        { label: 'Demand Signals', path: '/demand-signals' },
        { label: 'Forecasting', path: '/forecasting' },
      ],
    },
    {
      key: 'data',
      label: 'Data',
      icon: <DataIcon />,
      children: [
        { label: 'Customers', path: '/customers' },
        { label: 'Products', path: '/products' },
        { label: 'Vendors', path: '/vendors' },
        { label: 'Trading Terms', path: '/trading-terms' },
        { label: 'Baselines', path: '/baselines' },
        { label: 'Hierarchy', path: '/hierarchy/customers' },
      ],
    },
  ];

  if (isAdmin) {
    groups.push({
      key: 'admin',
      label: 'Admin',
      icon: <AdminIcon />,
      children: [
        { label: 'Users', path: '/users' },
        { label: 'Roles', path: '/role-management' },
        { label: 'Config', path: '/system-config' },
        { label: 'Workflows', path: '/workflow-engine' },
        { label: 'Integrations', path: '/integration-hub' },
        { label: 'Documents', path: '/document-management' },
        { label: 'Notifications', path: '/notification-center' },
      ],
    });
  }

  return groups;
};

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState({});
  const navGroups = getNavGroups(user?.role);

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isGroupActive = (group) => {
    if (group.path) return isActive(group.path);
    return group.children?.some(c => isActive(c.path));
  };

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const userInitial = user?.name?.[0] || user?.email?.[0] || 'U';

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        minWidth: SIDEBAR_WIDTH,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0F172A',
        color: '#94A3B8',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          py: 2.5,
          cursor: 'pointer',
        }}
        onClick={() => navigate('/dashboard')}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '10px',
            bgcolor: '#1E40AF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>T</Typography>
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#F1F5F9', letterSpacing: '-0.02em' }}>
          TRADEAI
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 0.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 } }}>
        {navGroups.map((group) => {
          const active = isGroupActive(group);
          const isOpen = expanded[group.key] !== undefined ? expanded[group.key] : active;

          if (group.path) {
            return (
              <Box
                key={group.key}
                onClick={() => navigate(group.path)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  mb: 0.25,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: active ? '#FFFFFF' : '#94A3B8',
                  bgcolor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  borderLeft: active ? '3px solid #3B82F6' : '3px solid transparent',
                  fontWeight: active ? 600 : 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.06)',
                    color: '#E2E8F0',
                  },
                }}
              >
                {React.cloneElement(group.icon, { sx: { fontSize: 20 } })}
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 'inherit', color: 'inherit', flex: 1 }}>
                  {group.label}
                </Typography>
                {group.badge && (
                  <Badge color="error" variant="dot" sx={{ '& .MuiBadge-badge': { top: 2, right: 2 } }} />
                )}
              </Box>
            );
          }

          return (
            <Box key={group.key} sx={{ mb: 0.25 }}>
              <Box
                onClick={() => toggleExpand(group.key)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: active ? '#FFFFFF' : '#94A3B8',
                  bgcolor: active && !isOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
                  borderLeft: active && !isOpen ? '3px solid #3B82F6' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.06)',
                    color: '#E2E8F0',
                  },
                }}
              >
                {React.cloneElement(group.icon, { sx: { fontSize: 20 } })}
                <Typography sx={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500, color: 'inherit', flex: 1 }}>
                  {group.label}
                </Typography>
                {isOpen ? <CollapseIcon sx={{ fontSize: 18, opacity: 0.5 }} /> : <ExpandIcon sx={{ fontSize: 18, opacity: 0.5 }} />}
              </Box>
              <Collapse in={isOpen} timeout="auto">
                <Box sx={{ pl: 4.5, py: 0.25 }}>
                  {group.children.map((child) => {
                    const childActive = isActive(child.path);
                    return (
                      <Box
                        key={child.path}
                        onClick={() => navigate(child.path)}
                        sx={{
                          py: 0.75,
                          px: 1,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          color: childActive ? '#FFFFFF' : '#64748B',
                          fontWeight: childActive ? 600 : 400,
                          bgcolor: childActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.04)',
                            color: '#CBD5E1',
                          },
                        }}
                      >
                        {child.label}
                      </Box>
                    );
                  })}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ px: 1.5, py: 1 }}>
        <Box
          onClick={() => navigate('/promotions/new')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            py: 1,
            borderRadius: '8px',
            cursor: 'pointer',
            bgcolor: '#1E40AF',
            color: '#FFFFFF',
            fontSize: '0.8125rem',
            fontWeight: 600,
            transition: 'all 0.15s ease',
            '&:hover': { bgcolor: '#1E3A8A' },
          }}
        >
          <AddIcon sx={{ fontSize: 18 }} />
          Quick Create
        </Box>
      </Box>

      <Box sx={{ px: 1.5, pb: 1, borderTop: '1px solid rgba(255,255,255,0.06)', pt: 1 }}>
        {[
          { key: 'settings', label: 'Settings', icon: <SettingsIcon />, path: '/system-config' },
          { key: 'help', label: 'Help', icon: <HelpIcon />, path: '/help' },
        ].map((item) => {
          const active = isActive(item.path);
          return (
            <Box
              key={item.key}
              onClick={() => navigate(item.path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 0.75,
                borderRadius: '8px',
                cursor: 'pointer',
                color: active ? '#FFFFFF' : '#64748B',
                fontSize: '0.8125rem',
                fontWeight: active ? 600 : 500,
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', color: '#CBD5E1' },
              }}
            >
              {React.cloneElement(item.icon, { sx: { fontSize: 18 } })}
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 'inherit', color: 'inherit' }}>
                {item.label}
              </Typography>
            </Box>
          );
        })}

        <Box
          onClick={onLogout}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 1.5,
            py: 0.75,
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#64748B',
            fontSize: '0.8125rem',
            transition: 'all 0.15s ease',
            '&:hover': { bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444' },
          }}
        >
          <LogoutIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: 'inherit' }}>
            Logout
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, pb: 2, pt: 1 }}>
        <Tooltip title={user?.name || user?.email || 'Profile'} placement="right" arrow>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              '&:hover': { opacity: 0.85 },
            }}
            onClick={() => navigate('/settings')}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#1E40AF',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {userInitial.toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#E2E8F0', lineHeight: 1.2 }} noWrap>
                {user?.name || 'User'}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#64748B', lineHeight: 1.2 }} noWrap>
                {user?.email || ''}
              </Typography>
            </Box>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
};

export { SIDEBAR_WIDTH };
export default Sidebar;
