import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField,
  Divider, Switch, FormControlLabel, Alert, Snackbar, CircularProgress,
  Tabs, Tab, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import api from '../../services/api';

const SECTION_TABS = [
  'Promotions',
  'Budgets',
  'Rebates',
  'Claims',
  'Calendars & Localization',
  'GL Export',
  'Overrides'
];

const BusinessRulesPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/business-rules');
      setConfig(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load business rules', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/business-rules', config);
      setConfig(res.data);
      setSnackbar({ open: true, message: 'Business rules saved', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const updateNested = (path, value) => {
    setConfig(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = clone;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return clone;
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!config) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">Unable to load business rules configuration.</Alert>
      </Box>
    );
  }

  const renderPromotions = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight="bold">Discount Caps</Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField fullWidth type="number" label="Max Discount %" value={config.promotions?.discountCaps?.maxPercent ?? ''} onChange={e => updateNested('promotions.discountCaps.maxPercent', Number(e.target.value))} />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField fullWidth type="number" label="Max Absolute Discount" value={config.promotions?.discountCaps?.maxAbsolute ?? ''} onChange={e => updateNested('promotions.discountCaps.maxAbsolute', Number(e.target.value))} helperText="0 = unlimited" />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField fullWidth type="number" label="Require Justification Over %" value={config.promotions?.discountCaps?.requireJustificationOverPercent ?? ''} onChange={e => updateNested('promotions.discountCaps.requireJustificationOverPercent', Number(e.target.value))} />
      </Grid>

      <Grid item xs={12} sx={{ mt: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">Stacking / Overlap</Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} md={4}>
        <FormControlLabel control={<Switch checked={config.promotions?.stacking?.allowStacking ?? false} onChange={e => updateNested('promotions.stacking.allowStacking', e.target.checked)} />} label="Allow Stacking" />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField fullWidth type="number" label="Max Stacked Promotions" value={config.promotions?.stacking?.maxStackedPromotions ?? ''} onChange={e => updateNested('promotions.stacking.maxStackedPromotions', Number(e.target.value))} />
      </Grid>
      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Overlap Policy</InputLabel>
          <Select value={config.promotions?.stacking?.overlapPolicy ?? 'disallow'} label="Overlap Policy" onChange={e => updateNested('promotions.stacking.overlapPolicy', e.target.value)}>
            <MenuItem value="disallow">Disallow</MenuItem>
            <MenuItem value="allow_same_product">Allow Same Product</MenuItem>
            <MenuItem value="allow_all">Allow All</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sx={{ mt: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">Duration Limits</Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth type="number" label="Min Days" value={config.promotions?.duration?.minDays ?? ''} onChange={e => updateNested('promotions.duration.minDays', Number(e.target.value))} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth type="number" label="Max Days" value={config.promotions?.duration?.maxDays ?? ''} onChange={e => updateNested('promotions.duration.maxDays', Number(e.target.value))} />
      </Grid>

      <Grid item xs={12} sx={{ mt: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">ROI Requirements</Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth type="number" label="Min Expected ROI (%)" value={config.promotions?.roi?.minExpectedROI ?? ''} onChange={e => updateNested('promotions.roi.minExpectedROI', Number(e.target.value))} />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControlLabel control={<Switch checked={config.promotions?.roi?.requireSimulation ?? false} onChange={e => updateNested('promotions.roi.requireSimulation', e.target.checked)} />} label="Require Simulation Before Approval" />
      </Grid>
    </Grid>
  );

  const renderBudgets = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight="bold">Allocation Caps</Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth type="number" label="Overall % of Revenue Cap" value={config.budgets?.allocationCaps?.overallPercentOfRevenue ?? ''} onChange={e => updateNested('budgets.allocationCaps.overallPercentOfRevenue', Number(e.target.value))} />
      </Grid>

      <Grid item xs={12} sx={{ mt: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">Guardrails</Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth type="number" label="Require ROI For Spend Over Amount" value={config.budgets?.guardrails?.requireROIForSpendOverAmount ?? ''} onChange={e => updateNested('budgets.guardrails.requireROIForSpendOverAmount', Number(e.target.value))} helperText="0 = disabled" />
      </Grid>
    </Grid>
  );

  const renderRebates = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight="bold">Settlement</Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Settlement Cycle</InputLabel>
          <Select value={config.rebates?.settlement?.cycle ?? 'quarterly'} label="Settlement Cycle" onChange={e => updateNested('rebates.settlement.cycle', e.target.value)}>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="quarterly">Quarterly</MenuItem>
            <MenuItem value="annually">Annually</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth type="number" label="Settlement Window (days)" value={config.rebates?.settlement?.settlementWindowDays ?? ''} onChange={e => updateNested('rebates.settlement.settlementWindowDays', Number(e.target.value))} />
      </Grid>
    </Grid>
  );

  const renderClaims = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight="bold">Claims & Deductions</Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControlLabel control={<Switch checked={config.claims?.autoMatching ?? true} onChange={e => updateNested('claims.autoMatching', e.target.checked)} />} label="Enable Auto-Matching" />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth type="number" label="Write-off Limit" value={config.claims?.writeoffLimits ?? ''} onChange={e => updateNested('claims.writeoffLimits', Number(e.target.value))} helperText="0 = unlimited" />
      </Grid>
    </Grid>
  );

  const renderCalendarsLocalization = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight="bold">Fiscal Calendar</Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth type="number" label="Fiscal Start Month (1-12)" value={config.calendars?.fiscalStartMonth ?? ''} onChange={e => updateNested('calendars.fiscalStartMonth', Number(e.target.value))} inputProps={{ min: 1, max: 12 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth label="Holiday Calendar" value={config.calendars?.holidayCalendar ?? ''} onChange={e => updateNested('calendars.holidayCalendar', e.target.value)} />
      </Grid>

      <Grid item xs={12} sx={{ mt: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">Localization</Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth label="Default Currency" value={config.localization?.defaultCurrency ?? ''} onChange={e => updateNested('localization.defaultCurrency', e.target.value)} />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Tax Policy</InputLabel>
          <Select value={config.localization?.taxPolicy ?? 'exclusive'} label="Tax Policy" onChange={e => updateNested('localization.taxPolicy', e.target.value)}>
            <MenuItem value="exclusive">Tax Exclusive</MenuItem>
            <MenuItem value="inclusive">Tax Inclusive</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderGLExport = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight="bold">GL Export</Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControlLabel control={<Switch checked={config.glExport?.enabled ?? false} onChange={e => updateNested('glExport.enabled', e.target.checked)} />} label="Enable GL Export" />
      </Grid>
    </Grid>
  );

  const renderOverrides = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight="bold">Override Controls</Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControlLabel control={<Switch checked={config.overrides?.allowManualOverrideWithAudit ?? true} onChange={e => updateNested('overrides.allowManualOverrideWithAudit', e.target.checked)} />} label="Allow Manual Override (with Audit)" />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControlLabel control={<Switch checked={config.overrides?.requireReasonForOverride ?? true} onChange={e => updateNested('overrides.requireReasonForOverride', e.target.checked)} />} label="Require Reason for Override" />
      </Grid>
    </Grid>
  );

  const tabContent = [
    renderPromotions,
    renderBudgets,
    renderRebates,
    renderClaims,
    renderCalendarsLocalization,
    renderGLExport,
    renderOverrides
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Business Rules Configuration</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure admin-managed rules for promotions, budgets, rebates, claims, and more
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadConfig}>Reset</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Rules'}
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3 }}>
            {SECTION_TABS.map((label, i) => (
              <Tab key={i} label={label} />
            ))}
          </Tabs>
          {tabContent[activeTab]()}
        </CardContent>
      </Card>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default BusinessRulesPage;
