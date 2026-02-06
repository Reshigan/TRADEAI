import React, { useState, useEffect } from 'react';
import { Box, useTheme, CircularProgress, Typography } from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { formatCurrency } from '../../../utils/formatters';
import api from '../../../services/api';

const BudgetUtilizationChart = ({ data: propData, height = 400 }) => {
  const theme = useTheme();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Colors for the pie chart
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.warning.main,
    theme.palette.success.light,
    theme.palette.info.main,
    theme.palette.error.light
  ];

  useEffect(() => {
    if (propData && propData.length > 0) {
      setChartData(propData);
      setLoading(false);
    } else {
      fetchData();
    }
  }, [propData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/analytics/budget-utilization');
      if (response.data.success && response.data.data) {
        // Transform data for pie chart
        const budgets = response.data.data;
        const totalUsed = budgets.reduce((sum, b) => sum + (b.used || 0), 0);
        const totalRemaining = budgets.reduce((sum, b) => sum + (b.remaining || 0), 0);
        setChartData([
          { name: 'Used', value: totalUsed },
          { name: 'Remaining', value: totalRemaining }
        ]);
      }
    } catch (err) {
      console.error('Failed to load budget utilization data:', err);
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

  const data = chartData;

  // Calculate total budget
  const totalBudget = data.reduce((sum, item) => sum + (item.value || 0), 0);

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
