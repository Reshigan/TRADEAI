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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
import { AIChatbotFAB } from './common';
import { WalkthroughTour } from './training';
import { AIInsightsFeed } from './contextual-ai';
import {analyticsService} from '../services/api';
import {safeNumber, safeToFixed, formatPercentage} from '../utils/formatters';

const Dashboard = ({ user }) => {
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showWalkthroughSnackbar, setShowWalkthroughSnackbar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    summary: null,
    monthlySpend: [],
    topCustomers: [],
    categoryPerformance: [],
    pendingApprovals: [],
    forecast: null
  });

  const [error, setError] = useState(null);
  


  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard analytics
        const response = await analyticsService.getDashboard();

        if (response.success) {
          setDashboardData(response.data);
        } else {
          throw new Error('Failed to fetch dashboard data');
        }

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
      {/* AI Assistant with Ollama */}
      <AIChatbotFAB pageContext="dashboard" contextData={dashboardData} />
      
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
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
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
          {/* AI Insights Feed */}
          <Box sx={{ mb: 4 }}>
            <AIInsightsFeed userId={user?.id} />
          </Box>

          {/* KPI Cards */}
          <Grid container spacing={3} sx={{ mb: 4, mt: 1 }}>
            {dashboardData.summary && [
              {
                title: 'Total Budget',
                value: `${dashboardData.summary.currencySymbol}${safeToFixed(safeNumber(dashboardData.summary.totalBudget) / 1000000, 1)}M`,
                icon: <AttachMoney color="primary" />,
                change: '+12%',
                trend: 'up'
              },
              {
                title: 'Active Promotions',
                value: safeNumber(dashboardData.summary.activePromotions, 0).toString(),
                icon: <LocalOffer color="secondary" />,
                change: `+${safeNumber(dashboardData.summary.activePromotions, 0)}`,
                trend: 'up'
              },
              {
                title: 'Customers',
                value: safeNumber(dashboardData.summary.totalCustomers, 0).toString(),
                icon: <ShoppingCart color="success" />,
                change: '0',
                trend: 'neutral'
              },
              {
                title: 'Budget Utilization',
                value: formatPercentage(dashboardData.summary.budgetUtilization, 0),
                icon: <Assessment color="warning" />,
                change: '+8%',
                trend: 'up'
              }
            ].map((kpi, index) => (
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
              {dashboardData.summary ? (
                <Box sx={{ my: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {dashboardData.summary.currencySymbol}{safeToFixed(safeNumber(dashboardData.summary.totalUsed) / 1000000, 1)}M Used
                    </Typography>
                    <Typography variant="body2">
                      {dashboardData.summary.currencySymbol}{safeToFixed(safeNumber(dashboardData.summary.totalBudget) / 1000000, 1)}M Total
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={safeNumber(dashboardData.summary.budgetUtilization, 0)} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Allocated
                      </Typography>
                      <Typography variant="h6">
                        {dashboardData.summary.currencySymbol}{safeToFixed(safeNumber(dashboardData.summary.totalUsed) / 1000000, 1)}M
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Remaining
                      </Typography>
                      <Typography variant="h6">
                        {dashboardData.summary.currencySymbol}{safeToFixed((safeNumber(dashboardData.summary.totalBudget) - safeNumber(dashboardData.summary.totalUsed)) / 1000000, 1)}M
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        % Used
                      </Typography>
                      <Typography variant="h6">
                        {formatPercentage(dashboardData.summary.budgetUtilization, 0)}
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
              {dashboardData.forecast?.recommendation || 'Based on current spending patterns, you are projected to exceed your budget by 8% before year end.'}
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
        
          {/* Top Customers */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Top Customers
                </Typography>
                <Button size="small" variant="outlined">
                  View All
                </Button>
              </Box>
              {dashboardData.topCustomers && dashboardData.topCustomers.length > 0 ? (
                <Grid container spacing={2}>
                  {dashboardData.topCustomers.slice(0, 4).map((customer, index) => (
                    <Grid item xs={12} sm={6} md={3} key={customer.id || index}>
                      <Card variant="outlined">
                        <CardHeader
                          title={customer.name}
                          subheader={`${customer.totalSpend ? `${dashboardData.summary?.currencySymbol || '$'}${customer.totalSpend.toLocaleString()}` : 'No spend data'}`}
                          titleTypographyProps={{ variant: 'subtitle1' }}
                          subheaderTypographyProps={{ variant: 'body2' }}
                          action={
                            <Chip 
                              label={customer.tier || 'Standard'} 
                              size="small"
                              color={customer.tier === 'Premium' ? 'success' : 'default'}
                            />
                          }
                        />
                        <Divider />
                        <CardContent sx={{ pt: 1 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Active Promotions: {customer.activePromotions || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Last Activity: {customer.lastActivity ? new Date(customer.lastActivity).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No customer data available
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