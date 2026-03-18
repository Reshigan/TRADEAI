import React, { useState } from 'react';
import { Box, Typography, TextField, InputAdornment, IconButton, Badge, Menu, MenuItem, Divider, Avatar, Select, FormControl } from '@mui/material';
import { Search, Bell, ChevronRight, Settings, LogOut, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const breadcrumbMap = {
  dashboard: 'Dashboard', plan: 'Plan', execute: 'Execute', approve: 'Approve',
  settle: 'Settle', analyze: 'Analyze', data: 'Data', admin: 'Admin',
  budgets: 'Budgets', promotions: 'Promotions', 'trade-spends': 'Trade Spends',
  campaigns: 'Campaigns', claims: 'Claims', deductions: 'Deductions',
  reconciliation: 'Reconciliation', accruals: 'Accruals', settlements: 'Settlements',
  pnl: 'P&L Analysis', 'customer-360': 'Customer 360', reports: 'Reports',
  forecast: 'Executive KPIs', waste: 'Waste Detection', customers: 'Customers',
  products: 'Products', vendors: 'Vendors', 'trading-terms': 'Trading Terms',
  baselines: 'Baselines', hierarchy: 'Hierarchy', users: 'Users', roles: 'Roles',
  config: 'Config', 'sap-export': 'SAP Export', 'sap-integration': 'SAP Integration',
  integrations: 'Integrations', wallet: 'KAM Wallet', calendar: 'Trade Calendar',
  scenarios: 'Scenarios', forecasting: 'Forecasting', 'vendor-funds': 'Vendor Funds',
};

export default function Header({ user, onLogout, onOpenCommandPalette }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [period, setPeriod] = useState('current_month');

  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, i) => ({
    label: breadcrumbMap[part] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
    path: '/' + pathParts.slice(0, i + 1).join('/'),
    isLast: i === pathParts.length - 1,
  }));

  return (
    <Box sx={{ height: 56, display: 'flex', alignItems: 'center', px: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
        {breadcrumbs.map((bc, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight size={14} color="#94A3B8" />}
            <Typography onClick={() => !bc.isLast && navigate(bc.path)}
              sx={{ fontSize: 13, color: bc.isLast ? 'text.primary' : 'text.secondary', fontWeight: bc.isLast ? 600 : 400, cursor: bc.isLast ? 'default' : 'pointer', '&:hover': !bc.isLast ? { color: 'primary.main' } : {} }}>
              {bc.label}
            </Typography>
          </React.Fragment>
        ))}
      </Box>

      <TextField size="small" placeholder="Search... (Cmd+K)" onClick={onOpenCommandPalette} readOnly
        InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} color="#94A3B8" /></InputAdornment> }}
        sx={{ width: 240, '& .MuiOutlinedInput-root': { bgcolor: 'background.default', cursor: 'pointer' }, '& input': { cursor: 'pointer' } }} />

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <Select value={period} onChange={e => setPeriod(e.target.value)} sx={{ fontSize: 13, height: 36 }}>
          <MenuItem value="current_month">This Month</MenuItem>
          <MenuItem value="current_quarter">This Quarter</MenuItem>
          <MenuItem value="current_year">This Year</MenuItem>
          <MenuItem value="last_month">Last Month</MenuItem>
          <MenuItem value="last_quarter">Last Quarter</MenuItem>
        </Select>
      </FormControl>

      <IconButton size="small"><Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16 } }}><Bell size={18} /></Badge></IconButton>

      <IconButton onClick={e => setAnchorEl(e.currentTarget)} size="small">
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>{(user?.name || user?.email || '?')[0].toUpperCase()}</Avatar>
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { minWidth: 200, mt: 1 } }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{user?.name || user?.email}</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', textTransform: 'capitalize' }}>{(user?.role || 'user').replace('_', ' ')}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setAnchorEl(null); navigate('/admin/config'); }}><Settings size={16} style={{ marginRight: 8 }} /> Settings</MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); onLogout(); navigate('/login'); }} sx={{ color: 'error.main' }}><LogOut size={16} style={{ marginRight: 8 }} /> Logout</MenuItem>
      </Menu>
    </Box>
  );
}
