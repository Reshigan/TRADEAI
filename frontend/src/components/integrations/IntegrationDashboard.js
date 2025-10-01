import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Badge,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add,
  Settings,
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