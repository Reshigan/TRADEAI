/**
 * Enhanced LoadingState Component
 * Professional loading states with skeleton screens and progress indicators
 */

import React from 'react';
import { Box, Typography, Skeleton, Card, CardContent, LinearProgress, Paper, Grid } from '@mui/material';
import { Loader2 } from 'lucide-react';

/**
 * Full Page Loading State
 */
export function PageLoader({ message = 'Loading...', showProgress = false, progress = 0 }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 3,
      }}
    >
      {/* Animated Spinner */}
      <Box
        sx={{
          width: 56,
          height: 56,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '3px solid',
            borderColor: 'primary.light',
            borderRadius: '50%',
            borderTopColor: 'primary.main',
            animation: 'spin 0.8s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: '70%',
            height: '70%',
            top: '15%',
            left: '15%',
            border: '3px solid',
            borderColor: 'secondary.light',
            borderRadius: '50%',
            borderBottomColor: 'secondary.main',
            animation: 'spin 0.6s linear infinite reverse',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(-360deg)' },
            },
          }}
        />
      </Box>

      {/* Message */}
      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
        {message}
      </Typography>

      {/* Progress Bar */}
      {showProgress && (
        <Box sx={{ width: 300 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: 'linear-gradient(90deg, #2563EB 0%, #7C3AED 100%)',
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
            {Math.round(progress)}% complete
          </Typography>
        </Box>
      )}
    </Box>
  );
}

/**
 * Card Loading State with Skeleton
 */
export function CardSkeleton({ variant = 'default', count = 1 }) {
  const variants = {
    default: (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Skeleton width={120} height={20} sx={{ mb: 2 }} />
          <Skeleton width="100%" height={180} sx={{ mb: 2, borderRadius: 2 }} />
          <Skeleton width="80%" height={20} sx={{ mb: 1 }} />
          <Skeleton width="60%" height={20} />
        </CardContent>
      </Card>
    ),
    kpi: (
      <Card sx={{ borderRadius: 3, p: 3 }}>
        <Skeleton width={100} height={18} sx={{ mb: 2 }} />
        <Skeleton width={140} height={40} sx={{ mb: 1 }} />
        <Skeleton width={80} height={16} />
      </Card>
    ),
    table: (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Skeleton width="40%" height={24} sx={{ mb: 3 }} />
          {[...Array(5)].map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <Skeleton width={40} height={40} sx={{ borderRadius: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="60%" height={18} sx={{ mb: 1 }} />
                <Skeleton width="40%" height={16} />
              </Box>
              <Skeleton width={80} height={32} sx={{ borderRadius: 2 }} />
            </Box>
          ))}
        </CardContent>
      </Card>
    ),
    list: (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          {[...Array(6)].map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <Skeleton width={48} height={48} sx={{ borderRadius: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="70%" height={18} sx={{ mb: 1 }} />
                <Skeleton width="50%" height={16} />
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    ),
    chart: (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Skeleton width="50%" height={24} sx={{ mb: 3 }} />
          <Skeleton width="100%" height={250} sx={{ borderRadius: 2 }} />
        </CardContent>
      </Card>
    ),
  };

  if (count > 1) {
    return (
      <Grid container spacing={2.5}>
        {[...Array(count)].map((_, i) => (
          <Grid item xs={12} sm={6} lg={4} key={i}>
            {variants[variant]}
          </Grid>
        ))}
      </Grid>
    );
  }

  return variants[variant] || variants.default;
}

/**
 * Dashboard Loading State
 */
export function DashboardSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header Skeleton */}
      <Box sx={{ mb: 4 }}>
        <Skeleton width={200} height={40} sx={{ mb: 1 }} />
        <Skeleton width={300} height={20} />
      </Box>

      {/* KPI Grid */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[...Array(4)].map((_, i) => (
          <Grid item xs={12} sm={6} lg={3} key={i}>
            <CardSkeleton variant="kpi" />
          </Grid>
        ))}
      </Grid>

      {/* Content Grid */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <CardSkeleton variant="chart" />
        </Grid>
        <Grid item xs={12} md={4}>
          <CardSkeleton variant="list" />
        </Grid>
      </Grid>
    </Box>
  );
}

/**
 * Table Loading State
 */
export function TableSkeleton({ rows = 10 }) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Skeleton width="30%" height={28} sx={{ mb: 3 }} />
        <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          {/* Table Header */}
          <Box sx={{ display: 'flex', p: 2, bgcolor: 'background.subtle', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Skeleton width="25%" height={18} />
            <Skeleton width="20%" height={18} sx={{ ml: 'auto' }} />
            <Skeleton width="15%" height={18} sx={{ ml: 2 }} />
            <Skeleton width="15%" height={18} sx={{ ml: 2 }} />
          </Box>
          {/* Table Rows */}
          {[...Array(rows)].map((_, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                p: 2,
                borderBottom: i < rows - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                alignItems: 'center',
              }}
            >
              <Skeleton width={40} height={40} sx={{ borderRadius: 2, mr: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="60%" height={18} sx={{ mb: 1 }} />
                <Skeleton width="40%" height={16} />
              </Box>
              <Skeleton width={80} height={32} sx={{ borderRadius: 2, ml: 2 }} />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * Form Loading State
 */
export function FormSkeleton({ fields = 5 }) {
  return (
    <Card sx={{ borderRadius: 3, maxWidth: 800 }}>
      <CardContent>
        <Skeleton width="40%" height={28} sx={{ mb: 3 }} />
        {[...Array(fields)].map((_, i) => (
          <Box key={i} sx={{ mb: 2.5 }}>
            <Skeleton width={120} height={18} sx={{ mb: 1 }} />
            <Skeleton width="100%" height={44} sx={{ borderRadius: 2 }} />
          </Box>
        ))}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 4 }}>
          <Skeleton width={120} height={40} sx={{ borderRadius: 2 }} />
          <Skeleton width={100} height={40} sx={{ borderRadius: 2 }} />
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * Inline Loading Spinner
 */
export function InlineLoader({ size = 'medium', text }) {
  const sizes = {
    small: 16,
    medium: 24,
    large: 32,
  };

  const sizeValue = sizes[size];

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Loader2 size={sizeValue} color="#2563EB" style={{ animation: 'spin 1s linear infinite' }} />
      {text && (
        <Typography variant="body2" color="text.secondary">
          {text}
        </Typography>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Box>
  );
}

/**
 * Content Placeholder for lazy-loaded components
 */
export function ContentPlaceholder({ height = 300, width = '100%' }) {
  return (
    <Paper
      elevation={0}
      sx={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.subtle',
        borderRadius: 3,
        border: '1px dashed',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Loader2 size={32} color="#94A3B8" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
        <Typography variant="body2" color="text.secondary">
          Loading content...
        </Typography>
        <style>{`@keyframes spin { to { transform: 'rotate(360deg)'; } }`}</style>
      </Box>
    </Paper>
  );
}

/**
 * Shimmer Loading Effect
 */
export function Shimmer({ width = '100%', height = 20, borderRadius = 2 }) {
  return (
    <Skeleton
      variant="rectangular"
      width={width}
      height={height}
      sx={{
        borderRadius,
        bgcolor: 'action.hover',
        animation: 'shimmer 1.5s infinite',
        background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
        backgroundSize: '200% 100%',
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      }}
    />
  );
}
