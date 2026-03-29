import React, { useState, useCallback, useRef } from 'react';
import ConfirmDialog from '../components/shared/ConfirmDialog';

/**
 * Hook that provides a promise-based confirm dialog.
 * Usage:
 *   const { confirm, ConfirmDialogComponent } = useConfirmDialog();
 *   // In handler:
 *   const ok = await confirm('Are you sure?');
 *   if (!ok) return;
 *   // ... proceed with action
 *   // In JSX:
 *   {ConfirmDialogComponent}
 */
export default function useConfirmDialog() {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({
        message,
        title: options.title || 'Confirm Action',
        severity: options.severity || 'warning',
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveRef.current) resolveRef.current(true);
    setDialog(null);
  }, []);

  const handleCancel = useCallback(() => {
    if (resolveRef.current) resolveRef.current(false);
    setDialog(null);
  }, []);

  const ConfirmDialogComponent = dialog ? (
    <ConfirmDialog
      open={true}
      title={dialog.title}
      message={dialog.message}
      severity={dialog.severity}
      confirmLabel={dialog.confirmLabel}
      cancelLabel={dialog.cancelLabel}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { confirm, ConfirmDialogComponent };
}
