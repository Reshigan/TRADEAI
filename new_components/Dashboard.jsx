import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Container, 
  Typography, 
  Button,
  CircularProgress,
  Alert,
  alpha,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  ShoppingCart,
  Group,
  Campaign,
  Refresh,
  ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import KPICard from './KPICard';
import ChartWidget from './ChartWidget';
import ActivityFeed from './ActivityFeed';
import QuickActions from './QuickActions';

const Dashboard = ({ user }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [dashboardData, setDashboardData] = useState({});

  // Mock data for demonstration
  const mockData = {
    kpiMetrics: [
      {
        title: "Total Budget",
        value: 2456000,
        trend: "up",
        trendPercentage: 12.4,
        icon: AccountBalance,
        color: "primary",
        prefix: "R",
        subtitle: "Allocated for Q4"
      },
      {
        title: "Active Promotions",
        value: 42,
        trend: "up",
        trendPercentage: 8.2,
        icon: Campaign,
        color: "secondary",
        subtitle: "Currently running"
      },
      {
        title: "Trade Spend",
        value: 1875000,
        trend: "down",
        trendPercentage: 3.7,
        icon: ShoppingCart,
        color: "success",
        prefix: "R",
        subtitle: "Month to date"
      },
      {
        title: "Active Customers",
        value: 1248,
        trend: "up",
        trendPercentage: 5.1,
        icon: Group,
        color: "info",
        subtitle: "Engaged"
      }
    ],
    salesChartData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Actual Sales',
          data: [650000, 590000, 800000, 810000, 560000, 550000, 720000, 780000, 850000, 920000, 880000, 950000],
          borderColor: theme.palette.primary.main,
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          tension: 0.4,
          fill: true
        },
        {
          label: 'Target Sales',
          data: [600000, 620000, 750000, 780000, 600000, 580000, 700000, 800000, 820000, 900000, 900000, 980000],
          borderColor: theme.palette.grey[400],
          borderDash: [5, 5],
          fill: false
        }
      ]
    },
    budgetDistributionData: {
      labels: ['Marketing', 'Promotions', 'Rebates', 'Events', 'Sampling'],
      datasets: [
        {
          data: [35, 25, 20, 12, 8],
          backgroundColor: [
            alpha(theme.palette.primary.main, 0.8),
            alpha(theme.palette.secondary.main, 0.8),
            alpha(theme.palette.success.main, 0.8),
            alpha(theme.palette.warning.main, 0.8),
            alpha(theme.palette.info.main, 0.8)
          ],
          borderColor: [
            theme.palette.primary.main,
            theme.palette.secondary.main,
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.info.main
          ],
          borderWidth: 1
        }
      ]
    },
    recentActivities: [
      {
        id: 1,
        type: 'budget',
        title: 'Q4 Marketing Budget Approved',
        description: 'R1.2M allocated for Q4 campaigns',
        status: 'completed',
        time: '2 hours ago'
      },
      {
        id: 2,
        type: 'promotion',
        title: 'Black Friday Campaign Launched',
        description: 'New seasonal promotion started',
        status: 'scheduled',
        time: 'Yesterday'
      },
      {
        id: 3,
        type: 'spend',
        title: 'TV Advertisement Payment',
        description: 'R245K processed for media buy',
        status: 'completed',
        time: '2 days ago'
      },
      {
        id: 4,
        type: 'warning',
        title: 'Budget Alert: Electronics Division',
        description: '85% of Q4 budget consumed',
        status: 'warning',
        time: '3 days ago'
      }
    ]
  };

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        setTimeout(() => {
          setDashboardData(mockData);
          setLoading(false);
        }, 1500);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setDashboardData(mockData);
      setLoading(false);
    }, 1000);
  };

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load dashboard data: {error}
        </Alert>
        <Button 
          startIcon={<Refresh />} 
          onClick={handleRefresh}
          variant="contained"
        >
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Welcome Banner */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 2, sm: 4 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #1E3A8A 0%, #5B21B6 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Welcome back, {user?.name || 'Team Member'}! 👋
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
            Here's what's happening with your business today
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              sx={{ 
                bgcolor: 'white', 
                color: '#1E3A8A', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } 
              }}
              endIcon={<ArrowForward />}
              onClick={() => navigate('/enterprise/budget')}
            >
              View Enterprise Budget
            </Button>
            <Button
              variant="outlined"
              sx={{ 
                borderColor: 'rgba(255,255,255,0.3)', 
                color: 'white',
                '&:hover': { 
                  borderColor: 'rgba(255,255,255,0.5)',
                  bgcolor: 'rgba(255,255,255,0.1)'
                } 
              }}
              endIcon={<ArrowForward />}
              onClick={() => navigate('/enterprise/promotions')}
            >
              Manage Promotions
            </Button>
          </Box>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {dashboardData.kpiMetrics?.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <KPICard
              title={metric.title}
              value={metric.value}
              trend={metric.trend}
              trendPercentage={metric.trendPercentage}
              icon={metric.icon}
              color={metric.color}
              prefix={metric.prefix}
              subtitle={metric.subtitle}
              loading={loading}
              onClick={() => console.log(`Navigate to ${metric.title}`)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Charts and Activity Feed */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Sales Trend Chart */}
        <Grid item xs={12} lg={8}>
          <ChartWidget
            title="Sales Performance"
            type="area"
            data={dashboardData.salesChartData}
            height={350}
            loading={loading}
            onRefresh={handleRefresh}
          />
        </Grid>

        {/* Budget Distribution Chart */}
        <Grid item xs={12} lg={4}>
          <ChartWidget
            title="Budget Distribution"
            type="doughnut"
            data={dashboardData.budgetDistributionData}
            height={350}
            loading={loading}
            onRefresh={handleRefresh}
          />
        </Grid>
      </Grid>

      {/* Recent Activity and Quick Actions */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} lg={6}>
          <ActivityFeed
            title="Recent Activity"
            activities={dashboardData.recentActivities || []}
            loading={loading}
            onViewAll={() => console.log('View all activities')}
            maxHeight={400}
          />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} lg={6}>
          <QuickActions
            title="Quick Actions"
            loading={loading}
            columns={2}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
// AI Enhancement Marker
