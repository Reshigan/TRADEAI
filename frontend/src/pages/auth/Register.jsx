import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Link,
  Grid,
  MenuItem
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyId: '690c703c755f331594b3c503', // Default company ID
    tenantId: '690c7011bb89caac6d854b0a', // Default tenant ID
    employeeId: '',
    role: 'analyst',
    department: 'sales'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await axios.post(`${API_BASE_URL}/auth/register`, registerData);

      if (response.data.success) {
        localStorage.setItem('token', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)',
      p: 3
    }}>
      <Paper elevation={3} sx={{ 
        maxWidth: 550, 
        width: '100%', 
        p: 5, 
        borderRadius: 3 
      }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" fontWeight={700} mb={1}>
            🚀 TRADEAI
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your account
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            type="email"
            label="Email Address"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
            placeholder="you@example.com"
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="password"
                label="Password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                inputProps={{ minLength: 8 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="password"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                inputProps={{ minLength: 8 }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Employee ID"
                value={formData.employeeId}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                required
                placeholder="EMP001"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                required
              >
                <MenuItem value="sales">Sales</MenuItem>
                <MenuItem value="marketing">Marketing</MenuItem>
                <MenuItem value="finance">Finance</MenuItem>
                <MenuItem value="operations">Operations</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company ID"
                value={formData.companyId}
                onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                required
                placeholder="COMP001"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tenant ID"
                value={formData.tenantId}
                onChange={(e) => setFormData(prev => ({ ...prev, tenantId: e.target.value }))}
                required
                placeholder="TEN001"
              />
            </Grid>
          </Grid>

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ 
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem'
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </Box>

        <Box mt={3} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link
              component="button"
              onClick={() => navigate('/login')}
              sx={{ fontWeight: 600, cursor: 'pointer' }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register;
