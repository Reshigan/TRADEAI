import React, { useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Box, Typography } from '@mui/material';

// Default colors for consistency
const COLORS = ['#1E3A8A', '#2D7D9A', '#2e7d32', '#ed6c02', '#d32f2f', '#7b1fa2', '#9c27b0', '#5c6bc0'];

// Custom tooltip component
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box 
        sx={{ 
          bgcolor: 'background.paper', 
          p: 1.5, 
          borderRadius: 1, 
          boxShadow: 3,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600, 
            mb: 0.5,
            color: data.fill
          }}
        >
          {data.category}
        </Typography>
        <Typography variant="body2">
          R{data.amount?.toLocaleString() || '0'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {data.value}% of total
        </Typography>
      </Box>
    );
  }
  return null;
};

// Budget Distribution Component (Zero-Slop Law 3, 11, 24)
const BudgetDistribution = ({ data = [], height = 250 }) => {
  // Process data for pie chart
  const chartData = useMemo(() => {
    // Handle case where data is null, undefined, or empty
    if (!data || data.length === 0) {
      return [];
    }
    
    // Calculate total amount for percentage calculation
    const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Convert to chart format
    return data
      .filter(item => item.amount > 0) // Only show categories with values
      .map((item, index) => ({
        category: item.category || `Category ${index + 1}`,
        amount: item.amount || 0,
        value: totalAmount > 0 ? Math.round(((item.amount || 0) / totalAmount) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [data]);

  // Handle empty data state (Zero-Slop Law 3)
  if (!data || data.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No budget data available
        </Typography>
      </Box>
    );
  }

  // Handle case where all amounts are zero
  if (chartData.length === 0 || chartData.every(item => item.amount === 0)) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No spending data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height }}>
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="category"
            label={({ category, value }) => `${category}: ${value}%`}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          gap: 1, 
          mt: 1,
          maxHeight: 80,
          overflow: 'auto'
        }}
      >
        {chartData.map((entry, index) => (
          <Box 
            key={entry.category}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              minWidth: 120
            }}
          >
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: COLORS[index % COLORS.length] 
              }} 
            />
            <Typography variant="caption" noWrap>
              {entry.category} ({entry.value}%)
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

  return (
    <Box sx={{ height }}>
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="category"
            label={({ category, value }) => `${category}: ${value}%`}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          gap: 1, 
          mt: 1,
          maxHeight: 80,
          overflow: 'auto'
        }}
      >
        {chartData.map((entry, index) => (
          <Box 
            key={entry.category}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              minWidth: 120
            }}
          >
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: COLORS[index % COLORS.length] 
              }} 
            />
            <Typography variant="caption" noWrap>
              {entry.category} ({entry.value}%)
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default BudgetDistribution;