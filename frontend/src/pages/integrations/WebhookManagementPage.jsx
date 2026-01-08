import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Grid, Alert, CircularProgress,
  FormControlLabel, Switch, Chip, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Checkbox, FormGroup, Tooltip, Paper
} from '@mui/material';
import {
  Add, Delete, Edit, Send, Refresh,
  CheckCircle, Error, Warning, History
} from '@mui/icons-material';
import api from '../../services/api';

const availableEvents = [
  { event: 'promotion.created', description: 'When a new promotion is created', category: 'Promotions' },
  { event: 'promotion.updated', description: 'When a promotion is updated', category: 'Promotions' },
  { event: 'promotion.approved', description: 'When a promotion is approved', category: 'Promotions' },
  { event: 'promotion.rejected', description: 'When a promotion is rejected', category: 'Promotions' },
  { event: 'promotion.completed', description: 'When a promotion is completed', category: 'Promotions' },
  { event: 'budget.created', description: 'When a new budget is created', category: 'Budgets' },
  { event: 'budget.updated', description: 'When a budget is updated', category: 'Budgets' },
  { event: 'budget.approved', description: 'When a budget is approved', category: 'Budgets' },
  { event: 'budget.threshold_reached', description: 'When budget utilization reaches threshold', category: 'Budgets' },
  { event: 'trade_spend.created', description: 'When a new trade spend is created', category: 'Trade Spends' },
  { event: 'trade_spend.approved', description: 'When a trade spend is approved', category: 'Trade Spends' },
  { event: 'trade_spend.rejected', description: 'When a trade spend is rejected', category: 'Trade Spends' },
  { event: 'claim.created', description: 'When a new claim is created', category: 'Claims' },
  { event: 'claim.approved', description: 'When a claim is approved', category: 'Claims' },
  { event: 'claim.rejected', description: 'When a claim is rejected', category: 'Claims' },
  { event: 'claim.paid', description: 'When a claim is paid', category: 'Claims' },
  { event: 'deduction.created', description: 'When a new deduction is created', category: 'Deductions' },
  { event: 'deduction.matched', description: 'When a deduction is matched', category: 'Deductions' },
  { event: 'deduction.disputed', description: 'When a deduction is disputed', category: 'Deductions' },
  { event: 'settlement.created', description: 'When a new settlement is created', category: 'Settlements' },
  { event: 'settlement.completed', description: 'When a settlement is completed', category: 'Settlements' },
  { event: 'import.completed', description: 'When a data import completes', category: 'System' },
  { event: 'import.failed', description: 'When a data import fails', category: 'System' },
  { event: 'alert.triggered', description: 'When a system alert is triggered', category: 'System' }
];

const eventCategories = [...new Set(availableEvents.map(e => e.category))];

export default function WebhookManagementPage() {
  const [loading, setLoading] = useState(true);
  const [webhooks, setWebhooks] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [testing, setTesting] = useState(null);
  const [showSecret, setShowSecret] = useState(null);
  const [deliveriesDialogOpen, setDeliveriesDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    events: [],
    isActive: true,
    retryPolicy: {
      maxRetries: 3,
      retryDelayMs: 1000,
      backoffMultiplier: 2
    },
    authentication: {
      type: 'none'
    }
  });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/webhooks');
      setWebhooks(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (webhook = null) => {
    if (webhook) {
      setEditingWebhook(webhook);
      setFormData({
        name: webhook.name,
        description: webhook.description || '',
        url: webhook.url,
        events: webhook.events || [],
        isActive: webhook.isActive,
        retryPolicy: webhook.retryPolicy || { maxRetries: 3, retryDelayMs: 1000, backoffMultiplier: 2 },
        authentication: webhook.authentication || { type: 'none' }
      });
    } else {
      setEditingWebhook(null);
      setFormData({
        name: '',
        description: '',
        url: '',
        events: [],
        isActive: true,
        retryPolicy: { maxRetries: 3, retryDelayMs: 1000, backoffMultiplier: 2 },
        authentication: { type: 'none' }
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingWebhook(null);
  };

  const handleSave = async () => {
    try {
      setError(null);
      if (!formData.name || !formData.url || formData.events.length === 0) {
        setError('Name, URL, and at least one event are required');
        return;
      }

      if (editingWebhook) {
        await api.put(`/webhooks/${editingWebhook._id}`, formData);
        setSuccess('Webhook updated successfully');
      } else {
        const response = await api.post('/webhooks', formData);
        if (response.data.data?.secret) {
          setSuccess(`Webhook created! Secret: ${response.data.data.secret} (save this - it won't be shown again)`);
        } else {
          setSuccess('Webhook created successfully');
        }
      }
      handleCloseDialog();
      loadWebhooks();
      setTimeout(() => setSuccess(null), 10000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save webhook');
    }
  };

  const handleDelete = async (webhookId) => {
    if (!window.confirm('Are you sure you want to delete this webhook?')) return;
    try {
      await api.delete(`/webhooks/${webhookId}`);
      setSuccess('Webhook deleted successfully');
      loadWebhooks();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete webhook');
    }
  };

  const handleTest = async (webhookId) => {
    try {
      setTesting(webhookId);
      const response = await api.post(`/webhooks/${webhookId}/test`);
      if (response.data.success) {
        setSuccess(`Test delivery successful (${response.data.data.responseTimeMs}ms)`);
      } else {
        setError(`Test delivery failed: ${response.data.data.error || 'Unknown error'}`);
      }
      setTimeout(() => { setSuccess(null); setError(null); }, 5000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Test failed');
    } finally {
      setTesting(null);
    }
  };

  const handleToggleActive = async (webhook) => {
    try {
      await api.put(`/webhooks/${webhook._id}`, { isActive: !webhook.isActive });
      loadWebhooks();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update webhook');
    }
  };

  const handleViewDeliveries = async (webhook) => {
    setSelectedWebhook(webhook);
    setDeliveriesDialogOpen(true);
    setLoadingDeliveries(true);
    try {
      const response = await api.get(`/webhooks/${webhook._id}/deliveries`);
      setDeliveries(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load deliveries');
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const handleEventToggle = (event) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const handleCategoryToggle = (category) => {
    const categoryEvents = availableEvents.filter(e => e.category === category).map(e => e.event);
    const allSelected = categoryEvents.every(e => formData.events.includes(e));
    
    setFormData(prev => ({
      ...prev,
      events: allSelected
        ? prev.events.filter(e => !categoryEvents.includes(e))
        : [...new Set([...prev.events, ...categoryEvents])]
    }));
  };

  const getStatusChip = (webhook) => {
    if (!webhook.isActive) {
      return <Chip label="Inactive" size="small" color="default" />;
    }
    const successRate = webhook.stats?.successRate || 0;
    if (successRate >= 95) {
      return <Chip label="Healthy" size="small" color="success" icon={<CheckCircle />} />;
    } else if (successRate >= 80) {
      return <Chip label="Degraded" size="small" color="warning" icon={<Warning />} />;
    } else if (webhook.stats?.totalDeliveries > 0) {
      return <Chip label="Failing" size="small" color="error" icon={<Error />} />;
    }
    return <Chip label="No Data" size="small" color="default" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Webhook Management</Typography>
          <Typography variant="body1" color="text.secondary">
            Configure webhooks to receive real-time notifications for key events
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadWebhooks}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add Webhook
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {webhooks.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No webhooks configured
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a webhook to receive real-time notifications when events occur in TRADEAI
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Create Your First Webhook
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>URL</TableCell>
                <TableCell>Events</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Deliveries</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook._id}>
                  <TableCell>
                    <Typography variant="subtitle2">{webhook.name}</Typography>
                    {webhook.description && (
                      <Typography variant="caption" color="text.secondary">
                        {webhook.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {webhook.url.length > 40 ? webhook.url.substring(0, 40) + '...' : webhook.url}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={webhook.events?.join(', ')}>
                      <Chip label={`${webhook.events?.length || 0} events`} size="small" />
                    </Tooltip>
                  </TableCell>
                  <TableCell>{getStatusChip(webhook)}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {webhook.stats?.totalDeliveries || 0} total
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {webhook.stats?.successRate || 0}% success
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Deliveries">
                      <IconButton size="small" onClick={() => handleViewDeliveries(webhook)}>
                        <History />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Test Webhook">
                      <IconButton
                        size="small"
                        onClick={() => handleTest(webhook._id)}
                        disabled={testing === webhook._id}
                      >
                        {testing === webhook._id ? <CircularProgress size={16} /> : <Send />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenDialog(webhook)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(webhook._id)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                    <Switch
                      size="small"
                      checked={webhook.isActive}
                      onChange={() => handleToggleActive(webhook)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingWebhook ? 'Edit Webhook' : 'Create Webhook'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="URL"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://your-server.com/webhook"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Events to Subscribe</Typography>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                {eventCategories.map((category) => {
                  const categoryEvents = availableEvents.filter(e => e.category === category);
                  const allSelected = categoryEvents.every(e => formData.events.includes(e.event));
                  const someSelected = categoryEvents.some(e => formData.events.includes(e.event));
                  
                  return (
                    <Box key={category} sx={{ mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected && !allSelected}
                            onChange={() => handleCategoryToggle(category)}
                          />
                        }
                        label={<Typography variant="subtitle2">{category}</Typography>}
                      />
                      <Box sx={{ ml: 3 }}>
                        <FormGroup row>
                          {categoryEvents.map((evt) => (
                            <FormControlLabel
                              key={evt.event}
                              control={
                                <Checkbox
                                  size="small"
                                  checked={formData.events.includes(evt.event)}
                                  onChange={() => handleEventToggle(evt.event)}
                                />
                              }
                              label={
                                <Tooltip title={evt.description}>
                                  <Typography variant="body2">{evt.event}</Typography>
                                </Tooltip>
                              }
                            />
                          ))}
                        </FormGroup>
                      </Box>
                    </Box>
                  );
                })}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Authentication Type"
                value={formData.authentication.type}
                onChange={(e) => setFormData({
                  ...formData,
                  authentication: { ...formData.authentication, type: e.target.value }
                })}
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="basic">Basic Auth</MenuItem>
                <MenuItem value="bearer">Bearer Token</MenuItem>
                <MenuItem value="api_key">API Key</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Retries"
                value={formData.retryPolicy.maxRetries}
                onChange={(e) => setFormData({
                  ...formData,
                  retryPolicy: { ...formData.retryPolicy, maxRetries: parseInt(e.target.value) || 3 }
                })}
                inputProps={{ min: 0, max: 10 }}
              />
            </Grid>
            {formData.authentication.type === 'basic' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={formData.authentication.username || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      authentication: { ...formData.authentication, username: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Password"
                    value={formData.authentication.password || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      authentication: { ...formData.authentication, password: e.target.value }
                    })}
                  />
                </Grid>
              </>
            )}
            {formData.authentication.type === 'bearer' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Bearer Token"
                  value={formData.authentication.token || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    authentication: { ...formData.authentication, token: e.target.value }
                  })}
                />
              </Grid>
            )}
            {formData.authentication.type === 'api_key' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Header Name"
                    value={formData.authentication.apiKeyHeader || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      authentication: { ...formData.authentication, apiKeyHeader: e.target.value }
                    })}
                    placeholder="X-API-Key"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="API Key Value"
                    value={formData.authentication.apiKeyValue || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      authentication: { ...formData.authentication, apiKeyValue: e.target.value }
                    })}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingWebhook ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deliveriesDialogOpen} onClose={() => setDeliveriesDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Delivery History - {selectedWebhook?.name}
        </DialogTitle>
        <DialogContent>
          {loadingDeliveries ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : deliveries.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No deliveries yet
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Response</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery._id}>
                      <TableCell>
                        <Typography variant="body2">{delivery.event}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={delivery.status}
                          size="small"
                          color={delivery.status === 'success' ? 'success' : delivery.status === 'failed' ? 'error' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{delivery.responseStatus || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{delivery.responseTimeMs || '-'}ms</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(delivery.createdAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveriesDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
