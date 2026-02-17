import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  LinearProgress,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingCart,
  LocalOffer,
  Assessment,
  Warning,
  CheckCircle,
  School as SchoolIcon
} from '@mui/icons-material';
import { AIChatbotFAB } from './common';
import { WalkthroughTour } from './training';
import { AIInsightsFeed } from './contextual-ai';
import {analyticsService} from '../services/api';
import {safeNumber, safeToFixed, formatPercentage} from '../utils/formatters';

const kpiColors = ['#7C3AED', '#7C3AED', '#10B981', '#F59E0B'];

const Dashboard = ({ user }) => {
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showWalkthroughSnackbar, setShowWalkthroughSnackbar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    summary: null,
    monthlySpend: [],
    topCustomers: [],
    categoryPerformance: [],
    pendingApprovals: [],
    forecast: null
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await analyticsService.getDashboard();
        if (response.success) {
          setDashboardData(response.data);
        } else {
          throw new Error('Failed to fetch dashboard data');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const walkthroughCompleted = localStorage.getItem('walkthroughCompleted');
    const firstLogin = localStorage.getItem('firstLogin');
    if (!walkthroughCompleted && !firstLogin) {
      localStorage.setItem('firstLogin', 'true');
      setShowWalkthroughSnackbar(true);
    }
  }, []);

  const handleStartWalkthrough = () => {
    setShowWalkthrough(true);
    setShowWalkthroughSnackbar(false);
  };

  const handleCloseWalkthrough = () => {
    setShowWalkthrough(false);
  };

  const cardSx = {
    borderRadius: '16px',
    border: '1px solid #E5E7EB',
    boxShadow: 'none',
    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <AIChatbotFAB pageContext="dashboard" contextData={dashboardData} />
      <WalkthroughTour open={showWalkthrough} onClose={handleCloseWalkthrough} />

      <Snackbar
        open={showWalkthroughSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={10000}
        onClose={() => setShowWalkthroughSnackbar(false)}
      >
        <Alert
          severity="info"
          icon={<SchoolIcon />}
          action={
            <Button color="inherit" size="small" onClick={handleStartWalkthrough}>
              Start Tour
            </Button>
          }
          onClose={() => setShowWalkthroughSnackbar(false)}
        >
          Welcome to Trade AI Platform! Would you like to take a quick tour?
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          startIcon={<SchoolIcon />}
          onClick={handleStartWalkthrough}
          sx={{
            borderRadius: '24px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8rem',
            color: '#7C3AED',
            border: '1px solid #E5E7EB',
            px: 2.5,
            '&:hover': { bgcolor: 'rgba(124,58,237,0.04)', borderColor: '#7C3AED' },
          }}
        >
          Platform Tour
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress sx={{ color: '#7C3AED' }} />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            <AIInsightsFeed userId={user?.id} />
          </Box>

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {dashboardData.summary && [
              {
                title: 'Total Budget',
                value: `${dashboardData.summary.currencySymbol}${safeToFixed(safeNumber(dashboardData.summary.totalBudget) / 1000000, 1)}M`,
                icon: <AttachMoney />,
                change: '+12%',
                trend: 'up'
              },
              {
                title: 'Active Promotions',
                value: safeNumber(dashboardData.summary.activePromotions, 0).toString(),
                icon: <LocalOffer />,
                change: `+${safeNumber(dashboardData.summary.activePromotions, 0)}`,
                trend: 'up'
              },
              {
                title: 'Customers',
                value: safeNumber(dashboardData.summary.totalCustomers, 0).toString(),
                icon: <ShoppingCart />,
                change: '0',
                trend: 'neutral'
              },
              {
                title: 'Budget Utilization',
                value: formatPercentage(dashboardData.summary.budgetUtilization, 0),
                icon: <Assessment />,
                change: '+8%',
                trend: 'up'
              }
            ].map((kpi, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper elevation={0} sx={{ ...cardSx, p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: '12px',
                        bgcolor: alpha(kpiColors[index], 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {React.cloneElement(kpi.icon, { sx: { color: kpiColors[index], fontSize: 22 } })}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {kpi.trend === 'up' ? (
                        <TrendingUp sx={{ fontSize: 16, color: '#10B981' }} />
                      ) : kpi.trend === 'down' ? (
                        <TrendingDown sx={{ fontSize: 16, color: '#EF4444' }} />
                      ) : null}
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        sx={{
                          color: kpi.trend === 'up' ? '#10B981' : kpi.trend === 'down' ? '#EF4444' : '#6B7280',
                        }}
                      >
                        {kpi.change}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h4" fontWeight={800} sx={{ color: '#111827', mb: 0.25 }}>
                    {kpi.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {kpi.title}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ ...cardSx, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#7C3AED' }} />
                    <Typography variant="subtitle2" fontWeight={700}>Budget Overview</Typography>
                  </Box>
                  <Chip
                    icon={<Assessment sx={{ fontSize: '14px !important' }} />}
                    label="View Details"
                    variant="outlined"
                    size="small"
                    clickable
                    sx={{ borderRadius: '16px', fontWeight: 600, fontSize: '0.7rem' }}
                  />
                </Box>
                {dashboardData.summary ? (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {dashboardData.summary.currencySymbol}{safeToFixed(safeNumber(dashboardData.summary.totalUsed) / 1000000, 1)}M Used
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {dashboardData.summary.currencySymbol}{safeToFixed(safeNumber(dashboardData.summary.totalBudget) / 1000000, 1)}M Total
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={safeNumber(dashboardData.summary.budgetUtilization, 0)}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 5,
                          background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                        },
                      }}
                    />
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      {[
                        { label: 'Allocated', value: `${dashboardData.summary.currencySymbol}${safeToFixed(safeNumber(dashboardData.summary.totalUsed) / 1000000, 1)}M` },
                        { label: 'Remaining', value: `${dashboardData.summary.currencySymbol}${safeToFixed((safeNumber(dashboardData.summary.totalBudget) - safeNumber(dashboardData.summary.totalUsed)) / 1000000, 1)}M` },
                        { label: '% Used', value: formatPercentage(dashboardData.summary.budgetUtilization, 0) },
                      ].map((stat, idx) => (
                        <Grid item xs={4} key={idx}>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#F9FAFB', borderRadius: '12px' }}>
                            <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                            <Typography variant="h6" fontWeight={700}>{stat.value}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <Typography variant="body2" color="text.secondary">No budget data available</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 2 }} />
                <Box sx={{ bgcolor: '#F5F3FF', borderRadius: '12px', p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#7C3AED', mb: 0.5 }}>
                    AI Budget Forecast
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {dashboardData.forecast?.recommendation || 'Based on current spending patterns, you are projected to exceed your budget by 8% before year end.'}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ ...cardSx, p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>Pending Approvals</Typography>
                  <Button
                    size="small"
                    sx={{
                      borderRadius: '16px',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      color: '#7C3AED',
                      border: '1px solid #E5E7EB',
                      px: 2,
                    }}
                  >
                    View All
                  </Button>
                </Box>
                {dashboardData.pendingApprovals.length > 0 ? (
                  <List sx={{ width: '100%' }}>
                    {dashboardData.pendingApprovals.map((item) => (
                      <React.Fragment key={item.id}>
                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: '#FEF3C7', width: 40, height: 40, borderRadius: '12px' }}>
                              <Warning sx={{ color: '#F59E0B', fontSize: 20 }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                                {item.type} - {item.customer}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                R{(item.amount || 0).toLocaleString()} · {item.requestedBy}
                              </Typography>
                            }
                          />
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Button
                              size="small"
                              sx={{
                                borderRadius: '10px',
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                bgcolor: '#7C3AED',
                                color: '#fff',
                                px: 1.5,
                                minWidth: 0,
                                '&:hover': { bgcolor: '#6D28D9' },
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              sx={{
                                borderRadius: '10px',
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                border: '1px solid #E5E7EB',
                                color: '#6B7280',
                                px: 1.5,
                                minWidth: 0,
                              }}
                            >
                              Reject
                            </Button>
                          </Box>
                        </ListItem>
                        <Divider variant="inset" component="li" sx={{ borderColor: '#F3F4F6' }} />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                    <Box sx={{ width: 56, height: 56, borderRadius: '16px', bgcolor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                      <CheckCircle sx={{ color: '#10B981', fontSize: 28 }} />
                    </Box>
                    <Typography variant="subtitle2" fontWeight={700}>No pending approvals</Typography>
                    <Typography variant="caption" color="text.secondary">All requests have been processed</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={0} sx={{ ...cardSx, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>Top Customers</Typography>
                  <Button
                    size="small"
                    sx={{
                      borderRadius: '16px',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      color: '#7C3AED',
                      border: '1px solid #E5E7EB',
                      px: 2,
                    }}
                  >
                    View All
                  </Button>
                </Box>
                {dashboardData.topCustomers && dashboardData.topCustomers.length > 0 ? (
                  <Grid container spacing={2}>
                    {dashboardData.topCustomers.slice(0, 4).map((customer, index) => (
                      <Grid item xs={12} sm={6} md={3} key={customer.id || index}>
                        <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: '14px', '&:hover': { borderColor: '#7C3AED', boxShadow: '0 2px 8px rgba(124,58,237,0.1)' } }}>
                          <CardHeader
                            title={customer.name}
                            subheader={`${customer.totalSpend ? `${dashboardData.summary?.currencySymbol || 'R'}${customer.totalSpend.toLocaleString()}` : 'No spend data'}`}
                            titleTypographyProps={{ variant: 'body2', fontWeight: 700, fontSize: '0.85rem' }}
                            subheaderTypographyProps={{ variant: 'caption' }}
                            action={
                              <Chip
                                label={customer.tier || 'Standard'}
                                size="small"
                                sx={{
                                  bgcolor: customer.tier === 'Premium' ? '#ECFDF5' : '#F3F4F6',
                                  color: customer.tier === 'Premium' ? '#059669' : '#6B7280',
                                  fontWeight: 600,
                                  fontSize: '0.65rem',
                                  height: 22,
                                  borderRadius: '8px',
                                }}
                              />
                            }
                          />
                          <Divider sx={{ borderColor: '#F3F4F6' }} />
                          <CardContent sx={{ pt: 1.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Active Promotions: {customer.activePromotions || 0}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              Last Activity: {customer.lastActivity ? new Date(customer.lastActivity).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No customer data available</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
