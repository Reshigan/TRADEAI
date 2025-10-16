import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Skeleton,
  Tooltip,
  Button,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { io } from 'socket.io-client';
import { format, subHours, subDays } from 'date-fns';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const RealTimeDashboard = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settingsAnchor, setSettingsAnchor] = useState(null);

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      totalRevenue: 0,
      totalProfit: 0,
      activePromotions: 0,
      customerCount: 0,
      revenueGrowth: 0,
      profitMargin: 0,
      promotionROI: 0,
      customerRetention: 0
    },
    revenueChart: {
      labels: [],
      datasets: []
    },
    promotionPerformance: {
      labels: [],
      datasets: []
    },
    customerSegments: {
      labels: [],
      datasets: []
    },
    alerts: [],
    recentActivity: [],
    systemHealth: {
      status: 'healthy',
      uptime: '99.9%',
      responseTime: '120ms',
      activeUsers: 0
    }
  });

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_WEBSOCKET_URL || 'wss://tradeai.gonxt.tech', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('dashboard_update', (data) => {
      setDashboardData(prevData => ({
        ...prevData,
        ...data
      }));
    });

    newSocket.on('kpi_update', (kpis) => {
      setDashboardData(prevData => ({
        ...prevData,
        kpis: { ...prevData.kpis, ...kpis }
      }));
    });

    newSocket.on('alert', (alert) => {
      setDashboardData(prevData => ({
        ...prevData,
        alerts: [alert, ...prevData.alerts.slice(0, 9)] // Keep last 10 alerts
      }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate mock data for demonstration
      const now = new Date();
      const labels = Array.from({ length: 24 }, (_, i) => 
        format(subHours(now, 23 - i), 'HH:mm')
      );

      const revenueData = Array.from({ length: 24 }, () => 
        Math.floor(Math.random() * 50000) + 100000
      );

              ],
        recentActivity: [
          {
            description: 'New promotion "Flash Sale" created',
            timestamp: new Date()
          },
          {
            description: 'Customer segment analysis completed',
            timestamp: new Date(Date.now() - 180000)
          },
          {
            description: 'ROI calculation updated for Q3',
            timestamp: new Date(Date.now() - 360000)
          }
        ]
      };

      setDashboardData(mockData);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleSettingsClick = (event) => {
    setSettingsAnchor(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchor(null);
  };

  const handleIntervalChange = (interval) => {
    setRefreshInterval(interval);
    handleSettingsClose();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const KPICard = ({ title, value, change, icon: Icon, format = 'number' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {format === 'currency' ? formatCurrency(value) : 
               format === 'percentage' ? `${value}%` : 
               value.toLocaleString()}
            </Typography>
            {change !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                {change >= 0 ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={change >= 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {formatPercentage(change)}
                </Typography>
              </Box>
            )}
          </Box>
          <Icon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
        </Box>
      </CardContent>
    </Card>
  );

  if (loading && !dashboardData.kpis.totalRevenue) {
    return (
      <Box p={3}>
        <Grid container spacing={3}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={40} />
                  <Skeleton variant="text" width="30%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Real-Time Dashboard
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              icon={isConnected ? <CheckCircle /> : <ErrorIcon />}
              label={isConnected ? 'Connected' : 'Disconnected'}
              color={isConnected ? 'success' : 'error'}
              size="small"
            />
            <Typography variant="body2" color="textSecondary">
              Last updated: {format(new Date(), 'HH:mm:ss')}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton onClick={handleSettingsClick}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={handleSettingsClose}
      >
        <MenuItem onClick={() => handleIntervalChange(10000)}>
          Refresh every 10 seconds
        </MenuItem>
        <MenuItem onClick={() => handleIntervalChange(30000)}>
          Refresh every 30 seconds
        </MenuItem>
        <MenuItem onClick={() => handleIntervalChange(60000)}>
          Refresh every minute
        </MenuItem>
        <MenuItem onClick={() => handleIntervalChange(300000)}>
          Refresh every 5 minutes
        </MenuItem>
      </Menu>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Revenue"
            value={dashboardData.kpis.totalRevenue}
            change={dashboardData.kpis.revenueGrowth}
            icon={TrendingUp}
            format="currency"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Profit"
            value={dashboardData.kpis.totalProfit}
            change={dashboardData.kpis.profitMargin}
            icon={TrendingUp}
            format="currency"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Active Promotions"
            value={dashboardData.kpis.activePromotions}
            change={dashboardData.kpis.promotionROI}
            icon={TrendingUp}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Customer Count"
            value={dashboardData.kpis.customerCount}
            change={dashboardData.kpis.customerRetention}
            icon={TrendingUp}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} mb={3}>
        {/* Revenue Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Revenue Trend (24h)</Typography>
                <IconButton size="small">
                  <FullscreenIcon />
                </IconButton>
              </Box>
              <Box height={300}>
                <Line
                  data={dashboardData.revenueChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: false,
                        ticks: {
                          callback: (value) => formatCurrency(value)
                        }
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Health */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Status</Typography>
                  <Chip
                    label={dashboardData.systemHealth.status}
                    color={getStatusColor(dashboardData.systemHealth.status)}
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Uptime</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {dashboardData.systemHealth.uptime}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Response Time</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {dashboardData.systemHealth.responseTime}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Active Users</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {dashboardData.systemHealth.activeUsers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Promotion Performance & Customer Segments */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Promotions
              </Typography>
              <Box height={250}>
                <Bar
                  data={dashboardData.promotionPerformance}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Segments
              </Typography>
              <Box height={250}>
                <Doughnut
                  data={dashboardData.customerSegments}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts & Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Alerts
              </Typography>
              <Box maxHeight={300} overflow="auto">
                {dashboardData.alerts.length > 0 ? (
                  dashboardData.alerts.map((alert, index) => (
                    <Alert
                      key={index}
                      severity={alert.severity || 'info'}
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="body2">
                        {alert.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {format(new Date(alert.timestamp), 'HH:mm:ss')}
                      </Typography>
                    </Alert>
                  ))
                ) : (
                  <Typography color="textSecondary">No active alerts</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Box maxHeight={300} overflow="auto">
                {dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.map((activity, index) => (
                    <Box key={index} mb={1} p={1} bgcolor="grey.50" borderRadius={1}>
                      <Typography variant="body2">
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {format(new Date(activity.timestamp), 'HH:mm:ss')}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography color="textSecondary">No recent activity</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealTimeDashboard;