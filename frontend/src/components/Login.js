import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Paper,
  Grid,
  Divider,
  Link
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { authService } from '../services/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login({ email, password });
      
      if (response.success) {
        // Store user data
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Call onLogin callback
        if (onLogin) {
          onLogin(response.data.user);
        }
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Invalid credentials. Try admin@tradeai.com / password123');
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container 
      component="main" 
      maxWidth="lg" 
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center',
        background: 'var(--bg-primary)',
        position: 'relative'
      }}
    >
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(0,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 4s ease-in-out infinite'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '5%',
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 6s ease-in-out infinite reverse'
        }}
      />
      
      <Grid container spacing={4} sx={{ height: '80vh', zIndex: 1 }}>
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <img 
              src="/images/modern-edgy-logo.svg" 
              alt="Trade AI Logo" 
              style={{ 
                height: 80, 
                marginBottom: 24,
                filter: 'drop-shadow(0 0 10px rgba(0,255,255,0.3))'
              }} 
            />
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              className="glitch-text"
              data-text="TRADE AI"
              sx={{
                background: 'linear-gradient(45deg, #ffffff, #00ffff, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 900,
                letterSpacing: '2px',
                textAlign: 'center'
              }}
            >
              TRADE AI
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'var(--text-secondary)', 
                textAlign: 'center',
                fontWeight: 300,
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              Next-Generation Trade Intelligence
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'var(--text-muted)', 
                textAlign: 'center',
                mt: 2,
                maxWidth: '400px'
              }}
            >
              AI-Powered FMCG Trade Spend Management Platform
            </Typography>
          </Box>
          
          <Card 
            className="modern-card"
            sx={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
              boxShadow: 'var(--shadow-card)',
              '&:hover': {
                boxShadow: 'var(--shadow-elevated)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography 
                variant="h5" 
                component="h2" 
                align="center" 
                gutterBottom
                sx={{
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  mb: 3
                }}
              >
                Access Your Dashboard
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      '& fieldset': {
                        borderColor: 'var(--border-primary)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--neon-cyan)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--neon-cyan)',
                        boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'var(--text-secondary)',
                      '&.Mui-focused': {
                        color: 'var(--neon-cyan)',
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'var(--text-secondary)' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      '& fieldset': {
                        borderColor: 'var(--border-primary)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--neon-cyan)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--neon-cyan)',
                        boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'var(--text-secondary)',
                      '&.Mui-focused': {
                        color: 'var(--neon-cyan)',
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'var(--text-secondary)' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          edge="end"
                          sx={{ color: 'var(--text-secondary)' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  className="neon-button primary"
                  sx={{ 
                    mt: 3, 
                    mb: 2, 
                    py: 1.5,
                    background: 'transparent',
                    border: '2px solid var(--neon-purple)',
                    color: 'var(--neon-purple)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    '&:hover': {
                      background: 'rgba(139, 92, 246, 0.1)',
                      boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
                      textShadow: '0 0 10px var(--neon-purple)',
                    },
                    '&:disabled': {
                      opacity: 0.6,
                      border: '2px solid var(--border-primary)',
                      color: 'var(--text-muted)',
                    }
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <div className="loading-spinner" style={{ width: 20, height: 20 }} />
                      ACCESSING...
                    </Box>
                  ) : (
                    'ACCESS PLATFORM'
                  )}
                </Button>
              </Box>
              
              <Divider sx={{ my: 3, borderColor: 'var(--border-primary)' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '0.75rem'
                  }}
                >
                  Demo Access
                </Typography>
              </Divider>
              
              <Box 
                sx={{ 
                  mt: 2,
                  p: 2,
                  background: 'var(--bg-tertiary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-primary)'
                }}
              >
                <Typography variant="body2" gutterBottom sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                  <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>ADMIN:</span> admin@tradeai.com / password123
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                  <span style={{ color: 'var(--neon-purple)', fontWeight: 600 }}>MANAGER:</span> manager@tradeai.com / password123
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--neon-green)', fontWeight: 600 }}>KAM:</span> kam@tradeai.com / password123
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'flex' } }}>
          <Paper 
            elevation={0} 
            className="modern-card"
            sx={{ 
              p: 4, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))',
              color: 'var(--text-primary)',
              height: '100%',
              borderRadius: '16px',
              border: '1px solid var(--border-primary)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Decorative elements */}
            <Box
              sx={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(0,255,255,0.05) 0%, transparent 70%)',
                borderRadius: '50%',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: '-30px',
                left: '-30px',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
                borderRadius: '50%',
              }}
            />
            
            <Typography 
              variant="h3" 
              gutterBottom
              sx={{
                background: 'linear-gradient(45deg, #ffffff, #00ffff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800,
                letterSpacing: '1px',
                mb: 3
              }}
            >
              Welcome to the Future
            </Typography>
            <Typography 
              variant="h6" 
              paragraph
              sx={{ 
                color: 'var(--text-secondary)',
                fontWeight: 300,
                lineHeight: 1.6,
                mb: 4
              }}
            >
              Next-generation FMCG trade intelligence platform powered by advanced AI algorithms and real-time analytics.
            </Typography>
            
            <Box sx={{ my: 4, zIndex: 1 }}>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{
                  color: 'var(--neon-cyan)',
                  fontWeight: 600,
                  mb: 3,
                  textShadow: '0 0 10px rgba(0,255,255,0.3)'
                }}
              >
                Advanced Capabilities
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0 }}>
                {[
                  'AI-Powered Predictive Analytics',
                  'Intelligent Budget Optimization',
                  'Real-time Trade Spend Monitoring',
                  'Advanced ROI Forecasting',
                  'Dynamic Performance Dashboards',
                  'Seamless Enterprise Integration'
                ].map((feature, index) => (
                  <Box 
                    component="li" 
                    key={index}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 2,
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <Box
                      sx={{
                        width: '6px',
                        height: '6px',
                        background: `linear-gradient(45deg, var(--neon-cyan), var(--neon-purple))`,
                        borderRadius: '50%',
                        mr: 2,
                        boxShadow: '0 0 10px rgba(0,255,255,0.5)'
                      }}
                    />
                    {feature}
                  </Box>
                ))}
              </Box>
            </Box>
            
            <Box sx={{ mt: 'auto', zIndex: 1 }}>
              <Typography 
                variant="body2"
                sx={{ 
                  color: 'var(--text-muted)',
                  textAlign: 'center'
                }}
              >
                Need assistance? <Link 
                  href="#" 
                  sx={{ 
                    color: 'var(--neon-cyan)',
                    textDecoration: 'none',
                    '&:hover': {
                      textShadow: '0 0 5px var(--neon-cyan)'
                    }
                  }}
                >
                  Contact Support
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Login;