import React, { useState, useEffect } from 'react';
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
  IconButton,
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
  CircularProgress
} from '@mui/material';
import {
  Integration,
  Webhook,
  Api,
  Refresh,
  Add,
  Delete,
  PlayArrow,
  Pause,
  Stop,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  Sync,
  Assessment,
  Email,
  ShoppingCart,
  Business,
  Analytics,
  Campaign
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
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

      const response = await api.get('/integrations/dashboard');
      const data = response.data;

      setDashboardData(data);
      setIntegrations(data.integrations?.list || []);
      setWebhooks(data.webhooks?.list || []);
      setApiAnalytics(data.api?.analytics || null);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard data:', error);
      setDashboardData(null);
      setIntegrations([]);
      setWebhooks([]);
      setApiAnalytics(null);
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
