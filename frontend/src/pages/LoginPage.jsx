import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { authService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authService.login(form);
      login(result.user, result.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', px: 2 }}>
      <Card sx={{ maxWidth: 420, width: '100%', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 4, background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', textAlign: 'center' }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 28 }}>T</Typography>
          </Box>
          <Typography variant="h2" sx={{ color: '#fff', mb: 0.5 }}>TradeAI</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Enterprise Trade Intelligence Platform</Typography>
        </Box>
        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} sx={{ mb: 2 }} required />
            <TextField fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} sx={{ mb: 3 }} required />
            <Button fullWidth variant="contained" type="submit" disabled={loading} size="large"
              sx={{ bgcolor: 'primary.main', py: 1.5, fontSize: 15, fontWeight: 600, '&:hover': { bgcolor: 'primary.dark', filter: 'brightness(0.85)' } }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>
          </form>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
            Demo: test@golive.com / GoLive@2026
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
