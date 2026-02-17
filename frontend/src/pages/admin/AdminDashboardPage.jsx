import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button
} from '@mui/material';
import {
  People as UsersIcon,
  Business as CompaniesIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    activeUsers: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [usersRes, companiesRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: { data: [] } })),
        api.get('/companies').catch(() => ({ data: { data: [] } }))
      ]);

      const users = usersRes.data.data || [];
      const companies = companiesRes.data.data || [];

      setStats({
        totalUsers: users.length,
        totalCompanies: companies.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        pendingApprovals: 0
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <UsersIcon sx={{ fontSize: 40 }} />,
      color: '#7C3AED',
      action: () => navigate('/admin/users')
    },
    {
      title: 'Total Companies',
      value: stats.totalCompanies,
      icon: <CompaniesIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      action: () => navigate('/admin/companies')
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      action: () => navigate('/admin/users')
    },
    {
      title: 'Security Alerts',
      value: 0,
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
      action: () => navigate('/admin/security')
    }
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 600 }}>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={card.action}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 700, color: card.color }}>
                      {loading ? '...' : card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {card.title}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color, opacity: 0.7 }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button variant="contained" onClick={() => navigate('/admin/users/new')}>
              Add New User
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outlined" onClick={() => navigate('/admin/companies')}>
              Manage Companies
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outlined" onClick={() => navigate('/admin/security')}>
              Security Settings
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AdminDashboardPage;
