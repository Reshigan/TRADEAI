import React from 'react';
import { Card, Grid, Typography, Box, Button } from '@mui/material';
import { 
  Settings, 
  Security, 
  Build, 
  Analytics, 
  NotificationsActive 
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const AdminCockpit = ({ user }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Admin Cockpit: {user?.firstName || 'System Admin'}</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        System configuration, user management, and health monitoring.
      </Typography>

      <Grid container spacing={3}>
        {/* Top Row: System Health KPIs */}
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="subtitle2">System Health</Typography>
            <Typography variant="h4">Healthy</Typography>
            <Typography variant="caption">All services operational</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.main', color: 'white' }}>
            <Typography variant="subtitle2">Active Users</Typography>
            <Typography variant="h4">124</Typography>
            <Typography variant="caption">Currently online</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
            <Typography variant="subtitle2">Pending Invites</Typography>
            <Typography variant="h4">8</Typography>
            <Typography variant="caption">Awaiting verification</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
            <Typography variant="subtitle2">Uptime</Typography>
            <Typography variant="h4">99.99%</Typography>
            <Typography variant="caption">Last 30 days</Typography>
          </Card>
        </Grid>

        {/* Middle Row: Operational Core */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" mb={2}>User Management</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="contained" startIcon={<People />} color="primary">Manage Users</Button>
              <Button variant="contained" startIcon={<Security />} color="secondary">Audit Access Logs</Button>
              <Button variant="contained" startIcon={<Build />} color="info">Update System Config</B>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" mb={2}>Infrastructure Monitoring</Typography>
            <Box sx={{ height: 200, bgcolor: '#f9f9f9', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Analytics color="disabled" sx={{ fontSize: 40 }} />
              <Typography variant="body2" color="text.secondary">Latency & Error Rate Chart</Typography>
            </Box>
          </Card>
        </Grid>

        {/* Bottom Row: System Actions */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>System Administration</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<Settings />} color="primary">Configuration</Button>
              <Button variant="outlined" startIcon={<NotificationsActive />} color="warning">System Notifications</Button>
              <Button variant="contained" color="error">Emergency Maintenance Mode</Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminCockpit;
