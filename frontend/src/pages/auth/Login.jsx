import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Link
} from '@mui/material';
import { authService } from '../../services/api';
import newLogo from '../../assets/new_logo.svg';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // GAP-01: 2FA challenge state
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.login(formData);

      // GAP-01: If 2FA required, show challenge screen
      if (result.requires2FA) {
        setTempToken(result.tempToken);
        setShow2FA(true);
        setLoading(false);
        return;
      }

      if (result.token && result.user) {
        navigate('/dashboard');
      } else {
        setError('Login failed - invalid response');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // GAP-01: Handle 2FA verification
  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { tempToken };
      if (useBackupCode) { payload.backupCode = totpCode; } else { payload.token = totpCode; }
      const result = await authService.verify2FA(payload);
      if (result.token && result.user) { navigate('/dashboard'); }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid 2FA code.');
    } finally {
      setLoading(false);
    }
  };

  // GAP-01: 2FA Challenge Screen
  if (show2FA) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1E3A8A 0%, #5B21B6 100%)', p: 3 }}>
        <Paper elevation={3} sx={{ maxWidth: 450, width: '100%', p: 5, borderRadius: 3 }}>
          <Box textAlign="center" mb={4}>
            <Box component="img" src={newLogo} alt="Trade AI Logo" sx={{ height: 50, mb: 2 }} />
            <Typography variant="h5" fontWeight={700} mb={1}>Two-Factor Authentication</Typography>
            <Typography variant="body2" color="text.secondary">
              {useBackupCode ? 'Enter a backup code' : 'Enter the 6-digit code from your authenticator app'}
            </Typography>
          </Box>
          {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>{error}</Alert>}
          <Box component="form" onSubmit={handle2FASubmit}>
            <TextField fullWidth label={useBackupCode ? 'Backup Code' : 'Authentication Code'} value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)} required
              placeholder={useBackupCode ? 'Enter backup code' : '000000'}
              inputProps={{ maxLength: useBackupCode ? 20 : 6, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' } }}
              autoFocus sx={{ mb: 3 }} />
            <Button fullWidth type="submit" variant="contained" disabled={loading}
              sx={{ py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '1rem', mb: 2 }}>
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
            <Box textAlign="center">
              <Link component="button" type="button" onClick={() => { setUseBackupCode(!useBackupCode); setTotpCode(''); setError(''); }}
                sx={{ fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                {useBackupCode ? 'Use authenticator app instead' : 'Use a backup code'}
              </Link>
            </Box>
            <Box textAlign="center" mt={2}>
              <Link component="button" type="button" onClick={() => { setShow2FA(false); setTempToken(''); setTotpCode(''); setError(''); }}
                sx={{ cursor: 'pointer', fontSize: '0.875rem', color: 'text.secondary' }}>Back to login</Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1E3A8A 0%, #5B21B6 100%)',
      p: 3
    }}>
      <Paper elevation={3} sx={{ 
        maxWidth: 450, 
        width: '100%', 
        p: 5, 
        borderRadius: 3 
      }}>
        <Box textAlign="center" mb={4}>
          <Box 
            component="img" 
            src={newLogo} 
            alt="Trade AI Logo"
            sx={{ height: 50, mb: 2 }}
          />
          <Typography variant="h4" fontWeight={700} mb={1}>
            TRADEAI
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to your account
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type="email"
            label="Email Address"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
            placeholder="you@example.com"
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            type="password"
            label="Password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
            placeholder="••••••••"
            sx={{ mb: 4 }}
          />

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
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Box>

        <Box mt={3} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link
              component="button"
              onClick={() => navigate('/register')}
              sx={{ fontWeight: 600, cursor: 'pointer' }}
            >
              Sign up
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
