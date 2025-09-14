import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  Divider,
  Paper,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Avatar,
  IconButton,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Badge,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Extension as IntegrationIcon
} from '@mui/icons-material';

import { PageHeader } from '../common';

const SettingsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    email: 'admin@tradeai.com',
    phone: '+1 (555) 123-4567',
    role: 'Administrator',
    department: 'IT',
    company: 'Trade AI Inc.',
    bio: 'System administrator responsible for managing the Trade AI platform.'
  });
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: true,
    showPassword: false
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    budgetAlerts: true,
    tradeSpendAlerts: true,
    promotionAlerts: true,
    systemAlerts: true,
    weeklyReports: true,
    monthlyReports: true
  });
  const [displaySettings, setDisplaySettings] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    currencyFormat: 'USD',
    compactNumbers: true
  });
  const [apiKeys, setApiKeys] = useState([
    { id: '1', name: 'Web App', key: 'sk_test_123456789abcdef', created: '2025-01-15', lastUsed: '2025-09-01' },
    { id: '2', name: 'Mobile App', key: 'sk_test_abcdef123456789', created: '2025-03-20', lastUsed: '2025-08-25' }
  ]);
  const [integrationSettings, setIntegrationSettings] = useState({
    sap: {
      enabled: false,
      server: '',
      client: '',
      username: '',
      systemNumber: '',
      testConnection: false
    },
    sso: {
      enabled: false,
      provider: 'azure',
      clientId: '',
      tenantId: '',
      redirectUri: '',
      testConnection: false
    },
    erp: {
      enabled: false,
      type: 'sap',
      endpoint: '',
      apiKey: '',
      syncFrequency: 'daily'
    }
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle profile data change
  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle security data change
  const handleSecurityChange = (event) => {
    const { name, value } = event.target;
    setSecurityData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle toggle change
  const handleToggleChange = (event) => {
    const { name, checked } = event.target;
    
    if (name.startsWith('notification')) {
      setNotificationSettings((prevSettings) => ({
        ...prevSettings,
        [name.replace('notification', '')]: checked
      }));
    } else if (name === 'twoFactorEnabled') {
      setSecurityData((prevData) => ({
        ...prevData,
        [name]: checked
      }));
    } else {
      setDisplaySettings((prevSettings) => ({
        ...prevSettings,
        [name]: checked
      }));
    }
  };

  // Handle display settings change
  const handleDisplaySettingChange = (event) => {
    const { name, value } = event.target;
    setDisplaySettings((prevSettings) => ({
      ...prevSettings,
      [name]: value
    }));
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setSecurityData((prevData) => ({
      ...prevData,
      showPassword: !prevData.showPassword
    }));
  };

  // Save profile
  const handleSaveProfile = () => {
    // In a real app, we would call the API to save the profile
    setSnackbar({
      open: true,
      message: 'Profile updated successfully',
      severity: 'success'
    });
  };

  // Change password
  const handleChangePassword = () => {
    // Validate passwords
    if (!securityData.currentPassword) {
      setSnackbar({
        open: true,
        message: 'Current password is required',
        severity: 'error'
      });
      return;
    }
    
    if (!securityData.newPassword) {
      setSnackbar({
        open: true,
        message: 'New password is required',
        severity: 'error'
      });
      return;
    }
    
    if (securityData.newPassword !== securityData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Passwords do not match',
        severity: 'error'
      });
      return;
    }
    
    // In a real app, we would call the API to change the password
    setSnackbar({
      open: true,
      message: 'Password changed successfully',
      severity: 'success'
    });
    
    // Clear password fields
    setSecurityData((prevData) => ({
      ...prevData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  // Save notification settings
  const handleSaveNotificationSettings = () => {
    // In a real app, we would call the API to save the notification settings
    setSnackbar({
      open: true,
      message: 'Notification settings updated successfully',
      severity: 'success'
    });
  };

  // Save display settings
  const handleSaveDisplaySettings = () => {
    // In a real app, we would call the API to save the display settings
    setSnackbar({
      open: true,
      message: 'Display settings updated successfully',
      severity: 'success'
    });
  };

  // Generate new API key
  const handleGenerateApiKey = () => {
    // In a real app, we would call the API to generate a new API key
    const newKey = {
      id: `${apiKeys.length + 1}`,
      name: `API Key ${apiKeys.length + 1}`,
      key: `sk_test_${Math.random().toString(36).substring(2, 15)}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never'
    };
    
    setApiKeys((prevKeys) => [...prevKeys, newKey]);
    
    setSnackbar({
      open: true,
      message: 'New API key generated successfully',
      severity: 'success'
    });
  };

  // Delete API key
  const handleDeleteApiKey = (id) => {
    // In a real app, we would call the API to delete the API key
    setApiKeys((prevKeys) => prevKeys.filter(key => key.id !== id));
    
    setSnackbar({
      open: true,
      message: 'API key deleted successfully',
      severity: 'success'
    });
  };

  // Handle integration settings change
  const handleIntegrationChange = (section, field, value) => {
    setIntegrationSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Test SAP connection
  const handleTestSapConnection = () => {
    setIntegrationSettings(prev => ({
      ...prev,
      sap: { ...prev.sap, testConnection: true }
    }));
    
    // Simulate connection test
    setTimeout(() => {
      setIntegrationSettings(prev => ({
        ...prev,
        sap: { ...prev.sap, testConnection: false }
      }));
      
      setSnackbar({
        open: true,
        message: 'SAP connection test successful',
        severity: 'success'
      });
    }, 2000);
  };

  // Test SSO connection
  const handleTestSsoConnection = () => {
    setIntegrationSettings(prev => ({
      ...prev,
      sso: { ...prev.sso, testConnection: true }
    }));
    
    // Simulate connection test
    setTimeout(() => {
      setIntegrationSettings(prev => ({
        ...prev,
        sso: { ...prev.sso, testConnection: false }
      }));
      
      setSnackbar({
        open: true,
        message: 'SSO connection test successful',
        severity: 'success'
      });
    }, 2000);
  };

  // Save integration settings
  const handleSaveIntegrations = () => {
    setSnackbar({
      open: true,
      message: 'Integration settings saved successfully',
      severity: 'success'
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar((prevSnackbar) => ({
      ...prevSnackbar,
      open: false
    }));
  };

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Manage your account settings and preferences"
      />

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<EditIcon />} label="Profile" />
          <Tab icon={<SecurityIcon />} label="Security" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<PaletteIcon />} label="Display" />
          <Tab icon={<IntegrationIcon />} label="Integrations" />
          <Tab icon={<LanguageIcon />} label="API" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Profile Settings
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <IconButton
                        color="primary"
                        aria-label="upload picture"
                        component="label"
                        sx={{ 
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                        size="small"
                      >
                        <input hidden accept="image/*" type="file" />
                        <PhotoCameraIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <Avatar
                      alt={profileData.name}
                      src="/static/images/avatar/1.jpg"
                      sx={{ width: 120, height: 120 }}
                    />
                  </Badge>
                  
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    {profileData.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profileData.role}
                  </Typography>
                  <Chip
                    label="Active"
                    color="success"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Role"
                        name="role"
                        value={profileData.role}
                        onChange={handleProfileChange}
                        disabled
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Department"
                        name="department"
                        value={profileData.department}
                        onChange={handleProfileChange}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Company"
                        name="company"
                        value={profileData.company}
                        onChange={handleProfileChange}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bio"
                        name="bio"
                        value={profileData.bio}
                        onChange={handleProfileChange}
                        multiline
                        rows={4}
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Security Settings
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Change Password
                      </Typography>
                      
                      <TextField
                        fullWidth
                        label="Current Password"
                        name="currentPassword"
                        type={securityData.showPassword ? 'text' : 'password'}
                        value={securityData.currentPassword}
                        onChange={handleSecurityChange}
                        margin="normal"
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={handleTogglePasswordVisibility}
                              edge="end"
                            >
                              {securityData.showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          ),
                        }}
                      />
                      
                      <TextField
                        fullWidth
                        label="New Password"
                        name="newPassword"
                        type={securityData.showPassword ? 'text' : 'password'}
                        value={securityData.newPassword}
                        onChange={handleSecurityChange}
                        margin="normal"
                      />
                      
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        name="confirmPassword"
                        type={securityData.showPassword ? 'text' : 'password'}
                        value={securityData.confirmPassword}
                        onChange={handleSecurityChange}
                        margin="normal"
                      />
                      
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleChangePassword}
                        >
                          Change Password
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Two-Factor Authentication
                      </Typography>
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={securityData.twoFactorEnabled}
                            onChange={handleToggleChange}
                            name="twoFactorEnabled"
                            color="primary"
                          />
                        }
                        label="Enable Two-Factor Authentication"
                      />
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Two-factor authentication adds an extra layer of security to your account.
                        When enabled, you'll need to provide a verification code in addition to your password when signing in.
                      </Typography>
                      
                      {securityData.twoFactorEnabled && (
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="outlined"
                            color="primary"
                          >
                            Setup Two-Factor Authentication
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card variant="outlined" sx={{ mt: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Session Management
                      </Typography>
                      
                      <Typography variant="body2" gutterBottom>
                        You're currently signed in on this device.
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          color="error"
                        >
                          Sign Out All Devices
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Notification Settings
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Notification Channels
                      </Typography>
                      
                      <List>
                        <ListItem>
                          <ListItemText
                            primary="Email Notifications"
                            secondary="Receive notifications via email"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              edge="end"
                              checked={notificationSettings.emailNotifications}
                              onChange={handleToggleChange}
                              name="notificationemailNotifications"
                              color="primary"
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        
                        <ListItem>
                          <ListItemText
                            primary="Push Notifications"
                            secondary="Receive notifications in the app"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              edge="end"
                              checked={notificationSettings.pushNotifications}
                              onChange={handleToggleChange}
                              name="notificationpushNotifications"
                              color="primary"
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Notification Types
                      </Typography>
                      
                      <List>
                        <ListItem>
                          <ListItemText
                            primary="Budget Alerts"
                            secondary="Notifications about budget changes and approvals"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              edge="end"
                              checked={notificationSettings.budgetAlerts}
                              onChange={handleToggleChange}
                              name="notificationbudgetAlerts"
                              color="primary"
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        
                        <ListItem>
                          <ListItemText
                            primary="Trade Spend Alerts"
                            secondary="Notifications about trade spend activities"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              edge="end"
                              checked={notificationSettings.tradeSpendAlerts}
                              onChange={handleToggleChange}
                              name="notificationtradeSpendAlerts"
                              color="primary"
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        
                        <ListItem>
                          <ListItemText
                            primary="Promotion Alerts"
                            secondary="Notifications about promotions"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              edge="end"
                              checked={notificationSettings.promotionAlerts}
                              onChange={handleToggleChange}
                              name="notificationpromotionAlerts"
                              color="primary"
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        
                        <ListItem>
                          <ListItemText
                            primary="System Alerts"
                            secondary="Notifications about system updates and maintenance"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              edge="end"
                              checked={notificationSettings.systemAlerts}
                              onChange={handleToggleChange}
                              name="notificationsystemAlerts"
                              color="primary"
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Report Subscriptions
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={notificationSettings.weeklyReports}
                                onChange={handleToggleChange}
                                name="notificationweeklyReports"
                                color="primary"
                              />
                            }
                            label="Weekly Performance Reports"
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={notificationSettings.monthlyReports}
                                onChange={handleToggleChange}
                                name="notificationmonthlyReports"
                                color="primary"
                              />
                            }
                            label="Monthly Summary Reports"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveNotificationSettings}
                >
                  Save Notification Settings
                </Button>
              </Box>
            </Box>
          )}
          
          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Display Settings
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Appearance
                      </Typography>
                      
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="theme-label">Theme</InputLabel>
                        <Select
                          labelId="theme-label"
                          name="theme"
                          value={displaySettings.theme}
                          onChange={handleDisplaySettingChange}
                          label="Theme"
                        >
                          <MenuItem value="light">Light</MenuItem>
                          <MenuItem value="dark">Dark</MenuItem>
                          <MenuItem value="system">System Default</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={displaySettings.compactNumbers}
                            onChange={handleToggleChange}
                            name="compactNumbers"
                            color="primary"
                          />
                        }
                        label="Use Compact Number Format (e.g., 1.2M instead of 1,200,000)"
                      />
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Localization
                      </Typography>
                      
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="language-label">Language</InputLabel>
                        <Select
                          labelId="language-label"
                          name="language"
                          value={displaySettings.language}
                          onChange={handleDisplaySettingChange}
                          label="Language"
                        >
                          <MenuItem value="en">English</MenuItem>
                          <MenuItem value="es">Spanish</MenuItem>
                          <MenuItem value="fr">French</MenuItem>
                          <MenuItem value="de">German</MenuItem>
                          <MenuItem value="zh">Chinese</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="timezone-label">Timezone</InputLabel>
                        <Select
                          labelId="timezone-label"
                          name="timezone"
                          value={displaySettings.timezone}
                          onChange={handleDisplaySettingChange}
                          label="Timezone"
                        >
                          <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                          <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
                          <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
                          <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
                          <MenuItem value="Europe/London">London (GMT)</MenuItem>
                          <MenuItem value="Europe/Paris">Paris (CET)</MenuItem>
                          <MenuItem value="Asia/Tokyo">Tokyo (JST)</MenuItem>
                        </Select>
                      </FormControl>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Format Settings
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth margin="normal">
                            <InputLabel id="date-format-label">Date Format</InputLabel>
                            <Select
                              labelId="date-format-label"
                              name="dateFormat"
                              value={displaySettings.dateFormat}
                              onChange={handleDisplaySettingChange}
                              label="Date Format"
                            >
                              <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                              <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                              <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth margin="normal">
                            <InputLabel id="currency-format-label">Currency Format</InputLabel>
                            <Select
                              labelId="currency-format-label"
                              name="currencyFormat"
                              value={displaySettings.currencyFormat}
                              onChange={handleDisplaySettingChange}
                              label="Currency Format"
                            >
                              <MenuItem value="USD">USD ($)</MenuItem>
                              <MenuItem value="EUR">EUR (€)</MenuItem>
                              <MenuItem value="GBP">GBP (£)</MenuItem>
                              <MenuItem value="JPY">JPY (¥)</MenuItem>
                              <MenuItem value="CAD">CAD (C$)</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveDisplaySettings}
                >
                  Save Display Settings
                </Button>
              </Box>
            </Box>
          )}
          
          {tabValue === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Integration Settings
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {/* SAP Integration */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      SAP Integration
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={integrationSettings.sap.enabled}
                          onChange={(e) => handleIntegrationChange('sap', 'enabled', e.target.checked)}
                        />
                      }
                      label="Enable SAP Integration"
                    />
                  </Box>
                  
                  {integrationSettings.sap.enabled && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="SAP Server"
                          value={integrationSettings.sap.server}
                          onChange={(e) => handleIntegrationChange('sap', 'server', e.target.value)}
                          placeholder="sap.company.com"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Client"
                          value={integrationSettings.sap.client}
                          onChange={(e) => handleIntegrationChange('sap', 'client', e.target.value)}
                          placeholder="100"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Username"
                          value={integrationSettings.sap.username}
                          onChange={(e) => handleIntegrationChange('sap', 'username', e.target.value)}
                          placeholder="SAP_USER"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="System Number"
                          value={integrationSettings.sap.systemNumber}
                          onChange={(e) => handleIntegrationChange('sap', 'systemNumber', e.target.value)}
                          placeholder="00"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="outlined"
                          onClick={handleTestSapConnection}
                          disabled={integrationSettings.sap.testConnection}
                          sx={{ mr: 2 }}
                        >
                          {integrationSettings.sap.testConnection ? 'Testing...' : 'Test Connection'}
                        </Button>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>

              {/* SSO Integration */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      Single Sign-On (SSO)
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={integrationSettings.sso.enabled}
                          onChange={(e) => handleIntegrationChange('sso', 'enabled', e.target.checked)}
                        />
                      }
                      label="Enable SSO"
                    />
                  </Box>
                  
                  {integrationSettings.sso.enabled && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>SSO Provider</InputLabel>
                          <Select
                            value={integrationSettings.sso.provider}
                            onChange={(e) => handleIntegrationChange('sso', 'provider', e.target.value)}
                            label="SSO Provider"
                          >
                            <MenuItem value="azure">Azure AD</MenuItem>
                            <MenuItem value="okta">Okta</MenuItem>
                            <MenuItem value="google">Google Workspace</MenuItem>
                            <MenuItem value="saml">Generic SAML</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Client ID"
                          value={integrationSettings.sso.clientId}
                          onChange={(e) => handleIntegrationChange('sso', 'clientId', e.target.value)}
                          placeholder="12345678-1234-1234-1234-123456789012"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Tenant ID"
                          value={integrationSettings.sso.tenantId}
                          onChange={(e) => handleIntegrationChange('sso', 'tenantId', e.target.value)}
                          placeholder="87654321-4321-4321-4321-210987654321"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Redirect URI"
                          value={integrationSettings.sso.redirectUri}
                          onChange={(e) => handleIntegrationChange('sso', 'redirectUri', e.target.value)}
                          placeholder="https://tradeai.gonxt.tech/auth/callback"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="outlined"
                          onClick={handleTestSsoConnection}
                          disabled={integrationSettings.sso.testConnection}
                          sx={{ mr: 2 }}
                        >
                          {integrationSettings.sso.testConnection ? 'Testing...' : 'Test SSO Configuration'}
                        </Button>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>

              {/* ERP Integration */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      ERP Integration
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={integrationSettings.erp.enabled}
                          onChange={(e) => handleIntegrationChange('erp', 'enabled', e.target.checked)}
                        />
                      }
                      label="Enable ERP Integration"
                    />
                  </Box>
                  
                  {integrationSettings.erp.enabled && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>ERP Type</InputLabel>
                          <Select
                            value={integrationSettings.erp.type}
                            onChange={(e) => handleIntegrationChange('erp', 'type', e.target.value)}
                            label="ERP Type"
                          >
                            <MenuItem value="sap">SAP</MenuItem>
                            <MenuItem value="oracle">Oracle ERP</MenuItem>
                            <MenuItem value="dynamics">Microsoft Dynamics</MenuItem>
                            <MenuItem value="netsuite">NetSuite</MenuItem>
                            <MenuItem value="custom">Custom API</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="API Endpoint"
                          value={integrationSettings.erp.endpoint}
                          onChange={(e) => handleIntegrationChange('erp', 'endpoint', e.target.value)}
                          placeholder="https://api.erp.company.com/v1"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="API Key"
                          type="password"
                          value={integrationSettings.erp.apiKey}
                          onChange={(e) => handleIntegrationChange('erp', 'apiKey', e.target.value)}
                          placeholder="Enter API key"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Sync Frequency</InputLabel>
                          <Select
                            value={integrationSettings.erp.syncFrequency}
                            onChange={(e) => handleIntegrationChange('erp', 'syncFrequency', e.target.value)}
                            label="Sync Frequency"
                          >
                            <MenuItem value="realtime">Real-time</MenuItem>
                            <MenuItem value="hourly">Hourly</MenuItem>
                            <MenuItem value="daily">Daily</MenuItem>
                            <MenuItem value="weekly">Weekly</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveIntegrations}
                >
                  Save Integration Settings
                </Button>
              </Box>
            </Box>
          )}

          {tabValue === 5 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                API Settings
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Alert severity="info" sx={{ mb: 3 }}>
                API keys provide access to the Trade AI API. Keep your API keys secure and never share them in publicly accessible areas.
              </Alert>
              
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleGenerateApiKey}
                >
                  Generate New API Key
                </Button>
              </Box>
              
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Your API Keys
                  </Typography>
                  
                  <List>
                    {apiKeys.map((apiKey) => (
                      <React.Fragment key={apiKey.id}>
                        <ListItem>
                          <ListItemText
                            primary={apiKey.name}
                            secondary={
                              <>
                                <Typography component="span" variant="body2">
                                  {`${apiKey.key.substring(0, 8)}...${apiKey.key.substring(apiKey.key.length - 4)}`}
                                </Typography>
                                <br />
                                <Typography component="span" variant="caption" color="text.secondary">
                                  Created: {apiKey.created} | Last used: {apiKey.lastUsed}
                                </Typography>
                              </>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleDeleteApiKey(apiKey.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
              
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    API Documentation
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    Access our comprehensive API documentation to learn how to integrate with the Trade AI platform.
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    color="primary"
                    href="#"
                  >
                    View API Documentation
                  </Button>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;