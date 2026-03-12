import React from 'react';
import { Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const MLvsActualBadge = ({ predicted, actual, metric = 'ROI', sx = {} }) => {
  if (predicted == null || actual == null) return null;
  const beat = actual >= predicted;
  const delta = actual - predicted;
  const color = beat ? '#059669' : '#EF4444';

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, borderRadius: 1, bgcolor: `${color}10`, border: `1px solid ${color}30`, ...sx }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
        {metric}: {typeof predicted === 'number' ? predicted.toFixed(1) : predicted}x
      </Typography>
      <Typography variant="caption" sx={{ fontSize: 11 }}>&rarr;</Typography>
      <Typography variant="caption" fontWeight={600} sx={{ color, fontSize: 11 }}>
        {typeof actual === 'number' ? actual.toFixed(1) : actual}x
      </Typography>
      {beat ? <TrendingUpIcon sx={{ color, fontSize: 12 }} /> : <TrendingDownIcon sx={{ color, fontSize: 12 }} />}
      <Typography variant="caption" sx={{ color, fontSize: 10, fontWeight: 600 }}>
        ({delta > 0 ? '+' : ''}{typeof delta === 'number' ? delta.toFixed(1) : delta})
      </Typography>
    </Box>
  );
};

export default MLvsActualBadge;
