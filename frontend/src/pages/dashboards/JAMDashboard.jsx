import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  Add,
  TrendingUp,
  ShoppingCart,
  ArrowForward,
  Warning,
  Assignment,
  CheckCircle,
  AccountBalance,
  ShowChart,
  AttachMoney
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import simulationService from '../../services/simulation/simulationService';
import analytics from '../../utils/analytics';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const JAMDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    nextBestPromotions: [],
    accountWatchlist: [],
    approvalQueue: [],
    quickStats: {}
  });

  useEffect(() => {
    loadDashboardData();
    analytics.trackEvent('page_view', { page: 'jam_dashboard' });
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const recommendationsRes = await simulationService.getNextBestPromotions(null, 5);
      
      setDashboardData({
        nextBestPromotions: recommendationsRes.recommendations || [],
        accountWatchlist: [],
        approvalQueue: [],
        quickStats: {
          activePromotions: 0,
          pendingApprovals: 0
        }
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractWatchlistAccounts = (segmentData) => {
    const watchlist = [];
    
    if (segmentData.segments) {
      const atRiskSegment = segmentData.segments.find(s => 
        s.name === 'At Risk' || s.name === 'Need Attention' || s.name === 'Lost'
      );
      
      if (atRiskSegment && segmentData.details) {
        const atRiskCustomers = segmentData.details[atRiskSegment.name] || [];
        watchlist.push(...atRiskCustomers.slice(0, 5).map(c => ({
          customerId: c.customerId,
          name: c.name || 'Unknown',
          reason: 'At Risk',
          severity: 'high',
          revenue: c.revenue || 0
        })));
      }
    }
    
    return watchlist;
  };

  const handleCreatePromotion = () => {
    navigate('/promotions/new');
  };

  const handleViewAccount = (customerId) => {
    navigate(`/customers/${customerId}`);
  };

  const handleApprovePromotion = async (promotionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/api/promotions/${promotionId}`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadDashboardData();
    } catch (error) {
      console.error('Failed to approve promotion:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            JAM Dashboard
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreatePromotion}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            Create Promotion
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          AI-powered insights and recommendations for your accounts
        </Typography>
      </Box>

      {/* KPI Summary Cards - Insight First */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                borderColor: 'primary.main'
              }
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Active Promotions
              </Typography>
              <ShowChart sx={{ color: 'primary.main' }} />
            </Box>
            <Typography variant="h3" fontWeight={700} color="text.primary" mb={0.5}>
              {dashboardData.quickStats.activePromotions}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="caption" color="success.main" fontWeight={600}>
                +12% vs last month
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
                borderColor: 'success.main'
              }
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Avg ROI
              </Typography>
              <AttachMoney sx={{ color: 'success.main' }} />
            </Box>
            <Typography variant="h3" fontWeight={700} color="text.primary" mb={0.5}>
              142%
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="caption" color="success.main" fontWeight={600}>
                Above target
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
                borderColor: 'warning.main'
              }
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Pending Approvals
              </Typography>
              <Assignment sx={{ color: 'warning.main' }} />
            </Box>
            <Typography variant="h3" fontWeight={700} color="text.primary" mb={0.5}>
              {dashboardData.quickStats.pendingApprovals}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Requires action
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
                borderColor: 'error.main'
              }
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                At-Risk Accounts
              </Typography>
              <Warning sx={{ color: 'error.main' }} />
            </Box>
            <Typography variant="h3" fontWeight={700} color="text.primary" mb={0.5}>
              {dashboardData.accountWatchlist.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Need attention
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* AI Recommendations - Primary Focus */}
        <Grid item xs={12} lg={8}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box 
                  sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    bgcolor: 'primary.lighter',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <TrendingUp sx={{ color: 'primary.main' }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    AI-Recommended Promotions
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Based on account performance and market trends
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {dashboardData.nextBestPromotions.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No promotion recommendations available. Create your first promotion to get started.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dashboardData.nextBestPromotions.map((promo, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      '&:hover': { 
                        borderColor: 'primary.main',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="start" gap={2} flex={1}>
                        <Box 
                          sx={{ 
                            p: 1.5, 
                            borderRadius: 2, 
                            bgcolor: 'primary.lighter',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <ShoppingCart sx={{ color: 'primary.main', fontSize: 24 }} />
                        </Box>
                        <Box flex={1}>
                          <Typography variant="body1" fontWeight={600} mb={0.5}>
                            {promo.name || `${promo.productName || 'Product'} Promotion`}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={2} mb={1}>
                            <Chip
                              label={`${promo.expectedROI || promo.roi || 'N/A'}% ROI`}
                              size="small"
                              color="success"
                              sx={{ fontWeight: 600 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {Math.round((promo.confidence || 0.75) * 100)}% confidence
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={(promo.confidence || 0.75) * 100}
                            sx={{ 
                              height: 6, 
                              borderRadius: 1,
                              bgcolor: 'action.hover',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 1
                              }
                            }}
                          />
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        endIcon={<ArrowForward />}
                        onClick={handleCreatePromotion}
                        sx={{ 
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          ml: 2
                        }}
                      >
                        Create
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Account Watchlist - Secondary */}
        <Grid item xs={12} lg={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
              <Box 
                sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  bgcolor: 'warning.lighter',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Warning sx={{ color: 'warning.main' }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Account Watchlist
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dashboardData.accountWatchlist.length} accounts need attention
                </Typography>
              </Box>
            </Box>
            
            {dashboardData.accountWatchlist.length === 0 ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                All accounts performing well
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {dashboardData.accountWatchlist.map((account, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: account.severity === 'high' ? 'error.main' : 'warning.main',
                      borderRadius: 2,
                      bgcolor: account.severity === 'high' ? 'error.lighter' : 'warning.lighter',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }
                    }}
                    onClick={() => handleViewAccount(account.customerId)}
                  >
                    <Typography variant="body2" fontWeight={600} mb={0.5}>
                      {account.name}
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Chip
                        label={account.reason}
                        size="small"
                        color={account.severity === 'high' ? 'error' : 'warning'}
                        sx={{ fontWeight: 600 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        ${(account.revenue || 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Approval Queue */}
        {dashboardData.approvalQueue.length > 0 && (
          <Grid item xs={12}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Box 
                  sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    bgcolor: 'info.lighter',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Assignment sx={{ color: 'info.main' }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Pending Approvals
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dashboardData.approvalQueue.length} promotions awaiting review
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dashboardData.approvalQueue.map((promotion, index) => (
                  <Paper
                    key={promotion._id || index}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': { 
                        borderColor: 'primary.main',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="start" gap={2} flex={1}>
                        <Box 
                          sx={{ 
                            p: 1.5, 
                            borderRadius: 2, 
                            bgcolor: 'info.lighter',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <AccountBalance sx={{ color: 'info.main', fontSize: 24 }} />
                        </Box>
                        <Box flex={1}>
                          <Typography variant="body1" fontWeight={600} mb={0.5}>
                            {promotion.name || 'Untitled Promotion'}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="body2" color="text.secondary">
                              Budget: ${(promotion.budget || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              •
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {promotion.type || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              •
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {promotion.discount || 0}% discount
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircle />}
                          onClick={() => handleApprovePromotion(promotion._id)}
                          sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          endIcon={<ArrowForward />}
                          onClick={() => navigate(`/promotions/${promotion._id}`)}
                          sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600
                          }}
                        >
                          Review
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default JAMDashboard;
