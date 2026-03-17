import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, CircularProgress, Alert, Divider } from '@mui/material';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import BlockIcon from '@mui/icons-material/Block';
import RefreshIcon from '@mui/icons-material/Refresh';
import apiClient from '../../services/apiClient';
import AIInsightCard from '../../components/ai/AIInsightCard';

const severityColors = { critical: '#EF4444', high: '#F59E0B', medium: '#3B82F6', low: '#64748B' };

const WasteDetectionManagement = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  const fetchWaste = async () => {
    try {
      setLoading(true);
      const [wasteRes, summaryRes] = await Promise.all([
        apiClient.post('/waste-detection', {}),
        apiClient.get('/waste-detection/summary'),
      ]);
      setData(wasteRes.data?.data || null);
      setSummary(summaryRes.data?.data || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWaste(); }, []);

  const patterns = data?.patterns || [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>AI Waste Detection</Typography>
          <Typography variant="body2" color="text.secondary">Identify promotions that lose money — know what NOT to promote</Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchWaste} disabled={loading}>Re-analyze</Button>
      </Box>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Completed Promos', value: summary.totalCompleted, color: '#1E40AF' },
            { label: 'Underperformers', value: summary.underperformers, color: '#EF4444', icon: <TrendingDownIcon /> },
            { label: 'Avg ROI', value: `${summary.avgROI}x`, color: summary.avgROI >= 1 ? '#059669' : '#F59E0B' },
            { label: 'Waste %', value: `${summary.wastePercentage}%`, color: summary.wastePercentage > 30 ? '#EF4444' : '#059669' },
          ].map((kpi, i) => (
            <Grid item xs={6} md={3} key={i}>
              <Card sx={{ border: '1px solid #E2E8F0' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ color: kpi.color }}>{kpi.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : patterns.length === 0 ? (
        <Alert severity="success" sx={{ mt: 2 }}>No waste patterns detected. Your promotions are performing well.</Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {data?.overallRating === 'needs_attention' && (
            <Alert severity="error" icon={<BlockIcon />}>
              Critical waste patterns detected. Review the items below to stop losing money on underperforming promotions.
            </Alert>
          )}

          {patterns.map((p, i) => (
            <AIInsightCard
              key={i}
              severity={p.severity === 'critical' ? 'error' : p.severity === 'high' ? 'warning' : 'info'}
              title={p.title}
              description={p.description}
              impact={p.recommendation}
              action={p.entityType === 'customer' ? 'View Customer' : p.entityType === 'product' ? 'View Product' : null}
            />
          ))}

          {data?.summary && (
            <Card sx={{ border: '1px solid #E2E8F0', mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Analysis Summary</Typography>
                <Divider sx={{ mb: 1 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Patterns Found</Typography>
                    <Typography variant="h6" fontWeight={700}>{data.summary.totalPatterns}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Critical</Typography>
                    <Typography variant="h6" fontWeight={700} color="error">{data.summary.critical}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">High Priority</Typography>
                    <Typography variant="h6" fontWeight={700} color="warning.main">{data.summary.high}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Promos Analyzed</Typography>
                    <Typography variant="h6" fontWeight={700}>{data.summary.analyzedPromotions}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
};

export default WasteDetectionManagement;
