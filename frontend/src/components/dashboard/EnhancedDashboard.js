import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Paper,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  AttachMoney,
  Campaign,
  Assessment,
  ArrowForward,
  MoreVert,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const COLORS = ['#7C3AED', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0'];

// Default data (will be replaced by API data)
const defaultRevenueData = [
  { month: 'Jan', revenue: 0, target: 0 },
  { month: 'Feb', revenue: 0, target: 0 },
  { month: 'Mar', revenue: 0, target: 0 },
  { month: 'Apr', revenue: 0, target: 0 },
  { month: 'May', revenue: 0, target: 0 },
  { month: 'Jun', revenue: 0, target: 0 },
];

const defaultBudgetData = [
  { name: 'Used', value: 0, amount: 0 },
  { name: 'Remaining', value: 0, amount: 0 },
];

const defaultActivities = [
  { type: 'info', title: 'Welcome to TRADEAI', time: 'Just now', status: 'info' },
];

export default function EnhancedDashboard({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalBudget: 0,
    totalSpend: 0,
    activePromotions: 0,
    totalCustomers: 0,
    budgetUtilization: 0
  });
  const [revenueData, setRevenueData] = useState(defaultRevenueData);
  const [budgetData, setBudgetData] = useState(defaultBudgetData);
  const [activities, setActivities] = useState(defaultActivities);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics dashboard data
      const analyticsResponse = await api.get('/analytics/dashboard');
      if (analyticsResponse.data.success && analyticsResponse.data.data) {
        const data = analyticsResponse.data.data;
        setMetrics({
          totalBudget: data.totalBudget || 0,
          totalSpend: data.totalSpend || 0,
          activePromotions: data.activePromotions || 0,
          totalCustomers: data.totalCustomers || 0,
          budgetUtilization: parseFloat(data.budgetUtilization) || 0
        });
        
        // Set budget distribution data
        const used = data.totalSpend || 0;
        const remaining = (data.totalBudget || 0) - used;
        setBudgetData([
          { name: 'Used', value: used > 0 ? Math.round((used / (data.totalBudget || 1)) * 100) : 0, amount: used },
          { name: 'Remaining', value: remaining > 0 ? Math.round((remaining / (data.totalBudget || 1)) * 100) : 0, amount: remaining }
        ]);
      }

      // Fetch sales performance data for chart
      try {
        const salesResponse = await api.get('/analytics/sales-performance');
        if (salesResponse.data.success && salesResponse.data.data) {
          setRevenueData(salesResponse.data.data.map(item => ({
            month: item.month,
            revenue: item.sales,
            target: item.target
          })));
        }
      } catch (err) {
        console.error('Failed to load sales data:', err);
      }

      // Fetch recent activities
      try {
        const activitiesResponse = await api.get('/activities?limit=4');
        if (activitiesResponse.data.success && activitiesResponse.data.data && activitiesResponse.data.data.length > 0) {
          setActivities(activitiesResponse.data.data.map(a => ({
            type: a.activityType || a.activity_type || 'info',
            title: a.description || a.title || 'Activity',
            time: formatTimeAgo(a.createdAt || a.created_at),
            status: a.status === 'completed' ? 'success' : a.status === 'pending' ? 'warning' : 'info'
          })));
        }
      } catch (err) {
        console.error('Failed to load activities:', err);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) return `R${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R${(value / 1000).toFixed(0)}K`;
    return `R${value}`;
  };

  const MetricCard = ({ title, value, change, trend, icon, color, subtitle, onClick }) => (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 8,
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${alpha(color, 0.2)} 0%, ${alpha(color, 0.1)} 100%)`,
              color: color,
            }}
          >
            {icon}
          </Box>
          <Chip
            icon={trend === 'up' ? <TrendingUp /> : <TrendingDown />}
            label={`${change}%`}
            size="small"
            color={trend === 'up' ? 'success' : 'error'}
            sx={{ fontWeight: 600 }}
          />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Banner */}
      <Box
        sx={{
          mb: 4,
          p: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Welcome back, {user?.name}! 👋
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
            Here's what's happening with your business today
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              sx={{ bgcolor: 'white', color: '#6D28D9', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
              endIcon={<ArrowForward />}
              onClick={() => navigate('/enterprise/budget')}
            >
              View Enterprise Dashboard
            </Button>
            <Button
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
              onClick={() => navigate('/analytics')}
            >
              Analytics
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Budget"
            value={formatCurrency(metrics.totalBudget)}
            change={12.5}
            trend="up"
            icon={<AccountBalance sx={{ fontSize: 32 }} />}
            color="#7C3AED"
            subtitle="Allocated budget"
            onClick={() => navigate('/analytics')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Trade Spend"
            value={formatCurrency(metrics.totalSpend)}
            change={metrics.budgetUtilization > 80 ? -3.2 : 8.3}
            trend={metrics.budgetUtilization > 80 ? "down" : "up"}
            icon={<AttachMoney sx={{ fontSize: 32 }} />}
            color="#2e7d32"
            subtitle={`${metrics.budgetUtilization.toFixed(1)}% utilized`}
            onClick={() => navigate('/enterprise/trade-spend')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Promotions"
            value={metrics.activePromotions.toString()}
            change={15.2}
            trend="up"
            icon={<Campaign sx={{ fontSize: 32 }} />}
            color="#ed6c02"
            subtitle="Running campaigns"
            onClick={() => navigate('/enterprise/promotions')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Customers"
            value={metrics.totalCustomers.toString()}
            change={8.3}
            trend="up"
            icon={<TrendingUp sx={{ fontSize: 32 }} />}
            color="#6D28D9"
            subtitle="Active accounts"
            onClick={() => navigate('/customers')}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue Trend */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Revenue Trend
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly performance vs target
                  </Typography>
                </Box>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#999" />
                  <YAxis stroke="#999" />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={3} dot={{ r: 6 }} />
                  <Line type="monotone" dataKey="target" stroke="#999" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Budget Distribution */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Budget Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={budgetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {budgetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {budgetData.map((item, index) => (
                  <Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[index] }} />
                      <Typography variant="body2">{item.name}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      R{(item.amount / 1000).toFixed(0)}K
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity & Quick Actions */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Activity
                </Typography>
                <Button size="small" endIcon={<ArrowForward />}>
                  View All
                </Button>
              </Box>
              {activities.map((activity, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: activity.status === 'success' ? '#e8f5e9' : activity.status === 'warning' ? '#fff3e0' : '#F5F3FF',
                      color: activity.status === 'success' ? '#2e7d32' : activity.status === 'warning' ? '#ed6c02' : '#7C3AED',
                      mr: 2,
                    }}
                  >
                    {activity.status === 'success' ? <CheckCircle /> : activity.status === 'warning' ? <Warning /> : <Info />}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {activity.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.time}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {[
                  { title: 'Create Budget', icon: <AccountBalance />, path: '/budgets/new', color: '#7C3AED' },
                  { title: 'New Promotion', icon: <Campaign />, path: '/promotions/new', color: '#6D28D9' },
                  { title: 'Run Simulation', icon: <Assessment />, path: '/enterprise/promotions', color: '#ed6c02' },
                  { title: 'View Reports', icon: <TrendingUp />, path: '/reports', color: '#2e7d32' },
                ].map((action) => (
                  <Grid item xs={6} key={action.title}>
                    <Paper
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                      }}
                      onClick={() => navigate(action.path)}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(action.color, 0.1),
                          color: action.color,
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        {action.icon}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {action.title}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
