import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, TextField, Button, MenuItem, Switch, FormControlLabel, Alert } from '@mui/material';
import { Save } from 'lucide-react';
import api from '../../services/api';

export default function SystemConfig() {
  const [config, setConfig] = useState({
    company_name: '', currency: 'ZAR', fiscal_year_start: '01', approval_threshold_1: '50000', approval_threshold_2: '200000',
    auto_accrual: true, auto_match_deductions: true, notification_email: true, ai_enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/config');
        const data = res.data?.data || res.data || {};
        setConfig(prev => ({ ...prev, ...data }));
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true); setSuccess(false);
    try {
      await api.put('/config', config);
      setSuccess(true);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">System Configuration</Typography><Typography variant="body2" color="text.secondary">Global system settings and preferences</Typography></Box>
        <Button variant="contained" startIcon={<Save size={16} />} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>Configuration saved successfully</Alert>}

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 2 }}>General</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}><TextField fullWidth label="Company Name" value={config.company_name} onChange={(e) => setConfig({ ...config, company_name: e.target.value })} /></Grid>
                <Grid item xs={6}><TextField fullWidth select label="Currency" value={config.currency} onChange={(e) => setConfig({ ...config, currency: e.target.value })}>
                  <MenuItem value="ZAR">ZAR (R)</MenuItem><MenuItem value="USD">USD ($)</MenuItem><MenuItem value="EUR">EUR</MenuItem><MenuItem value="GBP">GBP</MenuItem>
                </TextField></Grid>
                <Grid item xs={6}><TextField fullWidth select label="Fiscal Year Start" value={config.fiscal_year_start} onChange={(e) => setConfig({ ...config, fiscal_year_start: e.target.value })}>
                  {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => <MenuItem key={m} value={m}>Month {m}</MenuItem>)}
                </TextField></Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 2 }}>Approval Thresholds</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}><TextField fullWidth label="Level 1 Threshold (Manager)" type="number" value={config.approval_threshold_1} onChange={(e) => setConfig({ ...config, approval_threshold_1: e.target.value })} helperText="Amounts above this require manager approval" /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Level 2 Threshold (Director)" type="number" value={config.approval_threshold_2} onChange={(e) => setConfig({ ...config, approval_threshold_2: e.target.value })} helperText="Amounts above this require director approval" /></Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 2 }}>Automation</Typography>
              <FormControlLabel control={<Switch checked={config.auto_accrual} onChange={(e) => setConfig({ ...config, auto_accrual: e.target.checked })} />} label="Auto-calculate accruals" sx={{ display: 'block', mb: 1 }} />
              <FormControlLabel control={<Switch checked={config.auto_match_deductions} onChange={(e) => setConfig({ ...config, auto_match_deductions: e.target.checked })} />} label="Auto-match deductions to claims" sx={{ display: 'block', mb: 1 }} />
              <FormControlLabel control={<Switch checked={config.notification_email} onChange={(e) => setConfig({ ...config, notification_email: e.target.checked })} />} label="Email notifications" sx={{ display: 'block', mb: 1 }} />
              <FormControlLabel control={<Switch checked={config.ai_enabled} onChange={(e) => setConfig({ ...config, ai_enabled: e.target.checked })} />} label="AI/ML features enabled" sx={{ display: 'block' }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
