import React from 'react';
import { Card, Grid, Typography, Box, Button } from '@mui/material';
import { 
  CalendarMonth, 
  TrendingUp, 
  Assessment, 
  Search, 
  AddCircleOutline 
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useMyWork } from '../../../hooks/useMyWork';

const TradeMarketingCockpit = ({ user }) => {
  const { tenantId } = useAuth();
  const { promotions, loading } = useMyWork();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Trade Marketing Cockpit: {user?.firstName || 'Strategist'}</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Strategic planning, campaign oversight, and promotional calendar management.
      </Typography>

      <Grid container spacing={3}>
        {/* Top Row: Strategic KPIs */}
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="subtitle2">Campaign Reach</Typography>
            <Typography variant="h4">85%</Typography>
            <Typography variant="caption">Target coverage</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.main', color: 'white' }}>
            <Typography variant="subtitle2">Avg Promotion ROI</Typography>
            <Typography variant="h4">3.2x</Typography>
            <Typography variant="caption">Strategically optimized</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
            <Typography variant="subtitle2">Upcoming Launches</Typography>
            <Typography variant="h4">12</Typography>
            <Typography variant="caption">Next 30 days</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
            <Typography variant="subtitle2">Budget Utilization</Typography>
            <Typography variant="h4">64%</Typography>
            <Typography variant="caption">Fiscal year running total</Typography>
          </Card>
        </Grid>

        {/* Middle Row: Planning Workspace */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" mb={2}>Promotional Calendar Alignment</Typography>
            <Box sx={{ height: 300, bgcolor: '#f9f9f9', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <CalendarMonth color="disabled" sx={{ fontSize: 40 }} />
              <Typography variant="body2" color="text.secondary">Calendar Heatmap Visualization Area</Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="contained" startIcon={<AddCircleOutline />} color="primary">New Campaign</Button>
              <Button variant="contained" startIcon={<TrendingUp />} color="secondary">Optimize Mix</Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" mb={2}>Strategic Alerts</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { id: 1, title: 'Competitor Move', msg: 'Competitor X launched 20% off in Gauteng', priority: 'high' },
                { id: 2, title: 'Budget Gap', msg: 'Q3 Promotional budget is under-allocated', priority: 'medium' },
                { id: 3, title: 'Opportunity', msg: 'High ROI detected in bundle offers', priority: 'low' },
              ].map(alert => (
                <Box key={alert.id} sx={{ p: 1, border: '1px solid #eee', borderRadius: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2"><strong>{alert.title}</strong></Typography>
                  <Typography variant="caption" color="text.secondary">{alert.msg}</Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* Bottom Row: Execution Tools */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>Strategy Tools</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<Assessment />} color="primary">Run ROI Forecast</Button>
              <Button variant="outlined" startIcon={<Search />} color="secondary">Competitive Benchmarking</Button>
              <Button variant="contained" color="info">Generate Strategy Deck</Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TradeMarketingCockpit;
