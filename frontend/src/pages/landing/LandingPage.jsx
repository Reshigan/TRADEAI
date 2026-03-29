import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, TextField, Card, Grid, Container, InputAdornment, IconButton, Alert, CircularProgress, Chip, Divider } from '@mui/material';
import { TrendingUp, Shield, Zap, ArrowRight, Eye, EyeOff, CheckCircle, ChevronRight, Layers, Target, LineChart, PieChart, Globe, Sparkles, Play, Star, Check } from 'lucide-react';
import api from '../../services/api';

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.unobserve(el); }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
}

function AnimatedSection({ children, delay = 0, direction = 'up' }) {
  const [ref, inView] = useInView();
  const transforms = { up: 'translateY(40px)', down: 'translateY(-40px)', left: 'translateX(40px)', right: 'translateX(-40px)' };
  return (
    <Box ref={ref} sx={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'none' : transforms[direction],
      transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
    }}>
      {children}
    </Box>
  );
}

const brand = {
  primary: '#6366F1', primaryDark: '#4F46E5', primaryLight: '#818CF8',
  accent: '#06B6D4', accentLight: '#22D3EE',
  dark: '#0F172A', darkAlt: '#1E293B',
  gray: '#64748B', grayLight: '#94A3B8', border: '#E2E8F0', bg: '#FAFBFE',
  gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)',
  gradientAccent: 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)',
};

const features = [
  { icon: TrendingUp, title: 'AI-Powered Promotions', desc: 'Simulate ROI before launch. Predict cannibalization, forward-buying, and optimal spend allocation with machine learning models trained on your data.', tag: 'ML Engine' },
  { icon: Shield, title: 'Budget Enforcement', desc: 'Real-time budget tracking from allocation to settlement. KAM wallets ensure zero overspend with automated approval routing and escalation.', tag: 'Governance' },
  { icon: Zap, title: 'Automated Settlement', desc: 'Match deductions to accruals automatically. Generate settlements, reconcile claims, and close the loop in minutes instead of weeks.', tag: 'Automation' },
  { icon: PieChart, title: 'P&L Waterfall', desc: '10-line waterfall from Gross Revenue to Net Trade Margin. Drill down by customer, product, promotion, or time period with real-time data.', tag: 'Analytics' },
  { icon: Layers, title: 'Complete Process Chain', desc: 'Budget to Wallet to Promotion to Approval to Activation to Accrual to Deduction to Settlement to P&L. Every step wired end-to-end.', tag: 'Workflow' },
  { icon: Globe, title: 'Enterprise Integration', desc: 'SAP, Oracle, and ERP connectors out of the box. Webhook-driven architecture for real-time sync with your existing systems.', tag: 'Integration' },
];

const stats = [
  { value: '35%', label: 'Reduction in trade spend waste', icon: TrendingUp },
  { value: '4x', label: 'Faster deduction matching', icon: Zap },
  { value: '98%', label: 'Budget utilization accuracy', icon: Target },
  { value: '60%', label: 'Less time on reconciliation', icon: LineChart },
];

const processSteps = ['Budget', 'Wallet', 'Promotion', 'Approval', 'Activation', 'Accrual', 'Deduction', 'Settlement', 'P&L'];

const testimonials = [
  { name: 'Sarah Chen', role: 'VP Trade Marketing', company: 'Global FMCG Corp', quote: 'TradeAI transformed how we manage trade spend. The AI predictions alone saved us millions in the first quarter.' },
  { name: 'Marcus Johnson', role: 'CFO', company: 'Premium Brands Inc', quote: 'Finally, a platform that gives us real-time visibility into our trade promotion ROI. Game-changing for our finance team.' },
  { name: 'Ayesha Patel', role: 'Head of Revenue Growth', company: 'Fresh Foods Ltd', quote: 'The automated settlement module cut our reconciliation time by 70%. Our team can now focus on strategy instead of spreadsheets.' },
];

const pricingPlans = [
  { name: 'Growth', price: '$2,499', period: '/month', desc: 'For growing FMCG brands', features: ['Up to 500 promotions/year', 'AI ROI predictions', 'Budget management', 'Claims & deductions', 'Email support', '5 user seats'], popular: false },
  { name: 'Enterprise', price: 'Custom', period: '', desc: 'For large FMCG organizations', features: ['Unlimited promotions', 'Advanced AI/ML models', 'Full process chain', 'SAP integration', 'Dedicated CSM', 'Unlimited seats', 'Custom workflows', 'SLA guarantee'], popular: true },
  { name: 'Professional', price: '$4,999', period: '/month', desc: 'For established FMCG teams', features: ['Up to 2,000 promotions/year', 'Advanced analytics', 'Full P&L waterfall', 'Webhook integrations', 'Priority support', '25 user seats', 'API access'], popular: false },
];

export default function LandingPage({ onLogin }) {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scrolled, setScrolled] = useState(false);

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

  const LogoMark = ({ size = 36 }) => (
    <Box sx={{ width: size, height: size, borderRadius: size * 0.3, background: brand.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)', flexShrink: 0 }}>
      <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: size * 0.5 }}>T</Typography>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: brand.bg, overflow: 'hidden' }}>
      {/* Navbar */}
      <Box sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        px: { xs: 2, md: 6 }, py: scrolled ? 1.5 : 2.5,
        bgcolor: scrolled ? 'rgba(250,251,254,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(226,232,240,0.6)' : '1px solid transparent',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LogoMark />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 20, color: brand.dark, lineHeight: 1.1, letterSpacing: '-0.02em' }}>TradeAI</Typography>
              <Typography sx={{ fontSize: 9, color: brand.grayLight, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Trade Intelligence</Typography>
            </Box>
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
            {['Features', 'Process', 'Pricing'].map(item => (
              <Typography key={item} component="a" href={`#${item.toLowerCase()}`}
                sx={{ fontSize: 14, fontWeight: 500, color: brand.gray, textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s', '&:hover': { color: brand.primary } }}>
                {item}
              </Typography>
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="text" onClick={() => setShowLogin(true)}
              sx={{ color: brand.gray, fontWeight: 600, fontSize: 14, '&:hover': { color: brand.primary, bgcolor: 'rgba(99,102,241,0.04)' } }}>
              Sign In
            </Button>
            <Button variant="contained" onClick={() => setShowLogin(true)}
              sx={{ background: brand.gradient, fontWeight: 600, fontSize: 14, px: 3, borderRadius: 2.5, boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)', '&:hover': { boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5)', transform: 'translateY(-1px)' }, transition: 'all 0.2s' }}>
              Get Started
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Hero */}
      <Box sx={{ pt: { xs: 16, md: 22 }, pb: { xs: 10, md: 16 }, position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: '10%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: '5%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <AnimatedSection>
              <Chip icon={<Sparkles size={14} />} label="AI-Powered Trade Promotion Management"
                sx={{ mb: 4, bgcolor: 'rgba(99,102,241,0.08)', color: brand.primary, fontWeight: 600, fontSize: 13, py: 2.5, px: 1, borderRadius: 99, border: '1px solid rgba(99,102,241,0.15)', '& .MuiChip-icon': { color: brand.primary } }} />
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <Typography sx={{ fontSize: { xs: 40, sm: 52, md: 68, lg: 76 }, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', color: brand.dark, maxWidth: 900, mx: 'auto', mb: 3 }}>
                Manage trade spend
                <br />
                {'with '}
                <Box component="span" sx={{ background: brand.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', position: 'relative' }}>
                  intelligence
                  <Box sx={{ position: 'absolute', bottom: -4, left: 0, right: 0, height: 4, background: brand.gradientAccent, borderRadius: 2, opacity: 0.6 }} />
                </Box>
              </Typography>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <Typography sx={{ fontSize: { xs: 16, md: 20 }, color: brand.gray, maxWidth: 640, mx: 'auto', mb: 6, lineHeight: 1.7, fontWeight: 400 }}>
                From budget allocation to P&L analysis. TradeAI automates the entire FMCG trade promotion lifecycle with AI simulation, real-time enforcement, and enterprise integration.
              </Typography>
            </AnimatedSection>
            <AnimatedSection delay={0.3}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 4 }}>
                <Button variant="contained" size="large" endIcon={<ArrowRight size={18} />} onClick={() => setShowLogin(true)}
                  sx={{ px: 5, py: 2, fontSize: 16, fontWeight: 700, background: brand.gradient, borderRadius: 3, boxShadow: '0 8px 24px rgba(99,102,241,0.35)', '&:hover': { boxShadow: '0 12px 32px rgba(99,102,241,0.45)', transform: 'translateY(-2px)' }, transition: 'all 0.25s' }}>
                  Start Free Trial
                </Button>
                <Button variant="outlined" size="large" startIcon={<Play size={18} />} onClick={() => setShowLogin(true)}
                  sx={{ px: 5, py: 2, fontSize: 16, fontWeight: 600, borderColor: brand.border, color: brand.gray, borderRadius: 3, borderWidth: 1.5, '&:hover': { borderColor: brand.primary, color: brand.primary, bgcolor: 'rgba(99,102,241,0.04)', borderWidth: 1.5 } }}>
                  Watch Demo
                </Button>
              </Box>
            </AnimatedSection>
            <AnimatedSection delay={0.4}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 2, md: 4 }, flexWrap: 'wrap' }}>
                {['No credit card required', 'Free 14-day trial', 'SOC 2 compliant'].map(item => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CheckCircle size={16} color={brand.accent} />
                    <Typography sx={{ fontSize: 13, color: brand.grayLight, fontWeight: 500 }}>{item}</Typography>
                  </Box>
                ))}
              </Box>
            </AnimatedSection>
          </Box>
        </Container>
      </Box>

      {/* Stats */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#fff', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <Grid item xs={6} md={3} key={i}>
                  <AnimatedSection delay={i * 0.1}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: 'rgba(99,102,241,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                        <Icon size={22} color={brand.primary} />
                      </Box>
                      <Typography sx={{ fontSize: { xs: 32, md: 44 }, fontWeight: 800, background: brand.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>{s.value}</Typography>
                      <Typography sx={{ fontSize: 14, color: brand.gray, mt: 0.5, fontWeight: 500 }}>{s.label}</Typography>
                    </Box>
                  </AnimatedSection>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Box id="features" sx={{ py: { xs: 10, md: 16 } }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Chip label="CAPABILITIES" sx={{ mb: 2, bgcolor: 'rgba(6,182,212,0.08)', color: brand.accent, fontWeight: 700, fontSize: 11, letterSpacing: '0.1em' }} />
              <Typography sx={{ fontSize: { xs: 32, md: 44 }, fontWeight: 800, color: brand.dark, letterSpacing: '-0.03em', mb: 2 }}>
                Everything you need for
                <Box component="span" sx={{ display: 'block', background: brand.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>trade promotion excellence</Box>
              </Typography>
              <Typography sx={{ fontSize: 18, color: brand.gray, maxWidth: 560, mx: 'auto' }}>
                Built for FMCG teams managing complex trade spend across retailers, distributors, and channels.
              </Typography>
            </Box>
          </AnimatedSection>
          <Grid container spacing={3}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Grid item xs={12} md={6} lg={4} key={i}>
                  <AnimatedSection delay={i * 0.08}>
                    <Card sx={{
                      p: 4, height: '100%', border: '1px solid', borderColor: brand.border, borderRadius: 4,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default', position: 'relative', overflow: 'hidden',
                      '&:hover': { borderColor: brand.primaryLight, transform: 'translateY(-4px)', boxShadow: '0 20px 40px rgba(99,102,241,0.1)' },
                      '&::before': { content: '"\"\"', position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: brand.gradient, opacity: 0, transition: 'opacity 0.3s' },
                      '&:hover::before': { opacity: 1 },
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Box sx={{ width: 52, height: 52, borderRadius: 3, background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={24} color={brand.primary} />
                        </Box>
                        <Chip label={f.tag} size="small" sx={{ bgcolor: 'rgba(99,102,241,0.06)', color: brand.primary, fontWeight: 600, fontSize: 11, height: 24 }} />
                      </Box>
                      <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 1.5, color: brand.dark, letterSpacing: '-0.01em' }}>{f.title}</Typography>
                      <Typography sx={{ fontSize: 14, color: brand.gray, lineHeight: 1.8 }}>{f.desc}</Typography>
                    </Card>
                  </AnimatedSection>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* Process Chain */}
      <Box id="process" sx={{ bgcolor: brand.dark, py: { xs: 10, md: 14 }, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: '20%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Chip label="WORKFLOW" sx={{ mb: 2, bgcolor: 'rgba(6,182,212,0.15)', color: brand.accentLight, fontWeight: 700, fontSize: 11, letterSpacing: '0.1em' }} />
              <Typography sx={{ fontSize: { xs: 32, md: 48 }, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', mb: 2 }}>
                Complete TPM Process Chain
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, maxWidth: 500, mx: 'auto' }}>Every step connected. Every dollar tracked. Zero gaps.</Typography>
            </Box>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: { xs: 1.5, md: 0 }, px: { xs: 1, md: 0 } }}>
              {processSteps.map((step, i) => (
                <React.Fragment key={step}>
                  <Box sx={{
                    px: { xs: 2.5, md: 3.5 }, py: { xs: 1.5, md: 2 }, borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.1)', bgcolor: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(10px)', transition: 'all 0.3s', cursor: 'default',
                    '&:hover': { bgcolor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)', transform: 'translateY(-2px)' },
                  }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', mb: 0.25 }}>{String(i + 1).padStart(2, '0')}</Typography>
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: { xs: 13, md: 15 } }}>{step}</Typography>
                  </Box>
                  {i < processSteps.length - 1 && (
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', px: 0.5 }}>
                      <ChevronRight size={18} color="rgba(99,102,241,0.4)" />
                    </Box>
                  )}
                </React.Fragment>
              ))}
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      {/* Testimonials */}
      <Box sx={{ py: { xs: 10, md: 16 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Chip label="TESTIMONIALS" sx={{ mb: 2, bgcolor: 'rgba(99,102,241,0.08)', color: brand.primary, fontWeight: 700, fontSize: 11, letterSpacing: '0.1em' }} />
              <Typography sx={{ fontSize: { xs: 32, md: 44 }, fontWeight: 800, color: brand.dark, letterSpacing: '-0.03em' }}>
                Trusted by FMCG leaders
              </Typography>
            </Box>
          </AnimatedSection>
          <Grid container spacing={3}>
            {testimonials.map((t, i) => (
              <Grid item xs={12} md={4} key={i}>
                <AnimatedSection delay={i * 0.1}>
                  <Card sx={{
                    p: 4, height: '100%', border: '1px solid', borderColor: brand.border, borderRadius: 4,
                    transition: 'all 0.3s', '&:hover': { borderColor: brand.primaryLight, boxShadow: '0 12px 32px rgba(99,102,241,0.08)' },
                  }}>
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 3 }}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="#F59E0B" color="#F59E0B" />)}
                    </Box>
                    <Typography sx={{ fontSize: 15, color: brand.dark, lineHeight: 1.8, mb: 3, fontStyle: 'italic' }}>
                      &ldquo;{t.quote}&rdquo;
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 14, color: brand.dark }}>{t.name}</Typography>
                      <Typography sx={{ fontSize: 13, color: brand.gray }}>{t.role}, {t.company}</Typography>
                    </Box>
                  </Card>
                </AnimatedSection>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Pricing */}
      <Box id="pricing" sx={{ py: { xs: 10, md: 16 }, bgcolor: brand.bg }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Chip label="PRICING" sx={{ mb: 2, bgcolor: 'rgba(6,182,212,0.08)', color: brand.accent, fontWeight: 700, fontSize: 11, letterSpacing: '0.1em' }} />
              <Typography sx={{ fontSize: { xs: 32, md: 44 }, fontWeight: 800, color: brand.dark, letterSpacing: '-0.03em', mb: 2 }}>
                Simple, transparent pricing
              </Typography>
              <Typography sx={{ fontSize: 18, color: brand.gray, maxWidth: 500, mx: 'auto' }}>Start with a free trial. Scale as you grow.</Typography>
            </Box>
          </AnimatedSection>
          <Grid container spacing={3} justifyContent="center">
            {pricingPlans.map((plan, i) => (
              <Grid item xs={12} md={4} key={i}>
                <AnimatedSection delay={i * 0.1}>
                  <Card sx={{
                    p: 4, height: '100%', borderRadius: 4, position: 'relative', overflow: 'hidden',
                    border: plan.popular ? '2px solid' : '1px solid',
                    borderColor: plan.popular ? brand.primary : brand.border,
                    boxShadow: plan.popular ? '0 20px 40px rgba(99,102,241,0.15)' : 'none',
                    transform: plan.popular ? 'scale(1.03)' : 'none',
                    transition: 'all 0.3s', '&:hover': { transform: plan.popular ? 'scale(1.05)' : 'translateY(-4px)', boxShadow: '0 20px 40px rgba(99,102,241,0.12)' },
                  }}>
                    {plan.popular && (
                      <Box sx={{ position: 'absolute', top: 16, right: -30, background: brand.gradient, color: '#fff', px: 4, py: 0.5, transform: 'rotate(45deg)', fontSize: 11, fontWeight: 700 }}>
                        POPULAR
                      </Box>
                    )}
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: brand.primary, letterSpacing: '0.05em', textTransform: 'uppercase', mb: 1 }}>{plan.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1 }}>
                      <Typography sx={{ fontSize: 40, fontWeight: 800, color: brand.dark, letterSpacing: '-0.03em' }}>{plan.price}</Typography>
                      {plan.period && <Typography sx={{ fontSize: 16, color: brand.gray }}>{plan.period}</Typography>}
                    </Box>
                    <Typography sx={{ fontSize: 14, color: brand.gray, mb: 4 }}>{plan.desc}</Typography>
                    <Button fullWidth variant={plan.popular ? 'contained' : 'outlined'} size="large" onClick={() => setShowLogin(true)}
                      sx={{
                        mb: 4, py: 1.5, borderRadius: 2.5, fontWeight: 700,
                        ...(plan.popular ? { background: brand.gradient, boxShadow: '0 4px 14px rgba(99,102,241,0.35)' } : { borderColor: brand.border, color: brand.dark }),
                      }}>
                      {plan.popular ? 'Contact Sales' : 'Start Free Trial'}
                    </Button>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {plan.features.map((f, fi) => (
                        <Box key={fi} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Check size={16} color={brand.primary} />
                          <Typography sx={{ fontSize: 14, color: brand.gray }}>{f}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Card>
                </AnimatedSection>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Final CTA */}
      <Box sx={{ py: { xs: 10, md: 16 }, background: brand.gradient, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <AnimatedSection>
            <Typography sx={{ fontSize: { xs: 32, md: 48 }, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', mb: 2 }}>
              Ready to optimize your trade spend?
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 5, fontSize: 18, maxWidth: 500, mx: 'auto' }}>
              Join leading FMCG brands using TradeAI to drive profitable growth and eliminate trade spend waste.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="contained" size="large" endIcon={<ArrowRight size={18} />} onClick={() => setShowLogin(true)}
                sx={{ px: 5, py: 2, fontSize: 16, fontWeight: 700, bgcolor: '#fff', color: brand.primary, borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', '&:hover': { bgcolor: '#F8FAFC', transform: 'translateY(-2px)', boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }, transition: 'all 0.25s' }}>
                Get Started Now
              </Button>
              <Button variant="outlined" size="large" onClick={() => setShowLogin(true)}
                sx={{ px: 5, py: 2, fontSize: 16, fontWeight: 600, borderColor: 'rgba(255,255,255,0.3)', color: '#fff', borderRadius: 3, borderWidth: 1.5, '&:hover': { borderColor: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.08)', borderWidth: 1.5 } }}>
                Schedule Demo
              </Button>
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: brand.dark, py: { xs: 6, md: 8 }, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <LogoMark size={32} />
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>TradeAI</Typography>
                  <Typography sx={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.15em' }}>TRADE INTELLIGENCE</Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, maxWidth: 300 }}>
                AI-powered FMCG trade spend management platform. From budget to P&L, every step automated.
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 13, mb: 2, letterSpacing: '0.05em' }}>Product</Typography>
              {['Features', 'Pricing', 'Integrations', 'API Docs'].map(item => (
                <Typography key={item} sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, mb: 1.5, cursor: 'pointer', transition: 'color 0.2s', '&:hover': { color: 'rgba(255,255,255,0.7)' } }}>{item}</Typography>
              ))}
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 13, mb: 2, letterSpacing: '0.05em' }}>Company</Typography>
              {['About', 'Blog', 'Careers', 'Contact'].map(item => (
                <Typography key={item} sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, mb: 1.5, cursor: 'pointer', transition: 'color 0.2s', '&:hover': { color: 'rgba(255,255,255,0.7)' } }}>{item}</Typography>
              ))}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 13, mb: 2, letterSpacing: '0.05em' }}>Stay Updated</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField size="small" placeholder="Enter your email" sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                  '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.3)' },
                }} />
                <Button variant="contained" sx={{ background: brand.gradient, borderRadius: 2, px: 3, minWidth: 'auto' }}>
                  <ArrowRight size={18} />
                </Button>
              </Box>
            </Grid>
          </Grid>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 4 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
              \u00a9 {new Date().getFullYear()} TradeAI by GONXT Technology | Vanta X Holdings (Pty) Ltd. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              {['Privacy', 'Terms', 'Security'].map(item => (
                <Typography key={item} sx={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', '&:hover': { color: 'rgba(255,255,255,0.6)' } }}>{item}</Typography>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Login Modal */}
      {showLogin && (
        <Box onClick={() => setShowLogin(false)} sx={{
          position: 'fixed', inset: 0, bgcolor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)',
          zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
          animation: 'fadeIn 0.2s ease-out',
          '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
        }}>
          <Card onClick={e => e.stopPropagation()} sx={{
            width: '100%', maxWidth: 440, p: { xs: 3, sm: 4 }, borderRadius: 4,
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(20px) scale(0.98)' }, to: { opacity: 1, transform: 'none' } },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
              <LogoMark />
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 20, color: brand.dark }}>Sign in to TradeAI</Typography>
                <Typography sx={{ fontSize: 13, color: brand.gray }}>Trade Intelligence Platform</Typography>
              </Box>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleLogin}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: brand.gray, mb: 0.75 }}>Email</Typography>
              <TextField fullWidth type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" autoFocus required
                sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: brand.gray, mb: 0.75 }}>Password</Typography>
              <TextField fullWidth type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required
                InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</IconButton></InputAdornment> }}
                sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
              <Button fullWidth type="submit" variant="contained" disabled={loading} size="large"
                sx={{ py: 1.75, background: brand.gradient, borderRadius: 2.5, fontSize: 15, fontWeight: 700, boxShadow: '0 4px 14px rgba(99,102,241,0.35)', '&:hover': { boxShadow: '0 6px 20px rgba(99,102,241,0.5)' } }}>
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
              </Button>
            </Box>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Typography component="a" href="/forgot-password" sx={{ fontSize: 13, color: brand.primary, textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>Forgot password?</Typography>
              <Typography component="a" href="/register" sx={{ fontSize: 13, color: brand.primary, textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>Create account</Typography>
            </Box>
          </Card>
        </Box>
      )}
    </Box>
  );
}
