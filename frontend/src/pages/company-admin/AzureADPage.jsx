import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Grid, Alert, CircularProgress,
  FormControlLabel, Switch, Card, CardContent, Chip, Divider, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { 
  Save, Sync, CheckCircle, Error, CloudSync, Settings, History,
  PlayArrow, Refresh
} from '@mui/icons-material';
import enterpriseApi from '../../services/enterpriseApi';
import { formatLabel } from '../../utils/formatters';

const syncSchedules = [
  { value: 'manual', label: 'Manual Only' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' }
];

export default function AzureADPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [config, setConfig] = useState({
    tenantId: '',
    clientId: '',
    clientSecret: '',
    directoryId: '',
    syncEnabled: false,
    syncSchedule: 'daily',
    connectionStatus: 'not_configured',
    lastSyncAt: null,
    lastSyncStatus: null,
    lastSyncStats: null,
    syncHistory: []
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await enterpriseApi.companyAdmin.getAzureADConfig();
      if (response.data) {
        setConfig(prev => ({ ...prev, ...response.data }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load Azure AD configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await enterpriseApi.companyAdmin.saveAzureADConfig({
        tenantId: config.tenantId,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        directoryId: config.directoryId,
        syncEnabled: config.syncEnabled,
        syncSchedule: config.syncSchedule
      });
      setSuccess('Configuration saved successfully');
      setTimeout(() => setSuccess(null), 3000);
      loadConfig();
    } catch (err) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setError(null);
      const response = await enterpriseApi.companyAdmin.testAzureADConnection();
      if (response.data.status === 'connected') {
        setSuccess('Connection successful');
        setConfig(prev => ({ ...prev, connectionStatus: 'connected' }));
      } else {
        setError('Connection failed');
        setConfig(prev => ({ ...prev, connectionStatus: 'error' }));
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Connection test failed');
      setConfig(prev => ({ ...prev, connectionStatus: 'error' }));
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      const response = await enterpriseApi.companyAdmin.syncAzureAD();
      setSuccess(`Sync completed: ${response.data.stats.employeesCreated} employees created, ${response.data.stats.employeesUpdated} updated`);
      loadConfig();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'success';
      case 'configured': return 'info';
      case 'error': return 'error';
      case 'disconnected': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckCircle color="success" />;
      case 'error': return <Error color="error" />;
      default: return <CloudSync color="action" />;
    }
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
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Azure AD Integration</Typography>
          <Typography variant="body1" color="text.secondary">
            Connect to Azure Active Directory to import employees and departments
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={loadConfig}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Save />} 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Settings sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Connection Settings</Typography>
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon(config.connectionStatus)}
                  <Chip 
                    label={config.connectionStatus.replace('_', ' ')} 
                    size="small" 
                    color={getStatusColor(config.connectionStatus)} 
                  />
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tenant ID"
                    value={config.tenantId}
                    onChange={(e) => setConfig({ ...config, tenantId: e.target.value })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    helperText="Your Azure AD tenant ID"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Client ID"
                    value={config.clientId}
                    onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    helperText="Application (client) ID"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Client Secret"
                    value={config.clientSecret}
                    onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                    placeholder="Enter client secret"
                    helperText="Leave blank to keep existing secret"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Directory ID"
                    value={config.directoryId}
                    onChange={(e) => setConfig({ ...config, directoryId: e.target.value })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    helperText="Optional: Directory (tenant) ID"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={handleTestConnection}
                  disabled={testing || !config.tenantId || !config.clientId}
                  startIcon={testing ? <CircularProgress size={16} /> : <CheckCircle />}
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Sync sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Sync Settings</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.syncEnabled}
                        onChange={(e) => setConfig({ ...config, syncEnabled: e.target.checked })}
                      />
                    }
                    label="Enable Automatic Sync"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Sync Schedule"
                    value={config.syncSchedule}
                    onChange={(e) => setConfig({ ...config, syncSchedule: e.target.value })}
                    disabled={!config.syncEnabled}
                  >
                    {syncSchedules.map((s) => (
                      <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2">Manual Sync</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sync employees and departments from Azure AD now
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
                  onClick={handleSync}
                  disabled={syncing || config.connectionStatus !== 'connected'}
                >
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Last Sync</Typography>
              {config.lastSyncAt ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(config.lastSyncAt).toLocaleString()}
                  </Typography>
                  <Chip 
                    label={config.lastSyncStatus} 
                    size="small" 
                    color={config.lastSyncStatus === 'success' ? 'success' : 'warning'}
                    sx={{ mt: 1 }}
                  />
                  {config.lastSyncStats && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Employees Created: {config.lastSyncStats.employeesCreated}
                      </Typography>
                      <Typography variant="body2">
                        Employees Updated: {config.lastSyncStats.employeesUpdated}
                      </Typography>
                      <Typography variant="body2">
                        Departments Created: {config.lastSyncStats.departmentsCreated}
                      </Typography>
                      <Typography variant="body2">
                        Duration: {config.lastSyncStats.duration}s
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No sync performed yet
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <History sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Sync History</Typography>
              </Box>
              {config.syncHistory && config.syncHistory.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Records</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {config.syncHistory.slice(0, 5).map((sync, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="caption">
                              {new Date(sync.syncedAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={formatLabel(sync.status)} 
                              size="small" 
                              color={sync.status === 'success' ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>
                            {(sync.stats?.employeesCreated || 0) + (sync.stats?.employeesUpdated || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No sync history available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
