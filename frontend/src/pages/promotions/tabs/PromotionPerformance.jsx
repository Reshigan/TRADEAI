import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, CircularProgress, Chip,
  LinearProgress, Alert, alpha
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShowChart as ChartIcon, Assessment as AssessmentIcon,
  Lightbulb as LightbulbIcon, Speed as SpeedIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../../services/api/apiClient';
import { postEventAnalysisService } from '../../../services/api';

const PromotionPerformance = ({ promotionId, promotion }) => {
  const [performance, setPerformance] = useState(null);
  const [pea, setPea] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPerformance();
    loadPostEventAnalysis();
  }, [promotionId]);

  const loadPerformance = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/promotions/${promotionId}/performance`);
      setPerformance(response.data.data || response.data || null);
    } catch (error) {
      console.error('Error loading performance:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load performance data');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPostEventAnalysis = async () => {
    try {
      const res = await postEventAnalysisService.getAnalysis(promotionId);
      if (res.success) setPea(res.data);
    } catch (err) {
      console.error('Error loading post-event analysis:', err);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'R 0.00';
    return 'R ' + value.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0.0%';
    return value.toFixed(1) + '%';
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  const kpis = pea?.kpis || {};
  const scorecard = pea?.scorecard || {};
  const effects = pea?.effects || {};
  const recommendations = pea?.recommendations || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>Post-Event Analysis</Typography>
        <Chip
          icon={<AssessmentIcon />}
          label={promotion?.status === 'completed' ? 'Final Results' : promotion?.status === 'active' ? 'Live Data' : 'Projected'}
          color={promotion?.status === 'completed' ? 'success' : promotion?.status === 'active' ? 'info' : 'default'}
          size="small" sx={{ fontWeight: 600 }}
        />
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'ROI', value: `${(kpis.roi || 0).toFixed(1)}x`, color: (kpis.roi || 0) > 1 ? '#059669' : '#DC2626', icon: <TrendingUpIcon /> },
          { label: 'Uplift', value: formatPercentage(kpis.uplift), color: '#7C3AED', icon: <ChartIcon /> },
          { label: 'Incremental Sales', value: formatCurrency(kpis.incrementalSales), color: '#2563EB', icon: <AssessmentIcon /> },
          { label: 'Actual Spend', value: formatCurrency(kpis.actualSpend), color: '#D97706', icon: <SpeedIcon /> },
          { label: 'Margin Impact', value: formatCurrency(kpis.marginImpact), color: (kpis.marginImpact || 0) > 0 ? '#059669' : '#DC2626', icon: <TrendingUpIcon /> },
          { label: 'Payback', value: kpis.paybackPeriodDays !== 'N/A' ? `${kpis.paybackPeriodDays} days` : 'N/A', color: '#6B7280', icon: <SpeedIcon /> },
        ].map((kpi) => (
          <Grid item xs={6} md={2} key={kpi.label}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha(kpi.color, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                {React.cloneElement(kpi.icon, { sx: { fontSize: 18, color: kpi.color } })}
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: kpi.color }}>{kpi.value}</Typography>
              <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {scorecard && Object.keys(scorecard).length > 0 && (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Scorecard</Typography>
          <Grid container spacing={2}>
            {[
              { label: 'Volume', score: scorecard.volumeScore },
              { label: 'Revenue', score: scorecard.revenueScore },
              { label: 'Profit', score: scorecard.profitScore },
              { label: 'Efficiency', score: scorecard.efficiencyScore },
              { label: 'Overall', score: scorecard.overallScore },
            ].map((item) => (
              <Grid item xs={12} sm key={item.label}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    <Typography variant="caption" fontWeight={700}>{item.score || 0}/100</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={item.score || 0}
                    sx={{ height: 6, borderRadius: 3, bgcolor: alpha('#7C3AED', 0.08),
                      '& .MuiLinearProgress-bar': { bgcolor: (item.score || 0) > 70 ? '#059669' : (item.score || 0) > 40 ? '#D97706' : '#DC2626', borderRadius: 3 } }} />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {effects && (effects.postPromoDip || effects.haloEffect || effects.cannibalization) && (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Promotion Effects</Typography>
          <Grid container spacing={2}>
            {[
              { label: 'Post-Promo Dip', value: effects.postPromoDip, color: '#DC2626', desc: 'Sales drop after promo ends' },
              { label: 'Halo Effect', value: effects.haloEffect, color: '#059669', desc: 'Positive spillover to other products' },
              { label: 'Cannibalization', value: effects.cannibalization, color: '#D97706', desc: 'Sales stolen from other products' },
              { label: 'Net Effect', value: effects.netEffect, color: (effects.netEffect || 0) > 0 ? '#059669' : '#DC2626', desc: 'Overall incremental impact' },
            ].map((eff) => (
              <Grid item xs={6} md={3} key={eff.label}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={700} sx={{ color: eff.color }}>{formatCurrency(eff.value)}</Typography>
                  <Typography variant="body2" fontWeight={600}>{eff.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{eff.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {recommendations.length > 0 && (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LightbulbIcon sx={{ fontSize: 18, color: '#D97706' }} /> AI Recommendations
          </Typography>
          {recommendations.map((rec, i) => (
            <Alert key={i} severity={rec.type === 'warning' ? 'warning' : rec.type === 'repeat' ? 'success' : 'info'}
              sx={{ mb: i < recommendations.length - 1 ? 1 : 0, borderRadius: '10px', '& .MuiAlert-message': { fontSize: '0.85rem' } }}>
              {rec.text}
            </Alert>
          ))}
        </Paper>
      )}

      {!pea && !performance && (
        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: '14px' }}>
          <Typography color="text.secondary">Performance data will be available once the promotion is active</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default PromotionPerformance;
