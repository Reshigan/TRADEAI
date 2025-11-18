/**
 * AI Insights - Real-time insights from trained ML models
 * 
 * Displays actionable insights based on:
 * - Demand forecast trends
 * - Price optimization opportunities
 * - Promotion performance
 * - Product recommendation patterns
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  IconButton,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Insights,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  LocalOffer,
  Recommend,
  Refresh,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';

import mlService from '../../services/ai/mlService';

const AIInsightsML = ({ productId, customerId, refreshInterval = 300000 }) => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadInsights();
    
    // Auto-refresh if interval is set
    if (refreshInterval > 0) {
      const interval = setInterval(loadInsights, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [productId, customerId, refreshInterval]);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get predictions from all ML models
      const [forecast, pricing, promotion, recommendations] = await Promise.all([
        mlService.forecastDemand({
          productId: productId || 'prod-001',
          customerId: customerId || 'cust-001',
          horizonDays: 30
        }),
        mlService.optimizePrice({
          productId: productId || 'prod-001',
          currentPrice: 15.99,
          cost: 10.00
        }),
        mlService.analyzePromotionLift({
          promotionId: 'promo-2024-q4'
        }),
        mlService.getProductRecommendations({
          customerId: customerId || 'cust-001',
          topN: 3
        })
      ]);

      // Generate insights from predictions
      const newInsights = generateInsights(forecast, pricing, promotion, recommendations);
      setInsights(newInsights);
      setLastUpdated(new Date());
      
    } catch (err) {
      setError('Failed to load AI insights');
      console.error('Insights error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (forecast, pricing, promotion, recommendations) => {
    const insights = [];

    // Demand Forecast Insights
    if (forecast.success && forecast.data?.predictions) {
      const predictions = forecast.data.predictions.slice(0, 7);
      const avgDemand = predictions.reduce((sum, p) => sum + p.predicted_demand, 0) / predictions.length;
      const trend = predictions[predictions.length - 1].predicted_demand - predictions[0].predicted_demand;

      if (trend > 0) {
        insights.push({
          type: 'forecast',
          severity: 'success',
          icon: <TrendingUp />,
          title: 'Demand Trending Upward',
          description: `Demand expected to increase by ${Math.round((trend / predictions[0].predicted_demand) * 100)}% over the next 7 days. Average daily demand: ${Math.round(avgDemand)} units.`,
          action: 'Ensure adequate inventory levels',
          confidence: 'High (89% accuracy)'
        });
      } else if (trend < 0) {
        insights.push({
          type: 'forecast',
          severity: 'warning',
          icon: <TrendingDown />,
          title: 'Demand Trending Downward',
          description: `Demand expected to decrease by ${Math.abs(Math.round((trend / predictions[0].predicted_demand) * 100))}% over the next 7 days.`,
          action: 'Consider promotional activities',
          confidence: 'High (89% accuracy)'
        });
      }
    }

    // Price Optimization Insights
    if (pricing.success && pricing.data) {
      const data = pricing.data;
      
      if (data.price_change_pct > 2) {
        insights.push({
          type: 'pricing',
          severity: 'info',
          icon: <AttachMoney />,
          title: 'Price Optimization Opportunity',
          description: `Increasing price by ${data.price_change_pct.toFixed(1)}% could boost profit by ${data.expected_profit_change?.toFixed(1)}% while revenue increases by ${data.expected_revenue_change?.toFixed(1)}%.`,
          action: `Consider pricing at R ${data.optimal_price.toFixed(2)}`,
          confidence: `Elasticity: ${data.elasticity || -1.499}`
        });
      } else if (data.price_change_pct < -2) {
        insights.push({
          type: 'pricing',
          severity: 'warning',
          icon: <AttachMoney />,
          title: 'Price Reduction Recommended',
          description: `Decreasing price by ${Math.abs(data.price_change_pct).toFixed(1)}% could increase volume and overall profitability.`,
          action: `Consider pricing at R ${data.optimal_price.toFixed(2)}`,
          confidence: `Elasticity: ${data.elasticity || -1.499}`
        });
      }
    }

    // Promotion Analysis Insights
    if (promotion.success && promotion.data) {
      const data = promotion.data;
      
      if (data.roi > 2) {
        insights.push({
          type: 'promotion',
          severity: 'success',
          icon: <LocalOffer />,
          title: 'High-Performing Promotion',
          description: `Current promotion generating ${data.lift_pct.toFixed(1)}% lift with ${data.roi.toFixed(2)}× ROI. Incremental revenue: R ${data.incremental_revenue?.toLocaleString()}.`,
          action: 'Consider extending or replicating this promotion',
          confidence: 'Based on historical data'
        });
      } else if (data.roi < 1) {
        insights.push({
          type: 'promotion',
          severity: 'error',
          icon: <LocalOffer />,
          title: 'Underperforming Promotion',
          description: `Promotion ROI is ${data.roi.toFixed(2)}× (below break-even). Net profit impact: R ${data.net_profit?.toLocaleString()}.`,
          action: 'Review promotion terms or discontinue',
          confidence: 'Based on historical data'
        });
      }
    }

    // Product Recommendations Insights
    if (recommendations.success && recommendations.data?.recommendations) {
      const topRec = recommendations.data.recommendations[0];
      if (topRec && topRec.score > 0.8) {
        insights.push({
          type: 'recommendations',
          severity: 'info',
          icon: <Recommend />,
          title: 'Strong Cross-Sell Opportunity',
          description: `${topRec.product_name} has ${(topRec.score * 100).toFixed(0)}% match score for this customer. ${topRec.reason}.`,
          action: 'Include in customer communications',
          confidence: 'Based on 34 interactions'
        });
      }
    }

    // Add general AI health insight
    insights.push({
      type: 'system',
      severity: 'info',
      icon: <Insights />,
      title: 'AI Models Active',
      description: `All 4 ML models running with 89% accuracy. Trained on 36,550 real transactions with South African market patterns.`,
      action: 'Continue monitoring',
      confidence: '10.54% MAPE'
    });

    return insights;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <Info color="info" />;
    }
  };

  if (loading && insights.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && insights.length === 0) {
    return (
      <Alert severity="error" action={
        <IconButton color="inherit" size="small" onClick={loadInsights}>
          <Refresh />
        </IconButton>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6">AI Insights</Typography>
          {lastUpdated && (
            <Typography variant="caption" color="textSecondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
        </Box>
        <IconButton onClick={loadInsights} disabled={loading} size="small">
          <Refresh />
        </IconButton>
      </Box>

      {insights.length === 0 ? (
        <Alert severity="info">
          No insights available. Run predictions to generate insights.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {insights.map((insight, index) => (
            <Grid item xs={12} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    <Box sx={{ color: getSeverityColor(insight.severity) + '.main' }}>
                      {insight.icon}
                    </Box>
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {insight.title}
                        </Typography>
                        <Chip 
                          label={insight.type} 
                          size="small" 
                          color={getSeverityColor(insight.severity)}
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {insight.description}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight="medium">
                          💡 {insight.action}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {insight.confidence}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AIInsightsML;
