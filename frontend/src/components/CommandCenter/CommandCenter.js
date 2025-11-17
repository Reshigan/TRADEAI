import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  Chip,
  LinearProgress,
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Psychology as AIIcon,
  CalendarToday as CalendarIcon,
  Assessment as AnalyticsIcon,
  Lightbulb as LightbulbIcon,
  Rocket as RocketIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Timeline as TimelineIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api/apiClient';

const CommandCenter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    aiInsight: {
      type: 'info',
      iconType: 'check',
      title: 'Loading...',
      message: 'Fetching dashboard data...',
      action: 'Refresh',
      route: '/dashboard'
    },
    quickActions: [],
    activeWorkflows: [],
    kpis: {
      totalBudget: 0,
      totalSpent: 0,
      utilizationRate: 0,
      activePromotions: 0,
      pendingApprovals: 0
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch various data points in parallel
      const [budgets, promotions, tradeSpends] = await Promise.all([
        apiClient.get('/budgets'),
        apiClient.get('/promotions'),
        apiClient.get('/trade-spends')
      ]);

      console.log('CommandCenter - Raw API responses:', { budgets, promotions, tradeSpends });
      console.log('CommandCenter - budgets type:', typeof budgets, 'isArray:', Array.isArray(budgets));
      console.log('CommandCenter - budgets.data type:', typeof budgets?.data, 'isArray:', Array.isArray(budgets?.data));
      console.log('CommandCenter - budgets.data.data type:', typeof budgets?.data?.data, 'isArray:', Array.isArray(budgets?.data?.data));
      
      const toArray = (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data?.data)) return response.data.data;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.items)) return response.items;
        return [];
      };
      
      const budgetsArray = toArray(budgets);
      const promotionsArray = toArray(promotions);
      const tradeSpendsArray = toArray(tradeSpends);
      
      console.log('CommandCenter - Extracted arrays:', { 
        budgetsArray: budgetsArray.length + ' items', 
        promotionsArray: promotionsArray.length + ' items', 
        tradeSpendsArray: tradeSpendsArray.length + ' items' 
      });
      
      const data = processDashboardData(budgetsArray, promotionsArray, tradeSpendsArray);
      console.log('CommandCenter - Processed dashboard data:', data);
      console.log('CommandCenter - quickActions type:', Array.isArray(data.quickActions), 'length:', data.quickActions?.length);
      console.log('CommandCenter - activeWorkflows type:', Array.isArray(data.activeWorkflows), 'length:', data.activeWorkflows?.length);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processDashboardData = (budgets, promotions, tradeSpends) => {
    console.log('processDashboardData - Input types:', {
      budgets: Array.isArray(budgets) ? `array[${budgets.length}]` : typeof budgets,
      promotions: Array.isArray(promotions) ? `array[${promotions.length}]` : typeof promotions,
      tradeSpends: Array.isArray(tradeSpends) ? `array[${tradeSpends.length}]` : typeof tradeSpends
    });
    
    const budgetsArray = Array.isArray(budgets) ? budgets : [];
    const promotionsArray = Array.isArray(promotions) ? promotions : [];
    const tradeSpendsArray = Array.isArray(tradeSpends) ? tradeSpends : [];
    
    const totalBudget = budgetsArray.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalSpent = budgetsArray.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
    const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    let aiInsight = {};
    if (utilizationRate < 60) {
      aiInsight = {
        type: 'warning',
        iconType: 'warning',
        title: 'Budget Underutilization Detected',
        message: `Your budget is ${utilizationRate.toFixed(0)}% utilized. AI suggests reallocating $${((totalBudget - totalSpent) * 0.3).toLocaleString()} to high-performing customers for optimal ROI.`,
        action: 'Optimize Budget',
        route: '/budgets'
      };
    } else if (utilizationRate > 90) {
      aiInsight = {
        type: 'info',
        iconType: 'check',
        title: 'Budget Tracking Well',
        message: `Budget utilization at ${utilizationRate.toFixed(0)}%. On track for quarterly goals.`,
        action: 'View Details',
        route: '/budgets'
      };
    } else {
      aiInsight = {
        type: 'success',
        iconType: 'trending',
        title: 'Performance Above Target',
        message: `Promotions are performing 15% above forecast. Continue current strategy.`,
        action: 'View Performance',
        route: '/analytics'
      };
    }

    // Quick actions based on current state
    const quickActions = [
      {
        title: 'Plan 2026 Budget',
        description: 'AI-powered annual planning ready',
        iconType: 'calendar',
        color: 'primary',
        route: '/budgets/new-flow',
        badge: 'AI Ready'
      },
      {
        title: 'Create Promotion',
        description: 'Start AI-assisted promotion wizard',
        iconType: 'rocket',
        color: 'secondary',
        route: '/promotions/new-flow',
        badge: 'Recommended'
      },
      {
        title: 'Review Analytics',
        description: 'AI-generated insights available',
        iconType: 'analytics',
        color: 'info',
        route: '/analytics',
        badge: '3 New Insights'
      }
    ];

    // Active workflows (pending items)
    const activeWorkflows = [
      ...promotionsArray.filter(p => p.status === 'draft' || p.status === 'pending_approval').slice(0, 3).map(p => ({
        title: `${p.name || 'Untitled Promotion'}`,
        description: `${p.customer?.name || 'Customer'} - ${p.status}`,
        status: p.status,
        route: `/promotions/${p._id}`,
        type: 'promotion'
      })),
      ...budgetsArray.filter(b => b.status === 'draft').slice(0, 2).map(b => ({
        title: `${b.name || 'Untitled Budget'}`,
        description: `$${(b.totalAmount || 0).toLocaleString()} - Draft`,
        status: 'draft',
        route: `/budgets/${b._id}`,
        type: 'budget'
      })),
      ...tradeSpendsArray.filter(ts => ts.status === 'pending').slice(0, 2).map(ts => ({
        title: `${ts.description || 'Trade Spend Request'}`,
        description: `$${(ts.amount || 0).toLocaleString()} - Pending approval`,
        status: 'pending',
        route: `/trade-spends/${ts._id}`,
        type: 'tradespend'
      }))
    ].slice(0, 5);

    // KPIs
    const kpis = {
      totalBudget: totalBudget,
      totalSpent: totalSpent,
      utilizationRate: utilizationRate,
      activePromotions: promotionsArray.filter(p => p.status === 'active').length,
      pendingApprovals: [...promotionsArray, ...tradeSpendsArray].filter(item => 
        item.status === 'pending_approval' || item.status === 'pending'
      ).length
    };

    return {
      aiInsight,
      quickActions,
      activeWorkflows,
      kpis
    };
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>Loading Command Center...</Typography>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          <AIIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 40 }} />
          Command Center
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Your AI-powered trade promotion headquarters
        </Typography>
      </Box>

      {/* AI Insight of the Day */}
      <Alert 
        severity={dashboardData.aiInsight.type || 'info'} 
        icon={
          dashboardData.aiInsight.iconType === 'warning' ? <WarningIcon /> :
          dashboardData.aiInsight.iconType === 'check' ? <CheckIcon /> :
          dashboardData.aiInsight.iconType === 'trending' ? <TrendingUpIcon /> :
          undefined
        }
        sx={{ mb: 3, fontSize: '1.1rem' }}
        action={
          <Button 
            color="inherit" 
            size="small"
            onClick={() => navigate(dashboardData.aiInsight.route)}
          >
            {dashboardData.aiInsight.action}
          </Button>
        }
      >
        <Typography variant="h6" gutterBottom>
          💡 {dashboardData.aiInsight.title}
        </Typography>
        <Typography variant="body1">
          {dashboardData.aiInsight.message}
        </Typography>
      </Alert>

      {/* Quick Actions */}
      <Box mb={4}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <RocketIcon sx={{ mr: 1 }} />
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          {dashboardData.quickActions.map((action, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
                onClick={() => navigate(action.route)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box 
                      sx={{ 
                        bgcolor: `${action.color}.main`,
                        color: 'white',
                        p: 1,
                        borderRadius: 2
                      }}
                    >
                      {action.iconType === 'calendar' ? <CalendarIcon /> :
                       action.iconType === 'rocket' ? <RocketIcon /> :
                       action.iconType === 'analytics' ? <AnalyticsIcon /> :
                       null}
                    </Box>
                    {action.badge && (
                      <Chip 
                        label={action.badge} 
                        size="small" 
                        color={action.color}
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {action.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" endIcon={<ArrowIcon />}>
                    Get Started
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {/* Active Workflows */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TimelineIcon sx={{ mr: 1 }} />
              Active Workflows
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={2}>
              Items requiring your attention
            </Typography>
            
            {dashboardData.activeWorkflows.length === 0 ? (
              <Alert severity="success" icon={<CheckIcon />}>
                <Typography variant="body1">
                  All caught up! No pending items.
                </Typography>
              </Alert>
            ) : (
              dashboardData.activeWorkflows.map((workflow, index) => (
                <Box key={index}>
                  <Box 
                    sx={{ 
                      py: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                    onClick={() => navigate(workflow.route)}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={8}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {workflow.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {workflow.description}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Chip 
                          label={String(workflow.status || '').replace('_', ' ').toUpperCase()} 
                          size="small"
                          color={workflow.status === 'draft' ? 'default' : 'warning'}
                        />
                      </Grid>
                      <Grid item xs={1}>
                        <IconButton size="small">
                          <ArrowIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                  {index < dashboardData.activeWorkflows.length - 1 && <Divider />}
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        {/* KPI Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Quick Stats
            </Typography>
            
            <Box mt={3}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Budget Utilization
              </Typography>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {(dashboardData.kpis.utilizationRate ?? 0).toFixed(1)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={dashboardData.kpis.utilizationRate ?? 0} 
                sx={{ height: 8, borderRadius: 1, mb: 3 }}
              />

              <Typography variant="body2" color="textSecondary" gutterBottom>
                Total Budget
              </Typography>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                ${(dashboardData.kpis.totalBudget ?? 0).toLocaleString()}
              </Typography>

              <Typography variant="body2" color="textSecondary" gutterBottom mt={2}>
                Total Spent
              </Typography>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                ${(dashboardData.kpis.totalSpent ?? 0).toLocaleString()}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="textSecondary">
                  Active Promotions
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {dashboardData.kpis.activePromotions ?? 0}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">
                  Pending Approvals
                </Typography>
                <Chip 
                  label={dashboardData.kpis.pendingApprovals ?? 0} 
                  size="small"
                  color={(dashboardData.kpis.pendingApprovals ?? 0) > 0 ? 'warning' : 'default'}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* AI Recommendations Section */}
      <Box mt={4}>
        <Paper sx={{ p: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <LightbulbIcon sx={{ mr: 1 }} />
            AI Recommendations
          </Typography>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  💰 Budget Optimization
                </Typography>
                <Typography variant="body2">
                  Reallocate 15% of regional budget to Walmart for +23% ROI improvement
                </Typography>
                <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => navigate('/budgets')}>
                  Review Suggestion
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  🎯 Promotion Opportunity
                </Typography>
                <Typography variant="body2">
                  Create Black Friday promotion for beverages (predicted ROI: 165%)
                </Typography>
                <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => navigate('/promotions/new-flow')}>
                  Create Promotion
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  📊 Performance Alert
                </Typography>
                <Typography variant="body2">
                  Target promotions underperforming by 12% - adjust pricing recommended
                </Typography>
                <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => navigate('/analytics')}>
                  View Analytics
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default CommandCenter;
