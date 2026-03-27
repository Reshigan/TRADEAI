/**
 * Enhanced EmptyState Component
 * Professional empty states with illustrations, actions, and helpful guidance
 */

import React from 'react';
import { Box, Typography, Button, Paper, Link } from '@mui/material';
import { 
  FileText, 
  Plus, 
  Search, 
  Inbox, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  HelpCircle,
  ArrowRight,
  BarChart3,
  Users,
  DollarSign,
  Calendar,
  Settings,
  Upload,
  Download,
  Filter,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Enhanced EmptyState with professional styling and multiple variants
 */
export default function EmptyState({
  variant = 'default',
  icon: CustomIcon,
  title,
  description,
  action,
  secondaryAction,
  illustration,
  size = 'medium',
}) {
  const navigate = useNavigate();

  // Pre-configured icon and color mappings for common variants
  const variantConfig = {
    default: {
      icon: FileText,
      color: '#94A3B8',
      bg: '#F1F5F9',
    },
    search: {
      icon: Search,
      color: '#64748B',
      bg: '#F8FAFC',
    },
    inbox: {
      icon: Inbox,
      color: '#64748B',
      bg: '#F8FAFC',
    },
    success: {
      icon: CheckCircle,
      color: '#059669',
      bg: '#ECFDF5',
    },
    error: {
      icon: XCircle,
      color: '#DC2626',
      bg: '#FEF2F2',
    },
    warning: {
      icon: AlertCircle,
      color: '#F59E0B',
      bg: '#FFFBEB',
    },
    data: {
      icon: BarChart3,
      color: '#2563EB',
      bg: '#EFF6FF',
    },
    users: {
      icon: Users,
      color: '#7C3AED',
      bg: '#F5F3FF',
    },
    money: {
      icon: DollarSign,
      color: '#059669',
      bg: '#ECFDF5',
    },
    calendar: {
      icon: Calendar,
      color: '#F59E0B',
      bg: '#FFFBEB',
    },
    settings: {
      icon: Settings,
      color: '#64748B',
      bg: '#F8FAFC',
    },
    upload: {
      icon: Upload,
      color: '#2563EB',
      bg: '#EFF6FF',
    },
    download: {
      icon: Download,
      color: '#059669',
      bg: '#ECFDF5',
    },
    filter: {
      icon: Filter,
      color: '#64748B',
      bg: '#F8FAFC',
    },
    ai: {
      icon: Sparkles,
      color: '#7C3AED',
      bg: '#F5F3FF',
    },
  };

  const config = variantConfig[variant] || variantConfig.default;
  const IconComponent = CustomIcon || config.icon;

  // Size configurations
  const sizeConfig = {
    small: { iconSize: 40, gap: 1.5, maxWidth: 400 },
    medium: { iconSize: 64, gap: 2, maxWidth: 500 },
    large: { iconSize: 80, gap: 2.5, maxWidth: 600 },
  };

  const { iconSize, gap, maxWidth } = sizeConfig[size];

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 3,
        p: 6,
        textAlign: 'center',
        bgcolor: variant === 'default' ? 'transparent' : config.bg,
        maxWidth,
        mx: 'auto',
      }}
    >
      {/* Illustration or Icon */}
      <Box
        sx={{
          width: iconSize,
          height: iconSize,
          borderRadius: '50%',
          bgcolor: config.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: gap,
        }}
      >
        {illustration ? (
          illustration
        ) : (
          <IconComponent size={iconSize * 0.5} color={config.color} />
        )}
      </Box>

      {/* Title */}
      <Typography
        variant="h5"
        sx={{
          fontSize: '1.25rem',
          fontWeight: 600,
          mb: 1,
          color: 'text.primary',
        }}
      >
        {title}
      </Typography>

      {/* Description */}
      {description && (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mb: gap,
            fontSize: '0.9375rem',
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
        {action && (
          <Button
            variant="contained"
            color="primary"
            onClick={action.onClick || (() => {})}
            startIcon={action.icon || <Plus size={18} />}
            size={size === 'small' ? 'small' : 'medium'}
            sx={{
              fontWeight: 600,
              px: 3,
            }}
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="outlined"
            color="primary"
            onClick={secondaryAction.onClick || (() => {})}
            startIcon={secondaryAction.icon}
            endIcon={secondaryAction.endIcon || <ArrowRight size={16} />}
            size={size === 'small' ? 'small' : 'medium'}
            sx={{
              fontWeight: 600,
              px: 3,
            }}
          >
            {secondaryAction.label}
          </Button>
        )}
      </Box>
    </Paper>
  );
}

/**
 * Minimal EmptyState for tables and lists
 */
export function EmptyTableState({ message = 'No items found', icon: Icon }) {
  return (
    <Box
      sx={{
        py: 8,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: '#F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
        }}
      >
        {Icon ? (
          <Icon size={24} color="#94A3B8" />
        ) : (
          <Inbox size={24} color="#94A3B8" />
        )}
      </Box>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

/**
 * Search Results Empty State
 */
export function SearchEmptyState({ query, onClear }) {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try adjusting your search terms or filters.`}
      action={{
        label: 'Clear Search',
        onClick: onClear,
        icon: <XCircle size={18} />,
      }}
    />
  );
}

/**
 * Filter Results Empty State
 */
export function FilterEmptyState({ onClearFilters }) {
  return (
    <EmptyState
      variant="filter"
      title="No matching items"
      description="Try adjusting your filters to find what you're looking for."
      action={{
        label: 'Clear Filters',
        onClick: onClearFilters,
        icon: <Filter size={18} />,
      }}
    />
  );
}

/**
 * First Time User Empty State
 */
export function FirstTimeState({ title, description, action, secondaryAction }) {
  return (
    <EmptyState
      variant="ai"
      title={title}
      description={description}
      action={action}
      secondaryAction={secondaryAction}
      size="large"
    />
  );
}

/**
 * Permission Denied Empty State
 */
export function PermissionDeniedState({ message = "You don't have permission to view this content" }) {
  return (
    <EmptyState
      variant="error"
      icon={AlertCircle}
      title="Access Denied"
      description={message}
      action={{
        label: 'Contact Admin',
        onClick: () => window.location.href = '/admin',
      }}
    />
  );
}

/**
 * Maintenance Empty State
 */
export function MaintenanceState({ message = 'This feature is under maintenance' }) {
  return (
    <EmptyState
      variant="warning"
      icon={Settings}
      title="Under Maintenance"
      description={message}
    />
  );
}
