import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Refresh,
  MonetizationOn
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <div>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Where to move budget
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI-powered budget optimization recommendations
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDashboardData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <MonetizationOn sx={{ mr: 1, color: 'primary.main' }} />
                Budget Reallocation Recommendations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dashboardData.budgetRecommendations.length} recommendations
              </Typography>
            </Box>

            {dashboardData.budgetRecommendations.length === 0 ? (
              <Alert severity="info">
                No budget reallocation recommendations available. All budgets are optimally allocated.
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
          </Box>

          {dashboardData.portfolioKPIs && Object.keys(dashboardData.portfolioKPIs).length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Portfolio Summary
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      ${(Number(dashboardData.portfolioKPIs.totalReallocation || 0) / 1000).toFixed(1)}K
                    </Typography>
                    <Typography variant="body2">
                      Total Reallocation Opportunity
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ p: 3, bgcolor: 'success.main', color: 'white', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      ${(Number(dashboardData.portfolioKPIs.expectedRevenueGain || 0) / 1000).toFixed(1)}K
                    </Typography>
                    <Typography variant="body2">
                      Expected Revenue Gain
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ p: 3, bgcolor: 'warning.main', color: 'white', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {dashboardData.portfolioKPIs.underperformingCount || 0}
                    </Typography>
                    <Typography variant="body2">
                      Underperforming Promotions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ p: 3, bgcolor: 'info.main', color: 'white', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {dashboardData.portfolioKPIs.highPerformingCount || 0}
                    </Typography>
                    <Typography variant="body2">
                      High Performing Promotions
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ManagerDashboard;
