import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Tab,
  Tabs,
  Chip,
  Button
} from '@mui/material';
import {
  Settings,
  People,
  LocalOffer,
  AccountTree,
  Psychology,
  Security,
  Backup,
  Assessment
} from '@mui/icons-material';
import SystemSettings from './system/SystemSettings';
import UserManagement from './users/UserManagement';
import RebateConfiguration from './rebates/RebateConfiguration';
import WorkflowAutomation from './workflows/WorkflowAutomation';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);

  const adminSections = [
    {
      id: 'system',
      label: 'System Settings',
      icon: <Settings />,
      component: SystemSettings,
      description: 'Configure system-wide settings'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: <People />,
      component: UserManagement,
      description: 'Manage users, roles, and permissions'
    },
    {
      id: 'rebates',
      label: 'Rebate Configuration',
      icon: <LocalOffer />,
      component: RebateConfiguration,
      description: 'Configure rebate types and rules'
    },
    {
      id: 'workflows',
      label: 'Workflow Automation',
      icon: <AccountTree />,
      component: WorkflowAutomation,
      description: 'Setup approval chains and notifications'
    }
  ];

  const ActiveComponent = adminSections[activeTab].component;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          System Administration
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure and manage Trade AI platform settings
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <People color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">45</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LocalOffer color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">8</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rebate Types
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountTree color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">12</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Workflows
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Security color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">100%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    System Health
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {adminSections.map((section, index) => (
              <Tab
                key={section.id}
                label={section.label}
                icon={section.icon}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>
        <CardContent>
          <ActiveComponent />
        </CardContent>
      </Card>
    </Container>
  );
};

export default AdminDashboard;
