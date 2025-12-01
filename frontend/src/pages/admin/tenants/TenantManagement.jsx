/**
 * Tenant Management Page
 * Admin UI for creating and managing customer tenants
 * Priority 2.2: Tenant Provisioning Admin UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Tooltip,
  LinearProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Business,
  People,
  Storage,
  Settings,
  Refresh,
  Search,
  CheckCircle,
  Warning,
  Block,
  Visibility
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../../services/api';

// Subscription plan configurations
const SUBSCRIPTION_PLANS = {
  trial: { label: 'Trial', color: 'default', maxUsers: 5, maxCustomers: 100 },
  basic: { label: 'Basic', color: 'primary', maxUsers: 10, maxCustomers: 500 },
  professional: { label: 'Professional', color: 'secondary', maxUsers: 25, maxCustomers: 2000 },
  enterprise: { label: 'Enterprise', color: 'success', maxUsers: 100, maxCustomers: 10000 },
  custom: { label: 'Custom', color: 'warning', maxUsers: null, maxCustomers: null }
};

// Status configurations
const STATUS_CONFIG = {
  active: { label: 'Active', color: 'success', icon: CheckCircle },
  suspended: { label: 'Suspended', color: 'warning', icon: Warning },
  cancelled: { label: 'Cancelled', color: 'error', icon: Block },
  expired: { label: 'Expired', color: 'default', icon: Block }
};

// Industry options
const INDUSTRIES = ['FMCG', 'Retail', 'Manufacturing', 'Distribution', 'Other'];

// Company size options
const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (1-10)' },
  { value: 'small', label: 'Small (11-50)' },
  { value: 'medium', label: 'Medium (51-200)' },
  { value: 'large', label: 'Large (201-1000)' },
  { value: 'enterprise', label: 'Enterprise (1000+)' }
];

const TenantManagement = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  // State
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' | 'edit' | 'view'
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    companyInfo: {
      legalName: '',
      registrationNumber: '',
      taxId: '',
      industry: 'FMCG',
      companySize: 'small'
    },
    contactInfo: {
      primaryContact: {
        name: '',
        email: '',
        phone: '',
        position: ''
      },
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: ''
      }
    },
    subscription: {
      plan: 'trial',
      status: 'active'
    },
    limits: {
      maxUsers: 5,
      maxStorageGB: 10,
      maxCustomers: 1000,
      maxProducts: 5000,
      maxPromotions: 100
    },
    features: {
      multiCurrency: false,
      advancedAnalytics: false,
      aiPredictions: false,
      customReporting: false,
      apiAccess: false,
      sapIntegration: false,
      excelImportExport: true,
      emailNotifications: true,
      workflowApprovals: false,
      auditLogging: false,
      dataBackup: true,
      ssoIntegration: false
    },
    settings: {
      timezone: 'UTC',
      currency: 'USD',
      language: 'en'
    }
  });

  // Fetch tenants
  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenants');
      setTenants(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      enqueueSnackbar('Failed to load tenants', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/tenants/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
    fetchStats();
  }, [fetchTenants, fetchStats]);

  // Handle form changes
  const handleFormChange = (field, value) => {
    setFormData(prev => {
      const fields = field.split('.');
      if (fields.length === 1) {
        return { ...prev, [field]: value };
      }
      
      const newData = { ...prev };
      let current = newData;
      for (let i = 0; i < fields.length - 1; i++) {
        current[fields[i]] = { ...current[fields[i]] };
        current = current[fields[i]];
      }
      current[fields[fields.length - 1]] = value;
      return newData;
    });
  };

  // Auto-generate slug from name
  const handleNameChange = (name) => {
    handleFormChange('name', name);
    if (dialogMode === 'create') {
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      handleFormChange('slug', slug);
    }
  };

  // Open dialog
  const openDialog = (mode, tenant = null) => {
    setDialogMode(mode);
    setSelectedTenant(tenant);
    setActiveTab(0);
    
    if (tenant && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: tenant.name || '',
        slug: tenant.slug || '',
        domain: tenant.domain || '',
        companyInfo: tenant.companyInfo || formData.companyInfo,
        contactInfo: tenant.contactInfo || formData.contactInfo,
        subscription: tenant.subscription || formData.subscription,
        limits: tenant.limits || formData.limits,
        features: tenant.features || formData.features,
        settings: tenant.settings || formData.settings
      });
    } else {
      // Reset form for create
      setFormData({
        name: '',
        slug: '',
        domain: '',
        companyInfo: {
          legalName: '',
          registrationNumber: '',
          taxId: '',
          industry: 'FMCG',
          companySize: 'small'
        },
        contactInfo: {
          primaryContact: { name: '', email: '', phone: '', position: '' },
          address: { street: '', city: '', state: '', country: '', postalCode: '' }
        },
        subscription: { plan: 'trial', status: 'active' },
        limits: { maxUsers: 5, maxStorageGB: 10, maxCustomers: 1000, maxProducts: 5000, maxPromotions: 100 },
        features: {
          multiCurrency: false, advancedAnalytics: false, aiPredictions: false,
          customReporting: false, apiAccess: false, sapIntegration: false,
          excelImportExport: true, emailNotifications: true, workflowApprovals: false,
          auditLogging: false, dataBackup: true, ssoIntegration: false
        },
        settings: { timezone: 'UTC', currency: 'USD', language: 'en' }
      });
    }
    
    setDialogOpen(true);
  };

  // Save tenant
  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (dialogMode === 'create') {
        await api.post('/tenants', formData);
        enqueueSnackbar('Tenant created successfully', { variant: 'success' });
      } else {
        await api.put(`/tenants/${selectedTenant._id}`, formData);
        enqueueSnackbar('Tenant updated successfully', { variant: 'success' });
      }
      
      setDialogOpen(false);
      fetchTenants();
      fetchStats();
    } catch (error) {
      console.error('Error saving tenant:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to save tenant', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Delete tenant
  const handleDelete = async (tenant) => {
    if (!window.confirm(`Are you sure you want to deactivate tenant "${tenant.name}"?`)) {
      return;
    }
    
    try {
      await api.delete(`/tenants/${tenant._id}`);
      enqueueSnackbar('Tenant deactivated successfully', { variant: 'success' });
      fetchTenants();
      fetchStats();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      enqueueSnackbar('Failed to deactivate tenant', { variant: 'error' });
    }
  };

  // Filter tenants
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tenant.subscription?.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || tenant.subscription?.plan === filterPlan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Render stats cards
  const renderStats = () => {
    if (!stats) return null;
    
    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Business color="primary" />
                <Typography variant="h6">{stats.totalTenants || 0}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">Total Tenants</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle color="success" />
                <Typography variant="h6">{stats.activeTenants || 0}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">Active Tenants</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <People color="secondary" />
                <Typography variant="h6">{stats.totalUsers || 0}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">Total Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Storage color="warning" />
                <Typography variant="h6">{stats.totalStorageGB?.toFixed(1) || 0} GB</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">Storage Used</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render form tabs
  const renderFormTabs = () => {
    const isReadOnly = dialogMode === 'view';
    
    return (
      <>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          <Tab label="Basic Info" />
          <Tab label="Contact" />
          <Tab label="Subscription" />
          <Tab label="Features" />
          <Tab label="Settings" />
        </Tabs>
        
        {activeTab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tenant Name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={isReadOnly}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Slug"
                value={formData.slug}
                onChange={(e) => handleFormChange('slug', e.target.value)}
                disabled={isReadOnly || dialogMode === 'edit'}
                helperText="URL-friendly identifier"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Custom Domain"
                value={formData.domain}
                onChange={(e) => handleFormChange('domain', e.target.value)}
                disabled={isReadOnly}
                placeholder="tenant.example.com"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Legal Name"
                value={formData.companyInfo.legalName}
                onChange={(e) => handleFormChange('companyInfo.legalName', e.target.value)}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Industry</InputLabel>
                <Select
                  value={formData.companyInfo.industry}
                  onChange={(e) => handleFormChange('companyInfo.industry', e.target.value)}
                  disabled={isReadOnly}
                  label="Industry"
                >
                  {INDUSTRIES.map(ind => (
                    <MenuItem key={ind} value={ind}>{ind}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Company Size</InputLabel>
                <Select
                  value={formData.companyInfo.companySize}
                  onChange={(e) => handleFormChange('companyInfo.companySize', e.target.value)}
                  disabled={isReadOnly}
                  label="Company Size"
                >
                  {COMPANY_SIZES.map(size => (
                    <MenuItem key={size.value} value={size.value}>{size.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
        
        {activeTab === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Primary Contact</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Name"
                value={formData.contactInfo.primaryContact.name}
                onChange={(e) => handleFormChange('contactInfo.primaryContact.name', e.target.value)}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.contactInfo.primaryContact.email}
                onChange={(e) => handleFormChange('contactInfo.primaryContact.email', e.target.value)}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.contactInfo.primaryContact.phone}
                onChange={(e) => handleFormChange('contactInfo.primaryContact.phone', e.target.value)}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={formData.contactInfo.primaryContact.position}
                onChange={(e) => handleFormChange('contactInfo.primaryContact.position', e.target.value)}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>Address</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.contactInfo.address.street}
                onChange={(e) => handleFormChange('contactInfo.address.street', e.target.value)}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.contactInfo.address.city}
                onChange={(e) => handleFormChange('contactInfo.address.city', e.target.value)}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State/Province"
                value={formData.contactInfo.address.state}
                onChange={(e) => handleFormChange('contactInfo.address.state', e.target.value)}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                value={formData.contactInfo.address.country}
                onChange={(e) => handleFormChange('contactInfo.address.country', e.target.value)}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Postal Code"
                value={formData.contactInfo.address.postalCode}
                onChange={(e) => handleFormChange('contactInfo.address.postalCode', e.target.value)}
                disabled={isReadOnly}
              />
            </Grid>
          </Grid>
        )}
        
        {activeTab === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Subscription Plan</InputLabel>
                <Select
                  value={formData.subscription.plan}
                  onChange={(e) => handleFormChange('subscription.plan', e.target.value)}
                  disabled={isReadOnly}
                  label="Subscription Plan"
                >
                  {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                    <MenuItem key={key} value={key}>{plan.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.subscription.status}
                  onChange={(e) => handleFormChange('subscription.status', e.target.value)}
                  disabled={isReadOnly}
                  label="Status"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <MenuItem key={key} value={key}>{config.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>Resource Limits</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Users"
                value={formData.limits.maxUsers}
                onChange={(e) => handleFormChange('limits.maxUsers', parseInt(e.target.value))}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Storage (GB)"
                value={formData.limits.maxStorageGB}
                onChange={(e) => handleFormChange('limits.maxStorageGB', parseInt(e.target.value))}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Max Customers"
                value={formData.limits.maxCustomers}
                onChange={(e) => handleFormChange('limits.maxCustomers', parseInt(e.target.value))}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Max Products"
                value={formData.limits.maxProducts}
                onChange={(e) => handleFormChange('limits.maxProducts', parseInt(e.target.value))}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Max Promotions"
                value={formData.limits.maxPromotions}
                onChange={(e) => handleFormChange('limits.maxPromotions', parseInt(e.target.value))}
                disabled={isReadOnly}
              />
            </Grid>
          </Grid>
        )}
        
        {activeTab === 3 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Core Features</Typography>
            </Grid>
            {[
              { key: 'multiCurrency', label: 'Multi-Currency Support' },
              { key: 'advancedAnalytics', label: 'Advanced Analytics' },
              { key: 'aiPredictions', label: 'AI Predictions' },
              { key: 'customReporting', label: 'Custom Reporting' },
              { key: 'apiAccess', label: 'API Access' }
            ].map(feature => (
              <Grid item xs={12} sm={6} key={feature.key}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.features[feature.key]}
                      onChange={(e) => handleFormChange(`features.${feature.key}`, e.target.checked)}
                      disabled={isReadOnly}
                    />
                  }
                  label={feature.label}
                />
              </Grid>
            ))}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>Integration Features</Typography>
            </Grid>
            {[
              { key: 'sapIntegration', label: 'SAP Integration' },
              { key: 'excelImportExport', label: 'Excel Import/Export' },
              { key: 'emailNotifications', label: 'Email Notifications' },
              { key: 'ssoIntegration', label: 'SSO Integration' }
            ].map(feature => (
              <Grid item xs={12} sm={6} key={feature.key}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.features[feature.key]}
                      onChange={(e) => handleFormChange(`features.${feature.key}`, e.target.checked)}
                      disabled={isReadOnly}
                    />
                  }
                  label={feature.label}
                />
              </Grid>
            ))}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>Advanced Features</Typography>
            </Grid>
            {[
              { key: 'workflowApprovals', label: 'Workflow Approvals' },
              { key: 'auditLogging', label: 'Audit Logging' },
              { key: 'dataBackup', label: 'Data Backup' }
            ].map(feature => (
              <Grid item xs={12} sm={6} key={feature.key}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.features[feature.key]}
                      onChange={(e) => handleFormChange(`features.${feature.key}`, e.target.checked)}
                      disabled={isReadOnly}
                    />
                  }
                  label={feature.label}
                />
              </Grid>
            ))}
          </Grid>
        )}
        
        {activeTab === 4 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Timezone"
                value={formData.settings.timezone}
                onChange={(e) => handleFormChange('settings.timezone', e.target.value)}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Currency"
                value={formData.settings.currency}
                onChange={(e) => handleFormChange('settings.currency', e.target.value)}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Language"
                value={formData.settings.language}
                onChange={(e) => handleFormChange('settings.language', e.target.value)}
                disabled={isReadOnly}
              />
            </Grid>
          </Grid>
        )}
      </>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="/dashboard">Home</Link>
        <Link color="inherit" href="/admin">Admin</Link>
        <Typography color="text.primary">Tenant Management</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Tenant Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Create and manage customer tenants
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => { fetchTenants(); fetchStats(); }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => openDialog('create')}
          >
            New Tenant
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      {renderStats()}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <MenuItem key={key} value={key}>{config.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Plan</InputLabel>
              <Select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                label="Plan"
              >
                <MenuItem value="all">All Plans</MenuItem>
                {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                  <MenuItem key={key} value={key}>{plan.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tenants Table */}
      <Paper>
        {loading ? (
          <Box p={4} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : filteredTenants.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography color="textSecondary">
              {searchTerm || filterStatus !== 'all' || filterPlan !== 'all'
                ? 'No tenants match your filters'
                : 'No tenants found. Create your first tenant to get started.'}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tenant</TableCell>
                    <TableCell>Industry</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Users</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTenants
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((tenant) => {
                      const statusConfig = STATUS_CONFIG[tenant.subscription?.status] || STATUS_CONFIG.active;
                      const planConfig = SUBSCRIPTION_PLANS[tenant.subscription?.plan] || SUBSCRIPTION_PLANS.trial;
                      const userUsage = tenant.limits?.maxUsers > 0 
                        ? (tenant.usage?.users || 0) / tenant.limits.maxUsers * 100 
                        : 0;
                      
                      return (
                        <TableRow key={tenant._id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {tenant.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {tenant.slug}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{tenant.companyInfo?.industry || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={planConfig.label}
                              color={planConfig.color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={<statusConfig.icon sx={{ fontSize: 16 }} />}
                              label={statusConfig.label}
                              color={statusConfig.color}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {tenant.usage?.users || 0} / {tenant.limits?.maxUsers || 0}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(userUsage, 100)}
                                color={userUsage > 80 ? 'error' : userUsage > 60 ? 'warning' : 'primary'}
                                sx={{ height: 4, borderRadius: 2 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View">
                              <IconButton size="small" onClick={() => openDialog('view', tenant)}>
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openDialog('edit', tenant)}>
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Deactivate">
                              <IconButton size="small" color="error" onClick={() => handleDelete(tenant)}>
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredTenants.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New Tenant' : 
           dialogMode === 'edit' ? 'Edit Tenant' : 'View Tenant'}
        </DialogTitle>
        <DialogContent dividers>
          {renderFormTabs()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !formData.name}
            >
              {saving ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TenantManagement;
