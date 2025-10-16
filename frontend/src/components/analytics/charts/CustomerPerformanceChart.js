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
  LabelList
} from 'recharts';
import { formatCurrency } from '../../../utils/formatters';

// No more mock data - using real API calls

const CustomerPerformanceChart = ({ data = [], height = 400 }) => {
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
            Sales: {formatCurrency(payload[0].value)}
          </p>
          <p style={{ margin: '5px 0', color: payload[1].color }}>
            Trade Spend: {formatCurrency(payload[1].value)}
          </p>
          <p style={{ margin: '5px 0', fontWeight: 'bold' }}>
            ROI: {payload[0].payload.roi}x
          </p>
        </Box>
      );
    }
    return null;
  };

  // Custom label formatter
  const renderCustomizedLabel = (props) => {
    const { x, y, width, height, value } = props;
    const radius = 10;

    return (
      <g>
        <circle cx={x + width / 2} cy={y - radius} r={radius} fill={theme.palette.primary.main} />
        <text x={x + width / 2} y={y - radius} fill="#fff" textAnchor="middle" dominantBaseline="middle">
          {value}x
        </text>
      </g>
    );
  };

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis dataKey="name" />
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
            barSize={40}
          >
            <LabelList dataKey="roi" content={renderCustomizedLabel} />
          </Bar>
          <Bar 
            dataKey="spend" 
            name="Trade Spend" 
            fill={theme.palette.secondary.main} 
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default CustomerPerformanceChart;