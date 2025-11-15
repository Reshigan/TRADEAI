import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, options = {}) => {
    const {
      severity = 'info',
      title = null,
      duration = 6000,
      action = null
    } = options;

    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      severity,
      title,
      duration,
      action,
      open: true
    };

    setToasts(prev => [...prev, toast]);

    if (window.trackEvent) {
      window.trackEvent('toast_shown', {
        severity,
        message: message.substring(0, 100)
      });
    }

    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts(prev =>
      prev.map(toast =>
        toast.id === id ? { ...toast, open: false } : toast
      )
    );

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 300);
  }, []);

  const success = useCallback((message, options = {}) => {
    return showToast(message, { ...options, severity: 'success' });
  }, [showToast]);

  const error = useCallback((message, options = {}) => {
    return showToast(message, { ...options, severity: 'error', duration: 8000 });
  }, [showToast]);

  const warning = useCallback((message, options = {}) => {
    return showToast(message, { ...options, severity: 'warning' });
  }, [showToast]);

  const info = useCallback((message, options = {}) => {
    return showToast(message, { ...options, severity: 'info' });
  }, [showToast]);

  const value = {
    showToast,
    hideToast,
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open={toast.open}
          autoHideDuration={toast.duration}
          onClose={() => hideToast(toast.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ mb: toasts.indexOf(toast) * 7 }}
        >
          <Alert
            onClose={() => hideToast(toast.id)}
            severity={toast.severity}
            variant="filled"
            sx={{ width: '100%', minWidth: 300 }}
            action={toast.action}
          >
            {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
