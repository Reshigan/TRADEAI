import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Storage as StorageIcon,
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  CloudSync as CloudSyncIcon,
  DataObject as DataObjectIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { companyAdminApi } from '../../services/enterpriseApi';

const TabPanel = ({ children, value, index, ...other }) => (
  <div role="tabpanel" hidden={value !== index} {...other}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const ConnectionStatusChip = ({ status }) => {
  const statusConfig = {
    connected: { color: 'success', icon: <CheckCircleIcon fontSize="small" />, label: 'Connected' },
    configured: { color: 'info', icon: <SettingsIcon fontSize="small" />, label: 'Configured' },
    error: { color: 'error', icon: <ErrorIcon fontSize="small" />, label: 'Error' },
    disconnected: { color: 'warning', icon: <WarningIcon fontSize="small" />, label: 'Disconnected' },
    not_configured: { color: 'default', icon: <SettingsIcon fontSize="small" />, label: 'Not Configured' }
  };

  const config = statusConfig[status] || statusConfig.not_configured;

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
    />
  );
};

const ERPSettingsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [settings, setSettings] = useState(null);
  const [syncHistory, setSyncHistory] = useState([]);

  useEffect(() => {
    loadSettings();
    loadSyncHistory();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await companyAdminApi.getERPSettings();
      setSettings(response.data);
    } catch (err) {
      setError('Failed to load ERP settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncHistory = async () => {
    try {
      const response = await companyAdminApi.getERPSyncHistory(20);
      setSyncHistory(response.data || []);
    } catch (err) {
      console.error('Failed to load sync history:', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await companyAdminApi.updateERPSettings(settings);
      setSuccess('ERP settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save ERP settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestSAP = async () => {
    try {
      setTesting(true);
      setError(null);
      const response = await companyAdminApi.testSAPConnection();
      if (response.data.status === 'connected') {
        setSuccess('SAP connection successful');
        setSettings(prev => ({
          ...prev,
          sap: { ...prev.sap, connectionStatus: 'connected' }
        }));
      } else {
        setError('SAP connection failed');
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('SAP connection test failed');
      console.error(err);
    } finally {
      setTesting(false);
    }
  };

  const handleTestERP = async () => {
    try {
      setTesting(true);
      setError(null);
      const response = await companyAdminApi.testERPConnection();
      if (response.data.status === 'connected') {
        setSuccess('ERP connection successful');
        setSettings(prev => ({
          ...prev,
          erp: { ...prev.erp, connectionStatus: 'connected' }
        }));
      } else {
        setError('ERP connection failed');
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('ERP connection test failed');
      console.error(err);
    } finally {
      setTesting(false);
    }
  };

  const handleSyncMasterData = async (dataType) => {
    try {
      setSyncing(true);
      setError(null);
      const response = await companyAdminApi.syncMasterData(dataType);
      setSuccess(`${dataType} sync completed: ${response.data.stats.recordsProcessed} records processed`);
      loadSyncHistory();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(`Failed to sync ${dataType}`);
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncSalesData = async () => {
    try {
      setSyncing(true);
      setError(null);
      const response = await companyAdminApi.syncSalesData();
      setSuccess(`Sales data sync completed: ${response.data.stats.recordsProcessed} records processed`);
      loadSyncHistory();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError('Failed to sync sales data');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const updateSAPSettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      sap: { ...prev.sap, [field]: value }
    }));
  };

  const updateERPSettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      erp: { ...prev.erp, [field]: value }
    }));
  };

  const updateMasterDataSettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      masterData: { ...prev.masterData, [field]: value }
    }));
  };

  const updateSalesDataSettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      salesData: { ...prev.salesData, [field]: value }
    }));
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
          <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
            ERP Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure ERP connections for master data and real-time sales integration
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <StorageIcon />}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Paper sx={{ borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<StorageIcon />} label="SAP Integration" iconPosition="start" />
          <Tab icon={<CloudSyncIcon />} label="ERP Connection" iconPosition="start" />
          <Tab icon={<DataObjectIcon />} label="Master Data" iconPosition="start" />
          <Tab icon={<TimelineIcon />} label="Sales Data" iconPosition="start" />
          <Tab icon={<SyncIcon />} label="Sync History" iconPosition="start" />
        </Tabs>

        {/* SAP Integration Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.sap?.enabled || false}
                        onChange={(e) => updateSAPSettings('enabled', e.target.checked)}
                      />
                    }
                    label="Enable SAP Integration"
                  />
                  <ConnectionStatusChip status={settings?.sap?.connectionStatus} />
                </Box>
              </Grid>

              {settings?.sap?.enabled && (
                <>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Connection Type</InputLabel>
                      <Select
                        value={settings?.sap?.connectionType || 'api'}
                        onChange={(e) => updateSAPSettings('connectionType', e.target.value)}
                        label="Connection Type"
                      >
                        <MenuItem value="direct">Direct Connection</MenuItem>
                        <MenuItem value="api">REST API</MenuItem>
                        <MenuItem value="middleware">Middleware</MenuItem>
                        <MenuItem value="file">File-based</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Host / Base URL"
                      value={settings?.sap?.host || settings?.sap?.baseUrl || ''}
                      onChange={(e) => updateSAPSettings('host', e.target.value)}
                      placeholder="sap.company.com or https://api.sap.com"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Client ID"
                      value={settings?.sap?.client || ''}
                      onChange={(e) => updateSAPSettings('client', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="System ID"
                      value={settings?.sap?.systemId || ''}
                      onChange={(e) => updateSAPSettings('systemId', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      value={settings?.sap?.username || ''}
                      onChange={(e) => updateSAPSettings('username', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Password / API Key"
                      value={settings?.sap?.password || settings?.sap?.apiKey || ''}
                      onChange={(e) => updateSAPSettings('password', e.target.value)}
                      placeholder="Enter password or API key"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                      Sync Settings
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings?.sap?.syncEnabled || false}
                          onChange={(e) => updateSAPSettings('syncEnabled', e.target.checked)}
                        />
                      }
                      label="Enable Automatic Sync"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Sync Schedule</InputLabel>
                      <Select
                        value={settings?.sap?.syncSchedule || 'daily'}
                        onChange={(e) => updateSAPSettings('syncSchedule', e.target.value)}
                        label="Sync Schedule"
                      >
                        <MenuItem value="manual">Manual Only</MenuItem>
                        <MenuItem value="hourly">Hourly</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Master Data Mapping</Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings?.sap?.masterDataMapping?.customers || false}
                            onChange={(e) => updateSAPSettings('masterDataMapping', {
                              ...settings?.sap?.masterDataMapping,
                              customers: e.target.checked
                            })}
                          />
                        }
                        label="Customers"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings?.sap?.masterDataMapping?.products || false}
                            onChange={(e) => updateSAPSettings('masterDataMapping', {
                              ...settings?.sap?.masterDataMapping,
                              products: e.target.checked
                            })}
                          />
                        }
                        label="Products"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings?.sap?.masterDataMapping?.pricing || false}
                            onChange={(e) => updateSAPSettings('masterDataMapping', {
                              ...settings?.sap?.masterDataMapping,
                              pricing: e.target.checked
                            })}
                          />
                        }
                        label="Pricing"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings?.sap?.masterDataMapping?.inventory || false}
                            onChange={(e) => updateSAPSettings('masterDataMapping', {
                              ...settings?.sap?.masterDataMapping,
                              inventory: e.target.checked
                            })}
                          />
                        }
                        label="Inventory"
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      onClick={handleTestSAP}
                      disabled={testing}
                      startIcon={testing ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                    >
                      {testing ? 'Testing...' : 'Test Connection'}
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </TabPanel>

        {/* Generic ERP Connection Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.erp?.enabled || false}
                        onChange={(e) => updateERPSettings('enabled', e.target.checked)}
                      />
                    }
                    label="Enable ERP Integration"
                  />
                  <ConnectionStatusChip status={settings?.erp?.connectionStatus} />
                </Box>
              </Grid>

              {settings?.erp?.enabled && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="ERP System Name"
                      value={settings?.erp?.systemName || ''}
                      onChange={(e) => updateERPSettings('systemName', e.target.value)}
                      placeholder="e.g., Oracle, Microsoft Dynamics, NetSuite"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Connection Type</InputLabel>
                      <Select
                        value={settings?.erp?.connectionType || 'rest_api'}
                        onChange={(e) => updateERPSettings('connectionType', e.target.value)}
                        label="Connection Type"
                      >
                        <MenuItem value="rest_api">REST API</MenuItem>
                        <MenuItem value="soap">SOAP</MenuItem>
                        <MenuItem value="odbc">ODBC</MenuItem>
                        <MenuItem value="file_import">File Import</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Base URL"
                      value={settings?.erp?.baseUrl || ''}
                      onChange={(e) => updateERPSettings('baseUrl', e.target.value)}
                      placeholder="https://erp.company.com/api"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="API Key"
                      type="password"
                      value={settings?.erp?.apiKey || ''}
                      onChange={(e) => updateERPSettings('apiKey', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      value={settings?.erp?.username || ''}
                      onChange={(e) => updateERPSettings('username', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings?.erp?.syncEnabled || false}
                          onChange={(e) => updateERPSettings('syncEnabled', e.target.checked)}
                        />
                      }
                      label="Enable Automatic Sync"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Sync Schedule</InputLabel>
                      <Select
                        value={settings?.erp?.syncSchedule || 'daily'}
                        onChange={(e) => updateERPSettings('syncSchedule', e.target.value)}
                        label="Sync Schedule"
                      >
                        <MenuItem value="manual">Manual Only</MenuItem>
                        <MenuItem value="hourly">Hourly</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      onClick={handleTestERP}
                      disabled={testing}
                      startIcon={testing ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                    >
                      {testing ? 'Testing...' : 'Test Connection'}
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </TabPanel>

        {/* Master Data Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>Master Data Sources</Typography>
              </Grid>

              {/* Customer Master */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Customer Master</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Last sync: {settings?.masterData?.lastCustomerSync 
                            ? new Date(settings.masterData.lastCustomerSync).toLocaleString() 
                            : 'Never'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <InputLabel>Source</InputLabel>
                          <Select
                            value={settings?.masterData?.customerSource || 'manual'}
                            onChange={(e) => updateMasterDataSettings('customerSource', e.target.value)}
                            label="Source"
                          >
                            <MenuItem value="manual">Manual</MenuItem>
                            <MenuItem value="erp">ERP</MenuItem>
                            <MenuItem value="sap">SAP</MenuItem>
                            <MenuItem value="csv_import">CSV Import</MenuItem>
                          </Select>
                        </FormControl>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleSyncMasterData('customers')}
                          disabled={syncing}
                          startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
                        >
                          Sync Now
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Product Master */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Product Master</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Last sync: {settings?.masterData?.lastProductSync 
                            ? new Date(settings.masterData.lastProductSync).toLocaleString() 
                            : 'Never'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <InputLabel>Source</InputLabel>
                          <Select
                            value={settings?.masterData?.productSource || 'manual'}
                            onChange={(e) => updateMasterDataSettings('productSource', e.target.value)}
                            label="Source"
                          >
                            <MenuItem value="manual">Manual</MenuItem>
                            <MenuItem value="erp">ERP</MenuItem>
                            <MenuItem value="sap">SAP</MenuItem>
                            <MenuItem value="csv_import">CSV Import</MenuItem>
                          </Select>
                        </FormControl>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleSyncMasterData('products')}
                          disabled={syncing}
                          startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
                        >
                          Sync Now
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Pricing Master */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Pricing Master</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Last sync: {settings?.masterData?.lastPricingSync 
                            ? new Date(settings.masterData.lastPricingSync).toLocaleString() 
                            : 'Never'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <InputLabel>Source</InputLabel>
                          <Select
                            value={settings?.masterData?.pricingSource || 'manual'}
                            onChange={(e) => updateMasterDataSettings('pricingSource', e.target.value)}
                            label="Source"
                          >
                            <MenuItem value="manual">Manual</MenuItem>
                            <MenuItem value="erp">ERP</MenuItem>
                            <MenuItem value="sap">SAP</MenuItem>
                            <MenuItem value="csv_import">CSV Import</MenuItem>
                          </Select>
                        </FormControl>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleSyncMasterData('pricing')}
                          disabled={syncing}
                          startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
                        >
                          Sync Now
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Sales Data Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.salesData?.enabled || false}
                        onChange={(e) => updateSalesDataSettings('enabled', e.target.checked)}
                      />
                    }
                    label="Enable Sales Data Integration"
                  />
                  <ConnectionStatusChip status={settings?.salesData?.connectionStatus} />
                </Box>
              </Grid>

              {settings?.salesData?.enabled && (
                <>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Data Source</InputLabel>
                      <Select
                        value={settings?.salesData?.source || 'manual'}
                        onChange={(e) => updateSalesDataSettings('source', e.target.value)}
                        label="Data Source"
                      >
                        <MenuItem value="manual">Manual Entry</MenuItem>
                        <MenuItem value="erp">ERP System</MenuItem>
                        <MenuItem value="sap">SAP</MenuItem>
                        <MenuItem value="pos">POS System</MenuItem>
                        <MenuItem value="api">External API</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                      Real-time Feed Settings
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings?.salesData?.realtimeFeedEnabled || false}
                          onChange={(e) => updateSalesDataSettings('realtimeFeedEnabled', e.target.checked)}
                        />
                      }
                      label="Enable Real-time Feed"
                    />
                  </Grid>

                  {settings?.salesData?.realtimeFeedEnabled && (
                    <>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Real-time Feed URL"
                          value={settings?.salesData?.realtimeFeedUrl || ''}
                          onChange={(e) => updateSalesDataSettings('realtimeFeedUrl', e.target.value)}
                          placeholder="wss://sales-feed.company.com/stream"
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="password"
                          label="Feed API Key"
                          value={settings?.salesData?.realtimeFeedApiKey || ''}
                          onChange={(e) => updateSalesDataSettings('realtimeFeedApiKey', e.target.value)}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Feed Format</InputLabel>
                          <Select
                            value={settings?.salesData?.realtimeFeedFormat || 'json'}
                            onChange={(e) => updateSalesDataSettings('realtimeFeedFormat', e.target.value)}
                            label="Feed Format"
                          >
                            <MenuItem value="json">JSON</MenuItem>
                            <MenuItem value="xml">XML</MenuItem>
                            <MenuItem value="csv">CSV</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                      Batch Import Settings
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings?.salesData?.batchImportEnabled || false}
                          onChange={(e) => updateSalesDataSettings('batchImportEnabled', e.target.checked)}
                        />
                      }
                      label="Enable Batch Import"
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Import Schedule</InputLabel>
                      <Select
                        value={settings?.salesData?.batchImportSchedule || 'daily'}
                        onChange={(e) => updateSalesDataSettings('batchImportSchedule', e.target.value)}
                        label="Import Schedule"
                      >
                        <MenuItem value="hourly">Hourly</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Import Time"
                      type="time"
                      value={settings?.salesData?.batchImportTime || '02:00'}
                      onChange={(e) => updateSalesDataSettings('batchImportTime', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle2">Last Batch Import</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {settings?.salesData?.lastBatchImport 
                                ? `${new Date(settings.salesData.lastBatchImport).toLocaleString()} - ${settings.salesData.lastBatchImportRecords || 0} records`
                                : 'Never'}
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            onClick={handleSyncSalesData}
                            disabled={syncing}
                            startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon />}
                          >
                            {syncing ? 'Syncing...' : 'Sync Sales Data Now'}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                      Data Retention
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Retention Period (months)"
                      value={settings?.salesData?.retentionPeriodMonths || 24}
                      onChange={(e) => updateSalesDataSettings('retentionPeriodMonths', parseInt(e.target.value))}
                      inputProps={{ min: 1, max: 120 }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </TabPanel>

        {/* Sync History Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Sync History</Typography>
              <Tooltip title="Refresh">
                <IconButton onClick={loadSyncHistory}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Processed</TableCell>
                    <TableCell align="right">Created</TableCell>
                    <TableCell align="right">Updated</TableCell>
                    <TableCell align="right">Failed</TableCell>
                    <TableCell align="right">Duration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {syncHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary">No sync history available</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    syncHistory.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Chip label={record.syncType} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{new Date(record.syncedAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={record.status}
                            size="small"
                            color={record.status === 'success' ? 'success' : record.status === 'partial' ? 'warning' : 'error'}
                          />
                        </TableCell>
                        <TableCell align="right">{record.recordsProcessed || 0}</TableCell>
                        <TableCell align="right">{record.recordsCreated || 0}</TableCell>
                        <TableCell align="right">{record.recordsUpdated || 0}</TableCell>
                        <TableCell align="right">{record.recordsFailed || 0}</TableCell>
                        <TableCell align="right">{record.duration || 0}s</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ERPSettingsPage;
