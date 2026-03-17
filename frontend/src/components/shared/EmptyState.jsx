import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No data found', description = 'Get started by creating your first item.', actionLabel, onAction, icon: Icon = Inbox }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, px: 4 }}>
      <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <Icon size={28} color="#94A3B8" />
      </Box>
      <Typography variant="h3" sx={{ mb: 1, color: 'text.primary' }}>{title}</Typography>
      <Typography sx={{ color: 'text.secondary', mb: 3, textAlign: 'center', maxWidth: 400 }}>{description}</Typography>
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>{actionLabel}</Button>
      )}
    </Box>
  );
}
