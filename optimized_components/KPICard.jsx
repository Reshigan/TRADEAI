import React, { memo, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Skeleton, 
  alpha, 
  useTheme 
} from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

// Memoized component for better performance
const KPICard = memo(({ 
  title, 
  value, 
  trend, 
  trendPercentage, 
  icon: Icon, 
  color = 'primary',
  onClick,
  loading = false,
  compact = false,
  subtitle,
  prefix = '',
  suffix = ''
}) => {
  const theme = useTheme();
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';
  
  // Color mapping system with gradients
  const colorMap = {
    primary: {
      bg: alpha(theme.palette.primary.main, 0.1),
      iconBg: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
      iconColor: theme.palette.primary.main,
      trendBg: alpha(theme.palette.primary.main, 0.1),
      trendColor: theme.palette.primary.main
    },
    success: {
      bg: alpha(theme.palette.success.main, 0.1),
      iconBg: `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.2)} 0%, ${alpha(theme.palette.success.main, 0.1)} 100%)`,
      iconColor: theme.palette.success.main,
      trendBg: alpha(theme.palette.success.main, 0.1),
      trendColor: theme.palette.success.main
    },
    warning: {
      bg: alpha(theme.palette.warning.main, 0.1),
      iconBg: `linear-gradient(135deg, ${alpha(theme.palette.warning.light, 0.2)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
      iconColor: theme.palette.warning.main,
      trendBg: alpha(theme.palette.warning.main, 0.1),
      trendColor: theme.palette.warning.main
    },
    error: {
      bg: alpha(theme.palette.error.main, 0.1),
      iconBg: `linear-gradient(135deg, ${alpha(theme.palette.error.light, 0.2)} 0%, ${alpha(theme.palette.error.main, 0.1)} 100%)`,
      iconColor: theme.palette.error.main,
      trendBg: alpha(theme.palette.error.main, 0.1),
      trendColor: theme.palette.error.main
    },
    info: {
      bg: alpha(theme.palette.info.main, 0.1),
      iconBg: `linear-gradient(135deg, ${alpha(theme.palette.info.light, 0.2)} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`,
      iconColor: theme.palette.info.main,
      trendBg: alpha(theme.palette.info.main, 0.1),
      trendColor: theme.palette.info.main
    }
  };

  const colors = colorMap[color] || colorMap.primary;

  // Memoized callback for click handler
  const handleClick = useCallback(() => {
    if (onClick) onClick();
  }, [onClick]);

  // Format numeric values
  const formatValue = useCallback((val) => {
    if (typeof val === 'number') {
      if (prefix.includes('$') || prefix.includes('R') || suffix.includes('%')) {
        return prefix + val.toLocaleString() + suffix;
      }
      return val.toLocaleString();
    }
    return val;
  }, [prefix, suffix]);

  // Get trend icon
  const getTrendIcon = useCallback(() => {
    if (trend === 'up') return <TrendingUp sx={{ fontSize: 16 }} />;
    if (trend === 'down') return <TrendingDown sx={{ fontSize: 16 }} />;
    return <TrendingFlat sx={{ fontSize: 16 }} />;
  }, [trend]);

  if (loading) {
    return (
      <Card 
        sx={{ 
          height: '100%',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': onClick ? {
            transform: 'translateY(-2px)',
            boxShadow: 4
          } : {}
        }}
      >
        <CardContent sx={{ p: compact ? 2 : 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="80%" height={32} sx={{ my: 1 }} />
              <Skeleton variant="text" width="40%" height={16} />
            </Box>
            <Skeleton variant="circular" width={compact ? 40 : 48} height={compact ? 40 : 48} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 100%)',
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: theme.shadows[1],
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          '&::before': {
            opacity: 1
          }
        } : {},
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${colors.iconColor} 0%, ${alpha(colors.iconColor, 0.5)} 100%)`,
          opacity: 0,
          transition: 'opacity 0.3s ease'
        }
      }}
      onClick={handleClick}
    >
      <CardContent sx={{ p: compact ? 2 : 3, pb: compact ? '16px !important' : '24px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 500, 
                mb: 0.5,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant={compact ? "h5" : "h4"} 
              component="div" 
              sx={{ 
                fontWeight: 700, 
                my: 1,
                color: 'text.primary',
                lineHeight: 1.2
              }}
            >
              {formatValue(value)}
            </Typography>
            {subtitle && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ display: 'block', mb: 1 }}
              >
                {subtitle}
              </Typography>
            )}
            {trendPercentage && (
              <Box 
                sx={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  backgroundColor: colors.trendBg,
                  color: colors.trendColor,
                  maxWidth: '100%'
                }}
              >
                {getTrendIcon()}
                <Typography 
                  variant="caption" 
                  sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {Math.abs(trendPercentage)}% {isPositive ? 'increase' : isNegative ? 'decrease' : 'change'} vs last period
                </Typography>
              </Box>
            )}
          </Box>
          {Icon && (
            <Box 
              sx={{ 
                width: compact ? 40 : 48,
                height: compact ? 40 : 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: colors.iconBg,
                color: colors.iconColor,
                flexShrink: 0,
                ml: 2,
                boxShadow: `0 4px 6px ${alpha(colors.iconColor, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: `0 6px 12px ${alpha(colors.iconColor, 0.15)}`
                }
              }}
            >
              <Icon sx={{ fontSize: compact ? 20 : 24 }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

// Set display name for debugging
KPICard.displayName = 'KPICard';

export default KPICard;