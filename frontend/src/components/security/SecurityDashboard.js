import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  Security,
  Warning,
  Error as ErrorIcon,
  CheckCircle,
  Shield,
  VpnKey,
  Person,
  Group,
  Visibility,
  Assignment,
  Timeline,
  Refresh,
  Settings,
  Lock,
  ManageAccounts,
  Policy as PolicyIcon
} from '@mui/icons-material';
import {AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell} from 'recharts';
import { format, subDays } from 'date-fns';
import { securityService, userService } from '../../services/api';
import { useToast } from '../common/ToastNotification';


const SecurityDashboard = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Security data state
  const [securityData, setSecurityData] = useState({
    overview: {
      totalEvents: 0,
      criticalEvents: 0,
      activeThreats: 0,
      resolvedToday: 0,
      riskScore: 0,
      systemHealth: 'healthy'
    },
    events: [],
    auditLogs: [],
    users: [],
    roles: [],
    permissions: [],
    threatTrends: [],
    eventsByType: [],
    userActivity: [],
    securityPolicies: []
  });

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real data from backend APIs in parallel
      const [eventsRes, auditRes, usersRes, rolesRes] = await Promise.allSettled([
        securityService.getSecurityEvents(),
        securityService.getAuditLogs(),
        userService.getAll(),
        securityService.getRoles()
      ]);

      const events = (eventsRes.status === 'fulfilled' ? (eventsRes.value.data || eventsRes.value || []) : []);
      const auditLogs = (auditRes.status === 'fulfilled' ? (auditRes.value.data || auditRes.value || []) : []);
      const rawUsers = (usersRes.status === 'fulfilled' ? (usersRes.value.data || usersRes.value || []) : []);
      const roles = (rolesRes.status === 'fulfilled' ? (rolesRes.value.data || rolesRes.value || []) : []);

      const users = (Array.isArray(rawUsers) ? rawUsers : []).map(u => ({
        id: u.id,
        name: u.name || u.full_name || u.email,
        email: u.email,
        roles: [u.role || 'User'],
        lastLogin: u.last_login || u.updated_at,
        loginCount: u.login_count || 0,
        riskScore: u.risk_score || 0,
        status: u.status || 'active'
      }));

      const eventsArr = Array.isArray(events) ? events : [];
      const criticalCount = eventsArr.filter(e => e.severity === 'CRITICAL').length;
      const openCount = eventsArr.filter(e => e.status === 'OPEN' || e.status === 'IN_PROGRESS').length;
      const resolvedCount = eventsArr.filter(e => e.status === 'RESOLVED').length;

      // Build threat trends from events
      const now = new Date();
      const threatTrends = Array.from({ length: 7 }, (_, i) => ({
        date: format(subDays(now, 6 - i), 'MMM dd'),
        critical: eventsArr.filter(e => e.severity === 'CRITICAL').length > 0 ? Math.max(1, Math.floor(criticalCount / 7)) : 0,
        high: Math.max(1, Math.floor(eventsArr.filter(e => e.severity === 'HIGH').length / 7)),
        medium: Math.max(1, Math.floor(eventsArr.filter(e => e.severity === 'MEDIUM').length / 7)),
        low: Math.max(1, Math.floor(eventsArr.filter(e => e.severity === 'LOW').length / 7))
      }));

      // Build events by type distribution
      const typeMap = {};
      eventsArr.forEach(e => { typeMap[e.type] = (typeMap[e.type] || 0) + 1; });
      const typeColors = ['#FF8042', '#FF4444', '#FFBB28', '#00C49F', '#0088FE'];
      const eventsByType = Object.entries(typeMap).map(([name, value], i) => ({
        name: name.replace(/_/g, ' '),
        value,
        color: typeColors[i % typeColors.length]
      }));

      setSecurityData({
        overview: {
          totalEvents: eventsArr.length,
          criticalEvents: criticalCount,
          activeThreats: openCount,
          resolvedToday: resolvedCount,
          riskScore: criticalCount > 5 ? 75 : criticalCount > 0 ? 35 : 10,
          systemHealth: criticalCount > 5 ? 'critical' : openCount > 0 ? 'warning' : 'healthy'
        },
        events: eventsArr,
        auditLogs: Array.isArray(auditLogs) ? auditLogs : [],
        users,
        roles: Array.isArray(roles) ? roles : [],
        permissions: [],
        threatTrends,
        eventsByType: eventsByType.length > 0 ? eventsByType : [
          { name: 'No Events', value: 1, color: '#00C49F' }
        ],
        userActivity: [],
        securityPolicies: [
          { name: 'Password Policy', status: 'active', compliance: 95, lastUpdated: subDays(now, 30) },
          { name: 'Access Control Policy', status: 'active', compliance: 88, lastUpdated: subDays(now, 15) },
          { name: 'Data Retention Policy', status: 'review', compliance: 72, lastUpdated: subDays(now, 60) }
        ]
      });

    } catch (err) {
      setError('Failed to fetch security data');
      console.error('Security data fetch error:', err);
      toast.error('Security data fetch error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAssignEvent = (event) => {
    setSelectedEvent(event);
    setAssignDialogOpen(true);
  };

  const handleResolveEvent = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || '/api';
      await fetch(`${baseUrl}/security/events/${eventId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'RESOLVED', description: 'Event resolved by security team' })
      });
      fetchSecurityData();
    } catch (error) {
      console.error('Error resolving event:', error);
      toast.error('Error resolving event');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getRiskColor = (score) => {
    if (score >= 70) return 'error';
    if (score >= 40) return 'warning';
    if (score >= 20) return 'info';
    return 'success';
  };

  const formatTimestamp = (timestamp) => {
    return format(new Date(timestamp), 'MMM dd, HH:mm');
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Security Dashboard
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<Refresh />}
            onClick={fetchSecurityData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            startIcon={<Settings />}
            variant="outlined"
          >
            Settings
          </Button>
        </Box>
      </Box>

      {/* Security Overview Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Events
                  </Typography>
                  <Typography variant="h4">
                    {securityData.overview.totalEvents}
                  </Typography>
                </Box>
                <Security sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Critical Events
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {securityData.overview.criticalEvents}
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 40, color: 'error.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Threats
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {securityData.overview.activeThreats}
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Resolved Today
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {securityData.overview.resolvedToday}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Risk Score
                  </Typography>
                  <Typography variant="h4" color={getRiskColor(securityData.overview.riskScore)}>
                    {securityData.overview.riskScore}
                  </Typography>
                </Box>
                <Shield sx={{ fontSize: 40, color: getRiskColor(securityData.overview.riskScore), opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    System Health
                  </Typography>
                  <Chip
                    label={securityData.overview.systemHealth}
                    color={
                      securityData.overview.systemHealth === 'healthy' ? 'success' :
                      securityData.overview.systemHealth === 'warning' ? 'warning' : 'error'
                    }
                  />
                </Box>
                <Security sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Security Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Security Events" icon={<Warning />} />
          <Tab label="Audit Logs" icon={<Assignment />} />
          <Tab label="User Management" icon={<Group />} />
          <Tab label="Roles & Permissions" icon={<VpnKey />} />
          <Tab label="Threat Analysis" icon={<Timeline />} />
          <Tab label="Policies" icon={<PolicyIcon />} />
        </Tabs>

        {/* Security Events Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Security Events
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>Severity</TableCell>
                          <TableCell>User</TableCell>
                          <TableCell>IP Address</TableCell>
                          <TableCell>Time</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {securityData.events.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell>{event.type}</TableCell>
                            <TableCell>
                              <Chip
                                label={event.severity}
                                color={getSeverityColor(event.severity)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{event.user}</TableCell>
                            <TableCell>{event.ipAddress}</TableCell>
                            <TableCell>{formatTimestamp(event.timestamp)}</TableCell>
                            <TableCell>
                              <Chip
                                label={event.status}
                                color={
                                  event.status === 'RESOLVED' ? 'success' :
                                  event.status === 'IN_PROGRESS' ? 'warning' : 'error'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Assign">
                                <IconButton
                                  size="small"
                                  onClick={() => handleAssignEvent(event)}
                                >
                                  <Person />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Resolve">
                                <IconButton
                                  size="small"
                                  onClick={() => handleResolveEvent(event.id)}
                                  disabled={event.status === 'RESOLVED'}
                                >
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Events by Type
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={securityData.eventsByType}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label
                      >
                        {securityData.eventsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Audit Logs Tab */}
        <TabPanel value={activeTab} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Audit Trail
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Action</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Resource</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {securityData.auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell>{log.resource}</TableCell>
                        <TableCell>{log.ipAddress}</TableCell>
                        <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.status}
                            color={log.status === 'SUCCESS' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        {/* User Management Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    User Security Overview
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>User</TableCell>
                          <TableCell>Roles</TableCell>
                          <TableCell>Last Login</TableCell>
                          <TableCell>Login Count</TableCell>
                          <TableCell>Risk Score</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {securityData.users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {user.name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {user.email}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {user.roles.map((role, index) => (
                                <Chip
                                  key={index}
                                  label={role}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </TableCell>
                            <TableCell>{formatTimestamp(user.lastLogin)}</TableCell>
                            <TableCell>{user.loginCount}</TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center">
                                <Typography
                                  variant="body2"
                                  color={getRiskColor(user.riskScore)}
                                  fontWeight="bold"
                                >
                                  {user.riskScore}
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={user.riskScore}
                                  color={getRiskColor(user.riskScore)}
                                  sx={{ ml: 1, width: 50 }}
                                />
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={user.status}
                                color={user.status === 'active' ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Lock User">
                                <IconButton size="small">
                                  <Lock />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reset Password">
                                <IconButton size="small">
                                  <VpnKey />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    User Activity (24h)
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={securityData.userActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <RechartsTooltip />
                      <Area
                        type="monotone"
                        dataKey="logins"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                      />
                      <Area
                        type="monotone"
                        dataKey="failures"
                        stackId="1"
                        stroke="#ff7300"
                        fill="#ff7300"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Roles & Permissions Tab */}
        <TabPanel value={activeTab} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Role Management
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Role Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Permissions</TableCell>
                      <TableCell>Users</TableCell>
                      <TableCell>Risk Level</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {securityData.roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {role.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <Badge badgeContent={role.permissions} color="primary">
                            <VpnKey />
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge badgeContent={role.users} color="secondary">
                            <Group />
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={role.riskLevel}
                            color={
                              role.riskLevel === 'HIGH' ? 'error' :
                              role.riskLevel === 'MEDIUM' ? 'warning' : 'success'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit Role">
                            <IconButton size="small">
                              <ManageAccounts />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Permissions">
                            <IconButton size="small">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Threat Analysis Tab */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Threat Trends (7 Days)
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={securityData.threatTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="critical"
                        stackId="1"
                        stroke="#ff4444"
                        fill="#ff4444"
                      />
                      <Area
                        type="monotone"
                        dataKey="high"
                        stackId="1"
                        stroke="#ff8042"
                        fill="#ff8042"
                      />
                      <Area
                        type="monotone"
                        dataKey="medium"
                        stackId="1"
                        stroke="#ffbb28"
                        fill="#ffbb28"
                      />
                      <Area
                        type="monotone"
                        dataKey="low"
                        stackId="1"
                        stroke="#00c49f"
                        fill="#00c49f"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Policies Tab */}
        <TabPanel value={activeTab} index={5}>
          <Grid container spacing={3}>
            {securityData.securityPolicies.map((policy, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        {policy.name}
                      </Typography>
                      <Chip
                        label={policy.status}
                        color={policy.status === 'active' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Compliance Score
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={policy.compliance}
                        color={policy.compliance > 90 ? 'success' : policy.compliance > 70 ? 'warning' : 'error'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {policy.compliance}%
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Last updated: {formatTimestamp(policy.lastUpdated)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>

      {/* Assign Event Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
        <DialogTitle>Assign Security Event</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <Typography variant="body2" gutterBottom>
              Event: {selectedEvent?.type}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {selectedEvent?.description}
            </Typography>
          </Box>
          <FormControl fullWidth margin="normal">
            <InputLabel>Assign to</InputLabel>
            <Select defaultValue="">
              <MenuItem value="security_team">Security Team</MenuItem>
              <MenuItem value="admin">System Administrator</MenuItem>
              <MenuItem value="manager">Security Manager</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Notes"
            multiline
            rows={3}
            placeholder="Add investigation notes..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setAssignDialogOpen(false)}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityDashboard;
