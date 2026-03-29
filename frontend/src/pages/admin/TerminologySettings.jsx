// T-03: Admin Terminology Settings Page
import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, TextField, Button, Alert, Divider, Chip, CircularProgress } from '@mui/material';
import { Save, RotateCcw, Building2 } from 'lucide-react';
import { useTerminology } from '../../contexts/TerminologyContext';
import { settingsService } from '../../services/api';
import useConfirmDialog from '../../hooks/useConfirmDialog';

const TERMINOLOGY_KEYS = [
  { key: 'budget', description: 'Budget / AOP planning' },
  { key: 'promotion', description: 'Promotional activities' },
  { key: 'trade_spend', description: 'Trade spend investments' },
  { key: 'campaign', description: 'Marketing campaigns' },
  { key: 'rebate', description: 'Rebate programs' },
  { key: 'claim', description: 'Claims processing' },
  { key: 'deduction', description: 'Deduction management' },
  { key: 'settlement', description: 'Settlement processing' },
  { key: 'accrual', description: 'Accrual management' },
  { key: 'trading_term', description: 'Trading agreements' },
  { key: 'vendor', description: 'Vendor / Supplier' },
  { key: 'customer', description: 'Customer / Account' },
  { key: 'product', description: 'Product / SKU' },
  { key: 'approval', description: 'Approval workflow' },
  { key: 'notification', description: 'Notifications / Alerts' },
  { key: 'kam_wallet', description: 'KAM Wallet / Sales Rep Budget' },
  { key: 'vendor_fund', description: 'Vendor funding' },
  { key: 'pnl', description: 'Profit & Loss analysis' },
  { key: 'forecast', description: 'Forecasting / Projections' },
  { key: 'baseline', description: 'Baseline management' },
  { key: 'scenario', description: 'Scenario planning' },
];

const COMPANY_TYPES = [
  { value: 'distributor', label: 'Distributor', description: 'Uses AOP, Deal, Trade Investment terminology' },
  { value: 'retailer', label: 'Retailer', description: 'Uses Budget, Promotion, Vendor Claim terminology' },
  { value: 'custom', label: 'Custom', description: 'Fully customizable terminology' },
];

export default function TerminologySettings() {
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const { labels, companyType, updateTerminology, resetTerminology, refresh } = useTerminology();
  const [editLabels, setEditLabels] = useState({});
  const [selectedCompanyType, setSelectedCompanyType] = useState(companyType || 'distributor');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setEditLabels({ ...labels });
  }, [labels]);

  useEffect(() => {
    setSelectedCompanyType(companyType || 'distributor');
  }, [companyType]);

  const handleLabelChange = (key, value) => {
    setEditLabels(prev => ({ ...prev, [key]: value }));
    setDirty(true);
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateTerminology(editLabels);
      setSuccess('Terminology saved successfully. Changes will appear across the platform.');
      setDirty(false);
    } catch (err) {
      setError('Failed to save terminology: ' + (err.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const handleReset = async () => {
    if (!await confirm('Reset all terminology to defaults? This cannot be undone.', { severity: 'error' })) return;
    setResetting(true);
    setError('');
    setSuccess('');
    try {
      await resetTerminology();
      await refresh();
      setSuccess('Terminology reset to defaults.');
      setDirty(false);
    } catch (err) {
      setError('Failed to reset terminology: ' + (err.message || 'Unknown error'));
    }
    setResetting(false);
  };

  const handleCompanyTypeChange = async (newType) => {
    setSelectedCompanyType(newType);
    try {
      await settingsService.setCompanyType(newType);
      await refresh();
      setSuccess(`Company type set to "${newType}". Default terminology updated.`);
    } catch (err) {
      setError('Failed to set company type: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h1">Terminology Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Customize entity labels across the platform. Changes apply to sidebar, headers, forms, and API responses.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={resetting ? <CircularProgress size={16} /> : <RotateCcw size={16} />}
            onClick={handleReset} disabled={resetting || saving} color="warning">
            Reset to Defaults
          </Button>
          <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
            onClick={handleSave} disabled={saving || !dirty}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {dirty && <Alert severity="info" sx={{ mb: 2 }}>You have unsaved changes.</Alert>}

      {/* T-07: Company Type Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Building2 size={20} />
            <Typography variant="h3">Company Type</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select your company type to apply industry-standard terminology presets. You can further customize individual labels below.
          </Typography>
          <Grid container spacing={2}>
            {COMPANY_TYPES.map(ct => (
              <Grid item xs={12} sm={4} key={ct.value}>
                <Card variant="outlined" sx={{
                  cursor: 'pointer',
                  borderColor: selectedCompanyType === ct.value ? 'primary.main' : 'divider',
                  borderWidth: selectedCompanyType === ct.value ? 2 : 1,
                  bgcolor: selectedCompanyType === ct.value ? 'primary.50' : 'transparent',
                  '&:hover': { borderColor: 'primary.main' },
                }} onClick={() => handleCompanyTypeChange(ct.value)}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>{ct.label}</Typography>
                      {selectedCompanyType === ct.value && <Chip label="Active" size="small" color="primary" />}
                    </Box>
                    <Typography variant="caption" color="text.secondary">{ct.description}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Terminology Labels Grid */}
      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Entity Labels</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Customize how each entity type is labeled throughout the application. The plural form is automatically generated.
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {TERMINOLOGY_KEYS.map(({ key, description }) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField
                  fullWidth
                  size="small"
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  value={editLabels[key] || ''}
                  onChange={(e) => handleLabelChange(key, e.target.value)}
                  helperText={description}
                  InputProps={{ sx: { fontSize: '0.875rem' } }}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Preview</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            See how your terminology will appear in the sidebar navigation.
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={1}>
            {['budget', 'promotion', 'trade_spend', 'campaign', 'claim', 'deduction', 'settlement', 'rebate', 'customer', 'product', 'vendor'].map(key => (
              <Grid item xs={6} sm={4} md={3} key={key}>
                <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
                  <Typography variant="caption" color="text.secondary">{key}</Typography>
                  <Typography variant="body2" fontWeight={600}>{editLabels[key] || key}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    {ConfirmDialogComponent}
    </Box>
  );
}
