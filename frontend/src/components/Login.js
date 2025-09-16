import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Alert,
  InputAdornment,
  IconButton,
  Divider
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { authService } from '../services/api';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Debug: Log component mount
  useEffect(() => {
    console.log('Login component mounted');
    console.log('React is working!');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Add alert for debugging
    alert('Form submitted! Email: ' + credentials.email);
    console.log('Login form submitted with:', { email: credentials.email, password: credentials.password ? '***' : 'empty' });
    
    // Simple validation
    if (!credentials.email || !credentials.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      console.log('Attempting login with authService...');
      // Use authService for consistent API handling
      const data = await authService.login({
        email: credentials.email,
        password: credentials.password
      });

      console.log('Login response received:', { success: !!data.token, user: data.user });

      if (data.token) {
        console.log('Login successful, setting localStorage and calling onLogin...');
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('isAuthenticated', 'true');
        
        // Debug: Check what's actually stored in localStorage
        console.log('Token stored:', localStorage.getItem('authToken'));
        console.log('isAuthenticated stored:', localStorage.getItem('isAuthenticated'));
        console.log('User stored:', localStorage.getItem('user'));
        
        console.log('About to call onLogin with user:', data.user);
        onLogin(data.user);
        console.log('onLogin called successfully, now navigating to dashboard...');
        // Force navigation to dashboard
        navigate('/dashboard', { replace: true });
        console.log('Navigation to dashboard initiated');
      } else {
        setError('Invalid credentials. Use seeded user accounts.');
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Premium animated background elements */}
      <div style={{
        position: 'absolute',
        top: '15%',
        right: '15%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(30, 64, 175, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'premiumFloat 8s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '15%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'premiumFloat 10s ease-in-out infinite reverse'
      }} />

      <Container maxWidth="lg">
        <Box display="flex" alignItems="center" minHeight="100vh">
          {/* Left side - Branding */}
          <Box flex={1} pr={4} className="slide-in">
            <Box display="flex" alignItems="center" mb={3}>
              <img 
                src="/images/corporate-logo.svg" 
                alt="Trade AI Logo"
                style={{ height: '60px', marginRight: '1rem' }}
              />
            </Box>
            
            <Typography 
              variant="h2" 
              className="premium-heading"
              sx={{ 
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 700,
                mb: 2,
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em'
              }}
            >
              TRADE AI
            </Typography>
            
            <Typography 
              variant="h4" 
              sx={{ 
                color: 'var(--text-secondary)',
                fontWeight: 600,
                mb: 3,
                fontSize: { xs: '1.5rem', md: '2rem' },
                letterSpacing: '-0.01em'
              }}
            >
              NEXT-GENERATION TRADE INTELLIGENCE
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'var(--text-muted)',
                fontSize: '1.1rem',
                mb: 4,
                lineHeight: 1.6
              }}
            >
              AI-Powered FMCG Trade Spend Management Platform
            </Typography>
          </Box>

          {/* Right side - Login Form */}
          <Box flex={1} className="fade-in">
            <Paper 
              elevation={0}
              className="glass-card"
              sx={{ 
                maxWidth: 420,
                mx: 'auto',
                background: 'var(--bg-glass)',
                backdropFilter: 'var(--glass-backdrop)',
                WebkitBackdropFilter: 'var(--glass-backdrop)',
                border: 'var(--glass-border)',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-glass)'
              }}
            >
              <Typography 
                variant="h5" 
                align="center" 
                sx={{ 
                  mb: 3,
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '1.5rem'
                }}
              >
                Access Your Dashboard
              </Typography>

              {error && (
                <Alert 
                  severity="error" 
                  className="premium-alert error"
                  sx={{ 
                    mb: 2,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#dc2626',
                    border: 'none',
                    borderLeft: '4px solid #dc2626',
                    borderRadius: '12px',
                    '& .MuiAlert-icon': {
                      color: '#dc2626'
                    }
                  }}
                >
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Box className="form-group">
                  <Typography className="form-label">Email Address</Typography>
                  <TextField
                    fullWidth
                    name="email"
                    type="email"
                    value={credentials.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email address"
                    className="premium-input"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: 'var(--primary-blue-light)' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '2px solid rgba(30, 64, 175, 0.1)',
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderColor: 'var(--primary-blue-light)',
                        },
                        '&.Mui-focused': {
                          borderColor: 'var(--primary-blue-light)',
                          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                        },
                        '& fieldset': {
                          border: 'none',
                        },
                      },
                      '& .MuiInputBase-input': {
                        padding: '14px 18px',
                        fontSize: '1rem',
                        fontWeight: 400,
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: 'var(--text-light)',
                        opacity: 1,
                      },
                    }}
                  />
                </Box>

                <Box className="form-group">
                  <Typography className="form-label">Password</Typography>
                  <TextField
                    fullWidth
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    className="premium-input"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: 'var(--primary-blue-light)' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: 'var(--text-muted)' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '2px solid rgba(30, 64, 175, 0.1)',
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderColor: 'var(--primary-blue-light)',
                        },
                        '&.Mui-focused': {
                          borderColor: 'var(--primary-blue-light)',
                          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                        },
                        '& fieldset': {
                          border: 'none',
                        },
                      },
                      '& .MuiInputBase-input': {
                        padding: '14px 18px',
                        fontSize: '1rem',
                        fontWeight: 400,
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: 'var(--text-light)',
                        opacity: 1,
                      },
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  className="premium-button"
                  onClick={handleSubmit}
                  sx={{
                    py: 1.75,
                    fontSize: '1rem',
                    fontWeight: 600,
                    letterSpacing: '0.025em',
                    background: 'var(--gradient-primary)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    textTransform: 'none',
                    boxShadow: 'var(--shadow-subtle)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'var(--gradient-primary)',
                      transform: 'translateY(-2px)',
                      boxShadow: 'var(--shadow-premium)',
                    },
                  }}
                >
                  ACCESS PLATFORM
                </Button>
              </form>

              <Divider sx={{ my: 3, borderColor: 'rgba(30, 64, 175, 0.1)' }}>
                <Typography variant="body2" sx={{ color: 'var(--text-muted)', px: 2, fontSize: '0.85rem', fontWeight: 500 }}>
                  DEMO ACCESS
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center', fontSize: '0.85rem' }}>
                <Typography variant="body2" sx={{ color: 'var(--text-muted)', mb: 1 }}>
                  <strong style={{ color: 'var(--primary-blue)' }}>ADMIN:</strong> admin@tradeai.com / password123
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-muted)', mb: 1 }}>
                  <strong style={{ color: 'var(--accent-gold)' }}>MANAGER:</strong> manager@tradeai.com / password123
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--primary-blue-light)' }}>KAM:</strong> kam@tradeai.com / password123
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* Right side content */}
        <Box 
          flex={1} 
          pl={4} 
          className="fade-in"
          sx={{ display: { xs: 'none', lg: 'block' } }}
        >
          <Typography 
            variant="h3" 
            sx={{ 
              color: 'var(--text-primary)',
              fontWeight: 700,
              mb: 3,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em'
            }}
          >
            Welcome to the Future
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'var(--text-secondary)',
              fontSize: '1.1rem',
              mb: 4,
              lineHeight: 1.6
            }}
          >
            Next-generation FMCG trade intelligence platform powered by advanced AI algorithms and real-time analytics.
          </Typography>

          <Box>
            <Typography 
              variant="h5" 
              className="accent-heading"
              sx={{ 
                background: 'var(--gradient-accent)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 600,
                mb: 2
              }}
            >
              Advanced Capabilities
            </Typography>
            
            <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
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
                    mb: 1.5,
                    color: 'var(--text-secondary)',
                    fontSize: '1rem'
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--gradient-accent)',
                      mr: 2,
                      boxShadow: '0 0 8px rgba(212, 175, 55, 0.3)'
                    }} 
                  />
                  {feature}
                </Box>
              ))}
            </Box>
          </Box>

          <Box mt={4}>
            <Typography 
              variant="body2" 
              sx={{ color: 'var(--text-muted)' }}
            >
              Need assistance?{' '}
              <a 
                href="#" 
                style={{ 
                  color: 'var(--primary-blue-light)',
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                Contact Support
              </a>
            </Typography>
          </Box>
        </Box>
      </Container>
    </div>
  );
};

export default Login;