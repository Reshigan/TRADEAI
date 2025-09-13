import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  LinearProgress,
  Chip,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  CalendarToday,
  ShoppingCart,
  LocalOffer,
  Assessment,
  Warning,
  CheckCircle,
  School as SchoolIcon
} from '@mui/icons-material';
import { AIAssistant } from './common';
import { WalkthroughTour } from './training';
import { analyticsService, budgetService, promotionService, customerService } from '../services/api';

const Dashboard = ({ user }) => {
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showWalkthroughSnackbar, setShowWalkthroughSnackbar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    budgetData: null,
    recentPromotions: [],
    pendingApprovals: [],
    kpis: []
  });
  const [error, setError] = useState(null);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch data from multiple endpoints
        const [analyticsData, budgetsData, promotionsData, customersData] = await Promise.allSettled([
          analyticsService.getSummary(),
          budgetService.getAll({ limit: 10 }),
          promotionService.getAll({ limit: 5, status: 'active' }),
          customerService.getAll({ limit: 10 })
        ]);

        // Process analytics data
        const analytics = analyticsData.status === 'fulfilled' ? analyticsData.value : null;
        
        // Process budget data
        const budgets = budgetsData.status === 'fulfilled' ? budgetsData.value : { data: [] };
        const budgetSummary = budgets.data.reduce((acc, budget) => ({
          total: acc.total + (budget.totalAmount || 0),
          allocated: acc.allocated + (budget.allocatedAmount || 0),
          remaining: acc.remaining + (budget.remainingAmount || 0)
        }), { total: 0, allocated: 0, remaining: 0 });
        budgetSummary.percentUsed = budgetSummary.total > 0 ? (budgetSummary.allocated / budgetSummary.total) * 100 : 0;

        // Process promotions data
        const promotions = promotionsData.status === 'fulfilled' ? promotionsData.value : { data: [] };
        
        // Process customers data
        const customers = customersData.status === 'fulfilled' ? customersData.value : { data: [] };

        // Create KPIs from real data
        const kpis = [
          { 
            title: 'Total Budget', 
            value: `$${(budgetSummary.total / 1000000).toFixed(1)}M`, 
            icon: <AttachMoney color="primary" />, 
            change: analytics?.budgetGrowth || '+0%', 
            trend: 'up' 
          },
          { 
            title: 'Active Promotions', 
            value: promotions.data.length.toString(), 
            icon: <LocalOffer color="secondary" />, 
            change: analytics?.promotionGrowth || '+0', 
            trend: 'up' 
          },
          { 
            title: 'Customers', 
            value: customers.data.length.toString(), 
            icon: <ShoppingCart color="success" />, 
            change: analytics?.customerGrowth || '0', 
            trend: 'neutral' 
          },
          { 
            title: 'Budget Utilization', 
            value: `${budgetSummary.percentUsed.toFixed(0)}%`, 
            icon: <Assessment color="warning" />, 
            change: analytics?.utilizationChange || '+0%', 
            trend: 'up' 
          }
        ];

        setDashboardData({
          budgetData: budgetSummary,
          recentPromotions: promotions.data || [],
          pendingApprovals: analytics?.pendingApprovals || [],
          kpis
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Check if this is the first login
  useEffect(() => {
    const walkthroughCompleted = localStorage.getItem('walkthroughCompleted');
    const firstLogin = localStorage.getItem('firstLogin');
    
    if (!walkthroughCompleted && !firstLogin) {
      // Set first login flag
      localStorage.setItem('firstLogin', 'true');
      // Show walkthrough snackbar
      setShowWalkthroughSnackbar(true);
    }
  }, []);
  
  const handleStartWalkthrough = () => {
    setShowWalkthrough(true);
    setShowWalkthroughSnackbar(false);
  };
  
  const handleCloseWalkthrough = () => {
    setShowWalkthrough(false);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* AI Assistant */}
      <AIAssistant context="dashboard" />
      
      {/* Walkthrough Tour */}
      <WalkthroughTour 
        open={showWalkthrough} 
        onClose={handleCloseWalkthrough} 
      />
      
      {/* Walkthrough Snackbar */}
      <Snackbar
        open={showWalkthroughSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={10000}
        onClose={() => setShowWalkthroughSnackbar(false)}
      >
        <Alert 
          severity="info" 
          icon={<SchoolIcon />}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleStartWalkthrough}
            >
              Start Tour
            </Button>
          }
          onClose={() => setShowWalkthroughSnackbar(false)}
        >
          Welcome to Trade AI Platform! Would you like to take a quick tour?
        </Alert>
      </Snackbar>
      
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name?.split(' ')[0] || 'User'}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Here's what's happening with your trade spend activities today.
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          startIcon={<SchoolIcon />}
          onClick={handleStartWalkthrough}
          variant="outlined"
          size="small"
        >
          Platform Tour
        </Button>
      </Box>
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* KPI Cards */}
          <Grid container spacing={3} sx={{ mb: 4, mt: 1 }}>
            {dashboardData.kpis.map((kpi, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card elevation={2}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: 'background.paper', mr: 2 }}>
                        {kpi.icon}
                      </Avatar>
                      <Typography variant="h6" component="div">
                        {kpi.title}
                      </Typography>
                    </Box>
                    <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                      {kpi.value}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {kpi.trend === 'up' ? (
                        <TrendingUp fontSize="small" color="success" />
                      ) : kpi.trend === 'down' ? (
                        <TrendingDown fontSize="small" color="error" />
                      ) : (
                        <span style={{ width: 24 }} />
                      )}
                      <Typography 
                        variant="body2" 
                        color={
                          kpi.trend === 'up' ? 'success.main' : 
                          kpi.trend === 'down' ? 'error.main' : 
                          'text.secondary'
                        }
                        sx={{ ml: 0.5 }}
                      >
                        {kpi.change} from last month
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
      </Grid>
      
      <Grid container spacing={4}>
          {/* Budget Overview */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Budget Overview (2025)
              </Typography>
              {dashboardData.budgetData ? (
                <Box sx={{ my: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      ${(dashboardData.budgetData.allocated / 1000000).toFixed(1)}M Used
                    </Typography>
                    <Typography variant="body2">
                      ${(dashboardData.budgetData.total / 1000000).toFixed(1)}M Total
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={dashboardData.budgetData.percentUsed} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Allocated
                      </Typography>
                      <Typography variant="h6">
                        ${(dashboardData.budgetData.allocated / 1000000).toFixed(1)}M
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Remaining
                      </Typography>
                      <Typography variant="h6">
                        ${(dashboardData.budgetData.remaining / 1000000).toFixed(1)}M
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        % Used
                      </Typography>
                      <Typography variant="h6">
                        {dashboardData.budgetData.percentUsed.toFixed(0)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No budget data available
                  </Typography>
                </Box>
              )}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1">
                Budget Forecast (AI Prediction)
              </Typography>
              <Chip 
                icon={<Assessment />} 
                label="View Details" 
                variant="outlined" 
                color="primary" 
                size="small"
                clickable
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Based on current spending patterns, you are projected to exceed your budget by 8% before year end.
            </Typography>
          </Paper>
        </Grid>
        
        {/* Pending Approvals */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Pending Approvals
              </Typography>
              <Button size="small" variant="outlined">
                View All
              </Button>
            </Box>
            {dashboardData.pendingApprovals.length > 0 ? (
              <List sx={{ width: '100%' }}>
                {dashboardData.pendingApprovals.map((item) => (
                  <React.Fragment key={item.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.light' }}>
                          <Warning />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2">
                            {item.type} - {item.customer}
                          </Typography>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography variant="body2" color="text.secondary">
                              ${(item.amount || 0).toLocaleString()} • Requested by {item.requestedBy} on {new Date(item.date).toLocaleDateString()}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="contained" color="primary">
                          Approve
                        </Button>
                        <Button size="small" variant="outlined" color="error">
                          Reject
                        </Button>
                      </Box>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="subtitle1">
                  No pending approvals
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All requests have been processed
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
          {/* Recent Promotions */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Recent Promotions
                </Typography>
                <Button size="small" variant="outlined">
                  View All
                </Button>
              </Box>
              {dashboardData.recentPromotions.length > 0 ? (
                <Grid container spacing={2}>
                  {dashboardData.recentPromotions.map((promotion) => (
                    <Grid item xs={12} sm={6} md={3} key={promotion._id || promotion.id}>
                      <Card variant="outlined">
                        <CardHeader
                          title={promotion.name}
                          subheader={promotion.customer?.name || promotion.customer}
                          titleTypographyProps={{ variant: 'subtitle1' }}
                          subheaderTypographyProps={{ variant: 'body2' }}
                          action={
                            <Chip 
                              label={promotion.status} 
                              size="small"
                              color={promotion.status === 'active' ? 'success' : 'default'}
                            />
                          }
                        />
                        <Divider />
                        <CardContent sx={{ pt: 1 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Budget: ${(promotion.budget || 0).toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(promotion.startDate).toLocaleDateString()} - {new Date(promotion.endDate).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No recent promotions found
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
        </>
      )}
    </Container>
  );
};

export default Dashboard;