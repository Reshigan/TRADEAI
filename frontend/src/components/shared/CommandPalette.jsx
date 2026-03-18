import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, InputAdornment, Chip, Dialog } from '@mui/material';
import { Search, FileText, DollarSign, Users, Package, CheckSquare, ArrowRight, Plus, BarChart2, Settings, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const searchableItems = [
  // Entity creation actions (UX-09)
  { type: 'create', label: 'New Promotion', path: '/execute/promotions/new', icon: Plus, description: 'Create a new promotion' },
  { type: 'create', label: 'New Trade Spend', path: '/execute/trade-spends', icon: Plus, description: 'Create a new trade spend' },
  { type: 'create', label: 'New Claim', path: '/claims/create', icon: Plus, description: 'Submit a new claim' },
  { type: 'create', label: 'New Deduction', path: '/deductions/create', icon: Plus, description: 'Record a new deduction' },
  { type: 'create', label: 'New Budget', path: '/plan/budgets', icon: Plus, description: 'Create a new budget' },
  { type: 'create', label: 'New Campaign', path: '/execute/campaigns', icon: Plus, description: 'Create a new campaign' },
  // Navigation pages
  { type: 'page', label: 'Dashboard', path: '/dashboard', icon: FileText, description: 'Main dashboard' },
  { type: 'page', label: 'Promotions', path: '/execute/promotions', icon: FileText, description: 'All promotions' },
  { type: 'page', label: 'Budgets', path: '/plan/budgets', icon: DollarSign, description: 'Budget management' },
  { type: 'page', label: 'Customers', path: '/data/customers', icon: Users, description: 'Customer list' },
  { type: 'page', label: 'Products', path: '/data/products', icon: Package, description: 'Product catalog' },
  { type: 'page', label: 'Approvals', path: '/approve', icon: CheckSquare, description: 'Approval queue' },
  { type: 'page', label: 'Claims', path: '/settle/claims', icon: FileText, description: 'Claims management' },
  { type: 'page', label: 'Deductions', path: '/settle/deductions', icon: FileText, description: 'Deductions management' },
  { type: 'page', label: 'P&L Analysis', path: '/analyze/pnl', icon: BarChart2, description: 'Profit & Loss analysis' },
  { type: 'page', label: 'Customer 360', path: '/analyze/customer-360', icon: Users, description: '360° customer view' },
  { type: 'page', label: 'Trade Calendar', path: '/plan/calendar', icon: Calendar, description: 'Trade activity calendar' },
  { type: 'page', label: 'KAM Wallet', path: '/plan/wallet', icon: DollarSign, description: 'KAM budget wallet' },
  { type: 'page', label: 'SAP Export', path: '/admin/sap-export', icon: FileText, description: 'SAP integration exports' },
  { type: 'page', label: 'Waste Detection', path: '/analyze/waste', icon: FileText, description: 'Waste & inefficiency detection' },
  { type: 'page', label: 'Reports', path: '/analyze/reports', icon: BarChart2, description: 'Analytics reports' },
  { type: 'page', label: 'Settings', path: '/admin/config', icon: Settings, description: 'System configuration' },
  { type: 'page', label: 'Vendor Funds', path: '/plan/vendor-funds', icon: DollarSign, description: 'Vendor fund management' },
  { type: 'page', label: 'Reconciliation', path: '/settle/reconciliation', icon: FileText, description: 'Payment reconciliation' },
  { type: 'page', label: 'Accruals', path: '/settle/accruals', icon: FileText, description: 'Accrual management' },
  { type: 'page', label: 'Settlements', path: '/settle/settlements', icon: FileText, description: 'Settlement processing' },
  { type: 'page', label: 'Executive KPIs', path: '/analyze/forecast', icon: BarChart2, description: 'Executive KPI dashboard' },
  { type: 'page', label: 'Vendors', path: '/data/vendors', icon: Users, description: 'Vendor management' },
  { type: 'page', label: 'Trading Terms', path: '/data/trading-terms', icon: FileText, description: 'Trading terms management' },
  { type: 'page', label: 'Rebates', path: '/rebates', icon: DollarSign, description: 'Rebate management' },
  { type: 'page', label: 'Users', path: '/admin/users', icon: Users, description: 'User management' },
];

const TYPE_COLORS = {
  create: '#059669',
  page: '#2563EB',
};

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const results = query.length > 0
    ? searchableItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(query.toLowerCase())
      )
    : searchableItems.slice(0, 10);

  useEffect(() => {
    if (open) { setQuery(''); setSelectedIndex(0); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [open]);

  const handleSelect = (item) => {
    navigate(item.path);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[selectedIndex]) { handleSelect(results[selectedIndex]); }
    else if (e.key === 'Escape') { onClose(); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, mt: -10, overflow: 'hidden' } }}>
      <Box sx={{ p: 0 }}>
        <TextField fullWidth placeholder="Search pages, create entities..." value={query}
          onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
          onKeyDown={handleKeyDown} inputRef={inputRef} autoFocus
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={20} color="#94A3B8" /></InputAdornment> }}
          sx={{ '& .MuiOutlinedInput-root': { border: 'none', borderRadius: 0, '& fieldset': { border: 'none' }, fontSize: 16, py: 0.5 } }} />
        <Box sx={{ borderTop: '1px solid #E2E8F0', maxHeight: 420, overflow: 'auto' }}>
          {results.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}><Typography sx={{ color: 'text.secondary' }}>No results found</Typography></Box>
          ) : results.map((item, i) => {
            const Icon = item.icon;
            const typeColor = TYPE_COLORS[item.type] || '#64748B';
            return (
              <Box key={`${item.type}-${item.path}-${i}`} onClick={() => handleSelect(item)}
                sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer',
                  bgcolor: i === selectedIndex ? '#F1F5F9' : 'transparent', '&:hover': { bgcolor: '#F8FAFC' } }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: `${typeColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={typeColor} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{item.label}</Typography>
                  {item.description && <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{item.description}</Typography>}
                </Box>
                <Chip label={item.type} size="small"
                  sx={{ height: 20, fontSize: 10, textTransform: 'uppercase', bgcolor: `${typeColor}15`, color: typeColor }} />
                {i === selectedIndex && <ArrowRight size={14} color="#94A3B8" />}
              </Box>
            );
          })}
        </Box>
        <Box sx={{ borderTop: '1px solid #E2E8F0', px: 2, py: 1, display: 'flex', gap: 2 }}>
          <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>↑↓ Navigate</Typography>
          <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>↵ Open</Typography>
          <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>Esc Close</Typography>
          <Box sx={{ flex: 1 }} />
          <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>Ctrl+K to open</Typography>
        </Box>
      </Box>
    </Dialog>
  );
}
