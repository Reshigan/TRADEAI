import React, { useState, useEffect } from 'react';
import { Box, useTheme, CircularProgress, Typography } from '@mui/material';
import { 
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
import { formatCurrency } from '../../../utils/formatters';
import api from '../../../services/api';

const SalesPerformanceChart = ({ data: propData, height = 400 }) => {
  const theme = useTheme();
  const [data, setData] = useState(propData || []);
  const [loading, setLoading] = useState(!propData || propData.length === 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!propData || propData.length === 0) {
      fetchData();
    }
  }, [propData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/analytics/sales-performance');
      if (response.data.success && response.data.data) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load sales performance data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
        <Typography color="text.secondary">No sales data available</Typography>
      </Box>
    );
  }



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
