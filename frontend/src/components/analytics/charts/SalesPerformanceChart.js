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
  Line,
  ComposedChart
} from 'recharts';

// No more mock data - using real API calls

const SalesPerformanceChart = ({ data = [], height = 400 }) => {
  const theme = useTheme();

  // Format currency for tooltip - South African Rand
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
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
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '5px 0', color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis dataKey="month" />
          <YAxis 
            tickFormatter={(value) => formatCurrency(value)}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="sales" 
            name="Sales" 
            fill={theme.palette.primary.main} 
            barSize={20} 
          />
          <Line 
            type="monotone" 
            dataKey="target" 
            name="Target" 
            stroke={theme.palette.error.main} 
            strokeWidth={2} 
            dot={{ r: 4 }} 
          />
          <Line 
            type="monotone" 
            dataKey="lastYear" 
            name="Last Year" 
            stroke={theme.palette.grey[500]} 
            strokeWidth={2} 
            strokeDasharray="5 5" 
            dot={{ r: 4 }} 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default SalesPerformanceChart;