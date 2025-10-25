import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Skeleton
} from '@mui/material';

/**
 * ENHANCED LOADING STATES
 * Consistent loading indicators throughout the app
 * Maintains theme with gradient progress bars
 */

// Full page loading spinner
export const PageLoader = ({ message = 'Loading...' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 2
    }}
  >
    <Box sx={{ position: 'relative' }}>
      <CircularProgress
        size={60}
        sx={{
          color: '#00ffff',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }}
      />
      <CircularProgress
        size={60}
        variant="determinate"
        value={25}
        sx={{
          color: '#8b5cf6',
          position: 'absolute',
          left: 0,
          top: 0,
          opacity: 0.3
        }}
      />
    </Box>
    <Typography variant="body1" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// Inline loading spinner
export const InlineLoader = ({ size = 24, message }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <CircularProgress
      size={size}
      sx={{
        color: '#00ffff'
      }}
    />
    {message && (
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    )}
  </Box>
);

// Progress bar
export const ProgressBar = ({ value, message }) => (
  <Box sx={{ width: '100%' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">
          {Math.round(value)}%
        </Typography>
      </Box>
      <Box sx={{ width: '100%', ml: 1 }}>
        <LinearProgress
          variant="determinate"
          value={value}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: 'linear-gradient(90deg, #00ffff, #8b5cf6)',
            }
          }}
        />
      </Box>
    </Box>
    {message && (
      <Typography variant="caption" color="text.secondary">
        {message}
      </Typography>
    )}
  </Box>
);

// Card skeleton
export const CardSkeleton = ({ rows = 4 }) => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant="text" width="60%" height={32} />
    <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
    {Array.from({ length: rows }).map((_, index) => (
      <Skeleton
        key={index}
        variant="rectangular"
        height={60}
        sx={{ mb: 1, borderRadius: 1 }}
      />
    ))}
  </Box>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Box sx={{ width: '100%' }}>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Box
        key={rowIndex}
        sx={{
          display: 'flex',
          gap: 2,
          mb: 2
        }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            variant="rectangular"
            width="100%"
            height={40}
            sx={{ borderRadius: 1 }}
          />
        ))}
      </Box>
    ))}
  </Box>
);

// Chart skeleton
export const ChartSkeleton = ({ height = 300 }) => (
  <Box sx={{ width: '100%' }}>
    <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
    <Skeleton
      variant="rectangular"
      width="100%"
      height={height}
      sx={{ borderRadius: 1 }}
    />
  </Box>
);
