import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Collapse, Badge, Button, Popover, List, ListItemButton, ListItemIcon, ListItemText, Avatar, Divider, IconButton, Tooltip } from '@mui/material';
import { LayoutDashboard, CalendarRange, Zap, CheckSquare, Landmark, BarChart3, Database, Shield, Plus, Settings, HelpCircle, LogOut, ChevronDown, ChevronRight, ChevronLeft, DollarSign, Wallet, LineChart, TrendingUp, ShoppingCart, Megaphone, FileText, Receipt, Scale, BookOpen, PieChart, Users as UsersIcon, Package, Store, FileSpreadsheet, Layers, BarChart, AlertTriangle, Target, Building2, Link2, Lock, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTerminology } from '../contexts/TerminologyContext';
import { useThemeMode } from '../contexts/ThemeContext';

export const SIDEBAR_WIDTH = 256;
const COLLAPSED_WIDTH = 64;

// T-04: Dynamic nav groups using terminology labels
const buildNavGroups = (t, tPlural) => [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', single: true },
  { label: 'Plan', icon: CalendarRange, items: [
    { label: tPlural('budget'), icon: DollarSign, path: '/plan/budgets' },
    { label: tPlural('vendor_fund'), icon: Building2, path: '/plan/vendor-funds' },
    { label: t('kam_wallet'), icon: Wallet, path: '/plan/wallet' },
    { label: 'Trade Calendar', icon: CalendarRange, path: '/plan/calendar' },
    { label: tPlural('scenario'), icon: Target, path: '/plan/scenarios' },
    { label: 'Forecasting', icon: TrendingUp, path: '/plan/forecasting' },
  ]},
  { label: 'Execute', icon: Zap, items: [
    { label: tPlural('promotion'), icon: Megaphone, path: '/execute/promotions' },
    { label: tPlural('trade_spend'), icon: ShoppingCart, path: '/execute/trade-spends' },
    { label: tPlural('campaign'), icon: Target, path: '/execute/campaigns' },
  ]},
  { label: 'Approve', icon: CheckSquare, path: '/approve', single: true, badge: true },
  { label: 'Settle', icon: Landmark, items: [
    { label: tPlural('claim'), icon: FileText, path: '/settle/claims' },
    { label: tPlural('deduction'), icon: Receipt, path: '/settle/deductions' },
    { label: 'Reconciliation', icon: Scale, path: '/settle/reconciliation' },
    { label: tPlural('accrual'), icon: BookOpen, path: '/settle/accruals' },
    { label: tPlural('settlement'), icon: Landmark, path: '/settle/settlements' },
  ]},
  { label: 'Analyze', icon: BarChart3, items: [
    { label: t('pnl') + ' Analysis', icon: PieChart, path: '/analyze/pnl' },
    { label: t('customer') + ' 360', icon: UsersIcon, path: '/analyze/customer-360' },
    { label: 'Reports', icon: FileSpreadsheet, path: '/analyze/reports' },
    { label: 'Executive KPIs', icon: BarChart, path: '/analyze/forecast' },
    { label: 'Waste Detection', icon: AlertTriangle, path: '/analyze/waste' },
  ]},
  { label: 'Data', icon: Database, items: [
    { label: tPlural('customer'), icon: UsersIcon, path: '/data/customers' },
    { label: tPlural('product'), icon: Package, path: '/data/products' },
    { label: tPlural('vendor'), icon: Store, path: '/data/vendors' },
    { label: tPlural('trading_term'), icon: FileText, path: '/data/trading-terms' },
    { label: tPlural('baseline'), icon: LineChart, path: '/data/baselines' },
    { label: 'Hierarchy', icon: Layers, path: '/data/hierarchy' },
  ]},
  { label: 'Admin', icon: Shield, adminOnly: true, items: [
    { label: 'Users', icon: UsersIcon, path: '/admin/users' },
    { label: 'Roles', icon: Lock, path: '/admin/roles' },
    { label: 'Company Setup', icon: Settings, path: '/admin/company-setup' },
    { label: 'Config', icon: Settings, path: '/admin/config' },
    { label: 'Terminology', icon: FileText, path: '/admin/terminology' },
    { label: 'SAP Export', icon: FileSpreadsheet, path: '/admin/sap-export' },
    { label: 'SAP Integration', icon: FileSpreadsheet, path: '/admin/sap-integration' },
    { label: 'Integrations', icon: Link2, path: '/admin/integrations' },
  ]},
  { label: 'Super Admin', icon: Building2, superAdminOnly: true, items: [
    { label: 'Companies', icon: Building2, path: '/companies' },
    { label: 'Tenants', icon: Building2, path: '/admin/tenants' },
    { label: 'Modules', icon: Settings, path: '/admin/modules' },
    { label: 'Assign Admin', icon: UsersIcon, path: '/admin/assign-admin' },
  ]},
];

function NavGroup({ group, collapsed, location, navigate, pendingCount }) {
  const isActive = group.single ? location.pathname === group.path : group.items?.some(i => location.pathname.startsWith(i.path));
  const [open, setOpen] = useState(isActive);
  useEffect(() => { if (isActive) setOpen(true); }, [isActive]);

  if (group.single) {
    const Icon = group.icon;
    return (
      <Tooltip title={collapsed ? group.label : ''} placement="right">
        <ListItemButton onClick={() => navigate(group.path)}
          sx={{ mx: 1, borderRadius: 1.5, mb: 0.5, minHeight: 40, pl: collapsed ? 2.5 : 2,
            bgcolor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
            borderLeft: isActive ? '2.5px solid #6366F1' : '2.5px solid transparent',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
          <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: isActive ? '#fff' : 'rgba(255,255,255,0.5)' }}>
            {group.badge ? <Badge badgeContent={pendingCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 18, height: 18 } }}><Icon size={20} /></Badge> : <Icon size={20} />}
          </ListItemIcon>
          {!collapsed && <ListItemText primary={group.label} primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: isActive ? 600 : 400, color: isActive ? '#fff' : 'rgba(255,255,255,0.5)' }} />}
        </ListItemButton>
      </Tooltip>
    );
  }

  const Icon = group.icon;
  return (
    <Box sx={{ mb: 0.5 }}>
      <Tooltip title={collapsed ? group.label : ''} placement="right">
        <ListItemButton onClick={() => collapsed ? navigate(group.items[0].path) : setOpen(!open)}
          sx={{ mx: 1, borderRadius: 1.5, minHeight: 40, pl: collapsed ? 2.5 : 2,
            bgcolor: isActive && collapsed ? 'rgba(255,255,255,0.08)' : 'transparent',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
          <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: isActive ? '#fff' : 'rgba(255,255,255,0.5)' }}><Icon size={20} /></ListItemIcon>
          {!collapsed && (<>
            <ListItemText primary={group.label} primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: isActive ? 600 : 400, color: isActive ? '#fff' : 'rgba(255,255,255,0.5)' }} />
            {open ? <ChevronDown size={16} color="rgba(255,255,255,0.3)" /> : <ChevronRight size={16} color="rgba(255,255,255,0.3)" />}
          </>)}
        </ListItemButton>
      </Tooltip>
      {!collapsed && <Collapse in={open}>
        {group.items.map(item => {
          const ItemIcon = item.icon;
          const itemActive = location.pathname.startsWith(item.path);
          return (
            <ListItemButton key={item.path} onClick={() => navigate(item.path)}
              sx={{ mx: 1, borderRadius: 1.5, minHeight: 36, pl: 5.5,
                bgcolor: itemActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                borderLeft: itemActive ? '2.5px solid #6366F1' : '2.5px solid transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
              <ListItemIcon sx={{ minWidth: 28, color: itemActive ? '#fff' : 'rgba(255,255,255,0.4)' }}><ItemIcon size={16} /></ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: itemActive ? 600 : 400, color: itemActive ? '#fff' : 'rgba(255,255,255,0.5)' }} />
            </ListItemButton>
          );
        })}
      </Collapse>}
    </Box>
  );
}

export default function Sidebar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { t, tPlural } = useTerminology();
  const { mode, setMode } = useThemeMode();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const [quickAnchor, setQuickAnchor] = useState(null);
  const pendingCount = 0;
  const userRole = user?.role || 'kam';
  const navGroups = buildNavGroups(t, tPlural);
  useEffect(() => { localStorage.setItem('sidebar_collapsed', collapsed); }, [collapsed]);
  const width = collapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <Box sx={{ width, minWidth: width, height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 1200, bgcolor: '#0F172A', display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', overflowX: 'hidden' }}>
      <Box sx={{ p: collapsed ? 1.5 : 2, display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 64 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>T</Typography>
        </Box>
        {!collapsed && <Box>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>TradeAI</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 500 }}>Trade Intelligence</Typography>
        </Box>}
      </Box>

      {!collapsed && user && (
        <Box sx={{ mx: 2, mb: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#6366F1', fontSize: 13 }}>{(user.name || user.email || '?')[0].toUpperCase()}</Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || user.email}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'capitalize' }}>{(user.role || 'user').replace('_', ' ')}</Typography>
            </Box>
          </Box>
        </Box>
      )}

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2 }} />

      <Box sx={{ flex: 1, overflow: 'auto', py: 1, '&::-webkit-scrollbar': { width: 0 } }}>
        <List disablePadding>
          {navGroups.map(group => {
            if (group.adminOnly && !['admin', 'super_admin'].includes(userRole)) return null;
            if (group.superAdminOnly && userRole !== 'super_admin') return null;
            return <NavGroup key={group.label} group={group} collapsed={collapsed} location={location} navigate={navigate} pendingCount={pendingCount} />;
          })}
        </List>
      </Box>

      {!collapsed && (<>
        <Box sx={{ px: 2, pb: 1 }}>
          <Button fullWidth variant="contained" startIcon={<Plus size={16} />} onClick={(e) => setQuickAnchor(e.currentTarget)}
            sx={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', borderRadius: 2, py: 1, fontSize: 13, boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)', '&:hover': { boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5)' } }}>Quick Create</Button>
          <Popover open={Boolean(quickAnchor)} anchorEl={quickAnchor} onClose={() => setQuickAnchor(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }} transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
            <List sx={{ minWidth: 200, p: 1 }}>
              {[{ label: `New ${t('promotion')}`, path: '/execute/promotions/new' }, { label: `New ${t('trade_spend')}`, path: '/execute/trade-spends/new' }, { label: `New ${t('claim')}`, path: '/settle/claims/new' }].map(item => (
                <ListItemButton key={item.path} onClick={() => { navigate(item.path); setQuickAnchor(null); }} sx={{ borderRadius: 1, py: 0.75 }}>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13 }} />
                </ListItemButton>
              ))}
            </List>
          </Popover>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2 }} />
      </>)}

      {!collapsed && (
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2, p: 0.5 }}>
            {[
              { key: 'light', icon: Sun, label: 'Light' },
              { key: 'dark', icon: Moon, label: 'Dark' },
              { key: 'auto', icon: Monitor, label: 'Auto' },
            ].map(({ key, icon: Icon, label }) => (
              <Tooltip key={key} title={label} placement="top">
                <IconButton size="small" onClick={() => setMode(key)}
                  sx={{
                    color: mode === key ? '#fff' : 'rgba(255,255,255,0.35)',
                    bgcolor: mode === key ? 'rgba(99,102,241,0.25)' : 'transparent',
                    borderRadius: 1.5, mx: 0.25, width: 32, height: 32,
                    '&:hover': { color: '#fff', bgcolor: mode === key ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)' },
                  }}>
                  <Icon size={16} />
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ p: collapsed ? 1 : 1.5, display: 'flex', justifyContent: collapsed ? 'center' : 'space-between', gap: 0.5 }}>
        {!collapsed && <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => navigate('/admin/config')} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#fff' } }}><Settings size={18} /></IconButton>
          <IconButton size="small" onClick={() => navigate('/help')} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#fff' } }}><HelpCircle size={18} /></IconButton>
          <IconButton size="small" onClick={() => { logout(); navigate('/login'); }} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#EF4444' } }}><LogOut size={18} /></IconButton>
        </Box>}
        <IconButton size="small" onClick={() => setCollapsed(!collapsed)} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#fff' } }}>
          <ChevronLeft size={18} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
        </IconButton>
      </Box>
    </Box>
  );
}
