import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Card,
  CardContent,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import api from '../../../services/api';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    companyName: 'Trade AI Inc.',
    currency: 'ZAR',
    fiscalYearStart: '01-01',
    timezone: 'Africa/Johannesburg',
    dateFormat: 'YYYY-MM-DD',
    language: 'en',
    enableAI: true,
    enableNotifications: true,
    enableAuditLog: true,
    sessionTimeout: 30,
    maxUploadSize: 10,
    enableMultiTenant: false
  });

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put('/admin/settings', settings);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Settings saved successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to save settings',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        System Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure global system settings and preferences
      </Typography>

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                General Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={settings.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={settings.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      label="Currency"
                    >
                      <MenuItem value="ZAR">South African Rand (ZAR)</MenuItem>
                      <MenuItem value="USD">US Dollar (USD)</MenuItem>
                      <MenuItem value="EUR">Euro (EUR)</MenuItem>
                      <MenuItem value="GBP">British Pound (GBP)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Fiscal Year Start"
                    value={settings.fiscalYearStart}
                    onChange={(e) => handleChange('fiscalYearStart', e.target.value)}
                    placeholder="MM-DD"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={settings.timezone}
                      onChange={(e) => handleChange('timezone', e.target.value)}
                      label="Timezone"
                    >
                      <MenuItem value="Africa/Johannesburg">Africa/Johannesburg (GMT+2)</MenuItem>
                      <MenuItem value="America/New_York">America/New_York (EST)</MenuItem>
                      <MenuItem value="Europe/London">Europe/London (GMT)</MenuItem>
                      <MenuItem value="Asia/Tokyo">Asia/Tokyo (JST)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Feature Flags */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Feature Flags
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableAI}
                        onChange={(e) => handleChange('enableAI', e.target.checked)}
                      />
                    }
                    label="Enable AI Recommendations"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableNotifications}
                        onChange={(e) => handleChange('enableNotifications', e.target.checked)}
                      />
                    }
                    label="Enable Notifications"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableAuditLog}
                        onChange={(e) => handleChange('enableAuditLog', e.target.checked)}
                      />
                    }
                    label="Enable Audit Logging"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableMultiTenant}
                        onChange={(e) => handleChange('enableMultiTenant', e.target.checked)}
                      />
                    }
                    label="Enable Multi-Tenant Mode"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Security Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Session Timeout (minutes)"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Upload Size (MB)"
                    value={settings.maxUploadSize}
                    onChange={(e) => handleChange('maxUploadSize', parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadSettings}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={loading}
        >
          Save Settings
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemSettings;
