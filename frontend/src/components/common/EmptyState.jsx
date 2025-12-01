import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const EmptyState = ({ 
  icon = '📭', 
  title = 'No data found', 
  message, 
  actionLabel, 
  onAction,
  actionIcon = <AddIcon />,
  variant = 'default'
}) => {
  const isCompact = variant === 'compact';
  
  return (
    <Paper
      elevation={0}
      sx={{
        textAlign: 'center',
        py: isCompact ? 4 : 8,
        px: 3,
        backgroundColor: 'transparent',
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 3,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.light',
          backgroundColor: 'rgba(59, 130, 246, 0.02)',
        }
      }}
    >
      <Box
        sx={{
          fontSize: isCompact ? '48px' : '64px',
          mb: 2,
          filter: 'grayscale(20%)',
          opacity: 0.9,
        }}
      >
        {icon}
      </Box>
      <Typography 
        variant={isCompact ? 'h6' : 'h5'}
        component="h3" 
        sx={{ 
          fontWeight: 600, 
          mb: 1,
          color: 'text.primary'
        }}
      >
        {title}
      </Typography>
      {message && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            mb: 3, 
            maxWidth: '400px', 
            mx: 'auto',
            lineHeight: 1.6
          }}
        >
          {message}
        </Typography>
      )}
      {onAction && actionLabel && (
        <Button
          variant="contained"
          color="primary"
          onClick={onAction}
          startIcon={actionIcon}
          sx={{
            mt: 1,
            px: 3,
            py: 1,
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
};

export default EmptyState;
