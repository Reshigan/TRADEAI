import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, InputAdornment, Chip, Dialog } from '@mui/material';
import { Search, FileText, DollarSign, Users, Package, CheckSquare, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const searchableItems = [
  { type: 'page', label: 'Dashboard', path: '/dashboard', icon: FileText },
  { type: 'page', label: 'Promotions', path: '/execute/promotions', icon: FileText },
  { type: 'page', label: 'New Promotion', path: '/execute/promotions/new', icon: FileText },
  { type: 'page', label: 'Budgets', path: '/plan/budgets', icon: DollarSign },
  { type: 'page', label: 'Customers', path: '/data/customers', icon: Users },
  { type: 'page', label: 'Products', path: '/data/products', icon: Package },
  { type: 'page', label: 'Approvals', path: '/approve', icon: CheckSquare },
  { type: 'page', label: 'Claims', path: '/settle/claims', icon: FileText },
  { type: 'page', label: 'Deductions', path: '/settle/deductions', icon: FileText },
  { type: 'page', label: 'P&L Analysis', path: '/analyze/pnl', icon: DollarSign },
  { type: 'page', label: 'Customer 360', path: '/analyze/customer-360', icon: Users },
  { type: 'page', label: 'Trade Calendar', path: '/plan/calendar', icon: FileText },
  { type: 'page', label: 'KAM Wallet', path: '/plan/wallet', icon: DollarSign },
  { type: 'page', label: 'SAP Export', path: '/admin/sap-export', icon: FileText },
  { type: 'page', label: 'Waste Detection', path: '/analyze/waste', icon: FileText },
  { type: 'page', label: 'Reports', path: '/analyze/reports', icon: FileText },
  { type: 'page', label: 'Settings', path: '/admin/config', icon: FileText },
  { type: 'page', label: 'Vendor Funds', path: '/plan/vendor-funds', icon: DollarSign },
  { type: 'page', label: 'Reconciliation', path: '/settle/reconciliation', icon: FileText },
  { type: 'page', label: 'Accruals', path: '/settle/accruals', icon: FileText },
  { type: 'page', label: 'Settlements', path: '/settle/settlements', icon: FileText },
  { type: 'page', label: 'Executive KPIs', path: '/analyze/forecast', icon: FileText },
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const results = query.length > 0
    ? searchableItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
    : searchableItems.slice(0, 8);

  useEffect(() => { if (open) { setQuery(''); setSelectedIndex(0); setTimeout(() => inputRef.current?.focus(), 100); } }, [open]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[selectedIndex]) { navigate(results[selectedIndex].path); onClose(); }
    else if (e.key === 'Escape') { onClose(); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, mt: -10, overflow: 'hidden' } }}>
      <Box sx={{ p: 0 }}>
        <TextField fullWidth placeholder="Search pages, entities..." value={query} onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
          onKeyDown={handleKeyDown} inputRef={inputRef} autoFocus
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={20} color="#94A3B8" /></InputAdornment> }}
          sx={{ '& .MuiOutlinedInput-root': { border: 'none', borderRadius: 0, '& fieldset': { border: 'none' }, fontSize: 16, py: 0.5 } }} />
        <Box sx={{ borderTop: '1px solid #E2E8F0', maxHeight: 400, overflow: 'auto' }}>
          {results.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}><Typography sx={{ color: 'text.secondary' }}>No results found</Typography></Box>
          ) : results.map((item, i) => {
            const Icon = item.icon;
            return (
              <Box key={item.path} onClick={() => { navigate(item.path); onClose(); }}
                sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer',
                  bgcolor: i === selectedIndex ? '#F1F5F9' : 'transparent', '&:hover': { bgcolor: '#F8FAFC' } }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color="#64748B" />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{item.label}</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{item.path}</Typography>
                </Box>
                <Chip label={item.type} size="small" sx={{ height: 20, fontSize: 10, textTransform: 'uppercase' }} />
                {i === selectedIndex && <ArrowRight size={14} color="#94A3B8" />}
              </Box>
            );
          })}
        </Box>
        <Box sx={{ borderTop: '1px solid #E2E8F0', px: 2, py: 1, display: 'flex', gap: 2 }}>
          <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>↑↓ Navigate</Typography>
          <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>↵ Open</Typography>
          <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>Esc Close</Typography>
        </Box>
      </Box>
    </Dialog>
  );
}
