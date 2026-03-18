import React from 'react';
import { Chip, useTheme } from '@mui/material';

const lightConfig = {
  draft: { label: 'Draft', bg: '#F1F5F9', color: 'text.secondary' },
  pending_approval: { label: 'Pending', bg: '#FEF3C7', color: '#92400E' },
  pending: { label: 'Pending', bg: '#FEF3C7', color: '#92400E' },
  approved: { label: 'Approved', bg: '#DBEAFE', color: 'primary.dark' },
  active: { label: 'Active', bg: '#D1FAE5', color: '#065F46' },
  completed: { label: 'Completed', bg: '#F3F4F6', color: 'text.primary' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', color: '#991B1B' },
  matched: { label: 'Matched', bg: '#D1FAE5', color: '#065F46' },
  unmatched: { label: 'Unmatched', bg: '#FEF3C7', color: '#92400E' },
  in_progress: { label: 'In Progress', bg: '#DBEAFE', color: 'primary.dark' },
  overdue: { label: 'Overdue', bg: '#FEE2E2', color: '#991B1B' },
};

const darkConfig = {
  draft: { label: 'Draft', bg: '#1E293B', color: 'text.secondary' },
  pending_approval: { label: 'Pending', bg: '#422006', color: '#FCD34D' },
  pending: { label: 'Pending', bg: '#422006', color: '#FCD34D' },
  approved: { label: 'Approved', bg: '#172554', color: '#93C5FD' },
  active: { label: 'Active', bg: '#052E16', color: '#6EE7B7' },
  completed: { label: 'Completed', bg: '#1F2937', color: '#D1D5DB' },
  cancelled: { label: 'Cancelled', bg: '#450A0A', color: '#FCA5A5' },
  rejected: { label: 'Rejected', bg: '#450A0A', color: '#FCA5A5' },
  matched: { label: 'Matched', bg: '#052E16', color: '#6EE7B7' },
  unmatched: { label: 'Unmatched', bg: '#422006', color: '#FCD34D' },
  in_progress: { label: 'In Progress', bg: '#172554', color: '#93C5FD' },
  overdue: { label: 'Overdue', bg: '#450A0A', color: '#FCA5A5' },
};

export default function StatusChip({ status, label, size = 'small' }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const statusMap = isDark ? darkConfig : lightConfig;
  const fallback = isDark ? { label: status, bg: '#1E293B', color: 'text.secondary' } : { label: status, bg: '#F1F5F9', color: 'text.secondary' };
  const config = statusMap[status] || fallback;
  return (
    <Chip
      label={label || config.label}
      size={size}
      sx={{ bgcolor: config.bg, color: config.color, fontWeight: 600, fontSize: '0.75rem', borderRadius: '6px', height: size === 'small' ? 24 : 28 }}
    />
  );
}
