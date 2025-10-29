/**
 * QuickForecastWidget - Mini Forecast Chart
 * 
 * Compact 7-30 day forecast widget for embedding anywhere
 */

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const QuickForecastWidget = ({ data, title = 'Forecast', height = 100 }) => {
  if (!data || data.length === 0) {
    return (
      <Box textAlign="center" py={2}>
        <Typography variant="caption" color="textSecondary">
          No forecast data
        </Typography>
      </Box>
    );
  }

  const trend = data[data.length - 1].value > data[0].value ? 'up' : 'down';
  const trendPercent = ((data[data.length - 1].value - data[0].value) / data[0].value * 100).toFixed(1);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="caption" fontWeight="bold">
          {title}
        </Typography>
        <Chip
          icon={trend === 'up' ? <TrendingUp /> : <TrendingDown />}
          label={`${trend === 'up' ? '+' : ''}${trendPercent}%`}
          size="small"
          color={trend === 'up' ? 'success' : 'error'}
        />
      </Box>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ fontSize: '12px' }}
            formatter={(value) => [value.toLocaleString(), 'Forecast']}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={trend === 'up' ? '#4caf50' : '#f44336'} 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default QuickForecastWidget;
