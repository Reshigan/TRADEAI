import React from 'react';
import { Card, Grid, Typography, Box, Button } from '@mui/material';
import { 
  Assignment, 
  CheckCircle, 
  People, 
  TrendingUp, 
  WarningAmber 
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useMyWork } from '../../hooks/useMyWork';

const ManagerCockpit = ({ user }) => {
  const { tenantId } = useAuth();
  const { approvals, loading } = useMyWork();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Manager Cockpit: {user?.firstName || 'Team Lead'}</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
      Overseeing team performance, budget compliance, and approval queues.
      </Typography>

      <Grid container spacing={3}>
        {/* Top Row: Management KPIs */}
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="subtitle2">Pending Approvals</Typography>
            <Typography variant="h4">{approvals?.length || 0}</Typography>
            <Typography variant="caption">Requires your sign-off</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.main', color: 'white' }}>
            <Typography variant="subtitle2">Team Achievement</Typography>
            <Typography variant="h4">82%</Typography>
            <Typography variant="caption">Target revenue reach</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
            <Typography variant="subtitle2">Budget Variances</Typography>
            <Typography variant="h4">4</Typography>
            <Typography variant="caption">Over-utilized budgets</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
            <Typography variant="subtitle2">Approved ROI</Typography>
            <Typography variant="h4">2.8x</Typography>
            <Typography variant="caption">Aggregated team performance</Typography>
          </Card>
        </Grid>

        {/* Middle Row: Actionable Queues */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Approval Queue (Prioritized)</Typography>
              <Button size="small" variant="outlined">View All</Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {approvals?.slice(0, 5).map(app => (
                <Box key={app.id} sx={{ p: 2, border: '1px solid #eee', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2"><strong>{app.entity_name}</strong></Typography>
                    <Typography variant="caption" color="text.secondary">Requested by: {app.created_by || 'KAM'}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption" sx={{ bgcolor: app.priority === 'high' ? 'error.light' : 'grey.300', px: 1, borderRadius: 1 }}>{app.priority || 'medium'}</Typography>
                    <Button size="small" variant="contained" color="primary">Approve</Button>
                  </Box>
                </Box>
              ))}
              {(!approvals || approvals.length === 0) && <Typography variant="body2" color="text.secondary">Your queue is currently clear.</Typography>}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" mb={2}>Team Performance</Typography>
            <Box sx={{ height: 200, bgcolor: '#f9f9f9', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <People color="disabled" sx={{ fontSize: 40 }} />
              <Typography variant="body2" color="text.secondary">KAM Productivity Chart</Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" fullWidth size="small">View Team Leaderboard</Button>
              <Button variant="outlined" fullWidth size="small">Review Budget Allocations</Button>
            </Box>
          </Card>
        </Grid>

        {/* Bottom Row: Oversight Tools */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>Strategic Oversight</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" startIcon={<TrendingUp />} color="primary">Review All Promotions</Button>
              <Button variant="contained" startIcon={<WarningAmber />} color="warning">Audit Over-spend</Button>
              <Button variant="contained" startIcon={<CheckCircle />} color="success">Approve Monthly Accruals</Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ManagerCockpit;
