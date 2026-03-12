import React from 'react';
import { Box, Typography, LinearProgress, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const MLPredictionCard = ({ title, value, unit = '', confidence = 0, trend, dataPoints, range, sx = {} }) => {
  const confidencePct = Math.round((confidence || 0) * 100);
  const confidenceColor = confidencePct >= 75 ? 'success' : confidencePct >= 50 ? 'warning' : 'error';
  const trendPositive = trend === 'up' || trend === 'positive';

  return (
    <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FAFBFF', ...sx }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {value}{unit}
        </Typography>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', color: trendPositive ? '#059669' : '#EF4444' }}>
            {trendPositive ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
          </Box>
        )}
      </Box>
      {range && (
        <Typography variant="caption" color="text.secondary">
          Range: {range}
        </Typography>
      )}
      <Box sx={{ mt: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Confidence</Typography>
          <Typography variant="caption" fontWeight={600} color={`${confidenceColor}.main`}>{confidencePct}%</Typography>
        </Box>
        <LinearProgress variant="determinate" value={confidencePct} color={confidenceColor}
          sx={{ height: 6, borderRadius: 3, bgcolor: '#E2E8F0' }} />
      </Box>
      {dataPoints > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Based on {dataPoints} data points
        </Typography>
      )}
    </Box>
  );
};

export default MLPredictionCard;
