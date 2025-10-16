import React from 'react';
import { Box, useTheme } from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { formatCurrency } from '../../../utils/formatters';

// No more mock data - using real API calls

const BudgetUtilizationChart = ({ data = [], height = 400 }) => {
  const theme = useTheme();

  // Colors for the pie chart
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.warning.main,
    theme.palette.success.light
  ];

  // Format currency for tooltip
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate total budget
  const totalBudget = data.reduce((sum, item) => sum + item.value, 0);

  // Calculate percentages
  const dataWithPercentage = data.map(item => ({
    ...item,
    percentage: ((item.value / totalBudget) * 100).toFixed(1)
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
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
          <p style={{ margin: 0, fontWeight: 'bold' }}>{data.name}</p>
          <p style={{ margin: '5px 0' }}>
            {formatCurrency(data.value)} ({data.percentage}%)
          </p>
        </Box>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = ({ payload }) => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        {payload.map((entry, index) => (
          <Box
            key={`legend-${index}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              mx: 2
            }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                backgroundColor: entry.color,
                mr: 1,
                borderRadius: '50%'
              }}
            />
            <Box>
              <Box component="span" sx={{ fontWeight: 'medium' }}>
                {entry.value}
              </Box>
              <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                {dataWithPercentage.find(item => item.name === entry.value).percentage}%
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithPercentage}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
          >
            {dataWithPercentage.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Box component="span" sx={{ fontWeight: 'bold' }}>
          Total Budget: {formatCurrency(totalBudget)}
        </Box>
      </Box>
    </Box>
  );
};

export default BudgetUtilizationChart;