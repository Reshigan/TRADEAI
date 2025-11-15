import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  AccountBalance,
  TrendingDown,
  Assessment,
  Warning,
  CheckCircle,
  Refresh,
  ArrowForward,
  ShowChart,
  MonetizationOn
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    budgetRecommendations: [],
    underperformingPromotions: [],
    portfolioKPIs: {},
    anomalies: [],
    approvalQueue: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const tenantId = localStorage.getItem('tenantId');
      const token = localStorage.getItem('token');

      const [budgetRes, promotionsRes, anomaliesRes, approvalsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/budgets`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/promotions`, {
          params: { status: 'active' },
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.post(
          `${API_BASE_URL}/api/ai-orchestrator/orchestrate`,
          {
            userIntent: 'Detect anomalies in promotion performance and spending',
            context: { tenantId, dataType: 'promotions' }
          },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(`${API_BASE_URL}/api/promotions`, {
          params: { status: 'pending_approval', limit: 10 },
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const budgets = budgetRes.data.budgets || [];
      const promotions = promotionsRes.data.promotions || [];
      
      const budgetRecommendations = generateBudgetRecommendations(budgets, promotions);
      const underperforming = identifyUnderperformingPromotions(promotions);
      const kpis = calculatePortfolioKPIs(budgets, promotions);

      setDashboardData({
        budgetRecommendations,
        underperformingPromotions: underperforming,
        portfolioKPIs: kpis,
        anomalies: anomaliesRes.data.success ? (anomaliesRes.data.data.anomalies || []).slice(0, 5) : [],
        approvalQueue: approvalsRes.data.promotions || []
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBudgetRecommendations = (budgets, promotions) => {
    const recommendations = [];
    
    budgets.forEach(budget => {
      const spent = budget.spent || 0;
      const allocated = budget.allocated || 0;
      const utilization = allocated > 0 ? (spent / allocated) * 100 : 0;
      
      if (utilization < 50) {
        recommendations.push({
          budgetId: budget._id,
          category: budget.category || 'General',
          action: 'Reallocate',
          amount: allocated - spent,
          expectedROI: 2.5,
          reason: `Only ${utilization.toFixed(0)}% utilized - reallocate to high-performing categories`,
          severity: 'medium'
        });
      } else if (utilization > 90) {
        recommendations.push({
          budgetId: budget._id,
          category: budget.category || 'General',
          action: 'Increase',
          amount: allocated * 0.2,
          expectedROI: 2.0,
          reason: `${utilization.toFixed(0)}% utilized - consider increasing allocation`,
          severity: 'high'
        });
      }
    });
    
    return recommendations.slice(0, 5);
  };

  const identifyUnderperformingPromotions = (promotions) => {
    return promotions
      .filter(p => {
        const roi = p.financial?.actual?.roi || 0;
        const targetROI = p.financial?.planned?.targetROI || 1.5;
        return roi < targetROI * 0.7;
      })
      .slice(0, 5)
      .map(p => ({
        promotionId: p._id,
        name: p.name || 'Untitled',
        actualROI: p.financial?.actual?.roi || 0,
        targetROI: p.financial?.planned?.targetROI || 1.5,
        variance: ((p.financial?.actual?.roi || 0) - (p.financial?.planned?.targetROI || 1.5)),
        reason: 'Below target ROI'
      }));
  };

  const calculatePortfolioKPIs = (budgets, promotions) => {
    const totalBudget = budgets.reduce((sum, b) => sum + (b.allocated || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
    const totalRevenue = promotions.reduce((sum, p) => sum + (p.financial?.actual?.revenue || 0), 0);
    const avgROI = totalSpent > 0 ? totalRevenue / totalSpent : 0;
    
    return {
      totalBudget,
      totalSpent,
      utilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      totalRevenue,
      avgROI,
      activePromotions: promotions.length
    };
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
          Manager Dashboard
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={loadDashboardData}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <MonetizationOn color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Total Budget
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ${(dashboardData.portfolioKPIs.totalBudget || 0).toLocaleString()}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={dashboardData.portfolioKPIs.utilization || 0}
                sx={{ mt: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                {(dashboardData.portfolioKPIs.utilization || 0).toFixed(1)}% utilized
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ShowChart color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Average ROI
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {(dashboardData.portfolioKPIs.avgROI || 0).toFixed(2)}x
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Across {dashboardData.portfolioKPIs.activePromotions || 0} promotions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Assessment color="info" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Total Revenue
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ${(dashboardData.portfolioKPIs.totalRevenue || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                From active promotions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Warning color="warning" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Pending Approvals
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {dashboardData.approvalQueue.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Require your review
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountBalance color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  Budget Reallocation Recommendations
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                AI-driven budget optimization based on hierarchy and performance
              </Typography>
              
              {dashboardData.budgetRecommendations.length === 0 ? (
                <Alert severity="success">
                  Budget allocation is optimal. No reallocation needed.
                </Alert>
              ) : (
                <List>
                  {dashboardData.budgetRecommendations.map((rec, index) => (
                    <React.Fragment key={index}>
                      <ListItem
                        sx={{
                          border: '1px solid',
                          borderColor: rec.severity === 'high' ? 'warning.main' : 'divider',
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: rec.severity === 'high' ? 'warning.lighter' : 'transparent'
                        }}
                      >
                        <ListItemIcon>
                          <AccountBalance color={rec.severity === 'high' ? 'warning' : 'primary'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${rec.action} ${rec.category} Budget`}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                Amount: ${rec.amount.toLocaleString()} | 
                                Expected ROI: {rec.expectedROI}x
                              </Typography>
                              <br />
                              <Typography variant="caption" color="text.secondary">
                                {rec.reason}
                              </Typography>
                            </>
                          }
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          endIcon={<ArrowForward />}
                          onClick={() => navigate(`/budgets/${rec.budgetId}`)}
                        >
                          Review
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
                <TrendingDown color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  Underperforming Promotions
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Promotions below target ROI requiring attention
              </Typography>
              
              {dashboardData.underperformingPromotions.length === 0 ? (
                <Alert severity="success">
                  All promotions are meeting or exceeding targets.
                </Alert>
              ) : (
                <List>
                  {dashboardData.underperformingPromotions.map((promo, index) => (
                    <React.Fragment key={index}>
                      <ListItem
                        sx={{
                          border: '1px solid',
                          borderColor: 'error.main',
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: 'error.lighter'
                        }}
                      >
                        <ListItemIcon>
                          <TrendingDown color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={promo.name}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                Actual ROI: {promo.actualROI.toFixed(2)}x | 
                                Target: {promo.targetROI.toFixed(2)}x
                              </Typography>
                              <br />
                              <Chip
                                label={`${promo.variance.toFixed(2)}x below target`}
                                size="small"
                                color="error"
                                sx={{ mt: 0.5 }}
                              />
                            </>
                          }
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          endIcon={<ArrowForward />}
                          onClick={() => navigate(`/promotions/${promo.promotionId}`)}
                        >
                          Investigate
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
                <CheckCircle color="info" sx={{ mr: 1 }} />
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
                Promotions requiring manager approval
              </Typography>
              
              {dashboardData.approvalQueue.length === 0 ? (
                <Alert severity="info">
                  No promotions pending approval.
                </Alert>
              ) : (
                <List>
                  {dashboardData.approvalQueue.slice(0, 5).map((promotion, index) => (
                    <React.Fragment key={promotion._id || index}>
                      <ListItem
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1
                        }}
                      >
                        <ListItemText
                          primary={promotion.name || 'Untitled Promotion'}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                Budget: ${(promotion.budget || 0).toLocaleString()} | 
                                Type: {promotion.type || 'N/A'}
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
                      {index < Math.min(5, dashboardData.approvalQueue.length) - 1 && <Divider sx={{ my: 1 }} />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ManagerDashboard;
