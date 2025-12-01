import React from 'react';
import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  trendLabel,
  color = 'primary',
  loading = false,
  onClick,
  variant = 'default'
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === 'up') return <TrendingUp sx={{ fontSize: 16 }} />;
    if (trend === 'down') return <TrendingDown sx={{ fontSize: 16 }} />;
    return <TrendingFlat sx={{ fontSize: 16 }} />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'success.main';
    if (trend === 'down') return 'error.main';
    return 'text.secondary';
  };

  const colorMap = {
    primary: {
      bg: 'rgba(59, 130, 246, 0.08)',
      iconBg: 'rgba(59, 130, 246, 0.12)',
      iconColor: 'primary.main',
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.08)',
      iconBg: 'rgba(16, 185, 129, 0.12)',
      iconColor: 'success.main',
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.08)',
      iconBg: 'rgba(245, 158, 11, 0.12)',
      iconColor: 'warning.main',
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.08)',
      iconBg: 'rgba(239, 68, 68, 0.12)',
      iconColor: 'error.main',
    },
    info: {
      bg: 'rgba(59, 130, 246, 0.08)',
      iconBg: 'rgba(59, 130, 246, 0.12)',
      iconColor: 'info.main',
    },
  };

  const colors = colorMap[color] || colorMap.primary;
  const isCompact = variant === 'compact';

  if (loading) {
    return (
      <Card
        sx={{
          height: '100%',
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        <CardContent sx={{ p: isCompact ? 2 : 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="40%" height={36} sx={{ mt: 1 }} />
              <Skeleton variant="text" width="50%" height={16} sx={{ mt: 1 }} />
            </Box>
            <Skeleton variant="circular" width={48} height={48} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${colors.iconColor.replace('.main', '.light')} 0%, ${colors.iconColor} 100%)`,
          opacity: 0,
          transition: 'opacity 0.2s ease',
        },
        '&:hover::before': {
          opacity: onClick ? 1 : 0,
        },
      }}
    >
      <CardContent sx={{ p: isCompact ? 2 : 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                mb: 0.5,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant={isCompact ? 'h5' : 'h4'}
              component="div"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1.2,
                mb: subtitle || trend ? 1 : 0,
              }}
            >
              {value}
            </Typography>
            {(subtitle || trend) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {trend && (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      backgroundColor: trend === 'up' ? 'rgba(16, 185, 129, 0.1)' : 
                                       trend === 'down' ? 'rgba(239, 68, 68, 0.1)' : 
                                       'rgba(100, 116, 139, 0.1)',
                      color: getTrendColor(),
                    }}
                  >
                    {getTrendIcon()}
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {trendValue}
                    </Typography>
                  </Box>
                )}
                {(subtitle || trendLabel) && (
                  <Typography variant="caption" color="text.secondary">
                    {subtitle || trendLabel}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                width: isCompact ? 40 : 48,
                height: isCompact ? 40 : 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.iconBg,
                color: colors.iconColor,
                flexShrink: 0,
                ml: 2,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
