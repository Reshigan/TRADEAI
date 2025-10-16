import React from 'react';
import { Box, useTheme, Divider } from '@mui/material';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '../../../utils/formatters';

// No more mock data - using real API calls

const TradeSpendTrendsChart = ({ data = [], height = 400 }) => {
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
      // Calculate total for the month
      const total = payload.reduce((sum, entry) => sum + entry.value, 0);
      
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
          <Divider sx={{ my: 1 }} />
          <p style={{ margin: 0, fontWeight: 'bold' }}>
            Total: {formatCurrency(total)}
          </p>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          stackOffset="expand"
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis dataKey="month" />
          <YAxis 
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="display" 
            name="Display" 
            stackId="1"
            stroke={theme.palette.primary.main} 
            fill={theme.palette.primary.main} 
          />
          <Area 
            type="monotone" 
            dataKey="listing" 
            name="Listing" 
            stackId="1"
            stroke={theme.palette.secondary.main} 
            fill={theme.palette.secondary.main} 
          />
          <Area 
            type="monotone" 
            dataKey="promotion" 
            name="Promotion" 
            stackId="1"
            stroke={theme.palette.success.main} 
            fill={theme.palette.success.main} 
          />
          <Area 
            type="monotone" 
            dataKey="discount" 
            name="Discount" 
            stackId="1"
            stroke={theme.palette.warning.main} 
            fill={theme.palette.warning.main} 
          />
          <Area 
            type="monotone" 
            dataKey="sampling" 
            name="Sampling" 
            stackId="1"
            stroke={theme.palette.error.main} 
            fill={theme.palette.error.main} 
          />
          <Area 
            type="monotone" 
            dataKey="advertising" 
            name="Advertising" 
            stackId="1"
            stroke={theme.palette.info.main} 
            fill={theme.palette.info.main} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default TradeSpendTrendsChart;