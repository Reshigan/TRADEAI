import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, LinearProgress, Chip, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown, DollarSign, Megaphone, AlertTriangle, CheckSquare, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyticsService, promotionService, budgetService, approvalService } from '../services/api';

const fmt = (v) => {
  if (v == null) return 'R 0';
  const n = Number(v);
  if (n >= 1e6) return `R ${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3) return `R ${(n/1e3).toFixed(0)}K`;
  return `R ${n.toFixed(0)}`;
};

function KPI({ icon: Icon, label, value, change, color = '#2563EB', loading }) {
  if (loading) return <Card><CardContent sx={{ py: 3 }}><Skeleton width={80} /><Skeleton width={120} height={32} /><Skeleton width={60} /></CardContent></Card>;
  const positive = change >= 0;
  return (
    <Card>
      <CardContent sx={{ py: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={18} color={color} />
          </Box>
        </Box>
        <Typography variant="h2" sx={{ mb: 0.5 }}>{value}</Typography>
        {change != null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {positive ? <TrendingUp size={14} color="#059669" /> : <TrendingDown size={14} color="#DC2626" />}
            <Typography variant="caption" sx={{ color: positive ? '#059669' : '#DC2626', fontWeight: 600 }}>{Math.abs(change)}%</Typography>
            <Typography variant="caption" color="text.secondary">vs last period</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({});
  const [recentPromos, setRecentPromos] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [analytics, promos, budgets, approvals] = await Promise.allSettled([
          analyticsService.getDashboard(),
          promotionService.getAll({ limit: 5, sort: '-created_at' }),
          budgetService.getAll({ limit: 5 }),
          approvalService.getAll({ status: 'pending', limit: 5 }),
        ]);
        const a = analytics.status === 'fulfilled' ? (analytics.value.data || analytics.value) : {};
        setKpis({
          totalBudget: a.total_budget || a.totalBudget || 0,
          totalSpend: a.total_spend || a.totalSpend || 0,
          activePromos: a.active_promotions || a.activePromotions || 0,
          roi: a.avg_roi || a.averageRoi || 0,
          budgetUtil: a.budget_utilization || a.budgetUtilization || 0,
          pendingCount: a.pending_approvals || a.pendingApprovals || 0,
        });
        if (promos.status === 'fulfilled') setRecentPromos((promos.value.data || promos.value || []).slice(0, 5));
        if (approvals.status === 'fulfilled') setPendingApprovals((approvals.value.data || approvals.value || []).slice(0, 5));
      } catch (e) { console.error('Dashboard load error:', e); }
      setLoading(false);
    };
    load();
  }, []);

  const statusColor = (s) => {
    const map = { draft: '#94A3B8', pending_approval: '#F59E0B', approved: '#2563EB', active: '#059669', completed: '#6B7280', cancelled: '#DC2626', rejected: '#DC2626' };
    return map[s] || '#94A3B8';
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1">Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">Trade promotion performance overview</Typography>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}><KPI icon={DollarSign} label="Total Budget" value={fmt(kpis.totalBudget)} change={8.2} color="#2563EB" loading={loading} /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPI icon={DollarSign} label="Total Spend" value={fmt(kpis.totalSpend)} change={-3.1} color="#059669" loading={loading} /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPI icon={Megaphone} label="Active Promotions" value={String(kpis.activePromos || 0)} change={12} color="#7C3AED" loading={loading} /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPI icon={TrendingUp} label="Average ROI" value={`${(kpis.roi || 0).toFixed(1)}x`} change={5.4} color="#F59E0B" loading={loading} /></Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 2 }}>Budget Utilization</Typography>
              <Box sx={{ mb: 1 }}><LinearProgress variant="determinate" value={kpis.budgetUtil || 0} sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: (kpis.budgetUtil || 0) > 90 ? '#DC2626' : '#2563EB', borderRadius: 5 } }} /></Box>
              <Typography variant="body2" color="text.secondary">{(kpis.budgetUtil || 0).toFixed(1)}% of total budget used</Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Box><Typography variant="caption" color="text.secondary">Spent</Typography><Typography variant="body1" fontWeight={600}>{fmt(kpis.totalSpend)}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Available</Typography><Typography variant="body1" fontWeight={600}>{fmt((kpis.totalBudget || 0) - (kpis.totalSpend || 0))}</Typography></Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3">Pending Approvals</Typography>
                <Chip label={pendingApprovals.length} size="small" color="warning" />
              </Box>
              {pendingApprovals.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No pending approvals</Typography>
              ) : pendingApprovals.slice(0, 3).map((a, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: i < 2 ? '1px solid #F1F5F9' : 'none' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>{a.promotion_name || a.entity_type || 'Approval'}</Typography>
                    <Typography variant="caption" color="text.secondary">{a.requester_name || 'Unknown'}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>{fmt(a.amount)}</Typography>
                </Box>
              ))}
              <Button size="small" endIcon={<ArrowRight size={14} />} onClick={() => navigate('/approve')} sx={{ mt: 1 }}>View All</Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3">Quick Actions</Typography>
              </Box>
              {[{ label: 'Create Promotion', path: '/execute/promotions/new', color: '#2563EB' }, { label: 'Create Trade Spend', path: '/execute/trade-spends/new', color: '#059669' }, { label: 'Submit Claim', path: '/settle/claims/new', color: '#7C3AED' }, { label: 'View Reports', path: '/analyze/reports', color: '#F59E0B' }].map((action, i) => (
                <Button key={i} fullWidth variant="outlined" onClick={() => navigate(action.path)}
                  sx={{ mb: 1, justifyContent: 'flex-start', borderColor: 'divider', color: action.color, '&:hover': { borderColor: action.color, bgcolor: `${action.color}08` } }}>
                  {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h3">Recent Promotions</Typography>
            <Button size="small" endIcon={<ArrowRight size={14} />} onClick={() => navigate('/execute/promotions')}>View All</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Status</TableCell><TableCell align="right">Budget</TableCell><TableCell>Period</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {recentPromos.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No promotions yet</Typography></TableCell></TableRow>
                ) : recentPromos.map((p, i) => (
                  <TableRow key={i} onClick={() => navigate(`/execute/promotions/${p.id}`)} sx={{ cursor: 'pointer' }}>
                    <TableCell><Typography variant="body2" fontWeight={500}>{p.name || p.promotion_name}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{(p.type || p.promotion_type || '').replace('_', ' ')}</Typography></TableCell>
                    <TableCell><Chip label={(p.status || 'draft').replace('_', ' ')} size="small" sx={{ bgcolor: `${statusColor(p.status)}15`, color: statusColor(p.status), fontWeight: 600, textTransform: 'capitalize' }} /></TableCell>
                    <TableCell align="right">{fmt(p.budget || p.planned_spend)}</TableCell>
                    <TableCell><Typography variant="caption">{p.start_date ? new Date(p.start_date).toLocaleDateString() : '-'}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
