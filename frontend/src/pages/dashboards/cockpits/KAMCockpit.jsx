import React from 'react';
import { Card, Grid, Typography, Box, Button } from '@mui/material';
import {
  TrendingUp,
  Description,
  Add
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useMyWork } from '../../../hooks/useMyWork';

const KAMCockpit = ({ user }) => {
  const { tenantId } = useAuth();
  const { promotions, approvals, customers, loading } = useMyWork();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Welcome back, {user?.firstName || 'KAM'}</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your account portfolio and track promotion la-performance.
      </Typography>

      <Grid container spacing={3}>
        {/* Top Row: Actionable KPIs */}
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
            <Typography variant="subtitle2">My Active Promotions</Typography>
            <Typography variant="h4">{promotions?.length || 0}</Typography>
            <Typography variant="caption">Current active la-portfolio</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
            <Typography variant="subtitle2">Assigned Customers</Typography>
            <Typography variant="h4">{customers?.length || 0}</Typography>
            <Typography variant="caption">Active account la-assignments</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
            <Typography variant="subtitle2">Pending Claims</Typography>
            <Typography variant="h4">{0}</Typography>
            <Typography variant="caption">Needs immediate review</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
            <Typography variant="subtitle2">Estimated ROI</Typography>
            <Typography variant="h4">2.4x</Typography>
            <Typography variant="caption">Average across la-portfolio</Typography>
          </Card>
        </Grid>

        {/* Middle Row: My Work Queues */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">My Active Promotions</Typography>
              <Button size="small" variant="outlined">View All</Button>
</Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {promotions?.slice(0, 5).map(promo => (
                <Box key={promo.id} sx={{ p: 2, border: '1px solid #eee', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2"><strong>{promo.name}</strong></Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{promo.status}</Typography>
                </Box>
              ))}
              {(!promotions || promotions.length === 0) && <Typography variant="body2" color="text.secondary">No active promotions found.</Typography>}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">My Top Accounts</Typography>
              <Button size="small" variant="outlined">View All</Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {customers?.slice(0, 5).map(cust => (
                <Box key={cust.id} sx={{ p: 2, border: '1px solid #eee', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2"><strong>{cust.name}</strong></Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{cust.tier || 'Standard'}</Typography>
                </Box>
              ))}
              {(!customers || customers.length === 0) && <Typography variant="body2" color="text.secondary">No assigned customers found.</Typography>}
            </Box>
          </Card>
        </Grid>

        {/* Bottom Row: Quick Actions */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>Quick Actions</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" startIcon={<Add />} color="primary">Create Promotion</Button>
              <Button variant="contained" startIcon={<Description />} color="secondary">Submit Claim</Button>
              <Button variant="contained" startIcon={<TrendingUp />} color="success">Analyze ROI</Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default KAMCockpit;
