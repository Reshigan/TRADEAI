/**
 * AI Price Optimization Widget
 * Shows optimal pricing recommendations with predicted impact
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Grid,
  Divider
} from '@mui/material';
import {
  AttachMoney,
  Refresh,
  TrendingUp,
  CheckCircle,
  InfoOutlined
} from '@mui/icons-material';
import axios from 'axios';

const AIPriceOptimizationWidget = ({ productId = 'SAMPLE-PROD', currentPrice = 25.99 }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [optimization, setOptimization] = useState(null);

  useEffect(() => {
    if (productId && currentPrice) {
      fetchOptimization();
    }
  }, [productId, currentPrice]);

  const fetchOptimization = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/ai/optimize/price`,
        {
          productId,
          currentPrice,
          cost: currentPrice * 0.6,  // Assume 40% margin
          constraints: {
            min_price: currentPrice * 0.8,
            max_price: currentPrice * 1.3
          },
          optimizationObjective: 'profit'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Transform ML service response to widget format
      const data = response.data;
      const transformedOptimization = {
        productId: data.product_id,
        currentPrice: data.current_price,
        optimizedPrice: data.optimal_price,
        priceChangePct: data.price_change_pct,
        expectedImpact: data.expected_impact,
        confidence: data.confidence * 100,  // Convert to percentage
        modelVersion: data.model_version,
        timestamp: data.timestamp
      };

      setOptimization(transformedOptimization);
    } catch (err) {
      console.error('Optimization error:', err);
      setError(err.response?.data?.message || 'Failed to load optimization');
    } finally {
      setLoading(false);
    }
  };

  const calculatePriceChange = () => {
    if (!optimization) return null;
    const change = optimization.priceChangePct || ((optimization.optimizedPrice - currentPrice) / currentPrice) * 100;
    return {
      direction: change >= 0 ? 'increase' : 'decrease',
      percentage: Math.abs(change).toFixed(1)
    };
  };

  const priceChange = calculatePriceChange();

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        avatar={<AttachMoney color="success" />}
        title="AI Price Optimization"
        subheader="Revenue & profit optimization"
        action={
          <Tooltip title="Refresh optimization">
            <IconButton onClick={fetchOptimization} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        {optimization && (
          <>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={6}>
                <Box
                  p={2}
                  borderRadius={2}
                  bgcolor="grey.50"
                  textAlign="center"
                >
                  <Typography variant="caption" color="textSecondary">
                    Current Price
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ${currentPrice?.toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  p={2}
                  borderRadius={2}
                  bgcolor="success.50"
                  textAlign="center"
                  border={2}
                  borderColor="success.main"
                >
                  <Typography variant="caption" color="textSecondary">
                    Optimal Price
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    ${optimization.optimizedPrice?.toFixed(2)}
                  </Typography>
                  {priceChange && (
                    <Chip
                      label={`${priceChange.direction === 'increase' ? '+' : '-'}${priceChange.percentage}%`}
                      size="small"
                      color={priceChange.direction === 'increase' ? 'success' : 'warning'}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              </Grid>
            </Grid>

            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              <Chip
                icon={<CheckCircle />}
                label={`Confidence: ${optimization.confidence}%`}
                color={optimization.confidence >= 80 ? 'success' : 'primary'}
                size="small"
              />
              {optimization.status === 'degraded' && (
                <Chip
                  icon={<InfoOutlined />}
                  label="Simulated Data"
                  color="warning"
                  size="small"
                />
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="textSecondary" gutterBottom>
              <strong>Predicted Impact:</strong>
            </Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    +{optimization.revenueImpact}%
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Revenue
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    +{optimization.profitImpact}%
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Profit
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    {optimization.demandImpact}%
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Demand
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>Recommendations:</strong>
              </Typography>
              {optimization.recommendations?.map((rec, idx) => (
                <Typography key={idx} variant="caption" display="block" sx={{ ml: 2, mb: 0.5 }}>
                  • {rec}
                </Typography>
              ))}
            </Box>

            <Box mt={2}>
              <Button
                variant="contained"
                color="success"
                fullWidth
                startIcon={<TrendingUp />}
              >
                Apply Optimal Price
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AIPriceOptimizationWidget;
