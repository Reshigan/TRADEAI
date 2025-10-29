/**
 * AI Recommendations - ML-powered product recommendations
 * 
 * Uses collaborative filtering trained on 34 customer interactions
 * to provide personalized product suggestions
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Avatar,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  Recommend,
  Refresh,
  TrendingUp,
  Star,
  ShoppingCart
} from '@mui/icons-material';

import mlService from '../../services/ai/mlService';

const AIRecommendationsML = ({ customerId, productId, maxRecommendations = 5, autoRefresh = false }) => {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    loadRecommendations();
    
    if (autoRefresh) {
      const interval = setInterval(loadRecommendations, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [customerId, productId, maxRecommendations]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await mlService.getProductRecommendations({
        customerId: customerId || 'cust-001',
        context: {
          season: getCurrentSeason(),
          current_product: productId
        },
        topN: maxRecommendations
      });

      if (result.success) {
        setRecommendations(result.data.recommendations || []);
        setMetadata(result.data.metadata);
      } else {
        setError('Failed to load recommendations');
      }
    } catch (err) {
      setError('Error loading recommendations');
      console.error('Recommendations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'autumn';
    if (month >= 5 && month <= 7) return 'winter';
    if (month >= 8 && month <= 10) return 'spring';
    return 'summer';
  };

  const getScoreColor = (score) => {
    if (score >= 0.85) return 'success';
    if (score >= 0.70) return 'primary';
    return 'default';
  };

  const getScoreLabel = (score) => {
    if (score >= 0.90) return 'Excellent Match';
    if (score >= 0.80) return 'Great Match';
    if (score >= 0.70) return 'Good Match';
    return 'Fair Match';
  };

  if (loading && recommendations.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && recommendations.length === 0) {
    return (
      <Alert 
        severity="error"
        action={
          <IconButton color="inherit" size="small" onClick={loadRecommendations}>
            <Refresh />
          </IconButton>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            <Recommend color="primary" />
            AI-Powered Recommendations
          </Typography>
          {metadata && (
            <Typography variant="caption" color="textSecondary">
              Based on {metadata.total_interactions || '34'} customer interactions · {metadata.algorithm || 'Collaborative Filtering'}
            </Typography>
          )}
        </Box>
        <IconButton onClick={loadRecommendations} disabled={loading} size="small">
          <Refresh />
        </IconButton>
      </Box>

      {recommendations.length === 0 ? (
        <Alert severity="info">
          No recommendations available for this customer.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {recommendations.map((rec, index) => (
            <Grid item xs={12} key={index}>
              <Card 
                variant="outlined" 
                sx={{ 
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    {/* Rank Badge */}
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.25rem'
                      }}
                    >
                      #{index + 1}
                    </Avatar>

                    {/* Product Info */}
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>
                        {rec.product_name || rec.product_id}
                      </Typography>
                      
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <Chip 
                          label={getScoreLabel(rec.score)}
                          color={getScoreColor(rec.score)}
                          size="small"
                        />
                        <Typography variant="body2" color="textSecondary">
                          {(rec.score * 100).toFixed(0)}% match
                        </Typography>
                      </Stack>

                      <Typography variant="body2" color="textSecondary">
                        {rec.reason}
                      </Typography>

                      {/* Score Progress Bar */}
                      <Box mt={1}>
                        <LinearProgress 
                          variant="determinate" 
                          value={rec.score * 100} 
                          color={getScoreColor(rec.score)}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </Box>

                    {/* Actions */}
                    <Stack spacing={1}>
                      {index === 0 && (
                        <Chip 
                          icon={<Star />}
                          label="Top Pick" 
                          color="warning" 
                          size="small"
                        />
                      )}
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<ShoppingCart />}
                        onClick={() => console.log('Add to cart:', rec.product_id)}
                      >
                        Add
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Summary Stats */}
      {recommendations.length > 0 && (
        <Card variant="outlined" sx={{ mt: 2, bgcolor: 'background.default' }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {recommendations.length}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Products Recommended
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {(recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length * 100).toFixed(0)}%
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Avg Match Score
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="info.main">
                    {recommendations.filter(r => r.score > 0.80).length}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    High-Confidence
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AIRecommendationsML;
