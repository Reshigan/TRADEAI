import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Alert
} from '@mui/material';
import { TrendingUp, ShowChart, Assessment, Speed } from '@mui/icons-material';
import AIInsightCard from '../components/ai-insights/AIInsightCard';
import api from '../services/api';

const RealTimeDashboard = () => {
  const [insights, setInsights] = useState([]);
  const [metrics, setMetrics] = useState({
    revenue: 0,
    growth: 0,
    activePromotions: 0,
    customerEngagement: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [insightsRes, metricsRes] = await Promise.all([
        api.get('/api/ai/insights'),
        api.get('/api/dashboard/metrics')
      ]);

      setInsights(insightsRes.data.insights || []);
      setMetrics(metricsRes.data.metrics || metrics);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ icon, title, value, change, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" color={color}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {change && (
              <Chip 
                label={`${change > 0 ? '+' : ''}${change}%`}
                color={change > 0 ? 'success' : 'error'}
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
          <Box sx={{ fontSize: 48, color: `${color}.main`, opacity: 0.3 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Real-Time Intelligence Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-powered insights and live metrics at your fingertips
        </Typography>
      </Box>

      {/* Metrics Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<TrendingUp />}
            title="Revenue Today"
            value={`R ${metrics.revenue.toLocaleString()}`}
            change={metrics.growth}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<Assessment />}
            title="Active Promotions"
            value={metrics.activePromotions}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<ShowChart />}
            title="Customer Engagement"
            value={`${metrics.customerEngagement}%`}
            change={5.2}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<Speed />}
            title="System Status"
            value="Optimal"
            color="success"
          />
        </Grid>
      </Grid>

      {/* AI Insights Section */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">
            🤖 AI-Powered Insights
          </Typography>
          <Button variant="outlined" size="small">
            View All
          </Button>
        </Box>

        {loading ? (
          <Alert severity="info">Loading AI insights...</Alert>
        ) : insights.length > 0 ? (
          insights.slice(0, 5).map((insight, index) => (
            <AIInsightCard key={index} insight={insight} />
          ))
        ) : (
          <Alert severity="info">
            No new insights available. Check back soon!
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default RealTimeDashboard;
