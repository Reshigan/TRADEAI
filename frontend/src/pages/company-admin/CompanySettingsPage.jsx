import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Grid, Alert, CircularProgress,
  FormControlLabel, Switch, Tabs, Tab, Divider, Card, CardContent, MenuItem
} from '@mui/material';
import { Save, CloudUpload, Palette, Notifications, Security, Business } from '@mui/icons-material';
import enterpriseApi from '../../services/enterpriseApi';

const currencies = [
  { value: 'ZAR', label: 'South African Rand (R)', symbol: 'R' },
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' }
];

const timezones = [
  { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (SAST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' }
];

const dateFormats = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
];

const digestFrequencies = [
  { value: 'realtime', label: 'Real-time' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' }
];

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    branding: {
      logoUrl: '',
      primaryColor: '#6D28D9',
      secondaryColor: '#059669',
      showCompanyLogo: true
    },
    general: {
      companyDisplayName: '',
      tagline: '',
      supportEmail: '',
      supportPhone: '',
      defaultLanguage: 'en',
      defaultTimezone: 'Africa/Johannesburg',
      dateFormat: 'DD/MM/YYYY',
      currency: 'ZAR',
      currencySymbol: 'R'
    },
    features: {
      aiInsights: true,
      gamification: true,
      learningManagement: true,
      announcements: true,
      policies: true,
      azureAdIntegration: false,
      ssoEnabled: false,
      twoFactorRequired: false
    },
    notifications: {
      emailNotifications: true,
      inAppNotifications: true,
      smsNotifications: false,
      digestFrequency: 'daily',
      notifyOnNewAnnouncement: true,
      notifyOnPolicyUpdate: true,
      notifyOnCourseAssignment: true
    },
    security: {
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecial: true,
      sessionTimeoutMinutes: 60,
      maxLoginAttempts: 5
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await enterpriseApi.companyAdmin.getSettings();
      if (response.data) {
        setSettings(prev => ({
          ...prev,
          ...response.data,
          branding: { ...prev.branding, ...response.data.branding },
          general: { ...prev.general, ...response.data.general },
          features: { ...prev.features, ...response.data.features },
          notifications: { ...prev.notifications, ...response.data.notifications },
          security: { ...prev.security, ...response.data.security }
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await enterpriseApi.companyAdmin.updateSettings(settings);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // For demo, we'll use a data URL. In production, upload to S3/cloud storage
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await enterpriseApi.companyAdmin.uploadLogo({ logoUrl: event.target.result });
        setSettings(prev => ({
          ...prev,
          branding: { ...prev.branding, logoUrl: event.target.result }
        }));
        setSuccess('Logo uploaded successfully');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(err.message || 'Failed to upload logo');
      }
    };
    reader.readAsDataURL(file);
  };

  const updateBranding = (field, value) => {
    setSettings(prev => ({
      ...prev,
      branding: { ...prev.branding, [field]: value }
    }));
  };

  const updateGeneral = (field, value) => {
    setSettings(prev => ({
      ...prev,
      general: { ...prev.general, [field]: value }
    }));
  };

  const updateFeatures = (field, value) => {
    setSettings(prev => ({
      ...prev,
      features: { ...prev.features, [field]: value }
    }));
  };

  const updateNotifications = (field, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value }
    }));
  };

  const updateSecurity = (field, value) => {
    setSettings(prev => ({
      ...prev,
      security: { ...prev.security, [field]: value }
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
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Company Settings</Typography>
          <Typography variant="body1" color="text.secondary">
            Configure your company branding and system settings
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab icon={<Palette />} label="Branding" />
          <Tab icon={<Business />} label="General" />
          <Tab icon={<Notifications />} label="Notifications" />
          <Tab icon={<Security />} label="Security" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Branding Settings</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Company Logo</Typography>
                <Box sx={{ 
                  border: '2px dashed', 
                  borderColor: 'divider', 
                  borderRadius: 2, 
                  p: 3, 
                  textAlign: 'center',
                  mb: 2
                }}>
                  {settings.branding.logoUrl ? (
                    <Box sx={{ mb: 2 }}>
                      <img 
                        src={settings.branding.logoUrl} 
                        alt="Company Logo" 
                        style={{ maxHeight: 80, maxWidth: '100%' }} 
                      />
                    </Box>
                  ) : (
                    <Typography color="text.secondary" sx={{ mb: 2 }}>No logo uploaded</Typography>
                  )}
                  <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
                    Upload Logo
                    <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                  </Button>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.branding.showCompanyLogo}
                      onChange={(e) => updateBranding('showCompanyLogo', e.target.checked)}
                    />
                  }
                  label="Show company logo in header"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Brand Colors</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="color"
                      label="Primary Color"
                      value={settings.branding.primaryColor}
                      onChange={(e) => updateBranding('primaryColor', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="color"
                      label="Secondary Color"
                      value={settings.branding.secondaryColor}
                      onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>General Settings</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Display Name"
                  value={settings.general.companyDisplayName}
                  onChange={(e) => updateGeneral('companyDisplayName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tagline"
                  value={settings.general.tagline}
                  onChange={(e) => updateGeneral('tagline', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Support Email"
                  type="email"
                  value={settings.general.supportEmail}
                  onChange={(e) => updateGeneral('supportEmail', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Support Phone"
                  value={settings.general.supportPhone}
                  onChange={(e) => updateGeneral('supportPhone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Regional Settings</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Currency"
                  value={settings.general.currency}
                  onChange={(e) => {
                    const currency = currencies.find(c => c.value === e.target.value);
                    updateGeneral('currency', e.target.value);
                    if (currency) updateGeneral('currencySymbol', currency.symbol);
                  }}
                >
                  {currencies.map((c) => (
                    <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Timezone"
                  value={settings.general.defaultTimezone}
                  onChange={(e) => updateGeneral('defaultTimezone', e.target.value)}
                >
                  {timezones.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Date Format"
                  value={settings.general.dateFormat}
                  onChange={(e) => updateGeneral('dateFormat', e.target.value)}
                >
                  {dateFormats.map((d) => (
                    <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Feature Toggles</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={<Switch checked={settings.features.aiInsights} onChange={(e) => updateFeatures('aiInsights', e.target.checked)} />}
                  label="AI Insights"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={<Switch checked={settings.features.gamification} onChange={(e) => updateFeatures('gamification', e.target.checked)} />}
                  label="Gamification"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={<Switch checked={settings.features.learningManagement} onChange={(e) => updateFeatures('learningManagement', e.target.checked)} />}
                  label="Learning Management"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Notification Settings</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={<Switch checked={settings.notifications.emailNotifications} onChange={(e) => updateNotifications('emailNotifications', e.target.checked)} />}
                  label="Email Notifications"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={<Switch checked={settings.notifications.inAppNotifications} onChange={(e) => updateNotifications('inAppNotifications', e.target.checked)} />}
                  label="In-App Notifications"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={<Switch checked={settings.notifications.smsNotifications} onChange={(e) => updateNotifications('smsNotifications', e.target.checked)} />}
                  label="SMS Notifications"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Digest Frequency"
                  value={settings.notifications.digestFrequency}
                  onChange={(e) => updateNotifications('digestFrequency', e.target.value)}
                >
                  {digestFrequencies.map((d) => (
                    <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Notification Triggers</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={<Switch checked={settings.notifications.notifyOnNewAnnouncement} onChange={(e) => updateNotifications('notifyOnNewAnnouncement', e.target.checked)} />}
                  label="New Announcements"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={<Switch checked={settings.notifications.notifyOnPolicyUpdate} onChange={(e) => updateNotifications('notifyOnPolicyUpdate', e.target.checked)} />}
                  label="Policy Updates"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={<Switch checked={settings.notifications.notifyOnCourseAssignment} onChange={(e) => updateNotifications('notifyOnCourseAssignment', e.target.checked)} />}
                  label="Course Assignments"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Security Settings</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Password Policy</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Minimum Password Length"
                  value={settings.security.passwordMinLength}
                  onChange={(e) => updateSecurity('passwordMinLength', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Session Timeout (minutes)"
                  value={settings.security.sessionTimeoutMinutes}
                  onChange={(e) => updateSecurity('sessionTimeoutMinutes', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Login Attempts"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => updateSecurity('maxLoginAttempts', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={<Switch checked={settings.security.passwordRequireUppercase} onChange={(e) => updateSecurity('passwordRequireUppercase', e.target.checked)} />}
                  label="Require Uppercase"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={<Switch checked={settings.security.passwordRequireLowercase} onChange={(e) => updateSecurity('passwordRequireLowercase', e.target.checked)} />}
                  label="Require Lowercase"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={<Switch checked={settings.security.passwordRequireNumbers} onChange={(e) => updateSecurity('passwordRequireNumbers', e.target.checked)} />}
                  label="Require Numbers"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={<Switch checked={settings.security.passwordRequireSpecial} onChange={(e) => updateSecurity('passwordRequireSpecial', e.target.checked)} />}
                  label="Require Special Characters"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Authentication</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={<Switch checked={settings.features.twoFactorRequired} onChange={(e) => updateFeatures('twoFactorRequired', e.target.checked)} />}
                  label="Require Two-Factor Authentication"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={<Switch checked={settings.features.ssoEnabled} onChange={(e) => updateFeatures('ssoEnabled', e.target.checked)} />}
                  label="Enable SSO"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={<Switch checked={settings.features.azureAdIntegration} onChange={(e) => updateFeatures('azureAdIntegration', e.target.checked)} />}
                  label="Azure AD Integration"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
