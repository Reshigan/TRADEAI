import React from 'react';
import { Box, IconButton, InputBase, Badge, Avatar, Chip } from '@mui/material';
import { Search, Bell, Sparkles, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <Box sx={{ height: 56, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={onMenuClick} sx={{ display: { md: 'none' }, mr: 1 }}><Menu size={20} /></IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'background.default', borderRadius: 2, px: 1.5, py: 0.5, border: 1, borderColor: 'divider', width: { xs: 180, sm: 320 } }}>
          <Search size={16} color="#94A3B8" />
          <InputBase placeholder="Search promotions, budgets..." sx={{ ml: 1, flex: 1, fontSize: 13, color: 'text.primary' }} />
          <Chip label="/" size="small" sx={{ height: 20, fontSize: 10, bgcolor: 'action.hover' }} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip icon={<Sparkles size={14} />} label="AI Ready" size="small" sx={{ bgcolor: '#F5F3FF', color: '#7C3AED', fontWeight: 600, fontSize: 11, '& .MuiChip-icon': { color: '#7C3AED' } }} />
        <IconButton size="small"><Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16 } }}><Bell size={18} /></Badge></IconButton>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 12, ml: 0.5 }}>{(user?.name || user?.email || '?')[0].toUpperCase()}</Avatar>
      </Box>
    </Box>
  );
}
