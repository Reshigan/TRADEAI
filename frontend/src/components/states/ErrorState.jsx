import React from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import {
  ErrorOutline as ErrorOutlineIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon
} from '@mui/icons-material';

/**
 * ErrorState - Standard component for displaying error states
 * 
 * Usage:
 * <ErrorState
 *   title="Failed to load products"
 *   message="Unable to connect to the server. Please try again."
 *   onRetry={handleRetry}
 * />
 */
const ErrorState = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  error, // Error object for detailed error message
  
  onRetry,
  onGoHome,
  showRetry = true,
  showGoHome = false,
  
  sx = {},
  
  elevation = 0,
  bordered = true,
  
  severity = 'error' // 'error' | 'warning'
}) => {
  const errorMessage = error?.message || error?.response?.data?.message || message;
  
  return (
    <Paper
      elevation={elevation}
      sx={{
        p: 6,
        textAlign: 'center',
        border: bordered ? '1px solid' : 'none',
        borderColor: severity === 'error' ? 'error.light' : 'warning.light',
        borderRadius: 3,
        bgcolor: 'background.paper',
        ...sx
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 3,
          color: severity === 'error' ? 'error.main' : 'warning.main'
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 64 }} />
      </Box>
      
      {/* Title */}
      <Typography
        variant="h6"
        component="h3"
        sx={{
          fontWeight: 600,
          color: 'text.primary',
          mb: 1
        }}
      >
        {title}
      </Typography>
      
      {/* Error Message */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mb: 3,
          maxWidth: 500,
          mx: 'auto'
        }}
      >
        {errorMessage}
      </Typography>
      
      {/* Detailed Error (Development) */}
      {process.env.NODE_ENV === 'development' && error?.stack && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            textAlign: 'left',
            maxWidth: 600,
            mx: 'auto'
          }}
        >
          <Typography variant="caption" component="pre" sx={{ fontSize: '0.7rem', overflow: 'auto' }}>
            {error.stack}
          </Typography>
        </Alert>
      )}
      
      {/* Actions */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}
      >
        {showRetry && onRetry && (
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Try Again
          </Button>
        )}
        {showGoHome && onGoHome && (
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={onGoHome}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Go Home
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default ErrorState;
