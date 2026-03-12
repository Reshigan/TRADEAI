import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

export default function ConfirmDialog({ open, title = 'Confirm', message = 'Are you sure?', confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, severity = 'warning' }) {
  const colors = { warning: '#D97706', error: '#DC2626', info: '#2563EB' };
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>
      <DialogContent><DialogContentText>{message}</DialogContentText></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined" size="small">{cancelLabel}</Button>
        <Button onClick={onConfirm} variant="contained" size="small" sx={{ bgcolor: colors[severity] || colors.warning, '&:hover': { bgcolor: colors[severity] || colors.warning, filter: 'brightness(0.9)' } }}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
