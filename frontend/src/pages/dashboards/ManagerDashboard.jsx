import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Button,
  LinearProgress,
  alpha,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  MonetizationOn,
  TrendingDown,
  ShowChart,
  AttachMoney,
  ArrowUpward,
  ArrowDownward,
  MoreHoriz,
  FilterList,
  Fullscreen,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DecisionCard from '../../components/decision/DecisionCard';
import api, { analyticsService, promotionService, tradeCalendarService } from '../../services/api';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [liveData, setLiveData] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    budgetRecommendations: [],
    portfolioKPIs: {
      totalReallocation: 0,
      expectedRevenueGain: 0,
      underperformingCount: 0,
      highPerformingCount: 0
    }
  });
  const [activities, setActivities] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [recentPromos, setRecentPromos] = useState([]);
  const [reportMetrics, setReportMetrics] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        api.get('/dashboard').then(r => r.data).catch(() => null),
        analyticsService.getDashboard().catch(() => null),
      ]);

      if (dashRes?.success) {
        setLiveData(dashRes.data);
      }

      // Load activities
      try {
        const actRes = await api.get('/activities?limit=10');
        if (actRes.data?.success) setActivities(actRes.data.data || []);
      } catch (e) { console.error('Activities load error:', e); }

      // Load timeline/calendar events
      try {
        const calRes = await tradeCalendarService.getAll();
        setTimelineEvents(calRes.data || []);
      } catch (e) { console.error('Calendar load error:', e); }

      // Load recent promotions for report tab
      try {
        const promoRes = await promotionService.getAll({ limit: 20 });
        setRecentPromos((promoRes.data || promoRes || []).slice(0, 20));
      } catch (e) { console.error('Promos load error:', e); }

      // Load report metrics
      try {
        const repRes = await api.get('/analytics/sales-performance').catch(() => null);
        setReportMetrics(repRes?.data?.data || null);
      } catch (e) { console.error('Report load error:', e); }

      const budgetData = dashRes?.data?.budget || {};
      const analyticsData = analyticsRes?.data || {};
      const remaining = budgetData.remaining || (analyticsData.totalBudget - analyticsData.totalSpend) || 0;
      const promoCount = analyticsData.promotionCount || 0;
      const activePromos = analyticsData.activePromotions || 0;

      setDashboardData({
        budgetRecommendations: [],
        portfolioKPIs: {
          totalReallocation: remaining,
          expectedRevenueGain: remaining > 0 ? Math.round(remaining * 0.12) : 0,
          underperformingCount: Math.max(0, promoCount - activePromos),
          highPerformingCount: activePromos
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

  const handleApplyReallocation = () => {};

  const handleSimulateReallocation = (recommendation) => {
    navigate('/scenarios', { state: { recommendation } });
  };

  const handleExplainReallocation = () => {};

  const overview = liveData?.overview || {};
  const budget = liveData?.budget || {};
  const recentActivity = liveData?.recentActivity || [];

  const budgetUtil = budget.total ? ((budget.utilized / budget.total) * 100).toFixed(0) : budget.utilizationRate || 0;

  const tabLabels = ['Overview', 'Activity', 'Timeline', 'Report'];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {tabLabels.map((label, idx) => (
          <Button
            key={label}
            onClick={() => setActiveTab(idx)}
            sx={{
              px: { xs: 2, sm: 3 },
              py: 1,
              borderRadius: '24px',
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              textTransform: 'none',
              bgcolor: activeTab === idx ? '#1E40AF' : '#fff',
              color: activeTab === idx ? '#fff' : '#6B7280',
              border: activeTab === idx ? 'none' : '1px solid #E5E7EB',
              boxShadow: activeTab === idx ? '0 2px 8px rgba(124,58,237,0.25)' : 'none',
              '&:hover': {
                bgcolor: activeTab === idx ? '#1E3A8A' : '#F9FAFB',
              },
            }}
          >
            {label}
          </Button>
        ))}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'primary.dark' }} />
        </Box>
      ) : activeTab === 0 ? (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                height: '100%',
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.dark' }} />
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                    Sales Target
                  </Typography>
                </Box>
                <Box display="flex" gap={0.5}>
                  <Chip label="All" size="small" sx={{ bgcolor: 'action.hover', fontWeight: 600, fontSize: '0.7rem', height: 24 }} />
                  <IconButton size="small"><MoreHoriz sx={{ fontSize: 18 }} /></IconButton>
                  <IconButton size="small"><Fullscreen sx={{ fontSize: 18 }} /></IconButton>
                  <IconButton size="small"><FilterList sx={{ fontSize: 18 }} /></IconButton>
                </Box>
              </Box>

              <Box display="flex" alignItems="baseline" gap={1} mb={1}>
                <Typography variant="h2" fontWeight={800} sx={{ color: 'text.primary', fontSize: { xs: '2rem', sm: '3rem' } }}>
                  %{budgetUtil}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Better Than Last Month
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                {['Promotions', 'Budgets', 'Spend'].map((label, i) => (
                  <Box key={label} sx={{ flex: 1, textAlign: 'center' }}>
                    <Box
                      sx={{
                        height: 80,
                        borderRadius: '12px',
                        bgcolor: i === 0 ? 'rgba(124,58,237,0.15)' : i === 1 ? 'rgba(59,130,246,0.12)' : 'rgba(251,146,60,0.15)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        pb: 0.5,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: '60%',
                          height: `${30 + (i + 1) * 15}%`,
                          borderRadius: '8px 8px 0 0',
                          bgcolor: i === 0 ? '#1E40AF' : i === 1 ? '#1E40AF' : '#FB923C',
                          opacity: 0.8,
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', mt: 0.5 }}>
                      {label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box display="flex" alignItems="center" gap={1} sx={{ bgcolor: 'background.default', borderRadius: '10px', p: 1.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.dark' }} />
                <Typography variant="caption" color="text.secondary">
                  Period: {new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })} - {new Date(Date.now() + 30*86400000).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                height: '100%',
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" fontWeight={700}>Recent Activity</Typography>
                <IconButton size="small" onClick={() => navigate('/trade-spends')}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: 14, color: '#6B7280' }}>&#8599;</Typography>
                  </Box>
                </IconButton>
              </Box>

              <Box display="flex" gap={2} mb={2}>
                <Chip
                  icon={<ArrowUpward sx={{ fontSize: 14, color: '#10B981 !important' }} />}
                  label="Incoming"
                  size="small"
                  sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 600, fontSize: '0.7rem' }}
                />
                <Chip
                  icon={<ArrowDownward sx={{ fontSize: 14, color: '#EF4444 !important' }} />}
                  label="Outgoing"
                  size="small"
                  sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 600, fontSize: '0.7rem' }}
                />
              </Box>

              <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1.5}>
                Recent Trade Spends
              </Typography>
              {recentActivity.slice(0, 3).map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, borderBottom: idx < 2 ? '1px solid #F3F4F6' : 'none' }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: item.status === 'approved' ? '#ECFDF5' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ fontSize: 18 }}>{item.spendType === 'rebate' ? '💰' : item.spendType === 'promotional' ? '📣' : '📋'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                        {item.spendId || item.activityType}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {item.spendType} · {item.status}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" fontWeight={700} sx={{ color: item.status === 'approved' ? '#059669' : '#111827' }}>
                    R{(item.amount || 0).toLocaleString()}
                  </Typography>
                </Box>
              ))}

              {recentActivity.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">No recent activity</Typography>
                </Box>
              )}

              <Typography variant="body2" fontWeight={600} color="text.secondary" mt={2} mb={1.5}>
                Pending Actions
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: 18 }}>⏳</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                      Pending Approvals
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {overview.pendingApprovals || 0} items waiting
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  onClick={() => navigate('/approvals')}
                  sx={{ color: 'primary.dark', fontWeight: 600, fontSize: '0.75rem', textTransform: 'none' }}
                >
                  Review
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                height: '100%',
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" fontWeight={700}>Budget Goals</Typography>
                <IconButton size="small"><MoreHoriz sx={{ fontSize: 18 }} /></IconButton>
              </Box>

              <Box sx={{ bgcolor: '#FEFCE8', borderRadius: '14px', p: 2, mb: 2, position: 'relative' }}>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>
                      Annual Budget
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Target · {budgetUtil}% utilized
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2, mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Number(budgetUtil), 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#FDE68A',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: 'linear-gradient(90deg, #1E40AF, #A78BFA)',
                      },
                    }}
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" mt={1.5}>
                  <Typography variant="h5" fontWeight={800} color="text.primary">
                    R{((budget.utilized || 0) / 1000000).toFixed(1)}M
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    /R{((budget.total || 0) / 1000000).toFixed(1)}M
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1}>
                Key Metrics
              </Typography>
              {[
                { label: 'Total Customers', value: overview.totalCustomers || 0, color: '#1E40AF' },
                { label: 'Active Promotions', value: overview.activePromotions || 0, color: '#1E40AF' },
                { label: 'Total Products', value: overview.totalProducts || 0, color: '#10B981' },
              ].map((metric, idx) => (
                <Box key={idx} display="flex" alignItems="center" justifyContent="space-between" sx={{ py: 1.25, borderBottom: idx < 2 ? '1px solid #F3F4F6' : 'none' }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: metric.color }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>{metric.label}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700}>{metric.value}</Typography>
                </Box>
              ))}

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1}>
                  Quick Navigation
                </Typography>
                {[
                  { label: 'Budget Console', path: '/budget-console' },
                  { label: 'Forecasting', path: '/forecasting' },
                ].map((link, idx) => (
                  <Box
                    key={idx}
                    onClick={() => navigate(link.path)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1,
                      cursor: 'pointer',
                      '&:hover': { '& .nav-label': { color: 'primary.dark' } },
                    }}
                  >
                    <Typography className="nav-label" variant="body2" fontWeight={500} sx={{ transition: 'color 0.15s' }}>
                      {link.label}
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: '#9CA3AF' }}>&#8250;</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.dark' }} />
                  <Typography variant="subtitle2" fontWeight={700}>Portfolio Analysis</Typography>
                </Box>
                <Box display="flex" gap={1}>
                  <Tabs
                    value={0}
                    sx={{
                      minHeight: 32,
                      '& .MuiTab-root': { minHeight: 32, py: 0.5, px: 2, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none' },
                      '& .MuiTabs-indicator': { height: 2 },
                    }}
                  >
                    <Tab label="Sales" />
                    <Tab label="Insight" />
                  </Tabs>
                </Box>
              </Box>

              <Grid container spacing={3}>
                {[
                  { label: 'Reallocation Opportunity', value: `R${(Number(dashboardData.portfolioKPIs.totalReallocation || 0) / 1000).toFixed(1)}K`, icon: <MonetizationOn />, color: '#1E40AF', sub: 'Available to optimize' },
                  { label: 'Expected Revenue Gain', value: `R${(Number(dashboardData.portfolioKPIs.expectedRevenueGain || 0) / 1000).toFixed(1)}K`, icon: <AttachMoney />, color: '#10B981', sub: 'Projected uplift' },
                  { label: 'Underperforming', value: dashboardData.portfolioKPIs.underperformingCount || 0, icon: <TrendingDown />, color: '#EF4444', sub: 'Need attention' },
                  { label: 'High Performing', value: dashboardData.portfolioKPIs.highPerformingCount || 0, icon: <ShowChart />, color: '#10B981', sub: 'Exceeding targets' },
                ].map((kpi, idx) => (
                  <Grid item xs={6} md={3} key={idx}>
                    <Box sx={{ textAlign: 'center', p: 1.5 }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: alpha(kpi.color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                        {React.cloneElement(kpi.icon, { sx: { color: kpi.color, fontSize: 22 } })}
                      </Box>
                      <Typography variant="h6" fontWeight={700}>{kpi.value}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{kpi.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ p: 0.75, borderRadius: '8px', bgcolor: alpha('#1E40AF', 0.1), display: 'flex' }}>
                    <MonetizationOn sx={{ color: 'primary.dark', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>AI Recommendations</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dashboardData.budgetRecommendations.length} opportunities
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {dashboardData.budgetRecommendations.length === 0 ? (
                <Alert
                  severity="success"
                  sx={{
                    borderRadius: '12px',
                    bgcolor: '#ECFDF5',
                    '& .MuiAlert-icon': { color: '#059669' },
                  }}
                >
                  All budgets optimally allocated.
                </Alert>
              ) : (
                dashboardData.budgetRecommendations.slice(0, 3).map((rec, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
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
                  </Box>
                ))
              )}
            </Paper>
          </Grid>
        </Grid>
      ) : activeTab === 1 ? (
        /* ===== ACTIVITY TAB ===== */
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #E5E7EB' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" fontWeight={700}>Recent Activity Feed</Typography>
                <Button size="small" onClick={() => navigate('/trade-spends')} sx={{ textTransform: 'none', fontWeight: 600, color: 'primary.dark' }}>View All Trade Spends</Button>
              </Box>
              {activities.length === 0 && recentActivity.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" color="text.secondary">No recent activity</Typography>
                </Box>
              ) : (
                <Box>
                  {(activities.length > 0 ? activities : recentActivity).map((item, idx) => {
                    const title = item.description || item.title || item.activityType || item.activity_type || item.spendId || 'Activity';
                    const time = item.created_at || item.createdAt;
                    const statusType = item.status === 'completed' || item.status === 'approved' ? 'success' : item.status === 'pending' ? 'warning' : 'info';
                    return (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: idx < 9 ? '1px solid #F3F4F6' : 'none' }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: statusType === 'success' ? '#ECFDF5' : statusType === 'warning' ? '#FEF3C7' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Typography sx={{ fontSize: 18 }}>{statusType === 'success' ? '\u2705' : statusType === 'warning' ? '\u23F3' : '\u2139\uFE0F'}</Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>{title}</Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.25 }}>
                            {item.status && <Chip label={item.status} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
                            {item.spendType && <Chip label={item.spendType} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />}
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          {item.amount != null && <Typography variant="body2" fontWeight={700}>R{Number(item.amount || 0).toLocaleString()}</Typography>}
                          <Typography variant="caption" color="text.secondary">{time ? new Date(time).toLocaleDateString() : ''}</Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      ) : activeTab === 2 ? (
        /* ===== TIMELINE TAB ===== */
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #E5E7EB' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" fontWeight={700}>Promotion & Event Timeline</Typography>
                <Button size="small" onClick={() => navigate('/plan/calendar')} sx={{ textTransform: 'none', fontWeight: 600, color: 'primary.dark' }}>Full Calendar</Button>
              </Box>
              {timelineEvents.length === 0 && recentPromos.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" color="text.secondary">No upcoming events or promotions</Typography>
                  <Button variant="outlined" size="small" onClick={() => navigate('/plan/calendar')} sx={{ mt: 2, textTransform: 'none' }}>Go to Trade Calendar</Button>
                </Box>
              ) : (
                <Box>
                  {/* Timeline events */}
                  {[...timelineEvents, ...recentPromos.filter(p => p.start_date)]
                    .sort((a, b) => (a.start_date || a.startDate || '') > (b.start_date || b.startDate || '') ? 1 : -1)
                    .slice(0, 15)
                    .map((ev, idx) => {
                      const name = ev.name || ev.promotion_name || 'Event';
                      const startDate = ev.start_date || ev.startDate;
                      const endDate = ev.end_date || ev.endDate;
                      const status = ev.status || 'planned';
                      const evType = ev.event_type || ev.eventType || ev.promotion_type || 'promotion';
                      const spend = ev.planned_spend || ev.plannedSpend || 0;
                      const statusColors = { draft: '#94A3B8', planned: '#2563EB', approved: '#059669', active: '#1E40AF', completed: '#6B7280', cancelled: '#DC2626' };
                      const typeColors = { promotion: '#7C3AED', campaign: '#2563EB', seasonal: '#059669', holiday: '#DC2626', trade_show: '#D97706', product_launch: '#EC4899' };
                      return (
                        <Box key={idx} sx={{ display: 'flex', gap: 2, py: 1.5, borderBottom: idx < 14 ? '1px solid #F3F4F6' : 'none', '&:hover': { bgcolor: 'background.default' }, cursor: 'pointer' }}
                          onClick={() => ev.promotion_id || ev.promotionId ? navigate(`/execute/promotions/${ev.promotion_id || ev.promotionId}`) : null}>
                          <Box sx={{ width: 4, borderRadius: 2, bgcolor: typeColors[evType] || '#7C3AED', flexShrink: 0 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>{name}</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Chip label={evType.replace('_', ' ')} size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: `${typeColors[evType] || '#7C3AED'}15`, color: typeColors[evType] || '#7C3AED', textTransform: 'capitalize' }} />
                              <Chip label={status} size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: `${statusColors[status] || '#94A3B8'}15`, color: statusColors[status] || '#94A3B8', textTransform: 'capitalize' }} />
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                            <Typography variant="body2" fontWeight={600}>{startDate ? new Date(startDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }) : '-'}</Typography>
                            <Typography variant="caption" color="text.secondary">{endDate ? `to ${new Date(endDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })}` : ''}</Typography>
                            {spend > 0 && <Typography variant="caption" display="block" color="primary" fontWeight={600}>R{(spend / 1000).toFixed(0)}K</Typography>}
                          </Box>
                        </Box>
                      );
                    })}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      ) : (
        /* ===== REPORT TAB ===== */
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #E5E7EB' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" fontWeight={700}>Performance Report</Typography>
                <Button size="small" onClick={() => navigate('/analyze/reports')} sx={{ textTransform: 'none', fontWeight: 600, color: 'primary.dark' }}>Full Reports</Button>
              </Box>

              {/* Summary metrics */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { label: 'Total Budget', value: `R${((budget.total || 0) / 1000000).toFixed(1)}M`, color: '#1E40AF' },
                  { label: 'Budget Utilized', value: `${budgetUtil}%`, color: Number(budgetUtil) > 80 ? '#EF4444' : '#059669' },
                  { label: 'Active Promotions', value: overview.activePromotions || 0, color: '#7C3AED' },
                  { label: 'Total Customers', value: overview.totalCustomers || 0, color: '#2563EB' },
                ].map((m, idx) => (
                  <Grid item xs={6} md={3} key={idx}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: '12px' }}>
                      <Typography variant="h5" fontWeight={800} sx={{ color: m.color }}>{m.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{m.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Promotion performance table */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Promotion Performance</Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& th, & td': { px: 1.5, py: 1, textAlign: 'left', borderBottom: '1px solid #F3F4F6', fontSize: '0.8rem' }, '& th': { fontWeight: 700, color: '#6B7280', fontSize: '0.7rem', textTransform: 'uppercase' } }}>
                  <thead>
                    <tr><th>Promotion</th><th>Type</th><th>Status</th><th>Planned Spend</th><th>Actual Spend</th><th>Period</th></tr>
                  </thead>
                  <tbody>
                    {recentPromos.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px 0' }}><Typography variant="body2" color="text.secondary">No promotions data</Typography></td></tr>
                    ) : recentPromos.slice(0, 10).map((p, idx) => (
                      <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => navigate(`/execute/promotions/${p.id}`)}>
                        <td><Typography variant="body2" fontWeight={600}>{p.name || p.promotion_name}</Typography></td>
                        <td><Chip label={(p.promotion_type || p.type || 'N/A').replace('_', ' ')} size="small" sx={{ fontSize: '0.65rem', height: 20, textTransform: 'capitalize' }} /></td>
                        <td><Chip label={p.status || 'draft'} size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: p.status === 'active' ? '#ECFDF5' : p.status === 'approved' ? '#DBEAFE' : '#F3F4F6', color: p.status === 'active' ? '#059669' : p.status === 'approved' ? '#2563EB' : '#6B7280', textTransform: 'capitalize' }} /></td>
                        <td>R{(p.planned_spend || 0).toLocaleString()}</td>
                        <td>R{(p.actual_spend || 0).toLocaleString()}</td>
                        <td><Typography variant="caption">{p.start_date ? new Date(p.start_date).toLocaleDateString() : '-'}</Typography></td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>

              {/* Quick report links */}
              <Box sx={{ display: 'flex', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
                {[
                  { label: 'P&L Analysis', path: '/analyze/pnl' },
                  { label: 'Customer 360', path: '/analyze/customer-360' },
                  { label: 'Executive KPIs', path: '/analyze/forecast' },
                  { label: 'Waste Detection', path: '/analyze/waste' },
                ].map((link, idx) => (
                  <Button key={idx} variant="outlined" size="small" onClick={() => navigate(link.path)}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderColor: '#E5E7EB', color: 'text.primary', '&:hover': { borderColor: '#1E40AF', color: 'primary.dark' } }}>
                    {link.label}
                  </Button>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ManagerDashboard;
