import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper
} from '@mui/material';
import {
  Inbox as InboxIcon,
  Search as SearchIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

/**
 * EMPTY STATE COMPONENTS
 * Friendly empty states with call-to-action
 * Maintains theme with gradient buttons
 */

const EmptyState = ({
  icon: Icon = InboxIcon,
  title = 'No items found',
  description = 'Get started by creating your first item',
  actionLabel,
  onAction,
  variant = 'default' // default, search, error, info
}) => {
  const getIcon = () => {
    if (Icon) return Icon;
    switch (variant) {
      case 'search':
        return SearchIcon;
      case 'error':
        return ErrorIcon;
      case 'info':
        return InfoIcon;
      default:
        return InboxIcon;
    }
  };

  const IconComponent = getIcon();

  const getIconColor = () => {
    switch (variant) {
      case 'search':
        return '#00ffff';
      case 'error':
        return '#ef4444';
      case 'info':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 6,
        textAlign: 'center',
        bgcolor: 'background.default',
        border: '2px dashed',
        borderColor: 'divider'
      }}
    >
      <IconComponent
        sx={{
          fontSize: 80,
          color: getIconColor(),
          opacity: 0.5,
          mb: 2
        }}
      />
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: 600,
          color: 'text.primary'
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}
      >
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button
          variant="contained"
          size="large"
          onClick={onAction}
          sx={{
            background: 'linear-gradient(45deg, #00ffff, #8b5cf6)',
            color: 'white',
            fontWeight: 600,
            px: 4,
            py: 1.5,
            '&:hover': {
              background: 'linear-gradient(45deg, #00e6e6, #7c3aed)',
              boxShadow: '0 8px 24px rgba(0, 255, 255, 0.3)'
            }
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
};

// Preset empty states
export const NoDataState = ({ onAction, actionLabel = 'Add Data' }) => (
  <EmptyState
    title="No Data Available"
    description="There's no data to display yet. Start by adding some items."
    actionLabel={actionLabel}
    onAction={onAction}
  />
);

export const SearchEmptyState = ({ searchTerm }) => (
  <EmptyState
    variant="search"
    icon={SearchIcon}
    title="No Results Found"
    description={
      searchTerm
        ? `We couldn't find any results for "${searchTerm}". Try adjusting your search.`
        : 'Try a different search query.'
    }
  />
);

export const ErrorState = ({ onRetry }) => (
  <EmptyState
    variant="error"
    icon={ErrorIcon}
    title="Something Went Wrong"
    description="We encountered an error loading this data. Please try again."
    actionLabel="Retry"
    onAction={onRetry}
  />
);

export const InfoState = ({ title, description }) => (
  <EmptyState
    variant="info"
    icon={InfoIcon}
    title={title}
    description={description}
  />
);

export default EmptyState;
