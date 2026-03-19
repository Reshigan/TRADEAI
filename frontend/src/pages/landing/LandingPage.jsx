import React, { useState } from 'react';
import { Box, Typography, Button, TextField, Card, Grid, Container, InputAdornment, IconButton, Alert, CircularProgress } from '@mui/material';
import { TrendingUp, Shield, Zap, BarChart3, ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

const features = [
  { icon: TrendingUp, title: 'AI-Powered Promotions', desc: 'Simulate ROI before launch. Predict cannibalization, forward-buying, and optimal spend allocation with machine learning.' },
  { icon: Shield, title: 'Budget Enforcement', desc: 'Real-time budget tracking from allocation to settlement. KAM wallets ensure no overspend with automated approval routing.' },
  { icon: Zap, title: 'Automated Settlement', desc: 'Match deductions to accruals automatically. Generate settlements, reconcile claims, and close the loop in minutes.' },
  { icon: BarChart3, title: 'P&L Waterfall', desc: '10-line waterfall from Gross Revenue to Net Trade Margin. Drill down by customer, product, promotion, or period.' },
];

const stats = [
  { value: '35%', label: 'Reduction in trade spend waste' },
  { value: '4x', label: 'Faster deduction matching' },
  { value: '98%', label: 'Budget utilization accuracy' },
  { value: '60%', label: 'Less time on manual reconciliation' },
];

export default function LandingPage({ onLogin }) {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      const resp = response.data;
      const token = resp?.token || resp?.data?.tokens?.accessToken;
      const user = resp?.data?.user || resp?.user || resp;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(user));
        if (onLogin) onLogin(user);
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAFBFC' }}>
      {/* Nav */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 3, md: 6 }, py: 2, position: 'sticky', top: 0, bgcolor: 'rgba(250,251,252,0.9)', backdropFilter: 'blur(12px)', zIndex: 100, borderBottom: '1px solid #F1F5F9' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2.5, background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>T</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 18, color: '#0F172A', lineHeight: 1.1 }}>TradeAI</Typography>
            <Typography sx={{ fontSize: 9, color: '#64748B', fontWeight: 500, letterSpacing: '0.1em' }}>TRADE INTELLIGENCE</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => setShowLogin(true)} sx={{ borderColor: '#E2E8F0', color: '#475569' }}>Sign In</Button>
          <Button variant="contained" onClick={() => setShowLogin(true)} sx={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}>Get Started</Button>
        </Box>
      </Box>

      {/* Hero */}
      <Box sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 6, md: 10 }, textAlign: 'center', px: 3 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: '#EEF2FF', px: 2, py: 0.75, borderRadius: 99, mb: 3 }}>
          <Zap size={14} color="#4F46E5" />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#4F46E5' }}>AI-Powered Trade Promotion Management</Typography>
        </Box>
        <Typography sx={{ fontSize: { xs: 36, md: 56 }, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#0F172A', maxWidth: 800, mx: 'auto', mb: 3 }}>
          {'Manage trade spend with '}
          <Box component="span" sx={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>intelligence</Box>
        </Typography>
        <Typography sx={{ fontSize: { xs: 16, md: 20 }, color: '#64748B', maxWidth: 600, mx: 'auto', mb: 5, lineHeight: 1.6 }}>
          From budget allocation to P&L analysis. TradeAI automates the entire FMCG trade promotion lifecycle with AI simulation, real-time enforcement, and SAP integration.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" size="large" endIcon={<ArrowRight size={18} />} onClick={() => setShowLogin(true)}
            sx={{ px: 4, py: 1.5, fontSize: 16, background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', borderRadius: 3 }}>
            Start Free Trial
          </Button>
          <Button variant="outlined" size="large" sx={{ px: 4, py: 1.5, fontSize: 16, borderColor: '#E2E8F0', color: '#475569', borderRadius: 3 }}>
            Watch Demo
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 10 } }}>
        <Grid container spacing={3}>
          {stats.map((s, i) => (
            <Grid item xs={6} md={3} key={i}>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography sx={{ fontSize: { xs: 32, md: 40 }, fontWeight: 800, background: 'linear-gradient(135deg, #2563EB, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</Typography>
                <Typography sx={{ fontSize: 14, color: '#64748B' }}>{s.label}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features */}
      <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 10 } }}>
        <Typography sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 700, textAlign: 'center', mb: 1, color: '#0F172A' }}>Everything you need for trade promotion</Typography>
        <Typography sx={{ textAlign: 'center', color: '#64748B', mb: 6, fontSize: 16 }}>Built for FMCG teams managing complex trade spend across retailers.</Typography>
        <Grid container spacing={3}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Grid item xs={12} md={6} key={i}>
                <Card sx={{ p: 4, height: '100%', transition: 'all 0.2s', '&:hover': { borderColor: '#2563EB', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(37,99,235,0.08)' } }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <Icon size={24} color="#4F46E5" />
                  </Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 600, mb: 1, color: '#0F172A' }}>{f.title}</Typography>
                  <Typography sx={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>{f.desc}</Typography>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* Process Chain */}
      <Box sx={{ bgcolor: '#0F172A', py: { xs: 6, md: 10 }, mb: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 700, textAlign: 'center', mb: 1, color: '#fff' }}>Complete TPM Process Chain</Typography>
          <Typography sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', mb: 5, fontSize: 16 }}>Every step wired together, end to end.</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
            {['Budget', 'Wallet', 'Promotion', 'Approval', 'Activation', 'Accrual', 'Deduction', 'Settlement', 'P&L'].map((step, i) => (
              <React.Fragment key={step}>
                <Box sx={{ px: 3, py: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.15)', bgcolor: 'rgba(255,255,255,0.05)' }}>
                  <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{step}</Typography>
                </Box>
                {i < 8 && <Box sx={{ display: 'flex', alignItems: 'center' }}><ArrowRight size={16} color="rgba(255,255,255,0.3)" /></Box>}
              </React.Fragment>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA */}
      <Container maxWidth="md" sx={{ mb: { xs: 6, md: 10 }, textAlign: 'center' }}>
        <Typography sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 700, mb: 2, color: '#0F172A' }}>Ready to optimize your trade spend?</Typography>
        <Typography sx={{ color: '#64748B', mb: 4, fontSize: 16 }}>Join leading FMCG brands using TradeAI to drive profitable growth.</Typography>
        <Button variant="contained" size="large" endIcon={<ArrowRight size={18} />} onClick={() => setShowLogin(true)}
          sx={{ px: 5, py: 1.5, fontSize: 16, background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', borderRadius: 3 }}>
          Get Started Now
        </Button>
      </Container>

      {/* Footer */}
      <Box sx={{ borderTop: '1px solid #F1F5F9', py: 4, textAlign: 'center' }}>
        <Typography sx={{ fontSize: 13, color: '#64748B' }}>
          {'\u00a9 '}{new Date().getFullYear()} TradeAI by GONXT Technology | Vanta X Holdings (Pty) Ltd. All rights reserved.
        </Typography>
      </Box>

      {/* Login Modal */}
      {showLogin && (
        <Box onClick={() => setShowLogin(false)} sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          <Card onClick={e => e.stopPropagation()} sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2.5, background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>T</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Sign in to TradeAI</Typography>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Trade Intelligence Platform</Typography>
              </Box>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleLogin}>
              <TextField fullWidth label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} sx={{ mb: 2 }} autoFocus required />
              <TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} sx={{ mb: 3 }} required
                InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</IconButton></InputAdornment> }} />
              <Button fullWidth type="submit" variant="contained" disabled={loading} size="large"
                sx={{ py: 1.5, background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', borderRadius: 2 }}>
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign In'}
              </Button>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography component="a" href="/forgot-password" sx={{ fontSize: 13, color: 'primary.main', textDecoration: 'none' }}>Forgot password?</Typography>
              <Typography component="a" href="/register" sx={{ fontSize: 13, color: 'primary.main', textDecoration: 'none' }}>Create account</Typography>
            </Box>
          </Card>
        </Box>
      )}
    </Box>
  );
}
