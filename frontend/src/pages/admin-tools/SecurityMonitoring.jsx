import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const SecurityMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, criticalEvents: 0, blockedIPs: 0, activeUsers: 0 });

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [eventsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/security/events?limit=50`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE_URL}/admin/security/stats`, { headers }).catch(() => ({ data: { data: {} } }))
      ]);

      setSecurityEvents(eventsRes.data.data || []);
      setStats(statsRes.data.data || { totalEvents: 0, criticalEvents: 0, blockedIPs: 0, activeUsers: 0 });
    } catch (err) {
      console.error('Failed to fetch security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981'
    };
    return colors[severity] || '#6b7280';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-ZA');
  };

  const getSeverityChipColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        🔒 Security Monitoring
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        System security events and monitoring
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Total Events
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {stats.totalEvents.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Critical Events
            </Typography>
            <Typography variant="h4" fontWeight={700} color="error.main">
              {stats.criticalEvents.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Blocked IPs
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {stats.blockedIPs.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Active Users
            </Typography>
            <Typography variant="h4" fontWeight={700} color="success.main">
              {stats.activeUsers.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600}>
            Recent Security Events
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchSecurityData}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Refresh
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Timestamp</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {securityEvents.map((event, index) => (
                <TableRow key={index}>
                  <TableCell>{formatDate(event.timestamp)}</TableCell>
                  <TableCell>{event.eventType}</TableCell>
                  <TableCell>
                    <Chip 
                      label={event.severity}
                      size="small"
                      color={getSeverityChipColor(event.severity)}
                    />
                  </TableCell>
                  <TableCell>{event.ipAddress}</TableCell>
                  <TableCell>{event.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {securityEvents.length === 0 && (
            <Box textAlign="center" py={5}>
              <Typography variant="body2" color="text.secondary">
                No security events found
              </Typography>
            </Box>
          )}
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default SecurityMonitoring;
