import React from 'react';
import { Card, Grid, Typography, Box, Button } from '@mui/material';
import { 
  BarChart, 
  TrendingUp, 
  WarningAmber, 
  Search, 
  Lightbulb
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useMyWork } from '../../../hooks/useMyWork';

const AnalystCockpit = ({ user }) => {
  const { tenantId } = useAuth();
  const { promotions, customers, loading } = useMyWork();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Analyst Workspace: {user?.firstName || 'Data Analyst'}</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Identifying patterns, anomalies, and optimization opportunities in trade spend.
      </Typography>

      <Grid container spacing={3}>
        {/* Top Row: Data Health & Trends */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, bgcolor: 'background.paper', borderLeft: '5px solid #3B82F6' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">Data Quality Score</Typography>
              <Search color="primary" />
            </Box>
            <Typography variant="h4">94%</Typography>
            <Typography variant="caption" color="text.secondary">Last audit: 2h ago</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, bgcolor: 'background.paper', borderLeft: '5px solid #10B981' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">Average ROI</Typography>
              <TrendingUp color="success" />
            </Box>
            <Typography variant="h4">2.15x</Typography>
            <Typography variant="caption" color="text.secondary">+0.12 vs last quarter</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, bgcolor: 'background.paper', borderLeft: '5px solid #F59E0B' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">Anomalies Detected</Typography>
              <WarningAmber color="warning" />
            </Box>
            <Typography variant="h4">12</Typography>
            <Typography variant="caption" color="text.secondary">Requiring immediate review</Typography>
          </Card>
        </Grid>

        {/* Middle Row: Analysis Workflows */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" mb={2}>Top Performance Divergences</Typography>
            <Box sx={{ height: 300, bgcolor: '#f9f9f9', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <BarChart color="disabled" sx={{ fontSize: 40 }} />
              <Typography variant="body2" color="text.secondary">ROI Analysis Chart Area</Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="contained" startIcon={<Lightbulb />} color="primary">Run Cannibalization Audit</Button>
              <Button variant="contained" startIcon={<Search />} color="secondary">Analyze Forward-Buying</Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" mb={2}>Data Quality Alerts</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { id: 1, type: 'Missing Data', msg: '15 promotions lack end dates', severity: 'high' },
                { id: 2, type: 'Anomaly', msg: 'Unexpected volume spike in Customer X', severity: 'medium' },
                { id: 3, type: 'Outlier', msg: 'ROI of 12x detected in Promo Y', severity: 'low' },
              ].map(alert => (
                <Box key={alert.id} sx={{ p: 1, borderBottom: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2"><strong>{alert.type}</strong></Typography>
                  <Typography variant="caption" color="text.secondary">{alert.msg}</Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* Bottom Row: Quick Links */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>Quick Links</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" size="small">Export Data for Excel</Button>
              <Button variant="outlined" size="small">Generate Monthly Analysis Report</Button>
              <Button variant="outlined" size="small">Configure Anomaly Thresholds</Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalystCockpit;
