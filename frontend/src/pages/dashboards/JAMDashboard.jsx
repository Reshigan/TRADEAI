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
  Tooltip,
  IconButton,
  Divider,
  Chip
} from '@mui/material';
import {
  Add,
  Refresh,
  TrendingUp,
  ShoppingCart,
  ArrowForward,
  Warning,
  Assignment,
  CheckCircle,
  AccountBalance
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DecisionCard from '../../components/decision/DecisionCard';
import simulationService from '../../services/simulation/simulationService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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
    analytics.trackPageView('jam_dashboard');
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
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          JAM Dashboard
        </Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={loadDashboardData} sx={{ mr: 1 }}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreatePromotion}
          >
            Create Promotion
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUp color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  Next-Best Promotions
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                AI-recommended promotions for your accounts based on hierarchy and performance
              </Typography>
              
              {dashboardData.nextBestPromotions.length === 0 ? (
                <Alert severity="info">
                  No promotion recommendations available. Create your first promotion to get started.
                </Alert>
              ) : (
                <List>
                  {dashboardData.nextBestPromotions.map((promo, index) => (
                    <React.Fragment key={index}>
                      <ListItem
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <ListItemIcon>
                          <ShoppingCart color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={promo.name || `${promo.productName || 'Product'} Promotion`}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                Expected ROI: {promo.expectedROI || promo.roi || 'N/A'}%
                              </Typography>
                              <br />
                              <Typography variant="caption" color="text.secondary">
                                Confidence: {Math.round((promo.confidence || 0.75) * 100)}%
                              </Typography>
                            </>
                          }
                        />
                        <Button
                          size="small"
                          endIcon={<ArrowForward />}
                          onClick={handleCreatePromotion}
                        >
                          Create
                        </Button>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Warning color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  Account Watchlist
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Accounts requiring attention based on hierarchy-aware segmentation
              </Typography>
              
              {dashboardData.accountWatchlist.length === 0 ? (
                <Alert severity="success">
                  All accounts are performing well. No immediate action required.
                </Alert>
              ) : (
                <List>
                  {dashboardData.accountWatchlist.map((account, index) => (
                    <React.Fragment key={index}>
                      <ListItem
                        sx={{
                          border: '1px solid',
                          borderColor: account.severity === 'high' ? 'error.main' : 'warning.main',
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: account.severity === 'high' ? 'error.lighter' : 'warning.lighter'
                        }}
                      >
                        <ListItemIcon>
                          <Warning color={account.severity === 'high' ? 'error' : 'warning'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={account.name}
                          secondary={
                            <>
                              <Chip
                                label={account.reason}
                                size="small"
                                color={account.severity === 'high' ? 'error' : 'warning'}
                                sx={{ mr: 1, mt: 0.5 }}
                              />
                              <Typography variant="caption" component="span">
                                Revenue: ${(account.revenue || 0).toLocaleString()}
                              </Typography>
                            </>
                          }
                        />
                        <Button
                          size="small"
                          endIcon={<ArrowForward />}
                          onClick={() => handleViewAccount(account.customerId)}
                        >
                          View
                        </Button>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Assignment color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  Approval Queue
                </Typography>
                <Chip
                  label={dashboardData.approvalQueue.length}
                  size="small"
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Promotions pending your approval
              </Typography>
              
              {dashboardData.approvalQueue.length === 0 ? (
                <Alert severity="info">
                  No promotions pending approval.
                </Alert>
              ) : (
                <List>
                  {dashboardData.approvalQueue.map((promotion, index) => (
                    <React.Fragment key={promotion._id || index}>
                      <ListItem
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1
                        }}
                      >
                        <ListItemIcon>
                          <AccountBalance color="info" />
                        </ListItemIcon>
                        <ListItemText
                          primary={promotion.name || 'Untitled Promotion'}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                Budget: ${(promotion.budget || 0).toLocaleString()}
                              </Typography>
                              <br />
                              <Typography variant="caption" color="text.secondary">
                                Type: {promotion.type || 'N/A'} | 
                                Discount: {promotion.discount || 0}%
                              </Typography>
                            </>
                          }
                        />
                        <Box>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleApprovePromotion(promotion._id)}
                            sx={{ mr: 1 }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            endIcon={<ArrowForward />}
                            onClick={() => navigate(`/promotions/${promotion._id}`)}
                          >
                            Review
                          </Button>
                        </Box>
                      </ListItem>
                      {index < dashboardData.approvalQueue.length - 1 && <Divider sx={{ my: 1 }} />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h3" fontWeight="bold">
                {dashboardData.quickStats.activePromotions}
              </Typography>
              <Typography variant="body1">
                Active Promotions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h3" fontWeight="bold">
                {dashboardData.quickStats.pendingApprovals}
              </Typography>
              <Typography variant="body1">
                Pending Approvals
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h3" fontWeight="bold">
                {dashboardData.accountWatchlist.length}
              </Typography>
              <Typography variant="body1">
                Accounts Needing Attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default JAMDashboard;
