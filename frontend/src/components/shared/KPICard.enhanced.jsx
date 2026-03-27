/**
 * Enhanced KPICard Component
 * Professional KPI card with advanced features and styling
 */

import React from 'react';
import { Box, Typography, Card, CardContent, IconButton, Tooltip, Skeleton, Chip } from '@mui/material';
import { TrendingUp, TrendingDown, MoreVertical, Info } from 'lucide-react';

/**
 * Enhanced KPICard with professional styling
 * @param {string} title - Card title/label
 * @param {string|number} value - Main value to display
 * @param {string} subtitle - Optional subtitle
 * @param {number} trend - Trend percentage (positive or negative)
 * @param {string} trendLabel - Custom label for trend
 * @param {React.Component} icon - Icon component
 * @param {string} color - Primary color (hex or theme color)
 * @param {boolean} loading - Loading state
 * @param {function} onClick - Click handler
 * @param {string} tooltip - Optional tooltip
 * @param {string} suffix - Suffix to display after value (e.g., '%', 'x')
 * @param {string} variant - Card variant ('default', 'outlined', 'filled')
 * @param {React.ReactNode} action - Optional action element
 */
export default function KPICard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendLabel, 
  icon: Icon, 
  color = '#2563EB', 
  loading = false,
  onClick,
  tooltip,
  suffix = '',
  variant = 'default',
  action,
}) {
  const trendColor = trend > 0 ? '#059669' : trend < 0 ? '#DC2626' : '#94A3B8';
  const trendPositive = trend >= 0;
  
  // Gradient mapping for common colors
  const gradientMap = {
    '#2563EB': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    '#059669': 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    '#7C3AED': 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    '#F59E0B': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    '#DC2626': 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
    '#0284C7': 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
  };

  if (loading) {
    return (
      <Card 
        sx={{ 
          height: '100%',
          borderRadius: 3,
          border: variant === 'outlined' ? '1px solid' : 'none',
          borderColor: variant === 'outlined' ? 'divider' : 'transparent',
        }}
      >
        <CardContent sx={{ py: 3 }}>
          <Skeleton width={100} height={18} sx={{ mb: 2 }} />
          <Skeleton width={140} height={40} sx={{ mb: 1 }} />
          <Skeleton width={80} height={16} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      onClick={onClick}
      sx={{ 
        height: '100%',
        borderRadius: 3,
        border: variant === 'outlined' ? '1px solid' : '1px solid',
        borderColor: variant === 'outlined' ? 'divider' : 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        '&:hover': { 
          transform: onClick ? 'translateY(-2px)' : 'none',
          boxShadow: onClick ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' : 'inherit',
          borderColor: onClick ? color + '40' : 'divider',
        },
        bgcolor: variant === 'filled' ? `${color}08` : 'background.paper',
      }}
    >
      {tooltip && (
        <Tooltip title={tooltip} placement="top">
          <IconButton 
            size="small"
            sx={{ 
              position: 'absolute', 
              top: 12, 
              right: 12,
              width: 28,
              height: 28,
            }}
          >
            <Info size={14} color="#94A3B8" />
          </IconButton>
        </Tooltip>
      )}
      
      {action && (
        <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
          {action}
        </Box>
      )}
      
      <CardContent sx={{ py: 2.5, px: 3 }}>
        {/* Header with title and icon */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                fontWeight: 600, 
                display: 'block', 
                mb: 0.5,
                fontSize: '0.75rem',
              }}
            >
              {title}
            </Typography>
          </Box>
          {Icon && (
            <Box 
              sx={{ 
                width: 44, 
                height: 44, 
                borderRadius: 2.5, 
                background: gradientMap[color] || color,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                flexShrink: 0,
              }}
            >
              <Icon size={20} color="#fff" />
            </Box>
          )}
        </Box>

        {/* Main value */}
        <Typography 
          variant="h2" 
          sx={{ 
            mb: 1, 
            fontSize: '1.875rem', 
            fontWeight: 700,
            color: 'text.primary',
            letterSpacing: '-0.02em',
          }}
        >
          {value}{suffix}
        </Typography>

        {/* Subtitle */}
        {subtitle && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.tertiary', 
              display: 'block', 
              mb: 1.5,
              fontSize: '0.75rem',
            }}
          >
            {subtitle}
          </Typography>
        )}

        {/* Trend indicator */}
        {(trend !== undefined || trendLabel) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {trend !== undefined && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5, 
                  px: 1.25, 
                  py: 0.5, 
                  borderRadius: 1.5,
                  bgcolor: trendPositive ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                }}
              >
                {trendPositive ? (
                  <TrendingUp size={14} color="#059669" />
                ) : (
                  <TrendingDown size={14} color="#DC2626" />
                )}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: trendPositive ? '#059669' : '#DC2626', 
                    fontWeight: 700, 
                    fontSize: '0.8125rem',
                  }}
                >
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
            {trendLabel && (
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                }}
              >
                {trendLabel}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact KPICard for dense layouts
 */
export function KPICompact({ title, value, trend, icon: Icon, color = '#2563EB', loading = false }) {
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton width={80} height={16} sx={{ mb: 1 }} />
        <Skeleton width={100} height={28} />
      </Box>
    );
  }

  const trendPositive = trend >= 0;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        {Icon && (
          <Box 
            sx={{ 
              width: 32, 
              height: 32, 
              borderRadius: 2, 
              bgcolor: `${color}15`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
            }}
          >
            <Icon size={16} color={color} />
          </Box>
        )}
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography variant="h4" sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
          {value}
        </Typography>
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            {trendPositive ? (
              <TrendingUp size={12} color="#059669" />
            ) : (
              <TrendingDown size={12} color="#DC2626" />
            )}
            <Typography variant="caption" sx={{ color: trendPositive ? '#059669' : '#DC2626', fontWeight: 700 }}>
              {Math.abs(trend)}%
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

/**
 * KPI with sparkline chart
 */
export function KPIWithSparkline({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  color = '#2563EB', 
  loading = false,
  data = [],
}) {
  if (loading) {
    return <KPICard title={title} value="-" loading={true} />;
  }

  // Simple sparkline SVG
  const width = 80;
  const height = 30;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <KPICard 
      title={title} 
      value={value} 
      trend={trend} 
      icon={Icon} 
      color={color}
      action={
        <Box sx={{ width: 80, height: 30 }}>
          <svg width={width} height={height} style={{ overflow: 'visible' }}>
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              points={points}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Box>
      }
    />
  );
}
