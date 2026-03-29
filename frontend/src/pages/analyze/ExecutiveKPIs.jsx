import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, LinearProgress } from '@mui/material';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart, Megaphone, Users, AlertTriangle } from 'lucide-react';
import { analyticsService } from '../../services/api';
import { useToast } from '../../components/common/ToastNotification';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

function KPICard({ icon: Icon, label, value, change, color = '#2563EB', subtitle }) {
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
            <Typography variant="caption" sx={{ color: positive ? '#059669' : '#DC2626', fontWeight: 600 }}>{Math.abs(change).toFixed(1)}%</Typography>
            <Typography variant="caption" color="text.secondary">vs prior</Typography>
          </Box>
        )}
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function ExecutiveKPIs() {
  const toast = useToast();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analyticsService.getDashboard();
        setData(res.data || res || {});
      } catch (e) { console.error(e); toast.error('An error occurred'); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Box sx={{ py: 4 }}><LinearProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1">Executive KPIs</Typography>
        <Typography variant="body2" color="text.secondary">Key performance indicators for trade promotion management</Typography>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}><KPICard icon={DollarSign} label="Total Trade Spend" value={fmt(data.total_spend || data.totalSpend)} change={data.spend_change} color="#2563EB" /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPICard icon={Target} label="Average ROI" value={`${Number(data.avg_roi || data.averageRoi || 0).toFixed(1)}x`} change={data.roi_change} color="#059669" /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPICard icon={Megaphone} label="Active Promotions" value={String(data.active_promotions || data.activePromotions || 0)} change={data.promo_change} color="#7C3AED" /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPICard icon={BarChart} label="Budget Utilization" value={`${Number(data.budget_utilization || data.budgetUtilization || 0).toFixed(1)}%`} change={data.util_change} color="#F59E0B" /></Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}><KPICard icon={Users} label="Customers with Promos" value={String(data.customers_with_promotions || 0)} color="#0284C7" subtitle="of total customer base" /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPICard icon={DollarSign} label="Avg Spend per Promo" value={fmt(data.avg_spend_per_promotion)} color="#059669" /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPICard icon={AlertTriangle} label="Pending Claims" value={String(data.pending_claims || 0)} color="#DC2626" /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPICard icon={DollarSign} label="Unresolved Deductions" value={fmt(data.unresolved_deductions)} color="#F59E0B" /></Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Performance Summary</Typography>
          <Typography variant="body2" color="text.secondary">
            Trade spend efficiency is at {Number(data.budget_utilization || 0).toFixed(1)}% utilization.
            Average ROI across all promotions is {Number(data.avg_roi || 0).toFixed(1)}x.
            {data.active_promotions > 0 ? ` There are ${data.active_promotions} active promotions running.` : ''}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
