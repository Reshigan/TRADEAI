import React from 'react';
import { Chip } from '@mui/material';
import theme from '../../theme';

const statusConfig = {
  draft: { label: 'Draft', bg: '#F1F5F9', color: '#475569' },
  pending_approval: { label: 'Pending', bg: '#FEF3C7', color: '#92400E' },
  pending: { label: 'Pending', bg: '#FEF3C7', color: '#92400E' },
  approved: { label: 'Approved', bg: '#DBEAFE', color: '#1E40AF' },
  active: { label: 'Active', bg: '#D1FAE5', color: '#065F46' },
  completed: { label: 'Completed', bg: '#F3F4F6', color: '#374151' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', color: '#991B1B' },
  matched: { label: 'Matched', bg: '#D1FAE5', color: '#065F46' },
  unmatched: { label: 'Unmatched', bg: '#FEF3C7', color: '#92400E' },
  in_progress: { label: 'In Progress', bg: '#DBEAFE', color: '#1E40AF' },
  overdue: { label: 'Overdue', bg: '#FEE2E2', color: '#991B1B' },
};

export default function StatusChip({ status, label, size = 'small' }) {
  const config = statusConfig[status] || { label: status, bg: '#F1F5F9', color: '#475569' };
  return (
    <Chip
      label={label || config.label}
      size={size}
      sx={{ bgcolor: config.bg, color: config.color, fontWeight: 600, fontSize: '0.75rem', borderRadius: '6px', height: size === 'small' ? 24 : 28 }}
    />
  );
}
