/**
 * System Alerts Page
 * Displays system alerts and notifications for admins with filtering and pagination
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
  TableSortLabel,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Breadcrumbs,
  Link,
  Tooltip,
  Badge,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
  Settings,
  Search,
  DoneAll
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const Alerts = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [alerts, setAlerts] = useState([]);
  
  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const response = await api.get('/alerts');
        const data = response.data;
        
        // Transform API data to match component format
        const transformedAlerts = (data.alerts || []).map((alert, index) => ({
          _id: alert._id || index.toString(),
          type: alert.severity === 'critical' ? 'error' : alert.severity || 'info',
          title: alert.title || 'Alert',
          message: alert.message || '',
          category: alert.type || 'system',
          createdAt: alert.createdAt || new Date().toISOString(),
          read: alert.read || false
        }));
        
        setAlerts(transformedAlerts);
      } catch (error) {
        console.error('Error fetching alerts:', error);
        enqueueSnackbar('Failed to load alerts', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [enqueueSnackbar]);

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
      (alert.id || alert._id) === alertId ? { ...alert, read: true } : alert
    ));
    enqueueSnackbar('Alert marked as read', { variant: 'success' });
  };

  const handleDelete = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert._id !== alertId));
    enqueueSnackbar('Alert deleted', { variant: 'success' });
  };

  // Sorting
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Mark all as read
  const handleMarkAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
    enqueueSnackbar('All alerts marked as read', { variant: 'success' });
  };

  const filteredAlerts = alerts
    .filter(a => {
      // Tab filter
      if (activeTab === 1 && a.read) return false;
      if (activeTab === 2 && !a.read) return false;
      // Search filter
      const matchesSearch = !searchTerm || 
        a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.message?.toLowerCase().includes(searchTerm.toLowerCase());
      // Type filter
      const matchesType = !typeFilter || a.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (orderBy === 'createdAt') {
        return order === 'asc' 
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
      const aVal = a[orderBy] || '';
      const bVal = b[orderBy] || '';
      if (typeof aVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const paginatedAlerts = filteredAlerts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const unreadCount = alerts.filter(a => !a.read).length;
  const uniqueTypes = [...new Set(alerts.map(a => a.type).filter(Boolean))];

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
        <Tabs value={activeTab} onChange={(e, v) => { setActiveTab(v); setPage(0); }}>
          <Tab label={`All (${alerts.length})`} />
          <Tab label={`Unread (${unreadCount})`} />
          <Tab label={`Read (${alerts.length - unreadCount})`} />
        </Tabs>
      </Paper>

      {/* Alerts Table */}
      <Paper>
        <Box p={2} borderBottom={1} borderColor="divider" display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                label="Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {uniqueTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DoneAll />}
              onClick={handleMarkAllAsRead}
            >
              Mark All as Read
            </Button>
          )}
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={50}>Type</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'title'}
                    direction={orderBy === 'title' ? order : 'asc'}
                    onClick={() => handleSort('title')}
                  >
                    Alert
                  </TableSortLabel>
                </TableCell>
                <TableCell>Category</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'createdAt'}
                    direction={orderBy === 'createdAt' ? order : 'asc'}
                    onClick={() => handleSort('createdAt')}
                  >
                    Time
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="textSecondary" py={4}>
                      {searchTerm || typeFilter ? 'No alerts match your filters' : 'No alerts found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAlerts.map((alert) => (
                  <TableRow 
                    key={alert.id || alert._id}
                    hover
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
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredAlerts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>
    </Container>
  );
};

export default Alerts;
