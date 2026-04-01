import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  IconButton, 
  CircularProgress, 
  Alert, 
  Snackbar,
  Chip,
  Tooltip,
  Skeleton
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  AccountBalance,
  Campaign,
  ShoppingCart,
  Assessment,
  Insights as InsightsIcon,
  AutoGraph
} from '@mui/icons-material';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { getErrorMessage } from '../../services/api';
import KpiCard from './KpiCard';
import TrendingChart from './TrendingChart';
import ActivityFeed from './ActivityFeed';
import QuickActions from './QuickActions';
import InsightCard from './InsightCard';
import BudgetDistribution from './BudgetDistribution';

// Hermes-like AI Assistant Panel
const HermesAssistant = ({ insights, onAction }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (insights && insights.length > 0) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [insights]);

  if (!isVisible) return null;

  return (
    <Card 
      sx={{ 
        position: 'fixed', 
        bottom: 24, 
        right: 24, 
        width: 320, 
        zIndex: 1300,
        boxShadow: 8,
        animation: 'slideInUp 0.3s ease-out'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InsightsIcon sx={{ color: 'primary.main', mr: 1 }} />
          <Typography variant="h6">Hermes Insights</Typography>
          <IconButton 
            size="small" 
            sx={{ ml: 'auto' }}
            onClick={() => setIsVisible(false)}
          >
            ×
          </IconButton>
        </Box>
        {insights?.slice(0, 2).map((insight, index) => (
          <Alert 
            key={index} 
            severity={insight.impact === 'high' ? 'warning' : 'info'}
            sx={{ mb: 1, '& .MuiAlert-message': { width: '100%' } }}
            action={
              insight.action && (
                <Button 
                  color="inherit" 
                  size="small"
                  onClick={() => onAction(insight.action)}
                >
                  Fix
                </Button>
              )
            }
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {insight.title}
            </Typography>
            <Typography variant="caption" display="block">
              {insight.description}
            </Typography>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
const HermesDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      totalBudget: 0,
      usedBudget: 0,
      remainingBudget: 0,
      activePromotions: 0,
      completedPromotions: 0,
      roi: 0,
      lift: 0,
      totalRevenue: 0,
      tradeSpend: 0,
      budgetUtilization: 0,
      budgetVariance: 0
    },
    trends: {
      revenue: [],
      budget: [],
      tradeSpend: []
    },
    recentActivities: [],
    insights: [],
    budgetCategories: [],
    period: { startDate: null, endDate: null }
  });

  // Fetch dashboard data with proper error handling (Zero-Slop Law 1-8)
  const fetchDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      setError(null);
      
      // Fetch executive dashboard data (proper API integration - Zero-Slop Law 25)
      const execData = await dashboardService.getExecutiveDashboard({ 
        year: new Date().getFullYear() 
      });
      
      if (!execData?.success || !execData?.data) {
        throw new Error('Invalid dashboard data received');
      }
      
      const data = execData.data;
      
      // Process KPIs with trend calculations (Zero-Slop Law 24-27)
      const processedKpis = {
        totalBudget: data.kpis?.revenue?.ytd || 0,
        usedBudget: data.kpis?.tradeSpend?.total || 0,
        remainingBudget: (data.kpis?.revenue?.ytd || 0) - (data.kpis?.tradeSpend?.total || 0),
        activePromotions: data.activePromotions || 0,
        completedPromotions: data.completedPromotions || 0,
        roi: data.kpis?.tradeSpend?.roi || 0,
        lift: data.kpis?.volume?.growth || 0,
        totalRevenue: data.kpis?.revenue?.ytd || 0,
        tradeSpend: data.kpis?.tradeSpend?.total || 0,
        budgetUtilization: data.kpis?.tradeSpend?.utilization || 0,
        budgetVariance: data.kpis?.revenue?.vsTarget || 0
      };
      
      // Process trends for charts (Zero-Slop Law 24-27)
      const processedTrends = {
        revenue: data.monthlyTrend?.map(item => ({
          month: format(new Date(2023, item._id?.month - 1), 'MMM'),
          revenue: item.revenue || 0,
          volume: item.volume || 0
        })) || [],
        budget: data.monthlyTrend?.map(item => ({
          month: format(new Date(2023, item._id?.month - 1), 'MMM'),
          budget: data.kpis?.revenue?.ytd ? 
            (data.kpis.revenue.ytd / 12) : 0,
          actual: item.revenue || 0
        })) || [],
        tradeSpend: data.tradeSpendBreakdown?.map(item => ({
          category: item._id || 'Other',
          amount: item.total || 0
        })) || []
      };
      
      // Process activities with readable timestamps
      const processedActivities = data.recentActivity?.map(activity => ({
        id: activity.id,
        type: activity.type,
        description: activity.description || activity.message || 'Activity occurred',
        timestamp: activity.date || activity.timestamp || new Date(),
        status: activity.status || 'info'
      })) || [];
      
      // Process insights from AI analysis
      const processedInsights = data.insights || data.alerts?.map(alert => ({
        title: alert.title || 'Recommendation',
        description: alert.message || alert.description || '',
        impact: alert.severity || alert.impact || 'medium',
        action: alert.action || null
      })) || [];
      
      setDashboardData({
        kpis: processedKpis,
        trends: processedTrends,
        recentActivities: processedActivities,
        insights: processedInsights,
        budgetCategories: processedTrends.tradeSpend,
        period: {
          startDate: data.period?.startDate || subDays(new Date(), 30),
          endDate: data.period?.endDate || new Date()
        }
      });
      
    } catch (err) {
      // Error handling (Zero-Slop Law 1)
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: `Dashboard loading failed: ${errorMessage}`,
        severity: 'error'
      });
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Refresh handler with loading state (Zero-Slop Law 3, 4)
  const handleRefresh = async () => {
    await fetchDashboardData(false);
  };

  // Close snackbar notification
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handle AI insight actions
  const handleInsightAction = (action) => {
    if (action) {
      navigate(action);
    }
  };

  // Memoized KPI cards (Zero-Slop Law 24)  
  const kpiCards = useMemo(() => [
    {
      title: "Total Budget",
      value: dashboardData.kpis.totalBudget,
      change: dashboardData.kpis.budgetVariance,
      trend: dashboardData.kpis.budgetVariance >= 0 ? 'up' : 'down',
      icon: <AccountBalance />,
      color: "#1E3A8A",
      format: "currency",
      onClick: () => navigate('/budgets')
    },
    {
      title: "Active Promotions",
      value: dashboardData.kpis.activePromotions,
      change: dashboardData.kpis.lift,
      trend: dashboardData.kpis.lift >= 0 ? 'up' : 'down',
      icon: <Campaign />,
      color: "#1E40AF",
      format: "number",
      onClick: () => navigate('/promotions')
    },
    {
      title: "Trade Spend YTD",
      value: dashboardData.kpis.tradeSpend,
      change: null,
      trend: null,
      icon: <ShoppingCart />,
      color: "#2D7D9A",
      format: "currency",
      onClick: () => navigate('/tradespends')
    },
    {
      title: "Budget Utilization",
      value: dashboardData.kpis.budgetUtilization,
      change: null,
      trend: dashboardData.kpis.budgetUtilization > 90 ? 'down' : 
             dashboardData.kpis.budgetUtilization > 70 ? 'neutral' : 'up',
      icon: <Assessment />,
      color: dashboardData.kpis.budgetUtilization > 90 ? "#d32f2f" : 
             dashboardData.kpis.budgetUtilization > 70 ? "#ed6c02" : "#2e7d32",
      format: "percentage",
      onClick: () => navigate('/budgets/analytics')
    }
  ], [dashboardData.kpis, navigate]);

  // Loading state (Zero-Slop Law 3)
  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="circular" width={40} height={40} />
        </Box>
        <Grid container spacing={3} mb={3}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Error state (Zero-Slop Law 3)
  if (error && !dashboardData.kpis.totalBudget) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              startIcon={<RefreshIcon />} 
              onClick={handleRefresh}
            >
              Retry
            </Button>
          }
        >
          Failed to load dashboard: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Hermes Assistant Panel (AI Integration) */}
      <HermesAssistant 
        insights={dashboardData.insights} 
        onAction={handleInsightAction} 
      />
      
      {/* Header with Refresh */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Welcome back, {user?.name || 'User'} 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your business today
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh dashboard">
            <IconButton 
              onClick={handleRefresh} 
              disabled={refreshing}
              size="large"
            >
              {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* KPI Cards Row */}
      <Grid container spacing={3} mb={3}>
        {kpiCards.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <KpiCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      {/* Charts and Quick Actions */}
      <Grid container spacing={3} mb={3}>
        {/* Revenue Trend Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Revenue Trend
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly performance
                  </Typography>
                </Box>
                <Chip 
                  label={`${format(dashboardData.period.startDate, 'MMM dd')} - ${format(dashboardData.period.endDate, 'MMM dd')}`} 
                  size="small" 
                  variant="outlined" 
                />
              </Box>
              <TrendingChart 
                data={dashboardData.trends.revenue} 
                dataKeys={['revenue']} 
                colors={['#1E40AF']}
                height={280}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Budget Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Trade Spend Breakdown
              </Typography>
              <BudgetDistribution data={dashboardData.budgetCategories} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Activity Feed and Quick Actions */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Recent Activity
              </Typography>
              <ActivityFeed activities={dashboardData.recentActivities} />
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Actions
              </Typography>
              <QuickActions user={user} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Insights Section */}
      {dashboardData.insights && dashboardData.insights.length > 0 && (
        <Box mt={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AutoGraph sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  AI Insights & Recommendations
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {dashboardData.insights.slice(0, 3).map((insight, index) => (
                  <Grid item xs={12} key={index}>
                    <InsightCard 
                      title={insight.title} 
                      description={insight.description}
                      impact={insight.impact}
                      action={insight.action}
                      onAction={handleInsightAction}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HermesDashboard;