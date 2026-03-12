import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress
} from '@mui/material';
import { Email as EmailIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import apiClient from '../../services/apiClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/api/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 2 }}>
      <Card sx={{ maxWidth: 440, width: '100%', borderRadius: 3, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <EmailIcon sx={{ fontSize: 48, color: '#6366f1', mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>Forgot Password</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
          </Box>

          {success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              If an account exists with that email, a password reset link has been sent. Please check your inbox.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 3 }}
                autoFocus
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !email}
                sx={{ py: 1.5, borderRadius: 2, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', textTransform: 'none', fontWeight: 600, fontSize: '1rem' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
              </Button>
            </form>
          )}

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button component={Link} to="/login" startIcon={<ArrowBackIcon />} sx={{ textTransform: 'none', color: '#6366f1' }}>
              Back to Login
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
