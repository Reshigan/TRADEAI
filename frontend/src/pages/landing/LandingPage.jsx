import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, TextField, Grid, Container, InputAdornment, IconButton, Alert, CircularProgress, Divider } from '@mui/material';
import { TrendingUp, Shield, Zap, ArrowRight, Eye, EyeOff, CheckCircle, ChevronRight, PieChart, Globe, Play, Star, Check, Wallet, Menu, X } from 'lucide-react';
import api from '../../services/api';

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.unobserve(el); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function Reveal({ children, delay = 0, direction = 'up' }) {
  const [ref, inView] = useInView();
  const t = { up: 'translateY(48px)', down: 'translateY(-48px)', left: 'translateX(48px)', right: 'translateX(-48px)' };
  return (
    <Box ref={ref} sx={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : t[direction], transition: `all 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s` }}>
      {children}
    </Box>
  );
}

const c = {
  emerald: '#10B981', emeraldLight: '#34D399', emeraldDark: '#059669',
  gold: '#F59E0B', goldLight: '#FBBF24', goldDark: '#D97706',
  bg: '#09090B', bgCard: '#18181B', bgElevated: '#1C1C1F',
  surface: '#27272A', surfaceLight: '#3F3F46',
  white: '#FAFAFA', offWhite: '#E4E4E7', muted: '#A1A1AA', dim: '#71717A',
  border: 'rgba(255,255,255,0.08)', borderHover: 'rgba(255,255,255,0.15)',
  gradientHero: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
  gradientGold: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  gradientGlow: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
  gradientGlowGold: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
};

const gridBg = {
  backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
  backgroundSize: '64px 64px',
};

const features = [
  { icon: TrendingUp, title: 'AI Promotion Engine', desc: 'Predict ROI before launch. Simulate cannibalization, forward-buying, and optimal allocation with ML models trained on your data.', tag: 'ML', accent: '#10B981' },
  { icon: Shield, title: 'Budget Enforcement', desc: 'Real-time budget tracking from allocation to settlement. KAM wallets ensure zero overspend with automated escalation.', tag: 'Governance', accent: '#F59E0B' },
  { icon: Zap, title: 'Auto Settlement', desc: 'Match deductions to accruals automatically. Generate settlements and close the loop in minutes instead of weeks.', tag: 'Automation', accent: '#10B981' },
  { icon: PieChart, title: 'P&L Waterfall', desc: '10-line waterfall from Gross Revenue to Net Trade Margin. Drill into customer, product, or time period in real-time.', tag: 'Analytics', accent: '#F59E0B' },
  { icon: Wallet, title: 'KAM Spend Wallets', desc: 'Allocate budgets per KAM and customer. Track utilization, commitments, and available balance with full audit trail.', tag: 'Finance', accent: '#10B981' },
  { icon: Globe, title: 'Enterprise Sync', desc: 'SAP, Oracle, and ERP connectors built-in. Webhook-driven architecture for real-time integration with existing systems.', tag: 'Integration', accent: '#F59E0B' },
];

const metrics = [
  { value: '35%', label: 'Reduction in trade spend waste' },
  { value: '4x', label: 'Faster deduction matching' },
  { value: '98%', label: 'Budget utilization accuracy' },
  { value: '60%', label: 'Less time on reconciliation' },
];

const processSteps = [
  { step: 'Budget', num: '01' }, { step: 'Wallet', num: '02' }, { step: 'Promotion', num: '03' },
  { step: 'Approval', num: '04' }, { step: 'Activation', num: '05' }, { step: 'Accrual', num: '06' },
  { step: 'Deduction', num: '07' }, { step: 'Settlement', num: '08' }, { step: 'P&L', num: '09' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'VP Trade Marketing', company: 'Global FMCG Corp', quote: 'TradeAI transformed how we manage trade spend. The AI predictions alone saved us millions in the first quarter.' },
  { name: 'Marcus Johnson', role: 'CFO', company: 'Premium Brands Inc', quote: 'Finally, a platform that gives us real-time visibility into our trade promotion ROI. Game-changing for our finance team.' },
  { name: 'Ayesha Patel', role: 'Head of Revenue Growth', company: 'Fresh Foods Ltd', quote: 'The automated settlement module cut our reconciliation time by 70%. Our team focuses on strategy now, not spreadsheets.' },
];

const plans = [
  { name: 'Growth', price: '$2,499', period: '/mo', desc: 'For growing FMCG brands', features: ['Up to 500 promotions/year', 'AI ROI predictions', 'Budget management', 'Claims & deductions', 'Email support', '5 user seats'], popular: false },
  { name: 'Enterprise', price: 'Custom', period: '', desc: 'For large FMCG organizations', features: ['Unlimited promotions', 'Advanced AI/ML models', 'Full process chain', 'SAP integration', 'Dedicated CSM', 'Unlimited seats', 'Custom workflows', 'SLA guarantee'], popular: true },
  { name: 'Professional', price: '$4,999', period: '/mo', desc: 'For established FMCG teams', features: ['Up to 2,000 promotions/year', 'Advanced analytics', 'Full P&L waterfall', 'Webhook integrations', 'Priority support', '25 user seats', 'API access'], popular: false },
];

function Counter({ value, duration = 2000 }) {
  const [display, setDisplay] = useState('0');
  const [ref, inView] = useInView(0.3);
  useEffect(() => {
    if (!inView) return;
    const numericPart = value.replace(/[^0-9]/g, '');
    const suffix = value.replace(/[0-9]/g, '');
    const target = parseInt(numericPart, 10);
    if (isNaN(target)) { setDisplay(value); return; }
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { start = target; clearInterval(timer); }
      setDisplay(start + suffix);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value, duration]);
  return <span ref={ref}>{display}</span>;
}

export default function LandingPage({ onLogin }) {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMobileMenu(false); };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: c.bg, color: c.white, overflow: 'hidden' }}>

      {/* NAVBAR */}
      <Box component="nav" sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100,
        px: { xs: 2, md: 4 }, py: scrolled ? 1.5 : 2,
        bgcolor: scrolled ? 'rgba(9,9,11,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Box sx={{
              width: 38, height: 38, borderRadius: 2.5,
              background: c.gradientHero,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(16,185,129,0.3)',
            }}>
              <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 18, letterSpacing: '-0.03em' }}>T</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 20, color: c.white, letterSpacing: '-0.03em', lineHeight: 1.1 }}>TradeAI</Typography>
              <Typography sx={{ fontSize: 9, color: c.dim, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Trade Intelligence</Typography>
            </Box>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
            {['Features', 'Process', 'Pricing'].map(item => (
              <Typography key={item} onClick={() => scrollTo(item.toLowerCase())}
                sx={{ fontSize: 14, fontWeight: 500, color: c.muted, cursor: 'pointer', transition: 'color 0.2s', '&:hover': { color: c.emerald } }}>
                {item}
              </Typography>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button variant="text" onClick={() => setShowLogin(true)}
              sx={{ display: { xs: 'none', md: 'inline-flex' }, color: c.muted, fontWeight: 600, fontSize: 14, '&:hover': { color: c.emerald, bgcolor: 'rgba(16,185,129,0.06)' } }}>
              Sign In
            </Button>
            <Button variant="contained" onClick={() => setShowLogin(true)}
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                background: c.gradientHero, fontWeight: 700, fontSize: 14, px: 3, py: 1,
                borderRadius: 2.5, border: '1px solid rgba(16,185,129,0.3)',
                boxShadow: '0 0 20px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                '&:hover': { boxShadow: '0 0 32px rgba(16,185,129,0.4), inset 0 1px 0 rgba(255,255,255,0.15)', transform: 'translateY(-1px)' },
                transition: 'all 0.25s',
              }}>
              Get Started
            </Button>
            <IconButton onClick={() => setMobileMenu(!mobileMenu)} sx={{ display: { md: 'none' }, color: c.muted }}>
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </IconButton>
          </Box>
        </Container>

        {mobileMenu && (
          <Box sx={{ display: { md: 'none' }, px: 3, py: 3, bgcolor: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {['Features', 'Process', 'Pricing'].map(item => (
              <Typography key={item} onClick={() => scrollTo(item.toLowerCase())}
                sx={{ fontSize: 16, fontWeight: 500, color: c.muted, py: 1.5, cursor: 'pointer', '&:hover': { color: c.emerald } }}>
                {item}
              </Typography>
            ))}
            <Button fullWidth variant="contained" onClick={() => { setShowLogin(true); setMobileMenu(false); }}
              sx={{ mt: 2, background: c.gradientHero, fontWeight: 700, borderRadius: 2 }}>
              Get Started
            </Button>
          </Box>
        )}
      </Box>

      {/* HERO */}
      <Box sx={{ pt: { xs: 18, md: 24 }, pb: { xs: 10, md: 18 }, position: 'relative', ...gridBg }}>
        <Box sx={{ position: 'absolute', top: '5%', left: '20%', width: 700, height: 700, background: c.gradientGlow, pointerEvents: 'none', filter: 'blur(40px)' }} />
        <Box sx={{ position: 'absolute', top: '30%', right: '10%', width: 500, height: 500, background: c.gradientGlowGold, pointerEvents: 'none', filter: 'blur(60px)' }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Reveal>
              <Box sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1, mb: 4,
                px: 2.5, py: 0.75, borderRadius: 99,
                bgcolor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
              }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.emerald, boxShadow: '0 0 8px #10B981' }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: c.emeraldLight, letterSpacing: '0.02em' }}>
                  Next-Gen Trade Promotion Management
                </Typography>
              </Box>
            </Reveal>

            <Reveal delay={0.1}>
              <Typography sx={{
                fontSize: { xs: 42, sm: 56, md: 72, lg: 84 }, fontWeight: 900,
                lineHeight: 1.02, letterSpacing: '-0.045em',
                color: c.white, maxWidth: 900, mx: 'auto', mb: 3,
              }}>
                {'Trade spend, '}
                <Box component="span" sx={{
                  background: 'linear-gradient(135deg, #10B981 0%, #34D399 40%, #F59E0B 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  mastered.
                </Box>
              </Typography>
            </Reveal>

            <Reveal delay={0.2}>
              <Typography sx={{
                fontSize: { xs: 16, md: 20 }, color: c.muted, maxWidth: 580, mx: 'auto', mb: 6,
                lineHeight: 1.7, fontWeight: 400,
              }}>
                From budget allocation to P&amp;L close. TradeAI automates the entire FMCG trade promotion lifecycle with AI simulation, real-time enforcement, and enterprise-grade integration.
              </Typography>
            </Reveal>

            <Reveal delay={0.3}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 5 }}>
                <Button variant="contained" size="large" endIcon={<ArrowRight size={18} />} onClick={() => setShowLogin(true)}
                  sx={{
                    px: 5, py: 2, fontSize: 16, fontWeight: 700,
                    background: c.gradientHero, borderRadius: 3,
                    border: '1px solid rgba(16,185,129,0.3)',
                    boxShadow: '0 0 32px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                    '&:hover': { boxShadow: '0 0 48px rgba(16,185,129,0.45)', transform: 'translateY(-2px)' },
                    transition: 'all 0.3s',
                  }}>
                  Start Free Trial
                </Button>
                <Button variant="outlined" size="large" startIcon={<Play size={18} />} onClick={() => setShowLogin(true)}
                  sx={{
                    px: 5, py: 2, fontSize: 16, fontWeight: 600,
                    borderColor: c.border, color: c.muted, borderRadius: 3, borderWidth: 1.5,
                    '&:hover': { borderColor: c.emerald, color: c.emeraldLight, bgcolor: 'rgba(16,185,129,0.04)', borderWidth: 1.5 },
                  }}>
                  Watch Demo
                </Button>
              </Box>
            </Reveal>

            <Reveal delay={0.4}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 2, md: 4 }, flexWrap: 'wrap' }}>
                {['No credit card required', 'Free 14-day trial', 'SOC 2 compliant'].map(item => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CheckCircle size={15} color={c.emerald} />
                    <Typography sx={{ fontSize: 13, color: c.dim, fontWeight: 500 }}>{item}</Typography>
                  </Box>
                ))}
              </Box>
            </Reveal>
          </Box>
        </Container>
      </Box>

      {/* METRICS */}
      <Box sx={{ py: { xs: 8, md: 10 }, borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {metrics.map((m, i) => (
              <Grid item xs={6} md={3} key={i}>
                <Reveal delay={i * 0.1}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{
                      fontSize: { xs: 36, md: 52 }, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1,
                      background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                      <Counter value={m.value} />
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: c.dim, mt: 1, fontWeight: 500 }}>{m.label}</Typography>
                  </Box>
                </Reveal>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FEATURES - Bento Grid */}
      <Box id="features" sx={{ py: { xs: 12, md: 18 }, position: 'relative', ...gridBg }}>
        <Box sx={{ position: 'absolute', bottom: '10%', left: '5%', width: 600, height: 600, background: c.gradientGlowGold, pointerEvents: 'none', filter: 'blur(80px)' }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Reveal>
            <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: c.gold, letterSpacing: '0.2em', textTransform: 'uppercase', mb: 2 }}>
                Capabilities
              </Typography>
              <Typography sx={{ fontSize: { xs: 32, md: 48 }, fontWeight: 900, letterSpacing: '-0.04em', mb: 2 }}>
                Everything you need.{' '}
                <Box component="span" sx={{ color: c.muted }}>Nothing you don&rsquo;t.</Box>
              </Typography>
              <Typography sx={{ fontSize: 18, color: c.dim, maxWidth: 520, mx: 'auto' }}>
                Built for FMCG teams managing complex trade spend across retailers and channels.
              </Typography>
            </Box>
          </Reveal>

          <Grid container spacing={2.5}>
            {features.map((f, i) => {
              const Icon = f.icon;
              const isLarge = i < 2;
              return (
                <Grid item xs={12} md={isLarge ? 6 : 4} key={i}>
                  <Reveal delay={i * 0.06}>
                    <Box sx={{
                      p: { xs: 3, md: isLarge ? 5 : 4 }, height: '100%',
                      bgcolor: c.bgCard, borderRadius: 4,
                      border: '1px solid rgba(255,255,255,0.08)',
                      position: 'relative', overflow: 'hidden',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.15)',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.15)',
                      },
                      '&::before': {
                        content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                        background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)`,
                        opacity: 0, transition: 'opacity 0.4s',
                      },
                      '&:hover::before': { opacity: 1 },
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Box sx={{
                          width: 48, height: 48, borderRadius: 3,
                          bgcolor: `${f.accent}12`,
                          border: `1px solid ${f.accent}20`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={22} color={f.accent} />
                        </Box>
                        <Typography sx={{
                          fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: f.accent, opacity: 0.8,
                        }}>
                          {f.tag}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: isLarge ? 22 : 19, fontWeight: 700, mb: 1.5, color: c.white, letterSpacing: '-0.01em' }}>
                        {f.title}
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: c.dim, lineHeight: 1.8 }}>
                        {f.desc}
                      </Typography>
                    </Box>
                  </Reveal>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* PROCESS CHAIN */}
      <Box id="process" sx={{
        py: { xs: 12, md: 16 }, position: 'relative',
        borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Box sx={{ position: 'absolute', top: '20%', right: '15%', width: 400, height: 400, background: c.gradientGlow, pointerEvents: 'none', filter: 'blur(60px)' }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Reveal>
            <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: c.emerald, letterSpacing: '0.2em', textTransform: 'uppercase', mb: 2 }}>
                Workflow
              </Typography>
              <Typography sx={{ fontSize: { xs: 32, md: 48 }, fontWeight: 900, letterSpacing: '-0.04em', mb: 2 }}>
                Complete TPM Process Chain
              </Typography>
              <Typography sx={{ color: c.dim, fontSize: 18, maxWidth: 480, mx: 'auto' }}>
                Every step connected. Every dollar tracked. Zero gaps.
              </Typography>
            </Box>
          </Reveal>

          <Reveal delay={0.2}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: { xs: 1.5, md: 0 } }}>
              {processSteps.map((p, i) => (
                <React.Fragment key={p.step}>
                  <Box sx={{
                    px: { xs: 2.5, md: 3.5 }, py: { xs: 2, md: 2.5 }, borderRadius: 3,
                    bgcolor: c.bgCard, border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'default',
                    '&:hover': {
                      bgcolor: 'rgba(16,185,129,0.08)',
                      borderColor: 'rgba(16,185,129,0.25)',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 24px rgba(16,185,129,0.1)',
                    },
                  }}>
                    <Typography sx={{ color: c.emerald, fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', mb: 0.5, opacity: 0.7 }}>
                      {p.num}
                    </Typography>
                    <Typography sx={{ color: c.white, fontWeight: 700, fontSize: { xs: 13, md: 15 } }}>
                      {p.step}
                    </Typography>
                  </Box>
                  {i < processSteps.length - 1 && (
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', px: 0.5 }}>
                      <ChevronRight size={16} color={c.surfaceLight} />
                    </Box>
                  )}
                </React.Fragment>
              ))}
            </Box>
          </Reveal>
        </Container>
      </Box>

      {/* TESTIMONIALS */}
      <Box sx={{ py: { xs: 12, md: 18 }, position: 'relative', ...gridBg }}>
        <Container maxWidth="lg">
          <Reveal>
            <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: c.gold, letterSpacing: '0.2em', textTransform: 'uppercase', mb: 2 }}>
                Testimonials
              </Typography>
              <Typography sx={{ fontSize: { xs: 32, md: 48 }, fontWeight: 900, letterSpacing: '-0.04em' }}>
                Trusted by FMCG leaders
              </Typography>
            </Box>
          </Reveal>
          <Grid container spacing={3}>
            {testimonials.map((t, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Reveal delay={i * 0.1}>
                  <Box sx={{
                    p: 4, height: '100%', borderRadius: 4,
                    bgcolor: c.bgCard, border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'all 0.3s',
                    '&:hover': { borderColor: 'rgba(255,255,255,0.15)', boxShadow: '0 16px 40px rgba(0,0,0,0.3)' },
                  }}>
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 3 }}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={16} fill={c.gold} color={c.gold} />)}
                    </Box>
                    <Typography sx={{ fontSize: 15, color: c.offWhite, lineHeight: 1.8, mb: 3 }}>
                      &ldquo;{t.quote}&rdquo;
                    </Typography>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: c.white }}>{t.name}</Typography>
                    <Typography sx={{ fontSize: 13, color: c.dim }}>{t.role}, {t.company}</Typography>
                  </Box>
                </Reveal>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* PRICING */}
      <Box id="pricing" sx={{ py: { xs: 12, md: 18 }, borderTop: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 400, background: c.gradientGlow, pointerEvents: 'none', filter: 'blur(100px)', opacity: 0.5 }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Reveal>
            <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: c.emerald, letterSpacing: '0.2em', textTransform: 'uppercase', mb: 2 }}>
                Pricing
              </Typography>
              <Typography sx={{ fontSize: { xs: 32, md: 48 }, fontWeight: 900, letterSpacing: '-0.04em', mb: 2 }}>
                Simple, transparent pricing
              </Typography>
              <Typography sx={{ fontSize: 18, color: c.dim, maxWidth: 480, mx: 'auto' }}>Start free. Scale as you grow.</Typography>
            </Box>
          </Reveal>

          <Grid container spacing={3} justifyContent="center">
            {plans.map((plan, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Reveal delay={i * 0.1}>
                  <Box sx={{
                    p: 4, height: '100%', borderRadius: 4, position: 'relative', overflow: 'hidden',
                    bgcolor: plan.popular ? 'rgba(16,185,129,0.04)' : c.bgCard,
                    border: plan.popular ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: plan.popular ? '0 0 40px rgba(16,185,129,0.12)' : 'none',
                    transform: plan.popular ? 'scale(1.02)' : 'none',
                    transition: 'all 0.3s',
                    '&:hover': { transform: plan.popular ? 'scale(1.04)' : 'translateY(-4px)', borderColor: 'rgba(255,255,255,0.15)' },
                  }}>
                    {plan.popular && (
                      <Box sx={{
                        position: 'absolute', top: 20, right: -28,
                        background: c.gradientHero, color: '#fff',
                        px: 4, py: 0.5, transform: 'rotate(45deg)',
                        fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
                      }}>
                        POPULAR
                      </Box>
                    )}
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: c.emerald, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1 }}>
                      {plan.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1 }}>
                      <Typography sx={{ fontSize: 42, fontWeight: 900, color: c.white, letterSpacing: '-0.04em' }}>{plan.price}</Typography>
                      {plan.period && <Typography sx={{ fontSize: 16, color: c.dim }}>{plan.period}</Typography>}
                    </Box>
                    <Typography sx={{ fontSize: 14, color: c.dim, mb: 4 }}>{plan.desc}</Typography>
                    <Button fullWidth variant={plan.popular ? 'contained' : 'outlined'} size="large" onClick={() => setShowLogin(true)}
                      sx={{
                        mb: 4, py: 1.5, borderRadius: 2.5, fontWeight: 700,
                        ...(plan.popular
                          ? { background: c.gradientHero, boxShadow: '0 0 24px rgba(16,185,129,0.3)', border: '1px solid rgba(16,185,129,0.3)' }
                          : { borderColor: 'rgba(255,255,255,0.08)', color: c.muted, '&:hover': { borderColor: '#10B981', color: '#34D399' } }),
                      }}>
                      {plan.popular ? 'Contact Sales' : 'Start Free Trial'}
                    </Button>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {plan.features.map((feat, fi) => (
                        <Box key={fi} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Check size={16} color={c.emerald} />
                          <Typography sx={{ fontSize: 14, color: c.dim }}>{feat}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Reveal>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FINAL CTA */}
      <Box sx={{ py: { xs: 12, md: 18 }, position: 'relative', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 900, height: 500, background: c.gradientGlow, pointerEvents: 'none', filter: 'blur(80px)', opacity: 0.6 }} />
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Reveal>
            <Typography sx={{ fontSize: { xs: 36, md: 52 }, fontWeight: 900, letterSpacing: '-0.04em', mb: 3, lineHeight: 1.1 }}>
              Ready to eliminate{' '}
              <Box component="span" sx={{
                background: 'linear-gradient(135deg, #10B981 0%, #F59E0B 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                trade spend waste?
              </Box>
            </Typography>
            <Typography sx={{ color: c.dim, mb: 6, fontSize: 18, maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}>
              Join leading FMCG brands using TradeAI to drive profitable growth.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="contained" size="large" endIcon={<ArrowRight size={18} />} onClick={() => setShowLogin(true)}
                sx={{
                  px: 5, py: 2, fontSize: 16, fontWeight: 700,
                  background: c.gradientHero, borderRadius: 3,
                  border: '1px solid rgba(16,185,129,0.3)',
                  boxShadow: '0 0 32px rgba(16,185,129,0.3)',
                  '&:hover': { boxShadow: '0 0 48px rgba(16,185,129,0.45)', transform: 'translateY(-2px)' },
                  transition: 'all 0.3s',
                }}>
                Get Started Now
              </Button>
              <Button variant="outlined" size="large" onClick={() => setShowLogin(true)}
                sx={{
                  px: 5, py: 2, fontSize: 16, fontWeight: 600,
                  borderColor: 'rgba(255,255,255,0.08)', color: c.muted, borderRadius: 3, borderWidth: 1.5,
                  '&:hover': { borderColor: '#10B981', color: '#34D399', borderWidth: 1.5 },
                }}>
                Schedule Demo
              </Button>
            </Box>
          </Reveal>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box sx={{ bgcolor: c.bgCard, py: { xs: 6, md: 8 }, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 2, background: c.gradientHero, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>T</Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: 18, color: c.white }}>TradeAI</Typography>
              </Box>
              <Typography sx={{ fontSize: 14, color: c.dim, lineHeight: 1.8, maxWidth: 280 }}>
                AI-powered FMCG trade promotion management. From budget to P&amp;L, every step automated.
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography sx={{ color: c.muted, fontWeight: 700, fontSize: 12, mb: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Product</Typography>
              {['Features', 'Pricing', 'Integrations', 'API Docs'].map(item => (
                <Typography key={item} sx={{ color: c.dim, fontSize: 14, mb: 1.5, cursor: 'pointer', transition: 'color 0.2s', '&:hover': { color: c.emerald } }}>{item}</Typography>
              ))}
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography sx={{ color: c.muted, fontWeight: 700, fontSize: 12, mb: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Company</Typography>
              {['About', 'Blog', 'Careers', 'Contact'].map(item => (
                <Typography key={item} sx={{ color: c.dim, fontSize: 14, mb: 1.5, cursor: 'pointer', transition: 'color 0.2s', '&:hover': { color: c.emerald } }}>{item}</Typography>
              ))}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography sx={{ color: c.muted, fontWeight: 700, fontSize: 12, mb: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Stay Updated</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField size="small" placeholder="Enter your email"
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: c.bg, color: c.white, borderRadius: 2,
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                      '&:hover fieldset': { borderColor: c.surfaceLight },
                      '&.Mui-focused fieldset': { borderColor: c.emerald },
                    },
                    '& .MuiInputBase-input::placeholder': { color: c.dim, opacity: 1 },
                  }}
                />
                <Button variant="contained" sx={{ background: c.gradientHero, borderRadius: 2, px: 3, fontWeight: 700, minWidth: 'auto' }}>
                  <ArrowRight size={18} />
                </Button>
              </Box>
            </Grid>
          </Grid>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 4 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ fontSize: 13, color: c.dim }}>
              &copy; {new Date().getFullYear()} TradeAI by GONXT Technology | Vanta X Holdings (Pty) Ltd. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              {['Privacy', 'Terms', 'Security'].map(item => (
                <Typography key={item} sx={{ fontSize: 13, color: c.dim, cursor: 'pointer', transition: 'color 0.2s', '&:hover': { color: c.muted } }}>{item}</Typography>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* LOGIN MODAL */}
      {showLogin && (
        <Box onClick={() => setShowLogin(false)}
          sx={{
            position: 'fixed', inset: 0, zIndex: 1300,
            bgcolor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
          }}>
          <Box onClick={e => e.stopPropagation()}
            sx={{
              width: '100%', maxWidth: 420, p: 5, borderRadius: 4,
              bgcolor: c.bgCard, border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
              position: 'relative',
            }}>
            <Box sx={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 200, height: 80, background: c.gradientGlow, filter: 'blur(40px)', pointerEvents: 'none' }} />

            <Box sx={{ textAlign: 'center', mb: 4, position: 'relative' }}>
              <Box sx={{
                width: 52, height: 52, borderRadius: 3, mx: 'auto', mb: 2,
                background: c.gradientHero,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 32px rgba(16,185,129,0.3)',
              }}>
                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 24 }}>T</Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: 22, color: c.white, letterSpacing: '-0.02em' }}>
                Sign in to TradeAI
              </Typography>
              <Typography sx={{ fontSize: 14, color: c.dim, mt: 0.5 }}>Trade Intelligence Platform</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)', '& .MuiAlert-icon': { color: '#F87171' } }}>{error}</Alert>}

            <form onSubmit={handleLogin}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: c.muted, mb: 0.75 }}>Email</Typography>
              <TextField fullWidth size="small" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: c.bg, color: c.white, borderRadius: 2,
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                    '&:hover fieldset': { borderColor: c.surfaceLight },
                    '&.Mui-focused fieldset': { borderColor: c.emerald },
                  },
                  '& .MuiInputBase-input::placeholder': { color: c.dim, opacity: 1 },
                }} />
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: c.muted, mb: 0.75 }}>Password</Typography>
              <TextField fullWidth size="small" type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)} sx={{ color: c.dim }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: c.bg, color: c.white, borderRadius: 2,
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                    '&:hover fieldset': { borderColor: c.surfaceLight },
                    '&.Mui-focused fieldset': { borderColor: c.emerald },
                  },
                  '& .MuiInputBase-input::placeholder': { color: c.dim, opacity: 1 },
                }} />
              <Button fullWidth type="submit" variant="contained" disabled={loading}
                sx={{
                  py: 1.5, fontWeight: 700, fontSize: 15, borderRadius: 2.5,
                  background: c.gradientHero,
                  border: '1px solid rgba(16,185,129,0.3)',
                  boxShadow: '0 0 24px rgba(16,185,129,0.25)',
                  '&:hover': { boxShadow: '0 0 36px rgba(16,185,129,0.4)' },
                  '&.Mui-disabled': { opacity: 0.6 },
                }}>
                {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign In'}
              </Button>
            </form>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Typography sx={{ fontSize: 13, color: c.emerald, cursor: 'pointer', fontWeight: 500, '&:hover': { color: c.emeraldLight } }}>
                Forgot password?
              </Typography>
              <Typography sx={{ fontSize: 13, color: c.emerald, cursor: 'pointer', fontWeight: 500, '&:hover': { color: c.emeraldLight } }}>
                Create account
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
