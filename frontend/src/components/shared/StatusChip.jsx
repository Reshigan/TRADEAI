import React from 'react';
import { Chip } from '@mui/material';

const STATUS_CONFIG = {
  draft: { color: '#64748B', bg: '#F1F5F9', label: 'Draft' },
  pending: { color: '#D97706', bg: '#FFFBEB', label: 'Pending' },
  pending_approval: { color: '#D97706', bg: '#FFFBEB', label: 'Pending Approval' },
  approved: { color: '#059669', bg: '#ECFDF5', label: 'Approved' },
  active: { color: '#2563EB', bg: '#EFF6FF', label: 'Active' },
  completed: { color: '#7C3AED', bg: '#F5F3FF', label: 'Completed' },
  rejected: { color: '#DC2626', bg: '#FEF2F2', label: 'Rejected' },
  cancelled: { color: '#6B7280', bg: '#F3F4F6', label: 'Cancelled' },
  expired: { color: '#9CA3AF', bg: '#F9FAFB', label: 'Expired' },
  closed: { color: '#6B7280', bg: '#F3F4F6', label: 'Closed' },
  matched: { color: '#059669', bg: '#ECFDF5', label: 'Matched' },
  unmatched: { color: '#DC2626', bg: '#FEF2F2', label: 'Unmatched' },
  partial: { color: '#D97706', bg: '#FFFBEB', label: 'Partial' },
  calculated: { color: '#0284C7', bg: '#F0F9FF', label: 'Calculated' },
  posted: { color: '#059669', bg: '#ECFDF5', label: 'Posted' },
  settled: { color: '#7C3AED', bg: '#F5F3FF', label: 'Settled' },
  open: { color: '#2563EB', bg: '#EFF6FF', label: 'Open' },
  in_progress: { color: '#D97706', bg: '#FFFBEB', label: 'In Progress' },
  high: { color: '#DC2626', bg: '#FEF2F2', label: 'High' },
  medium: { color: '#D97706', bg: '#FFFBEB', label: 'Medium' },
  low: { color: '#059669', bg: '#ECFDF5', label: 'Low' },
  critical: { color: '#DC2626', bg: '#FEF2F2', label: 'Critical' },
};

export default function StatusChip({ status, label, size = 'small', sx = {} }) {
  const key = (status || '').toLowerCase().replace(/\s+/g, '_');
  const config = STATUS_CONFIG[key] || { color: '#64748B', bg: '#F1F5F9', label: status };
  return (
    <Chip
      label={label || config.label || status}
      size={size}
      sx={{
        bgcolor: config.bg,
        color: config.color,
        fontWeight: 600,
        fontSize: '0.75rem',
        borderRadius: '6px',
        height: size === 'small' ? 24 : 28,
        ...sx,
      }}
    />
  );
}
