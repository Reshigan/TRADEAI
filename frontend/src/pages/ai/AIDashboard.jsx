/**
 * AI Dashboard Page
 * Comprehensive AI/ML insights and predictions dashboard
 * Feature 7.2: AI Dashboard Widgets Integration
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  Chip
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  People,
  AttachMoney,
  NotificationsActive,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import {
  AIDemandForecastWidget,
  AIPriceOptimizationWidget,
  AICustomerSegmentationWidget,
  AIAnomalyDetectionWidget,
  AIModelHealthWidget,
  AIFeaturesOverview
} from '../../components/ai-widgets';

const AIDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="/dashboard">
          Home
        </Link>
        <Typography color="text.primary">AI Dashboard</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Psychology color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight="bold">
              AI Intelligence Dashboard
            </Typography>
            <Chip label="Beta" color="primary" size="small" />
          </Box>
          <Typography variant="body2" color="textSecondary">
            Real-time AI/ML insights, predictions, and automated analytics
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<DashboardIcon />} label="Overview" />
          <Tab icon={<TrendingUp />} label="Forecasting" />
          <Tab icon={<AttachMoney />} label="Optimization" />
          <Tab icon={<People />} label="Customer Insights" />
          <Tab icon={<NotificationsActive />} label="Anomalies" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* AI Features Status Overview */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <AIFeaturesOverview />
            </Paper>
          </Grid>

          {/* Model Health */}
          <Grid item xs={12} lg={8}>
            <AIModelHealthWidget />
          </Grid>

          {/* Anomaly Detection */}
          <Grid item xs={12} lg={6}>
            <AIAnomalyDetectionWidget scope="all" />
          </Grid>

          {/* Demand Forecast */}
          <Grid item xs={12} lg={6}>
            <AIDemandForecastWidget days={7} />
          </Grid>

          {/* Customer Segmentation */}
          <Grid item xs={12} lg={6}>
            <AICustomerSegmentationWidget />
          </Grid>

          {/* Price Optimization */}
          <Grid item xs={12} lg={6}>
            <AIPriceOptimizationWidget currentPrice={25.99} />
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Demand Forecasting & Predictions
              </Typography>
              <Typography variant="body2" color="textSecondary">
                AI-powered demand predictions for products and customers
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={6}>
            <AIDemandForecastWidget days={7} />
          </Grid>

          <Grid item xs={12} lg={6}>
            <AIDemandForecastWidget days={30} />
          </Grid>

          <Grid item xs={12}>
            <AIModelHealthWidget />
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Price Optimization & Revenue Management
              </Typography>
              <Typography variant="body2" color="textSecondary">
                AI-driven pricing recommendations for maximum profitability
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={6}>
            <AIPriceOptimizationWidget productId="prod-001" currentPrice={25.99} />
          </Grid>

          <Grid item xs={12} lg={6}>
            <AIPriceOptimizationWidget productId="prod-002" currentPrice={42.50} />
          </Grid>

          <Grid item xs={12}>
            <AIModelHealthWidget />
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Customer Intelligence & Segmentation
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ML-powered customer insights and behavior analysis
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <AICustomerSegmentationWidget />
          </Grid>

          <Grid item xs={12}>
            <AIModelHealthWidget />
          </Grid>
        </Grid>
      )}

      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Anomaly Detection & Alerts
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Real-time detection of unusual patterns and outliers
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={8}>
            <AIAnomalyDetectionWidget scope="all" />
          </Grid>

          <Grid item xs={12} lg={4}>
            <AIModelHealthWidget />
          </Grid>
        </Grid>
      )}

      {/* Footer Info */}
      <Box mt={4} p={2} bgcolor="grey.50" borderRadius={2}>
        <Typography variant="caption" color="textSecondary" display="block">
          <strong>Note:</strong> All AI predictions are generated using machine learning models trained on historical data. 
          Confidence scores indicate the reliability of predictions. The system operates in degraded mode with simulated 
          data when ML models are not available.
        </Typography>
      </Box>
    </Container>
  );
};

export default AIDashboard;
