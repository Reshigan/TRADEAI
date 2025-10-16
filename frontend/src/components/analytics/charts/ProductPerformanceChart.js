import React from 'react';
import { Box, useTheme } from '@mui/material';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ZAxis,
  Label
} from 'recharts';
import { formatCurrency } from '../../../utils/formatters';

// No more mock data - using real API calls

const ProductPerformanceChart = ({ data = [], height = 400 }) => {
  // Group data by category
  const categories = [...new Set(data.map(item => item.category))];
  const dataByCategory = categories.map(category => ({
    name: category,
    data: data.filter(item => item.category === category)
  }));
  const theme = useTheme();

  // Colors for different categories
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7300'
  ];



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
            Category: {data.category}
          </p>
          <p style={{ margin: '5px 0' }}>
            Sales: {formatCurrency(data.sales)}
          </p>
          <p style={{ margin: '5px 0' }}>
            ROI: {data.roi}x
          </p>
          <p style={{ margin: '5px 0' }}>
            Volume: {data.volume.toLocaleString()} units
          </p>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis 
            type="number" 
            dataKey="roi" 
            name="ROI" 
            domain={[3, 8]}
          >
            <Label
              value="ROI (x)"
              position="bottom"
              offset={0}
              style={{ textAnchor: 'middle', fill: theme.palette.text.primary }}
            />
          </XAxis>
          <YAxis 
            type="number" 
            dataKey="sales" 
            name="Sales" 
            tickFormatter={(value) => formatCurrency(value)}
            width={80}
          >
            <Label
              value="Sales"
              position="left"
              angle={-90}
              offset={-10}
              style={{ textAnchor: 'middle', fill: theme.palette.text.primary }}
            />
          </YAxis>
          <ZAxis 
            type="number" 
            dataKey="volume" 
            range={[50, 500]} 
            name="Volume" 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {dataByCategory.map((category, index) => (
            <Scatter 
              key={category.name}
              name={category.name} 
              data={category.data} 
              fill={COLORS[index % COLORS.length]} 
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ProductPerformanceChart;