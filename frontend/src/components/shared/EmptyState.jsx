import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';

export default function EmptyState({ icon, title = 'No data found', description, actionLabel, onAction }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, px: 3, textAlign: 'center' }}>
      <Box sx={{ width: 64, height: 64, borderRadius: '16px', bgcolor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        {icon || <InboxOutlined sx={{ fontSize: 32, color: '#94A3B8' }} />}
      </Box>
      <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', mb: 0.5 }}>{title}</Typography>
      {description && <Typography sx={{ fontSize: '0.875rem', color: '#64748B', maxWidth: 360, mb: 2 }}>{description}</Typography>}
      {actionLabel && onAction && (
        <Button variant="contained" size="small" onClick={onAction}>{actionLabel}</Button>
      )}
    </Box>
  );
}
