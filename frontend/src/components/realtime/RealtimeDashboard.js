import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Settings,
  Notifications,
  Speed,
  Memory,
  Storage,
  NetworkCheck,
  Warning,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import io from 'socket.io-client';

const RealtimeDashboard = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [subscriptions, setSubscriptions] = useState({
    dashboard: true,
    performance: true,
    alerts: true
  });
  const [metrics, setMetrics] = useState({
    system: {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: { in: 0, out: 0 }
    },
    application: {
      requests: 0,
      responseTime: 0,
      errorRate: 0,
      activeUsers: 0
    },
    business: {
      promotionsCreated: 0,
      reportsGenerated: 0,
      dataProcessed: 0,
      revenue: 0
    }
  });
  const [chartData, setChartData] = useState({
    performance: [],
    requests: [],
    errors: []
  });
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const chartDataRef = useRef({
    performance: [],
    requests: [],
    errors: []
  });

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io(process.env.REACT_APP_WEBSOCKET_URL || 'wss://tradeai.gonxt.tech', {
      transports: ['websocket'],
      upgrade: false
    });

    newSocket.on('connect', () => {
      console.log('Connected to real-time analytics');
      setIsConnected(true);
      
      // Subscribe to channels based on current subscriptions
      Object.entries(subscriptions).forEach(([channel, enabled]) => {
        if (enabled) {
          newSocket.emit('subscribe', { channel, tenantId: 'tenant_1' });
        }
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from real-time analytics');
      setIsConnected(false);
    });

    newSocket.on('metrics_update', (data) => {
      handleMetricsUpdate(data);
    });

    newSocket.on('alert', (alert) => {
      handleAlert(alert);
    });

    newSocket.on('notification', (notification) => {
      handleNotification(notification);
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (socket && isConnected) {
      // Update subscriptions
      Object.entries(subscriptions).forEach(([channel, enabled]) => {
        if (enabled) {
          socket.emit('subscribe', { channel, tenantId: 'tenant_1' });
        } else {
          socket.emit('unsubscribe', { channel });
        }
      });
    }
  }, [subscriptions, socket, isConnected]);

  const handleMetricsUpdate = (data) => {
    const { type, metrics: newMetrics, timestamp } = data;
    
    setMetrics(prev => ({
      ...prev,
      [type]: { ...prev[type], ...newMetrics }
    }));

    // Update chart data
    const now = new Date(timestamp);
    const timeLabel = now.toLocaleTimeString();

    setChartData(prev => {
      const updated = { ...prev };
      
      if (type === 'system') {
        // Update performance chart
        const newPoint = {
          time: timeLabel,
          cpu: newMetrics.cpu || 0,
          memory: newMetrics.memory || 0,
          timestamp: now.getTime()
        };
        
        updated.performance = [...prev.performance, newPoint].slice(-20); // Keep last 20 points
      }
      
      if (type === 'application') {
        // Update requests chart
        const newPoint = {
          time: timeLabel,
          requests: newMetrics.requests || 0,
          responseTime: newMetrics.responseTime || 0,
          timestamp: now.getTime()
        };
        
        updated.requests = [...prev.requests, newPoint].slice(-20);
        
        // Update errors chart
        if (newMetrics.errorRate !== undefined) {
          const errorPoint = {
            time: timeLabel,
            errorRate: newMetrics.errorRate,
            timestamp: now.getTime()
          };
          
          updated.errors = [...prev.errors, errorPoint].slice(-20);
        }
      }
      
      chartDataRef.current = updated;
      return updated;
    });
  };

  const handleAlert = (alert) => {
    setAlerts(prev => [alert, ...prev].slice(0, 10)); // Keep last 10 alerts
  };

  const handleNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 5)); // Keep last 5 notifications
  };

  const handleSubscriptionChange = (channel) => {
    setSubscriptions(prev => ({
      ...prev,
      [channel]: !prev[channel]
    }));
  };

  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.critical) return 'error';
    if (value >= thresholds.warning) return 'warning';
    return 'success';
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'info':
        return <Info color="info" />;
      default:
        return <CheckCircle color="success" />;
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Real-time Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={isConnected ? <CheckCircle /> : <Error />}
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
          <IconButton>
            <Settings />
          </IconButton>
        </Box>
      </Box>

      {/* Subscription Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Data Subscriptions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {Object.entries(subscriptions).map(([channel, enabled]) => (
              <FormControlLabel
                key={channel}
                control={
                  <Switch
                    checked={enabled}
                    onChange={() => handleSubscriptionChange(channel)}
                    disabled={!isConnected}
                  />
                }
                label={channel.charAt(0).toUpperCase() + channel.slice(1)}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Speed color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">CPU Usage</Typography>
              </Box>
              <Typography variant="h4" color={getStatusColor(metrics.system.cpu, { warning: 70, critical: 85 })}>
                {metrics.system.cpu.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={metrics.system.cpu}
                color={getStatusColor(metrics.system.cpu, { warning: 70, critical: 85 })}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Memory color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Memory</Typography>
              </Box>
              <Typography variant="h4" color={getStatusColor(metrics.system.memory, { warning: 75, critical: 90 })}>
                {metrics.system.memory.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={metrics.system.memory}
                color={getStatusColor(metrics.system.memory, { warning: 75, critical: 90 })}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Storage color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Disk Usage</Typography>
              </Box>
              <Typography variant="h4" color={getStatusColor(metrics.system.disk, { warning: 80, critical: 95 })}>
                {metrics.system.disk.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={metrics.system.disk}
                color={getStatusColor(metrics.system.disk, { warning: 80, critical: 95 })}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NetworkCheck color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Network I/O</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                In: {formatNumber(metrics.system.network.in)} B/s
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Out: {formatNumber(metrics.system.network.out)} B/s
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Application Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Requests/sec
              </Typography>
              <Typography variant="h4" color="primary">
                {formatNumber(metrics.application.requests)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp color="success" fontSize="small" />
                <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                  +12%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Response Time
              </Typography>
              <Typography variant="h4" color="primary">
                {metrics.application.responseTime}ms
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingDown color="success" fontSize="small" />
                <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                  -5%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Error Rate
              </Typography>
              <Typography variant="h4" color={metrics.application.errorRate > 5 ? 'error' : 'primary'}>
                {metrics.application.errorRate.toFixed(2)}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingDown color="success" fontSize="small" />
                <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                  -2%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h4" color="primary">
                {formatNumber(metrics.application.activeUsers)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp color="success" fontSize="small" />
                <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                  +8%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="cpu" stackId="1" stroke="#8884d8" fill="#8884d8" name="CPU %" />
                  <Area type="monotone" dataKey="memory" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Memory %" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Request Metrics
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.requests}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip />
                  <Line yAxisId="left" type="monotone" dataKey="requests" stroke="#8884d8" name="Requests/sec" />
                  <Line yAxisId="right" type="monotone" dataKey="responseTime" stroke="#82ca9d" name="Response Time (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts and Notifications */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Alerts
              </Typography>
              {alerts.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No recent alerts
                </Typography>
              ) : (
                <List>
                  {alerts.map((alert, index) => (
                    <React.Fragment key={alert.id || index}>
                      <ListItem>
                        <ListItemIcon>
                          {getAlertIcon(alert.severity)}
                        </ListItemIcon>
                        <ListItemText
                          primary={alert.title || alert.message}
                          secondary={`${alert.severity} • ${new Date(alert.timestamp).toLocaleString()}`}
                        />
                      </ListItem>
                      {index < alerts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Business Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {formatNumber(metrics.business.promotionsCreated)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Promotions Created
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {formatNumber(metrics.business.reportsGenerated)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Reports Generated
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {formatNumber(metrics.business.dataProcessed)}MB
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Data Processed
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      R{formatNumber(metrics.business.revenue)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Revenue Impact
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealtimeDashboard;