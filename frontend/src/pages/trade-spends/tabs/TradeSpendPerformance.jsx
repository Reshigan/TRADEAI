import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';
import apiClient from '../../../services/api/apiClient';

const TradeSpendPerformance = ({ tradeSpendId, tradeSpend }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tradeSpendId) loadData();
  }, [tradeSpendId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/trade-spends/${tradeSpendId}/performance`);
      setData(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Performance</Typography>
      <Typography variant="body2" color="text.secondary">Data will be displayed here</Typography>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </Paper>
  );
};

export default TradeSpendPerformance;
