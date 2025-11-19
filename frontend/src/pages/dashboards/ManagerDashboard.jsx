import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Chip
} from '@mui/material';
import {
  MonetizationOn,
  TrendingUp,
  TrendingDown,
  ShowChart,
  AttachMoney
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DecisionCard from '../../components/decision/DecisionCard';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    budgetRecommendations: [],
    portfolioKPIs: {
      totalReallocation: 0,
      expectedRevenueGain: 0,
      underperformingCount: 0,
      highPerformingCount: 0
    }
  });

  useEffect(() => {
    loadDashboardData();
    // analytics.trackPageView('manager_dashboard');
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // const reallocationRes = await simulationService.getBudgetReallocation(null, 100);
      
      setDashboardData({
        budgetRecommendations: [],
        portfolioKPIs: {
          totalReallocation: 0,
          expectedRevenueGain: 0,
          underperformingCount: 0,
          highPerformingCount: 0
        }
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setDashboardData({
        budgetRecommendations: [],
        portfolioKPIs: {
          totalReallocation: 0,
          expectedRevenueGain: 0,
          underperformingCount: 0,
          highPerformingCount: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyReallocation = (recommendation) => {
    console.log('Apply reallocation:', recommendation);
  };

  const handleSimulateReallocation = (recommendation) => {
    navigate('/simulation-studio', { state: { recommendation } });
  };

  const handleExplainReallocation = (recommendation) => {
    console.log('Explain reallocation:', recommendation);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="text.primary" mb={1}>
          Budget Optimization
        </Typography>
        <Typography variant="body2" color="text.secondary">
          AI-powered recommendations to maximize portfolio performance
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
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
                    Reallocation Opportunity
                  </Typography>
                  <MonetizationOn sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="h3" fontWeight={700} color="text.primary" mb={0.5}>
                  ${(Number(dashboardData.portfolioKPIs.totalReallocation || 0) / 1000).toFixed(1)}K
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Available to optimize
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
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
                    borderColor: 'success.main'
                  }
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Expected Revenue Gain
                  </Typography>
                  <AttachMoney sx={{ color: 'success.main' }} />
                </Box>
                <Typography variant="h3" fontWeight={700} color="text.primary" mb={0.5}>
                  ${(Number(dashboardData.portfolioKPIs.expectedRevenueGain || 0) / 1000).toFixed(1)}K
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="caption" color="success.main" fontWeight={600}>
                    Projected uplift
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
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
                    borderColor: 'error.main'
                  }
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Underperforming
                  </Typography>
                  <TrendingDown sx={{ color: 'error.main' }} />
                </Box>
                <Typography variant="h3" fontWeight={700} color="text.primary" mb={0.5}>
                  {dashboardData.portfolioKPIs.underperformingCount || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Promotions need attention
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
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
                    borderColor: 'success.main'
                  }
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    High Performing
                  </Typography>
                  <ShowChart sx={{ color: 'success.main' }} />
                </Box>
                <Typography variant="h3" fontWeight={700} color="text.primary" mb={0.5}>
                  {dashboardData.portfolioKPIs.highPerformingCount || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Promotions exceeding targets
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Budget Reallocation Recommendations */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider'
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
                  <MonetizationOn sx={{ color: 'primary.main' }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Budget Reallocation Recommendations
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dashboardData.budgetRecommendations.length} AI-powered optimization opportunities
                  </Typography>
                </Box>
              </Box>
              {dashboardData.budgetRecommendations.length > 0 && (
                <Chip 
                  label={`${dashboardData.budgetRecommendations.length} opportunities`}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>

            {dashboardData.budgetRecommendations.length === 0 ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                All budgets are optimally allocated. No reallocation recommendations at this time.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {dashboardData.budgetRecommendations.map((rec, index) => (
                  <Grid item xs={12} key={index}>
                    <DecisionCard
                      title={rec.type === 'reallocate' 
                        ? `Reallocate from ${rec.from.promotionName} to ${rec.to.promotionName}`
                        : `Reduce spend on ${rec.from.promotionName}`
                      }
                      description={rec.reasoning}
                      impact={{
                        delta: rec.expectedImpact.revenueGain || rec.expectedImpact.savingsRealized || 0,
                        baseline: rec.from.currentSpend
                      }}
                      roi={rec.to ? rec.to.currentROI : rec.from.currentROI}
                      confidence={rec.confidence}
                      hierarchy={[
                        { type: 'From', name: rec.from.promotionName, level: 1 },
                        ...(rec.to ? [{ type: 'To', name: rec.to.promotionName, level: 1 }] : [])
                      ]}
                      priority={rec.priority}
                      risks={rec.from.currentROI < 50 ? [
                        { level: 'high', message: `Low ROI (${Number(rec.from.currentROI || 0).toFixed(1)}%) on source promotion` }
                      ] : []}
                      onSimulate={() => handleSimulateReallocation(rec)}
                      onApply={() => handleApplyReallocation(rec)}
                      onExplain={() => handleExplainReallocation(rec)}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ManagerDashboard;
