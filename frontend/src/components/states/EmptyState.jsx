import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import {
  Inbox as InboxIcon,
  SearchOff as SearchOffIcon,
  FilterAltOff as FilterAltOffIcon,
  ErrorOutline as ErrorOutlineIcon
} from '@mui/icons-material';

/**
 * EmptyState - Standard component for displaying empty states
 * 
 * Usage:
 * <EmptyState
 *   icon={<InboxIcon />}
 *   title="No products found"
 *   description="Get started by creating your first product"
 *   action={<Button onClick={handleCreate}>Create Product</Button>}
 * />
 */
const EmptyState = ({
  icon,
  iconColor = 'text.secondary',
  
  title = 'No data found',
  description,
  
  action,
  secondaryAction,
  
  variant = 'default', // 'default' | 'search' | 'filter' | 'error'
  
  sx = {},
  
  elevation = 0,
  bordered = true
}) => {
  const getDefaultIcon = () => {
    switch (variant) {
      case 'search':
        return <SearchOffIcon sx={{ fontSize: 64 }} />;
      case 'filter':
        return <FilterAltOffIcon sx={{ fontSize: 64 }} />;
      case 'error':
        return <ErrorOutlineIcon sx={{ fontSize: 64 }} />;
      default:
        return <InboxIcon sx={{ fontSize: 64 }} />;
    }
  };
  
  const displayIcon = icon || getDefaultIcon();
  
  return (
    <Paper
      elevation={elevation}
      sx={{
        p: 6,
        textAlign: 'center',
        border: bordered ? '1px solid' : 'none',
        borderColor: 'divider',
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
          color: iconColor,
          opacity: 0.5
        }}
      >
        {displayIcon}
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
      
      {/* Description */}
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 3,
            maxWidth: 400,
            mx: 'auto'
          }}
        >
          {description}
        </Typography>
      )}
      
      {/* Actions */}
      {(action || secondaryAction) && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          {action}
          {secondaryAction}
        </Box>
      )}
    </Paper>
  );
};

export default EmptyState;
