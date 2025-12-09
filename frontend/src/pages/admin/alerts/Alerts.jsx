/**
 * System Alerts Page
 * Displays system alerts and notifications for admins
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Breadcrumbs,
  Link,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  CheckCircle,
  Refresh,
  Delete,
  Visibility,
  NotificationsActive,
  Settings
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

const Alerts = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [alerts, setAlerts] = useState([]);

  // Mock alerts data - in production this would come from the API
  const mockAlerts = [
    {
      _id: '1',
      type: 'warning',
      title: 'Budget Threshold Exceeded',
      message: 'Marketing budget has exceeded 90% of allocated amount',
      category: 'budget',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      read: false
    },
    {
      _id: '2',
      type: 'info',
      title: 'New User Registration',
      message: '3 new users have been registered in the last 24 hours',
      category: 'users',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      read: true
    },
    {
      _id: '3',
      type: 'success',
      title: 'Promotion Approved',
      message: 'Summer Sale promotion has been approved by management',
      category: 'promotions',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      read: true
    },
    {
      _id: '4',
      type: 'error',
      title: 'ERP Sync Failed',
      message: 'Failed to sync sales data from ERP system. Please check connection settings.',
      category: 'system',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      read: false
    },
    {
      _id: '5',
      type: 'warning',
      title: 'Low Inventory Alert',
      message: '15 products have inventory below minimum threshold',
      category: 'products',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      read: false
    }
  ];

  useEffect(() => {
    // Simulate API call
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        // In production: const response = await api.get('/alerts');
        // setAlerts(response.data.alerts);
        await new Promise(resolve => setTimeout(resolve, 500));
        setAlerts(mockAlerts);
      } catch (error) {
        console.error('Error fetching alerts:', error);
        enqueueSnackbar('Failed to load alerts', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error': return <Error color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'success': return <CheckCircle color="success" />;
      default: return <Info color="info" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'success';
      default: return 'info';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour(s) ago`;
    if (diffDays < 7) return `${diffDays} day(s) ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert._id === alertId ? { ...alert, read: true } : alert
    ));
    enqueueSnackbar('Alert marked as read', { variant: 'success' });
  };

  const handleDelete = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert._id !== alertId));
    enqueueSnackbar('Alert deleted', { variant: 'success' });
  };

  const filteredAlerts = activeTab === 0 
    ? alerts 
    : activeTab === 1 
      ? alerts.filter(a => !a.read)
      : alerts.filter(a => a.read);

  const unreadCount = alerts.filter(a => !a.read).length;

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="/dashboard">Home</Link>
        <Link color="inherit" href="/admin">Admin</Link>
        <Typography color="text.primary">Alerts</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            System Alerts
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Monitor system notifications and alerts
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            href="/settings"
          >
            Settings
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Badge badgeContent={alerts.length} color="primary">
                  <NotificationsActive color="primary" sx={{ fontSize: 40 }} />
                </Badge>
                <Box>
                  <Typography variant="h4">{alerts.length}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Alerts</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Warning color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{unreadCount}</Typography>
                  <Typography variant="body2" color="textSecondary">Unread</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Error color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{alerts.filter(a => a.type === 'error').length}</Typography>
                  <Typography variant="body2" color="textSecondary">Errors</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{alerts.filter(a => a.read).length}</Typography>
                  <Typography variant="body2" color="textSecondary">Resolved</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label={`All (${alerts.length})`} />
          <Tab label={`Unread (${unreadCount})`} />
          <Tab label={`Read (${alerts.length - unreadCount})`} />
        </Tabs>
      </Paper>

      {/* Alerts Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={50}>Type</TableCell>
                <TableCell>Alert</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="textSecondary" py={4}>
                      No alerts found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAlerts.map((alert) => (
                  <TableRow 
                    key={alert._id}
                    sx={{ bgcolor: alert.read ? 'transparent' : 'action.hover' }}
                  >
                    <TableCell>{getAlertIcon(alert.type)}</TableCell>
                    <TableCell>
                      <Typography fontWeight={alert.read ? 'normal' : 'bold'}>
                        {alert.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {alert.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={alert.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{formatDate(alert.createdAt)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={alert.read ? 'Read' : 'Unread'} 
                        size="small"
                        color={alert.read ? 'default' : 'primary'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {!alert.read && (
                        <Tooltip title="Mark as read">
                          <IconButton 
                            size="small"
                            onClick={() => handleMarkAsRead(alert._id)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small"
                          onClick={() => handleDelete(alert._id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default Alerts;
