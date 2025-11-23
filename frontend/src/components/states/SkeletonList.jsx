import React from 'react';
import { Box, Skeleton, Paper, Stack } from '@mui/material';

/**
 * SkeletonList - Standard loading skeleton for list pages
 * 
 * Usage:
 * <SkeletonList rows={5} />
 */
const SkeletonList = ({
  rows = 5,
  
  variant = 'table', // 'table' | 'card' | 'list'
  
  showHeader = true,
  
  sx = {}
}) => {
  if (variant === 'card') {
    return (
      <Box sx={{ ...sx }}>
        <Stack spacing={2}>
          {Array.from({ length: rows }).map((_, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Skeleton variant="circular" width={48} height={48} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="40%" height={24} />
                  <Skeleton variant="text" width="60%" height={20} />
                </Box>
              </Box>
              <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
            </Paper>
          ))}
        </Stack>
      </Box>
    );
  }
  
  if (variant === 'list') {
    return (
      <Box sx={{ ...sx }}>
        <Stack spacing={1}>
          {Array.from({ length: rows }).map((_, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}
            >
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="30%" height={20} />
                <Skeleton variant="text" width="50%" height={16} />
              </Box>
              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
            </Box>
          ))}
        </Stack>
      </Box>
    );
  }
  
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        ...sx
      }}
    >
      {/* Table Header */}
      {showHeader && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            p: 2,
            bgcolor: 'background.default',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Skeleton variant="text" width="20%" height={24} />
          <Skeleton variant="text" width="25%" height={24} />
          <Skeleton variant="text" width="15%" height={24} />
          <Skeleton variant="text" width="20%" height={24} />
          <Skeleton variant="text" width="10%" height={24} />
        </Box>
      )}
      
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            gap: 2,
            p: 2,
            borderBottom: index < rows - 1 ? '1px solid' : 'none',
            borderColor: 'divider'
          }}
        >
          <Skeleton variant="text" width="20%" height={20} />
          <Skeleton variant="text" width="25%" height={20} />
          <Skeleton variant="text" width="15%" height={20} />
          <Skeleton variant="text" width="20%" height={20} />
          <Skeleton variant="rectangular" width="10%" height={32} sx={{ borderRadius: 1 }} />
        </Box>
      ))}
    </Paper>
  );
};

export default SkeletonList;
