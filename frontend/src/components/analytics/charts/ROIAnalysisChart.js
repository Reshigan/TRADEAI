import React from 'react';
import { Box, useTheme } from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { formatCurrency } from '../../../utils/formatters';

// No more mock data - using real API calls

const ROIAnalysisChart = ({ data = [], height = 400 }) => {
  const theme = useTheme();

  // Format currency for tooltip
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 1
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          <p style={{ margin: '5px 0', color: payload[0].color }}>
            Spend: {formatCurrency(payload[0].value)}
          </p>
          <p style={{ margin: '5px 0', color: payload[1].color }}>
            Revenue: {formatCurrency(payload[1].value)}
          </p>
          <p style={{ margin: '5px 0', fontWeight: 'bold' }}>
            ROI: {payload[1].payload.roi}x
          </p>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis dataKey="name" />
          <YAxis 
            yAxisId="left"
            orientation="left"
            tickFormatter={(value) => formatCurrency(value)}
            width={80}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => `${value}x`}
            domain={[0, 10]}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            yAxisId="left"
            dataKey="spend" 
            name="Spend" 
            fill={theme.palette.primary.light} 
            barSize={20} 
          />
          <Bar 
            yAxisId="left"
            dataKey="revenue" 
            name="Revenue" 
            fill={theme.palette.primary.main} 
            barSize={20} 
          />
          <ReferenceLine 
            yAxisId="right" 
            y={5} 
            stroke={theme.palette.error.main} 
            strokeDasharray="3 3" 
            label={{ 
              value: 'Target ROI: 5x', 
              position: 'insideBottomRight',
              fill: theme.palette.error.main,
              fontSize: 12
            }} 
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ROIAnalysisChart;