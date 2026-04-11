import React from 'react';
import { Card, Grid, Typography, Box, Button } from '@mui/material';
import { 
  Public, 
  Business, 
  TrendingUp, 
  Group, 
  Assessment 
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const SuperAdminCockpit = ({ user }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Super Admin Cockpit: {user?.firstName || 'GONXT Admin'}</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Platform-wide oversight of all tenants and system-level performance.
      </Typography>

      <Grid container spacing={3}>
        {/* Top Row: Global Metrics */}
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.dark', color: 'white' }}>
            <Typography variant="subtitle2">Total Tenants</Typography>
            <Typography variant="h4">42</Typography>
            <Typography variant="caption">Active companies</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.dark', color: 'white' }}>
            <Typography variant="subtitle2">Global Users</Typography>
            <Typography variant="h4">1,250</Typography>
            <Typography variant="caption">Across all tenants</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
            <Typography variant="subtitle2">Global ROI Avg</Typography>
            <Typography variant="h4">2.6x</Typography>
            <Typography variant="caption">Platform average</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.dark', color: 'white' }}>
            <Typography variant="subtitle2">Platform Revenue</Typography>
            <Typography variant="h4">R 4.2M</Typography>
            <Typography variant="caption">SaaS recurring revenue</Typography>
          </Card>
        </Grid>

        {/* Middle Row: Multi-Tenant Management */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" mb={2}>Tenant Performance Distribution</Typography>
            <Box sx={{ height: 300, bgcolor: '#f9f9f9', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <Assessment color="disabled" sx={{ fontSize: 40 }} />
              <Typography variant="body2" color="text.secondary">Multi-tenant Revenue Map</Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="contained" startIcon={<Business />} color="primary">Audit Tenant</Button>
              <Button variant="contained" startIcon={<Public />} color="secondary">Create New Tenant</Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" mb={2}>Global System Alerts</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { id: 1, tenant: 'Mondelez SA', msg: 'D1 database latency spike', priority: 'high' },
                { id: 2, tenant: 'P&G South Africa', msg: 'AI Inference timeout', priority: 'medium' },
                { id: 3, tenant: 'Nestle', msg: 'Sentry error spike in la-promotions', priority: 'high' },
              ].map(alert => (
                <Box key={alert.id} sx={{ p: 1, border: '1px solid #eee', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: alert.priority === 'high' ? 'red' : 'orange' }} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{alert.tenant}</Typography>
                    <Typography variant="caption" color="text.secondary">{alert.msg}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* Bottom Row: Super Admin Actions */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>Platform Operations</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<Group />} color="primary">User Directory</Button>
              <Button variant="outlined" startIcon={<TrendingUp />} color="secondary">Global Market Trends</Button>
              <Button variant="contained" color="error">Flush Global Cache</Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SuperAdminCockpit;
