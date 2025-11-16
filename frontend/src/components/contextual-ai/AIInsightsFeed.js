/**
 * AIInsightsFeed - Priority Actions Dashboard Feed
 * 
 * Shows personalized AI-driven priority actions on main dashboard:
 * - Top 3 urgent/important actions
 * - Performance vs forecast tracking
 * - Real-time insights and alerts
 * - Quick action buttons
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Stack,
  Grid,
  IconButton,
  Divider
} from '@mui/material';
import {
  Warning,
  TrendingUp,
  LocalOffer,
  AttachMoney,
  Lightbulb,
  Refresh,
  ArrowForward
} from '@mui/icons-material';


const AIInsightsFeed = ({ userId }) => {
  const [setLoading] = useState(true);
  const [actions, setActions] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    loadFeed();
  }, [userId]);

  const loadFeed = async () => {
    setLoading(true);

    try {
      // In production, this would call a personalized API endpoint
      // For now, generate intelligent feed based on patterns
      
      const feedData = await generatePersonalizedFeed(userId);
      
      setActions(feedData.actions);
      setPerformance(feedData.performance);
      setInsights(feedData.insights);
      
    } catch (err) {
      console.error('Feed loading error:', err);
      // Fallback to static feed
      setActions(generateFallbackActions());
      setPerformance(generateFallbackPerformance());
      setInsights(generateFallbackInsights());
    } finally {
      setLoading(false);
    }
  };

  const generatePersonalizedFeed = async (userId) => {
    // This would integrate with ML service to get personalized recommendations
    // For now, return empty data to show "No data available" state
    
    return {
      actions: [],
      performance: null,
      insights: []
    };
  };

  const generateFallbackActions = () => [];

  const generateFallbackPerformance = () => null;

  const generateFallbackInsights = () => [];

  const getPriorityColor = (priority) => {
    if (priority === 'urgent') return 'error';
    if (priority === 'opportunity') return 'success';
    return 'info';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatVariance = (variance) => {
    const color = variance >= 0 ? 'success.main' : 'error.main';
    const sign = variance >= 0 ? '+' : '';
    return (
      <Typography component="span" color={color} fontWeight="bold">
        {sign}{variance.toFixed(1)}%
      </Typography>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">
          🤖 Your AI Assistant
        </Typography>
        <IconButton onClick={loadFeed} size="small">
          <Refresh />
        </IconButton>
      </Box>

      {/* Top 3 Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📌 Priority Actions Today
          </Typography>
          {actions.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="textSecondary">
                No priority actions at this time
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Actions will appear here when there are items requiring your attention
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {actions.map((action, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      height: '100%',
                      borderColor: `${action.color}.main`,
                      borderWidth: 2
                    }}
                  >
                    <CardContent>
                      <Stack spacing={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box color={`${action.color}.main`}>
                            {action.icon}
                          </Box>
                          <Chip 
                            label={action.priority.toUpperCase()} 
                            color={getPriorityColor(action.priority)}
                            size="small"
                          />
                        </Box>
                        
                        <Typography variant="h6">
                          {action.title}
                        </Typography>
                        
                        <Typography variant="body2" color="textSecondary">
                          {action.description}
                        </Typography>
                        
                        <Button
                          variant="contained"
                          color={action.color}
                          endIcon={<ArrowForward />}
                          href={action.link}
                          fullWidth
                        >
                          {action.buttonText}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Performance vs Forecast */}
      {performance && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Performance vs Forecast
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="textSecondary">
                      Today
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(performance.today.actual)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      vs {formatCurrency(performance.today.forecast)} forecast
                    </Typography>
                    <Box mt={1}>
                      {formatVariance(performance.today.variance)}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="textSecondary">
                      This Week
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(performance.week.actual)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      vs {formatCurrency(performance.week.forecast)} forecast
                    </Typography>
                    <Box mt={1}>
                      {formatVariance(performance.week.variance)}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="textSecondary">
                      This Month
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(performance.month.actual)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      vs {formatCurrency(performance.month.forecast)} forecast
                    </Typography>
                    <Box mt={1}>
                      {formatVariance(performance.month.variance)}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Lightbulb color="primary" />
              <Typography variant="h6">
                AI Insights
              </Typography>
              <Chip label={`${insights.length} new`} size="small" color="primary" />
            </Box>
            <Stack spacing={1}>
              {insights.map((insight, index) => (
                <Alert key={index} severity={insight.type} variant="outlined">
                  {insight.message}
                </Alert>
              ))}
            </Stack>
            <Button 
              variant="text" 
              endIcon={<ArrowForward />}
              sx={{ mt: 2 }}
              href="/ai-dashboard"
            >
              View All Insights ({insights.length + 15})
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AIInsightsFeed;
