import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  LinearProgress,
  CircularProgress,
  Badge,
  Divider
} from '@mui/material';
import {
  Integration,
  CloudSync,
  Webhook,
  Api,
  Settings,
  Refresh,
  Add,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Stop,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
  Sync,
  Timeline,
  Assessment,
  Security,
  Speed,
  Storage,
  Email,
  ShoppingCart,
  Business,
  Analytics,
  Campaign
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import api from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const IntegrationDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [apiAnalytics, setApiAnalytics] = useState(null);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);

  // Form states
  const [integrationConfig, setIntegrationConfig] = useState({
    credentials: {},
    settings: {}
  });

  const [webhookConfig, setWebhookConfig] = useState({
    url: '',
    events: [],
    active: true,
    secret: ''
  });

  const [syncConfig, setSyncConfig] = useState({
    entities: [],
    fullSync: false
  });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demonstration
      const mockDashboardData = {
        integrations: {
          total: 6,
          active: 4,
          error: 1,
          list: [
            {
              id: 'erp',
              name: 'Enterprise Resource Planning',
              type: 'erp',
              status: 'active',
              lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              syncCount: 45,
              errorCount: 0
            },
            {
              id: 'crm',
              name: 'Customer Relationship Management',
              type: 'crm',
              status: 'active',
              lastSync: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              syncCount: 32,
              errorCount: 1
            },
            {
              id: 'pos',
              name: 'Point of Sale System',
              type: 'pos',
              status: 'active',
              lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
              syncCount: 128,
              errorCount: 0
            },
            {
              id: 'email',
              name: 'Email Marketing Platform',
              type: 'email',
              status: 'active',
              lastSync: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
              syncCount: 67,
              errorCount: 2
            },
            {
              id: 'social',
              name: 'Social Media Advertising',
              type: 'social',
              status: 'error',
              lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              syncCount: 12,
              errorCount: 5
            },
            {
              id: 'analytics',
              name: 'Web Analytics Platform',
              type: 'analytics',
              status: 'inactive',
              lastSync: null,
              syncCount: 0,
              errorCount: 0
            }
          ]
        },
        webhooks: {
          total: 3,
          active: 2,
          list: [
            {
              id: 'wh_1',
              url: 'https://api.example.com/webhooks/orders',
              events: ['order.created', 'order.updated'],
              active: true,
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'wh_2',
              url: 'https://crm.example.com/webhooks/customers',
              events: ['user.created', 'user.updated'],
              active: true,
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'wh_3',
              url: 'https://analytics.example.com/webhooks/events',
              events: ['*'],
              active: false,
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        },
        api: {
          analytics: {
            totalRequests: 15420,
            totalErrors: 234,
            averageResponseTime: 145,
            hourlyStats: Array.from({ length: 24 }, (_, i) => ({
              hour: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString().slice(0, 13),
              requests: Math.floor(Math.random() * 1000) + 200,
              errors: Math.floor(Math.random() * 50)
            })),
            statusCodeDistribution: {
              '200': 12500,
              '201': 1800,
              '400': 150,
              '401': 45,
              '404': 80,
              '500': 34
            }
          }
        },
        summary: {
          totalIntegrations: 6,
          activeWebhooks: 2,
          dailyAPIRequests: 15420,
          systemHealth: 'healthy'
        }
      };

      setDashboardData(mockDashboardData);
      setIntegrations(mockDashboardData.integrations.list);
      setWebhooks(mockDashboardData.webhooks.list);
      setApiAnalytics(mockDashboardData.api.analytics);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Integration Management
  const connectIntegration = async (integrationId) => {
    try {
      setLoading(true);
      setError(null);

      // Mock connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update integration status
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, status: 'active', lastSync: new Date().toISOString() }
          : integration
      ));

      setConfigDialogOpen(false);
      alert('Integration connected successfully!');
    } catch (error) {
      setError('Failed to connect integration');
      console.error('Error connecting integration:', error);
    } finally {
      setLoading(false);
    }
  };

  const disconnectIntegration = async (integrationId) => {
    if (!window.confirm('Are you sure you want to disconnect this integration?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Mock disconnection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update integration status
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, status: 'inactive' }
          : integration
      ));

      alert('Integration disconnected successfully!');
    } catch (error) {
      setError('Failed to disconnect integration');
      console.error('Error disconnecting integration:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncIntegration = async (integrationId) => {
    try {
      setLoading(true);
      setError(null);

      // Mock sync
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update integration sync data
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { 
              ...integration, 
              lastSync: new Date().toISOString(),
              syncCount: integration.syncCount + 1
            }
          : integration
      ));

      setSyncDialogOpen(false);
      alert('Sync completed! 1,234 records synchronized.');
    } catch (error) {
      setError('Failed to sync integration');
      console.error('Error syncing integration:', error);
    } finally {
      setLoading(false);
    }
  };

  // Webhook Management
  const createWebhook = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock webhook creation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newWebhook = {
        id: `wh_${Date.now()}`,
        url: webhookConfig.url,
        events: webhookConfig.events,
        active: webhookConfig.active,
        createdAt: new Date().toISOString()
      };

      setWebhooks(prev => [...prev, newWebhook]);
      setWebhookDialogOpen(false);
      setWebhookConfig({ url: '', events: [], active: true, secret: '' });
      
      alert('Webhook created successfully!');
    } catch (error) {
      setError('Failed to create webhook');
      console.error('Error creating webhook:', error);
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async (webhookId) => {
    try {
      setLoading(true);
      setError(null);

      // Mock webhook test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Webhook test successful!');
    } catch (error) {
      setError('Failed to test webhook');
      console.error('Error testing webhook:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteWebhook = async (webhookId) => {
    if (!window.confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Mock webhook deletion
      await new Promise(resolve => setTimeout(resolve, 1000));

      setWebhooks(prev => prev.filter(webhook => webhook.id !== webhookId));
      
      alert('Webhook deleted successfully!');
    } catch (error) {
      setError('Failed to delete webhook');
      console.error('Error deleting webhook:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntegrationIcon = (type) => {
    const icons = {
      erp: <Business />,
      crm: <Business />,
      pos: <ShoppingCart />,
      email: <Email />,
      social: <Campaign />,
      analytics: <Analytics />
    };
    return icons[type] || <Integration />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'error': return 'error';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'inactive': return <Pause color="disabled" />;
      default: return <Info />;
    }
  };

  const IntegrationCard = ({ integration }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            {getIntegrationIcon(integration.type)}
            <Typography variant="h6">
              {integration.name}
            </Typography>
          </Box>
          <Chip
            label={integration.status}
            color={getStatusColor(integration.status)}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {integration.type.toUpperCase()} Integration
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2">
            Last Sync: {integration.lastSync ? format(new Date(integration.lastSync), 'MMM dd, HH:mm') : 'Never'}
          </Typography>
          {getStatusIcon(integration.status)}
        </Box>

        <Box display="flex" gap={1} mb={2}>
          <Chip
            label={`${integration.syncCount || 0} syncs`}
            size="small"
            variant="outlined"
          />
          {integration.errorCount > 0 && (
            <Chip
              label={`${integration.errorCount} errors`}
              size="small"
              variant="outlined"
              color="error"
            />
          )}
        </Box>

        <Box display="flex" gap={1}>
          {integration.status === 'inactive' ? (
            <Button
              size="small"
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => {
                setSelectedIntegration(integration);
                setConfigDialogOpen(true);
              }}
            >
              Connect
            </Button>
          ) : (
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Sync />}
                onClick={() => {
                  setSelectedIntegration(integration);
                  setSyncDialogOpen(true);
                }}
                disabled={integration.status !== 'active'}
              >
                Sync
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<Stop />}
                onClick={() => disconnectIntegration(integration.id)}
              >
                Disconnect
              </Button>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const WebhookCard = ({ webhook }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flexGrow={1}>
            <Typography variant="h6" gutterBottom>
              {webhook.url}
            </Typography>
            <Box display="flex" gap={1} mb={1}>
              <Chip
                label={webhook.active ? 'Active' : 'Inactive'}
                color={webhook.active ? 'success' : 'default'}
                size="small"
              />
              <Chip
                label={`${webhook.events?.length || 0} events`}
                size="small"
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Created: {format(new Date(webhook.createdAt), 'MMM dd, yyyy HH:mm')}
            </Typography>
            {webhook.events && webhook.events.length > 0 && (
              <Box mt={1}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Events:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {webhook.events.slice(0, 3).map((event, index) => (
                    <Chip key={index} label={event} size="small" variant="outlined" />
                  ))}
                  {webhook.events.length > 3 && (
                    <Chip label={`+${webhook.events.length - 3} more`} size="small" variant="outlined" />
                  )}
                </Box>
              </Box>
            )}
          </Box>
          <Box display="flex" flexDirection="column" gap={1}>
            <IconButton
              size="small"
              onClick={() => testWebhook(webhook.id)}
              disabled={!webhook.active}
            >
              <PlayArrow />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => deleteWebhook(webhook.id)}
            >
              <Delete />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  if (loading && !dashboardData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Integration Dashboard
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<Add />}
            onClick={() => setWebhookDialogOpen(true)}
          >
            Add Webhook
          </Button>
          <Button
            startIcon={<Refresh />}
            onClick={loadDashboardData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      {dashboardData && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Integrations
                    </Typography>
                    <Typography variant="h4">
                      {dashboardData.integrations.total}
                    </Typography>
                  </Box>
                  <Integration sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Active Integrations
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {dashboardData.integrations.active}
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Active Webhooks
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {dashboardData.webhooks.active}
                    </Typography>
                  </Box>
                  <Webhook sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Daily API Requests
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {dashboardData.summary.dailyAPIRequests.toLocaleString()}
                    </Typography>
                  </Box>
                  <Api sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Integrations" icon={<Integration />} />
          <Tab label="Webhooks" icon={<Webhook />} />
          <Tab label="API Analytics" icon={<Analytics />} />
          <Tab label="System Health" icon={<Assessment />} />
        </Tabs>

        {/* Integrations Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {integrations.map((integration) => (
              <Grid item xs={12} sm={6} md={4} key={integration.id}>
                <IntegrationCard integration={integration} />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Webhooks Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box>
            {webhooks.length > 0 ? (
              webhooks.map((webhook) => (
                <WebhookCard key={webhook.id} webhook={webhook} />
              ))
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  No webhooks configured. Click "Add Webhook" to create one.
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* API Analytics Tab */}
        <TabPanel value={activeTab} index={2}>
          {apiAnalytics ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      API Request Trends
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={apiAnalytics.hourlyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" tickFormatter={(hour) => format(new Date(hour + ':00:00'), 'HH:mm')} />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="requests" stroke="#8884d8" name="Requests" />
                        <Line type="monotone" dataKey="errors" stroke="#ff7300" name="Errors" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Status Code Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(apiAnalytics.statusCodeDistribution).map(([code, count]) => ({
                            name: code,
                            value: count
                          }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          {Object.entries(apiAnalytics.statusCodeDistribution).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">
              Loading API analytics...
            </Typography>
          )}
        </TabPanel>

        {/* System Health Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Integration Health
                  </Typography>
                  <List>
                    {integrations.map((integration) => (
                      <ListItem key={integration.id}>
                        <ListItemIcon>
                          {getStatusIcon(integration.status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={integration.name}
                          secondary={`Status: ${integration.status} | Last sync: ${integration.lastSync ? format(new Date(integration.lastSync), 'MMM dd, HH:mm') : 'Never'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Metrics
                  </Typography>
                  {dashboardData && (
                    <Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">System Health</Typography>
                        <Chip
                          label={dashboardData.summary.systemHealth}
                          color="success"
                          size="small"
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Error Rate</Typography>
                        <Typography variant="body2">
                          {apiAnalytics ? ((apiAnalytics.totalErrors / apiAnalytics.totalRequests) * 100).toFixed(2) : 0}%
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Avg Response Time</Typography>
                        <Typography variant="body2">
                          {apiAnalytics ? apiAnalytics.averageResponseTime.toFixed(0) : 0}ms
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Integration Config Dialog */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Connect Integration: {selectedIntegration?.name}
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Configure connection credentials for {selectedIntegration?.name}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Key / Client ID"
                  value={integrationConfig.credentials.apiKey || ''}
                  onChange={(e) => setIntegrationConfig(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, apiKey: e.target.value }
                  }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Secret / Client Secret"
                  type="password"
                  value={integrationConfig.credentials.secret || ''}
                  onChange={(e) => setIntegrationConfig(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, secret: e.target.value }
                  }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Base URL (optional)"
                  value={integrationConfig.credentials.baseUrl || ''}
                  onChange={(e) => setIntegrationConfig(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, baseUrl: e.target.value }
                  }))}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => connectIntegration(selectedIntegration?.id)}
            disabled={loading}
          >
            Connect
          </Button>
        </DialogActions>
      </Dialog>

      {/* Webhook Config Dialog */}
      <Dialog open={webhookDialogOpen} onClose={() => setWebhookDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Webhook</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Webhook URL"
                  value={webhookConfig.url}
                  onChange={(e) => setWebhookConfig(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://your-app.com/webhooks/tradeai"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Events</InputLabel>
                  <Select
                    multiple
                    value={webhookConfig.events}
                    onChange={(e) => setWebhookConfig(prev => ({ ...prev, events: e.target.value }))}
                  >
                    <MenuItem value="user.created">User Created</MenuItem>
                    <MenuItem value="order.created">Order Created</MenuItem>
                    <MenuItem value="promotion.started">Promotion Started</MenuItem>
                    <MenuItem value="promotion.ended">Promotion Ended</MenuItem>
                    <MenuItem value="alert.triggered">Alert Triggered</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Secret (optional)"
                  value={webhookConfig.secret}
                  onChange={(e) => setWebhookConfig(prev => ({ ...prev, secret: e.target.value }))}
                  placeholder="Leave empty to auto-generate"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={webhookConfig.active}
                      onChange={(e) => setWebhookConfig(prev => ({ ...prev, active: e.target.checked }))}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWebhookDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={createWebhook}
            disabled={loading || !webhookConfig.url}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sync Config Dialog */}
      <Dialog open={syncDialogOpen} onClose={() => setSyncDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Sync Integration: {selectedIntegration?.name}
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Entities to Sync</InputLabel>
              <Select
                multiple
                value={syncConfig.entities}
                onChange={(e) => setSyncConfig(prev => ({ ...prev, entities: e.target.value }))}
              >
                <MenuItem value="customers">Customers</MenuItem>
                <MenuItem value="products">Products</MenuItem>
                <MenuItem value="orders">Orders</MenuItem>
                <MenuItem value="inventory">Inventory</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={syncConfig.fullSync}
                  onChange={(e) => setSyncConfig(prev => ({ ...prev, fullSync: e.target.checked }))}
                />
              }
              label="Full Sync (sync all data, not just changes)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => syncIntegration(selectedIntegration?.id)}
            disabled={loading}
          >
            Start Sync
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntegrationDashboard;
  Sync,
  CheckCircle,
  Error,
  Warning,
  Schedule,
  Visibility,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Stop,
  CloudSync,
  Api,
  Webhook,
  DataObject,
  Timeline,
  ExpandMore,
  Cable,
  Storage,
  Transform,
  Notifications
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const IntegrationDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [connectors, setConnectors] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [syncJobs, setSyncJobs] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [configDialog, setConfigDialog] = useState({ open: false, connector: null });
  const [syncDialog, setSyncDialog] = useState({ open: false, integration: null });
  const [webhookDialog, setWebhookDialog] = useState({ open: false, webhook: null });
  const [loading, setLoading] = useState(false);
  const [integrationStats, setIntegrationStats] = useState({});
  const [syncStats, setSyncStats] = useState({});

  useEffect(() => {
    loadIntegrationData();
  }, []);

  const loadIntegrationData = async () => {
    setLoading(true);
    try {
      const [connectorsRes, integrationsRes, syncJobsRes, webhooksRes, statsRes] = await Promise.all([
        axios.get('/api/integrations/connectors'),
        axios.get('/api/integrations'),
        axios.get('/api/integrations/sync-jobs'),
        axios.get('/api/integrations/webhooks'),
        axios.get('/api/integrations/stats')
      ]);

      setConnectors(connectorsRes.data);
      setIntegrations(integrationsRes.data);
      setSyncJobs(syncJobsRes.data);
      setWebhooks(webhooksRes.data);
      setIntegrationStats(statsRes.data.integrations);
      setSyncStats(statsRes.data.sync);
    } catch (error) {
      console.error('Error loading integration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createIntegration = async (connectorId, config) => {
    try {
      const response = await axios.post('/api/integrations', {
        connectorId,
        configuration: config
      });
      loadIntegrationData(); // Refresh data
      return response.data;
    } catch (error) {
      console.error('Error creating integration:', error);
    }
  };

  const testConnection = async (integrationId) => {
    try {
      const response = await axios.post(`/api/integrations/${integrationId}/test`);
      return response.data;
    } catch (error) {
      console.error('Error testing connection:', error);
    }
  };

  const startSync = async (integrationId, syncType = 'full') => {
    try {
      const response = await axios.post(`/api/integrations/${integrationId}/sync`, {
        syncType
      });
      loadIntegrationData(); // Refresh data
      return response.data;
    } catch (error) {
      console.error('Error starting sync:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'success';
      case 'running': return 'primary';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'disconnected': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckCircle color="success" />;
      case 'running': return <Sync color="primary" />;
      case 'pending': return <Schedule color="warning" />;
      case 'failed': return <Error color="error" />;
      case 'disconnected': return <Cable color="disabled" />;
      default: return <Schedule />;
    }
  };

  const getConnectorIcon = (type) => {
    switch (type) {
      case 'crm': return '👥';
      case 'erp': return '🏢';
      case 'ecommerce': return '🛒';
      case 'analytics': return '📊';
      case 'communication': return '💬';
      default: return '🔗';
    }
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`integration-tabpanel-${index}`}
      aria-labelledby={`integration-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Cable color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Active Integrations</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {integrationStats.active || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Currently connected
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CloudSync color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Sync Jobs</Typography>
            </Box>
            <Typography variant="h4" color="warning.main">
              {syncStats.running || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Currently running
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DataObject color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Records Synced</Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {syncStats.recordsToday || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Today
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Error color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Failed Syncs</Typography>
            </Box>
            <Typography variant="h4" color="error.main">
              {syncStats.failed || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Last 24 hours
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Charts */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Integration Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Connected', value: integrationStats.connected || 0, fill: '#2e7d32' },
                    { name: 'Disconnected', value: integrationStats.disconnected || 0, fill: '#d32f2f' },
                    { name: 'Pending', value: integrationStats.pending || 0, fill: '#ed6c02' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sync Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={syncStats.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="successful" stroke="#2e7d32" name="Successful" />
                <Line type="monotone" dataKey="failed" stroke="#d32f2f" name="Failed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Activity */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Sync Activity
            </Typography>
            <List>
              {syncJobs.slice(0, 5).map((job, index) => (
                <React.Fragment key={job.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getStatusIcon(job.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${job.connectorName} - ${job.syncType} sync`}
                      secondary={`${job.recordsProcessed} records • ${job.status} • ${new Date(job.startTime).toLocaleString()}`}
                    />
                    <Chip
                      label={job.status}
                      color={getStatusColor(job.status)}
                      size="small"
                    />
                  </ListItem>
                  {index < 4 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderConnectors = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Available Connectors
        </Typography>
        <Grid container spacing={2}>
          {connectors.map((connector) => (
            <Grid item xs={12} sm={6} md={4} key={connector.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {getConnectorIcon(connector.type)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{connector.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {connector.type}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {connector.description}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Capabilities:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {connector.capabilities?.map((capability) => (
                        <Chip
                          key={capability}
                          label={capability}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => setConfigDialog({ open: true, connector })}
                  >
                    Configure
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );

  const renderIntegrations = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Active Integrations</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setConfigDialog({ open: true, connector: null })}
          >
            Add Integration
          </Button>
        </Box>
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Integration</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Sync</TableCell>
                  <TableCell>Records</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {integrations.map((integration) => (
                  <TableRow key={integration.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          {getConnectorIcon(integration.type)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {integration.connectorName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {integration.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{integration.type}</TableCell>
                    <TableCell>
                      <Chip
                        label={integration.connectionStatus}
                        color={getStatusColor(integration.connectionStatus)}
                        size="small"
                        icon={getStatusIcon(integration.connectionStatus)}
                      />
                    </TableCell>
                    <TableCell>
                      {integration.lastSync ? 
                        new Date(integration.lastSync).toLocaleString() : 
                        'Never'
                      }
                    </TableCell>
                    <TableCell>
                      {integration.recordsProcessed || 0}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => testConnection(integration.id)}
                      >
                        <CheckCircle />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setSyncDialog({ open: true, integration })}
                      >
                        <Sync />
                      </IconButton>
                      <IconButton size="small">
                        <Settings />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedIntegration(integration)}
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>

      {selectedIntegration && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Integration Details - {selectedIntegration.connectorName}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Status:</strong> {selectedIntegration.connectionStatus}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Sync Frequency:</strong> {selectedIntegration.syncFrequency}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Last Sync:</strong> {selectedIntegration.lastSync ? 
                      new Date(selectedIntegration.lastSync).toLocaleString() : 'Never'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Records Processed:</strong> {selectedIntegration.recordsProcessed || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Field Mappings:</strong>
                  </Typography>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="body2">View Mappings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {Object.entries(selectedIntegration.fieldMappings || {}).map(([external, internal]) => (
                          <ListItem key={external}>
                            <ListItemText
                              primary={`${external} → ${internal}`}
                              secondary="Field mapping"
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  const renderSyncJobs = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Sync Jobs
        </Typography>
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job ID</TableCell>
                  <TableCell>Integration</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Records</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {syncJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>{job.id}</TableCell>
                    <TableCell>{job.connectorName}</TableCell>
                    <TableCell>
                      <Chip label={job.syncType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={job.status}
                        color={getStatusColor(job.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={job.progress || 0}
                          sx={{ width: 100, mr: 1 }}
                        />
                        <Typography variant="body2">
                          {job.progress || 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {job.recordsProcessed}/{job.totalRecords || '?'}
                    </TableCell>
                    <TableCell>
                      {job.endTime ? 
                        formatDuration(new Date(job.endTime) - new Date(job.startTime)) :
                        formatDuration(Date.now() - new Date(job.startTime))
                      }
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                      {job.status === 'running' && (
                        <IconButton size="small">
                          <Stop />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Integration Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Webhook />}>
            Webhooks
          </Button>
          <Button variant="contained" startIcon={<Add />}>
            Add Integration
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Connectors" />
          <Tab label="Integrations" />
          <Tab 
            label={
              <Badge badgeContent={syncJobs.filter(j => j.status === 'running').length} color="primary">
                Sync Jobs
              </Badge>
            } 
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {renderOverview()}
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        {renderConnectors()}
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        {renderIntegrations()}
      </TabPanel>
      <TabPanel value={activeTab} index={3}>
        {renderSyncJobs()}
      </TabPanel>

      {/* Configuration Dialog */}
      <Dialog
        open={configDialog.open}
        onClose={() => setConfigDialog({ open: false, connector: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Configure {configDialog.connector?.name} Integration
        </DialogTitle>
        <DialogContent>
          {configDialog.connector && (
            <Box sx={{ mt: 2 }}>
              <Stepper activeStep={0} orientation="vertical">
                <Step>
                  <StepLabel>Authentication</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Configuration</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Field Mapping</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Test Connection</StepLabel>
                </Step>
              </Stepper>
              
              <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="API Key"
                  type="password"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="API Secret"
                  type="password"
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Sync Frequency</InputLabel>
                  <Select label="Sync Frequency">
                    <MenuItem value="hourly">Hourly</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="manual">Manual</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={<Switch />}
                  label="Enable automatic sync"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog({ open: false, connector: null })}>
            Cancel
          </Button>
          <Button variant="outlined">
            Test Connection
          </Button>
          <Button variant="contained">
            Save Integration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sync Dialog */}
      <Dialog
        open={syncDialog.open}
        onClose={() => setSyncDialog({ open: false, integration: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Start Sync - {syncDialog.integration?.connectorName}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Sync Type</InputLabel>
            <Select label="Sync Type">
              <MenuItem value="full">Full Sync</MenuItem>
              <MenuItem value="incremental">Incremental Sync</MenuItem>
              <MenuItem value="delta">Delta Sync</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Data Types</InputLabel>
            <Select label="Data Types" multiple>
              <MenuItem value="customers">Customers</MenuItem>
              <MenuItem value="products">Products</MenuItem>
              <MenuItem value="orders">Orders</MenuItem>
              <MenuItem value="analytics">Analytics</MenuItem>
            </Select>
          </FormControl>
          <Alert severity="info">
            This will sync data from the external system to TRADEAI. The process may take several minutes depending on the amount of data.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncDialog({ open: false, integration: null })}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              startSync(syncDialog.integration?.id);
              setSyncDialog({ open: false, integration: null });
            }}
          >
            Start Sync
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntegrationDashboard;