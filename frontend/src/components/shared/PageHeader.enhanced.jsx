/**
 * Enhanced PageHeader Component
 * Professional page header with breadcrumbs, actions, and consistent styling
 */

import React from 'react';
import { Box, Typography, Breadcrumbs, Link, IconButton, Tooltip, Chip, Divider, Button } from '@mui/material';
import { ChevronRight, ArrowLeft, Info, HelpCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Professional Page Header Component
 * Provides consistent header styling across all pages
 */
export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions = [],
  onBack,
  icon: Icon,
  tabs = [],
  activeTab,
  onTabChange,
  helpText,
  badge,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const defaultBreadcrumbs = [
    { label: 'Home', href: '/dashboard' },
    ...breadcrumbs,
  ];

  return (
    <Box sx={{ mb: 4 }}>
      {/* Breadcrumbs */}
      {defaultBreadcrumbs.length > 0 && (
        <Breadcrumbs 
          separator={<ChevronRight size={16} color="#94A3B8" />}
          sx={{ mb: 2 }}
        >
          {defaultBreadcrumbs.map((crumb, index) => (
            <Link
              key={index}
              color={index === defaultBreadcrumbs.length - 1 ? 'text.primary' : 'text.secondary'}
              href={crumb.href}
              onClick={(e) => {
                if (index < defaultBreadcrumbs.length - 1) {
                  e.preventDefault();
                  navigate(crumb.href);
                }
              }}
              sx={{ 
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: index === defaultBreadcrumbs.length - 1 ? 600 : 400,
                cursor: index < defaultBreadcrumbs.length - 1 ? 'pointer' : 'default',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              {crumb.label}
            </Link>
          ))}
        </Breadcrumbs>
      )}

      {/* Header Content */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Back Button */}
          {onBack && (
            <IconButton 
              onClick={onBack}
              sx={{ 
                mt: 0.5,
                bgcolor: 'background.paper',
                boxShadow: 'sm',
                '&:hover': { bgcolor: 'background.subtle' },
              }}
            >
              <ArrowLeft size={18} />
            </IconButton>
          )}

          {/* Icon */}
          {Icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                bgcolor: 'primary.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={24} color="#2563EB" />
            </Box>
          )}

          {/* Title and Subtitle */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography 
                variant="h1" 
                sx={{ 
                  fontSize: '1.875rem', 
                  fontWeight: 700,
                  color: 'text.primary',
                  letterSpacing: '-0.02em',
                }}
              >
                {title}
              </Typography>
              {badge && (
                <Chip
                  label={badge.label}
                  size="small"
                  color={badge.color || 'primary'}
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: 1,
                  }}
                />
              )}
              {helpText && (
                <Tooltip title={helpText}>
                  <IconButton size="small">
                    <Info size={16} color="#94A3B8" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            {subtitle && (
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '0.9375rem',
                  maxWidth: 600,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Actions */}
        {actions.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outlined'}
                color={action.color || 'primary'}
                startIcon={action.icon}
                endIcon={action.endIcon}
                onClick={action.onClick}
                disabled={action.disabled}
                sx={{
                  fontWeight: 600,
                  px: action.variant === 'contained' ? 2.5 : 2,
                }}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        )}
      </Box>

      {/* Tabs */}
      {tabs.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            {tabs.map((tab, index) => (
              <Button
                key={index}
                onClick={() => onTabChange && onTabChange(index)}
                variant={activeTab === index ? 'contained' : 'text'}
                startIcon={tab.icon}
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 2.5,
                  py: 1.25,
                  mb: -3,
                  bgcolor: activeTab === index ? 'primary.main' : 'transparent',
                  color: activeTab === index ? 'white' : 'text.secondary',
                  '&:hover': {
                    bgcolor: activeTab === index ? 'primary.dark' : 'background.subtle',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
                {tab.badge && (
                  <Chip
                    label={tab.badge}
                    size="small"
                    sx={{
                      ml: 1,
                      height: 20,
                      minWidth: 20,
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      bgcolor: activeTab === index ? 'rgba(255,255,255,0.2)' : 'primary.50',
                      color: activeTab === index ? 'white' : 'primary.main',
                    }}
                  />
                )}
              </Button>
            ))}
          </Box>
          <Divider sx={{ mt: 3 }} />
        </Box>
      )}
    </Box>
  );
}

/**
 * Simple Page Header for basic pages
 */
export function SimplePageHeader({ title, subtitle, action }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
      <Box>
        <Typography variant="h1" sx={{ fontSize: '1.875rem', fontWeight: 700, mb: 0.5 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
}

/**
 * Stats Header with inline metrics
 */
export function StatsPageHeader({ title, subtitle, stats = [], action }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: '1.875rem', fontWeight: 700, mb: 0.5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box>{action}</Box>}
      </Box>
      
      {stats.length > 0 && (
        <Box sx={{ display: 'flex', gap: 3 }}>
          {stats.map((stat, index) => (
            <Box key={index} sx={{ minWidth: 120 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {stat.label}
              </Typography>
              <Typography variant="h4" sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {stat.value}
              </Typography>
              {stat.trend && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: stat.trend > 0 ? '#059669' : '#DC2626',
                    fontWeight: 600,
                  }}
                >
                  {stat.trend > 0 ? '+' : ''}{stat.trend}% vs last period
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
