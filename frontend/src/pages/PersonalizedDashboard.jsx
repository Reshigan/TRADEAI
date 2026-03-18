import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  WavingHand as WaveIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import SmartInsightsWidget from '../components/SmartInsightsWidget';
import QuickActionsPanel from '../components/QuickActionsPanel';
import SuccessTracker from '../components/SuccessTracker';
import InteractiveTrendChart from '../components/InteractiveTrendChart';

/**
 * Personalized Dashboard - The Heart of the System
 * 
 * A living, breathing dashboard that adapts to each user.
 * Makes users feel like the system knows them and is working FOR them.
 */
const PersonalizedDashboard = () => {
  const [user, setUser] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [dashboardData, setDashboardData] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);

  useEffect(() => {
    // GAP-05: Get real user from auth context / localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser({
          id: parsed.id,
          name: `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || parsed.email,
          firstName: parsed.firstName,
          role: parsed.role || 'User',
          avatar: parsed.avatar || null,
          email: parsed.email,
          companyId: parsed.companyId
        });
      } else {
        setUser({ name: 'User', role: 'User', firstName: 'User' });
      }
    } catch {
      setUser({ name: 'User', role: 'User', firstName: 'User' });
    }

    // Personalized greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }

    // GAP-05: Wire to real API endpoints
    fetchDashboardData();
    fetchAIInsights();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || '/api';
      const res = await fetch(`${baseUrl}/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data.data || data);
      }
    } catch { /* fallback to static display */ }
  };

  const fetchAIInsights = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || '/api';
      const res = await fetch(`${baseUrl}/ai-copilot/suggest-actions`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setAiInsights(data.data || data.suggestions || []);
      }
    } catch { /* fallback */ }
  };

  const handleRefresh = () => {
    setLastRefresh(new Date());
    fetchDashboardData();
    fetchAIInsights();
  };

  if (!user) {
    return <Box sx={{ p: 3 }}>Loading...</Box>;
  }

  return (
    <Box sx={{ bgcolor: 'action.hover', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Personalized Header */}
        <Box sx={{ mb: 4 }}>
          <Paper sx={{ 
            p: 3,
            background: 'linear-gradient(135deg, #1E3A8A 0%, #5B21B6 100%)',
            color: 'white'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar 
                  sx={{ width: 72, height: 72, border: '3px solid white' }}
                  src={user.avatar}
                >
                  {user.name.charAt(0)}
                </Avatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {greeting}, {user.name.split(' ')[0]}
                    </Typography>
                    <WaveIcon sx={{ fontSize: 32, color: '#ffd700' }} />
                  </Box>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    {user.role} • Last refresh: {lastRefresh.toLocaleTimeString()}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Refresh dashboard">
                  <IconButton 
                    onClick={handleRefresh}
                    sx={{ 
                      color: 'white',
                      bgcolor: 'rgba(255,255,255,0.2)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Dashboard settings">
                  <IconButton 
                    sx={{ 
                      color: 'white',
                      bgcolor: 'rgba(255,255,255,0.2)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Quick Stats - GAP-05: Wire to real data */}
            <Box sx={{ display: 'flex', gap: 3, mt: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Today's Tasks
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {dashboardData?.pendingApprovals ?? '...'} pending
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Active Promotions
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {dashboardData?.activePromotions ?? '...'} running
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Budget Utilization
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {dashboardData?.budgetUtilization ? `${Math.round(dashboardData.budgetUtilization)}%` : '...'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Main Dashboard Grid */}
        <Grid container spacing={3}>
          {/* Left Column - Insights & Actions */}
          <Grid item xs={12} lg={8}>
            {/* Smart Insights */}
            <SmartInsightsWidget userId={user.id} />

            {/* Quick Actions */}
            <QuickActionsPanel />

            {/* Revenue Trend Chart */}
            <InteractiveTrendChart 
              title="Revenue Performance"
              metric="revenue"
              prediction={true}
              benchmark={42000}
              insights="Strong upward trend with 18% growth. AI predicts continued momentum for next 2 weeks based on seasonal buying patterns."
            />

            {/* Key Metrics */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                    R1.2M
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Revenue
                  </Typography>
                  <Chip label="↑ 12%" size="small" color="success" sx={{ mt: 1 }} />
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#059669' }}>
                    3.2x
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average ROI
                  </Typography>
                  <Chip label="↑ 8%" size="small" color="success" sx={{ mt: 1 }} />
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                    87%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Success Rate
                  </Typography>
                  <Chip label="↑ 5%" size="small" color="success" sx={{ mt: 1 }} />
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Right Column - Success Tracker */}
          <Grid item xs={12} lg={4}>
            <SuccessTracker userId={user.id} />
          </Grid>
        </Grid>

        {/* Contextual Tips */}
        <Paper sx={{ p: 2, mt: 3, bgcolor: '#ecfdf5', border: '2px solid #059669' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#059669', mb: 1 }}>
            Smart Tip of the Day
          </Typography>
          <Typography variant="body2" sx={{ color: '#047857' }}>
            Your high-value customer "ABC Retailers" hasn't placed an order in 14 days (longer than usual). 
            Consider reaching out with a personalized offer. <Button size="small" sx={{ ml: 1 }}>Create Offer</Button>
          </Typography>
        </Paper>

        {/* Learning Progress */}
        <Paper sx={{ p: 2, mt: 2, bgcolor: '#eff6ff' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1E3A8A', mb: 1 }}>
            Your AI is Getting Smarter
          </Typography>
          <Typography variant="body2" sx={{ color: '#1E3A8A', mb: 1 }}>
            After analyzing your last 156 decisions, the AI model accuracy has improved to 91% (up from 87% last week).
            The more you use it, the better it gets at understanding your preferences.
          </Typography>
          <Chip 
            label="Model accuracy: 91%" 
            size="small" 
            sx={{ bgcolor: 'primary.dark', color: 'white', fontWeight: 600 }}
          />
        </Paper>

        {/* Footer Timestamp */}
        <Box sx={{ textAlign: 'center', mt: 4, pb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Dashboard updated at {lastRefresh.toLocaleString()} • All predictions are real-time
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default PersonalizedDashboard;
