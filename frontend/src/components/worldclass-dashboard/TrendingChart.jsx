import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Box, Typography } from '@mui/material';

// Custom tooltip component for better UX (Zero-Slop Law 11, 14)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
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
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography 
            key={index} 
            variant="body2" 
            sx={{ 
              color: entry.color,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: entry.color 
              }} 
            />
            {entry.name}: {typeof entry.value === 'number' ? `R${entry.value.toLocaleString()}` : entry.value}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

// Trending Chart Component (Zero-Slop Law 11, 14)
const TrendingChart = ({ 
  data = [], 
  dataKeys = ['value'], 
  colors = ['#1E40AF'], 
  height = 300, 
  type = 'line',
  showGrid = true 
}) => {
  // Handle empty data state (Zero-Slop Law 3)
  if (!data || data.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  // Format Y-axis values
  const formatYAxis = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value;
  };

  // Chart configuration
  const chartProps = {
    data,
    margin: { top: 5, right: 30, left: 20, bottom: 5 }
  };

  // Render appropriate chart type
  const renderChart = () => {
    if (type === 'bar') {
      return (
        <BarChart {...chartProps}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />}
          <XAxis dataKey="name" />
          <YAxis tickFormatter={formatYAxis} />
          <Tooltip content={<CustomTooltip />} />
          {dataKeys.map((key, index) => (
            <Bar key={key} dataKey={key} fill={colors[index] || colors[0]}>
              {data.map((entry, entryIndex) => (
                <Cell 
                  key={`cell-${entryIndex}`} 
                  fill={colors[index] || colors[0]} 
                />
              ))}
            </Bar>
          ))}
        </BarChart>
      );
    }

    return (
      <LineChart {...chartProps}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />}
        <XAxis dataKey="month" />
        <YAxis tickFormatter={formatYAxis} />
        <Tooltip content={<CustomTooltip />} />
        {dataKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index] || colors[0]}
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      {renderChart()}
    </ResponsiveContainer>
  );
};

export default TrendingChart;