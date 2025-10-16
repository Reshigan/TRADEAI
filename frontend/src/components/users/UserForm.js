import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Snackbar,
  Card,
  CardContent,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

import { PageHeader } from '../common';

// Mock data for development

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = id && id !== 'new';
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    password: '',
    confirmPassword: '',
    status: 'active',
    sendWelcomeEmail: true
  });
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Load user data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      // In a real app, we would fetch data from the API
      // For now, we'll use mock data
      setLoading(true);
      
    }
  }, [isEditMode]);
  
  // Handle form input change
  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === 'sendWelcomeEmail' ? checked : value
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };
  
  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    // In a real app, we would call the API to save the user
    setTimeout(() => {
      setSaving(false);
      
      setSnackbar({
        open: true,
        message: isEditMode
          ? `User ${formData.name} has been updated`
          : `User ${formData.name} has been created`,
        severity: 'success'
      });
      
      // Navigate back to user list after successful save
      setTimeout(() => {
        navigate('/users');
      }, 1500);
    }, 1500);
  };
  
  // Handle cancel
  const handleCancel = () => {
    navigate('/users');
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar((prevSnackbar) => ({
      ...prevSnackbar,
      open: false
    }));
  };
  
  return (
    <Box>
      <PageHeader
        title={isEditMode ? 'Edit User' : 'Create User'}
        subtitle={isEditMode ? 'Update user information and permissions' : 'Add a new user to the system'}
      />
      
      <Paper sx={{ p: 3, mb: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  User Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={Boolean(errors.role)} required>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    label="Role"
                  >
                    <MenuItem value="Administrator">Administrator</MenuItem>
                    <MenuItem value="Manager">Manager</MenuItem>
                    <MenuItem value="Analyst">Analyst</MenuItem>
                    <MenuItem value="Viewer">Viewer</MenuItem>
                  </Select>
                  {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={Boolean(errors.department)} required>
                  <InputLabel id="department-label">Department</InputLabel>
                  <Select
                    labelId="department-label"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    label="Department"
                  >
                    <MenuItem value="IT">IT</MenuItem>
                    <MenuItem value="Sales">Sales</MenuItem>
                    <MenuItem value="Marketing">Marketing</MenuItem>
                    <MenuItem value="Finance">Finance</MenuItem>
                    <MenuItem value="Operations">Operations</MenuItem>
                    <MenuItem value="Product">Product</MenuItem>
                  </Select>
                  {errors.department && <FormHelperText>{errors.department}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  {isEditMode ? 'Change Password' : 'Set Password'}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {isEditMode && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Leave the password fields blank if you don't want to change the password.
                  </Alert>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                  required={!isEditMode}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword}
                  required={!isEditMode}
                />
              </Grid>
              
              {isEditMode && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Account Status
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <FormControl component="fieldset">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.status === 'active'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            status: e.target.checked ? 'active' : 'inactive'
                          }))}
                          color="primary"
                        />
                      }
                      label={formData.status === 'active' ? 'Active' : 'Inactive'}
                    />
                    <FormHelperText>
                      {formData.status === 'active'
                        ? 'User can access the system'
                        : 'User cannot access the system'
                      }
                    </FormHelperText>
                  </FormControl>
                </Grid>
              )}
              
              {!isEditMode && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Notification Options
                      </Typography>
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.sendWelcomeEmail}
                            onChange={handleChange}
                            name="sendWelcomeEmail"
                            color="primary"
                          />
                        }
                        label="Send welcome email with login instructions"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    startIcon={<ArrowBackIcon />}
                    sx={{ mr: 2 }}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <CircularProgress size={24} sx={{ mr: 1 }} />
                        Saving...
                      </>
                    ) : (
                      isEditMode ? 'Update User' : 'Create User'
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        )}
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserForm;