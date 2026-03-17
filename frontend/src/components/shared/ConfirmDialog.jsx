import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

export default function ConfirmDialog({ open, title = 'Confirm Action', message = 'Are you sure?', confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, severity = 'primary' }) {
  const colorMap = { primary: 'primary', error: 'error', warning: 'warning' };
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>
      <DialogContent><DialogContentText>{message}</DialogContentText></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="inherit">{cancelLabel}</Button>
        <Button onClick={onConfirm} variant="contained" color={colorMap[severity] || 'primary'}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
