import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ChartIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../../services/api/apiClient';

const PromotionPerformance = ({ promotionId, promotion }) => {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPerformance();
  }, [promotionId]);

  const loadPerformance = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/promotions/${promotionId}/performance`);
      setPerformance(response.data.data || response.data || null);
    } catch (error) {
      console.error('Error loading performance:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load performance data');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'R 0.00';
    return 'R ' + value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0.0%';
    return value.toFixed(1) + '%';
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return '0';
    return value.toLocaleString('en-ZA');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const perfData = performance || {
    totalRevenue: 0,
    baselineRevenue: 0,
    incrementalRevenue: 0,
    totalCost: 0,
    roi: 0,
    unitsSold: 0,
    baselineUnits: 0,
    lift: 0,
    redemptionRate: 0
  };

  const isPositiveROI = perfData.roi > 0;
  const isPositiveLift = perfData.lift > 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Performance Metrics</Typography>
        {promotion.status === 'active' || promotion.status === 'completed' ? (
          <Chip 
            label={promotion.status === 'active' ? 'Live Data' : 'Final Results'} 
            color={promotion.status === 'active' ? 'success' : 'default'}
            size="small"
          />
        ) : (
          <Chip label="No Data Yet" size="small" variant="outlined" />
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ChartIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography color="text.secondary" variant="body2">
                  Total Revenue
                </Typography>
              </Box>
              <Typography variant="h5">
                {formatCurrency(perfData.totalRevenue)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Baseline: {formatCurrency(perfData.baselineRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {isPositiveROI ? (
                  <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
                ) : (
                  <TrendingDownIcon sx={{ mr: 1, color: 'error.main' }} />
                )}
                <Typography color="text.secondary" variant="body2">
                  Incremental Revenue
                </Typography>
              </Box>
              <Typography variant="h5" color={isPositiveROI ? 'success.main' : 'error.main'}>
                {formatCurrency(perfData.incrementalRevenue)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cost: {formatCurrency(perfData.totalCost)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                ROI
              </Typography>
              <Typography variant="h5" color={isPositiveROI ? 'success.main' : 'error.main'}>
                {formatPercentage(perfData.roi)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isPositiveROI ? 'Profitable' : 'Loss'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Units Sold
              </Typography>
              <Typography variant="h5">
                {formatNumber(perfData.unitsSold)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Baseline: {formatNumber(perfData.baselineUnits)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Lift
              </Typography>
              <Typography variant="h5" color={isPositiveLift ? 'success.main' : 'text.primary'}>
                {formatPercentage(perfData.lift)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                vs. baseline
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Redemption Rate
              </Typography>
              <Typography variant="h5">
                {formatPercentage(perfData.redemptionRate)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Efficiency
              </Typography>
              <Typography variant="h5">
                {perfData.totalCost > 0 
                  ? formatCurrency(perfData.incrementalRevenue / perfData.totalCost)
                  : 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Revenue per R1 spent
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {!performance && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Performance data will be available once the promotion is active
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PromotionPerformance;
