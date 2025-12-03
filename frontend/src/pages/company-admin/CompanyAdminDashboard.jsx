import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Paper,
  CircularProgress, Alert
} from '@mui/material';
import {
  People, School, SportsEsports, Campaign, Policy,
  Settings, Sync, Business, Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import enterpriseApi from '../../services/enterpriseApi';

const StatCard = ({ title, value, subtitle, icon: Icon, color, onClick }) => (
  <Card 
    sx={{ 
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 4 } : {}
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          p: 1, 
          borderRadius: 2, 
          bgcolor: `${color}.lighter`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 2
        }}>
          <Icon sx={{ color: `${color}.main`, fontSize: 28 }} />
        </Box>
        <Typography variant="h6" color="text.secondary">{title}</Typography>
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 600, mb: 0.5 }}>{value}</Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
      )}
    </CardContent>
  </Card>
);

const QuickAction = ({ title, description, icon: Icon, onClick, color = 'primary' }) => (
  <Paper
    sx={{
      p: 2,
      cursor: 'pointer',
      transition: 'all 0.2s',
      '&:hover': { bgcolor: 'action.hover', transform: 'translateX(4px)' }
    }}
    onClick={onClick}
  >
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Icon sx={{ color: `${color}.main`, mr: 2, fontSize: 24 }} />
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
      </Box>
    </Box>
  </Paper>
);

export default function CompanyAdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await enterpriseApi.companyAdmin.getDashboardStats();
      setStats(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Company Administration</Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your company settings, users, and content
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} onClick={loadStats}>Refresh</Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Users"
            value={stats?.users?.total || 0}
            subtitle={`${stats?.users?.active || 0} active`}
            icon={People}
            color="primary"
            onClick={() => navigate('/company-admin/users')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Learning Courses"
            value={stats?.courses?.total || 0}
            subtitle={`${stats?.courses?.published || 0} published`}
            icon={School}
            color="success"
            onClick={() => navigate('/company-admin/courses')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Games"
            value={stats?.games?.active || 0}
            subtitle="Gamification"
            icon={SportsEsports}
            color="warning"
            onClick={() => navigate('/company-admin/games')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Announcements"
            value={stats?.announcements?.active || 0}
            subtitle="Active"
            icon={Campaign}
            color="info"
            onClick={() => navigate('/company-admin/announcements')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <QuickAction
                title="Create Learning Course"
                description="Add new training content for employees"
                icon={School}
                color="success"
                onClick={() => navigate('/company-admin/courses/new')}
              />
              <QuickAction
                title="Post Announcement"
                description="Share important updates with your team"
                icon={Campaign}
                color="info"
                onClick={() => navigate('/company-admin/announcements/new')}
              />
              <QuickAction
                title="Manage Policies"
                description="Create or update company policies"
                icon={Policy}
                color="warning"
                onClick={() => navigate('/company-admin/policies')}
              />
              <QuickAction
                title="Setup Gamification"
                description="Configure games and leaderboards"
                icon={SportsEsports}
                color="secondary"
                onClick={() => navigate('/company-admin/games')}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>System Configuration</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <QuickAction
                title="Company Settings"
                description="Branding, logo, and general settings"
                icon={Settings}
                onClick={() => navigate('/company-admin/settings')}
              />
              <QuickAction
                title="Azure AD Integration"
                description="Connect and sync employees from Azure AD"
                icon={Sync}
                onClick={() => navigate('/company-admin/azure-ad')}
              />
              <QuickAction
                title="User Management"
                description="Manage user accounts and permissions"
                icon={People}
                onClick={() => navigate('/company-admin/users')}
              />
              <QuickAction
                title="Departments"
                description="Manage organizational structure"
                icon={Business}
                onClick={() => navigate('/company-admin/departments')}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Employees"
            value={stats?.employees?.total || 0}
            subtitle="From Azure AD"
            icon={People}
            color="secondary"
            onClick={() => navigate('/company-admin/employees')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Departments"
            value={stats?.departments?.total || 0}
            subtitle="Active"
            icon={Business}
            color="primary"
            onClick={() => navigate('/company-admin/departments')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Policies"
            value={stats?.policies?.published || 0}
            subtitle="Published"
            icon={Policy}
            color="warning"
            onClick={() => navigate('/company-admin/policies')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Audit Logs"
            value="View"
            subtitle="Activity history"
            icon={Settings}
            color="info"
            onClick={() => navigate('/company-admin/audit-logs')}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
