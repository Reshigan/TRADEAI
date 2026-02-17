import React, { useState } from 'react';
import { Box, Grid, Typography, Paper, Tab, Tabs, alpha } from '@mui/material';
import { Settings, People, LocalOffer, AccountTree, Security } from '@mui/icons-material';
import SystemSettings from './system/SystemSettings';
import UserManagement from './users/UserManagement';
import RebateConfiguration from './rebates/RebateConfiguration';
import WorkflowAutomation from './workflows/WorkflowAutomation';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);

  const adminSections = [
    { id: 'system', label: 'System Settings', icon: <Settings />, component: SystemSettings },
    { id: 'users', label: 'User Management', icon: <People />, component: UserManagement },
    { id: 'rebates', label: 'Rebate Configuration', icon: <LocalOffer />, component: RebateConfiguration },
    { id: 'workflows', label: 'Workflow Automation', icon: <AccountTree />, component: WorkflowAutomation }
  ];

  const statCards = [
    { label: 'Active Users', value: '45', icon: <People />, color: '#7C3AED', bg: alpha('#7C3AED', 0.08) },
    { label: 'Rebate Types', value: '8', icon: <LocalOffer />, color: '#059669', bg: alpha('#059669', 0.08) },
    { label: 'Active Workflows', value: '12', icon: <AccountTree />, color: '#2563EB', bg: alpha('#2563EB', 0.08) },
    { label: 'System Health', value: '100%', icon: <Security />, color: '#D97706', bg: alpha('#D97706', 0.08) },
  ];

  const ActiveComponent = adminSections[activeTab].component;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>System Administration</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>Configure and manage Trade AI platform settings</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {React.cloneElement(s.icon, { sx: { color: s.color, fontSize: 22 } })}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
                <Typography variant="h6" fontWeight={700}>{s.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 52 }, '& .Mui-selected': { color: '#7C3AED' }, '& .MuiTabs-indicator': { bgcolor: '#7C3AED' } }}>
            {adminSections.map((section) => (
              <Tab key={section.id} label={section.label} icon={section.icon} iconPosition="start" />
            ))}
          </Tabs>
        </Box>
        <Box sx={{ p: 3 }}>
          <ActiveComponent />
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
