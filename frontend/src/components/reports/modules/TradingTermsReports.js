import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Gavel as TradingTermsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  GetApp as DownloadIcon,
  MoreVert as MoreIcon,
  DateRange as DateRangeIcon,
  FilterList as FilterIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Cancel as RejectedIcon,
  Warning as ExpiringIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import { tradingTermsService } from '../../../services/api';
import { formatCurrency, formatLabel } from '../../../utils/formatters';

const TradingTermsReports = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [tradingTerms, setTradingTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchTradingTermsData();
  }, []);

  const fetchTradingTermsData = async () => {
    try {
      setLoading(true);
      const response = await tradingTermsService.getAll();
      // Ensure we always have an array
      const data = response?.data || response || [];
      setTradingTerms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching trading terms data:', error);
      setTradingTerms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Calculate trading terms metrics with safety checks
  const safeTerms = Array.isArray(tradingTerms) ? tradingTerms : [];
  const totalEstimatedValue = safeTerms.reduce((sum, term) => sum + (term?.financialImpact?.estimatedAnnualValue || 0), 0);
  const totalCost = safeTerms.reduce((sum, term) => sum + (term?.financialImpact?.costToCompany || 0), 0);
  const avgROI = safeTerms.length > 0 ? safeTerms.reduce((sum, term) => sum + (term?.performance?.actualROI || 0), 0) / safeTerms.length : 0;
  const avgUtilization = safeTerms.length > 0 ? safeTerms.reduce((sum, term) => sum + (term?.performance?.utilizationRate || 0), 0) / safeTerms.length : 0;

  // Status distribution
  const statusCounts = safeTerms.reduce((acc, term) => {
    const status = term?.approvalWorkflow?.status || 'draft';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Term type distribution
  const termTypeCounts = safeTerms.reduce((acc, term) => {
    const type = term?.termType || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Prepare chart data
  const performanceData = safeTerms.map((term, index) => ({
    name: term?.name?.substring(0, 20) + '...' || `Term ${index + 1}`,
    estimatedValue: term?.financialImpact?.estimatedAnnualValue || 0,
    actualRevenue: term?.performance?.actualRevenue || 0,
    cost: term?.financialImpact?.costToCompany || 0,
    roi: term?.performance?.actualROI || 0,
    utilization: term?.performance?.utilizationRate || 0,
    volume: term?.performance?.actualVolume || 0
  }));

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: formatLabel(status),
    value: count,
    percentage: ((count / safeTerms.length) * 100).toFixed(1)
  }));

  const termTypeData = Object.entries(termTypeCounts).map(([type, count]) => ({
    name: formatLabel(type),
    value: count,
    percentage: ((count / safeTerms.length) * 100).toFixed(1)
  }));

  const roiVsUtilizationData = safeTerms.map((term, index) => ({
    name: term?.name?.substring(0, 15) + '...' || `Term ${index + 1}`,
    roi: term?.performance?.actualROI || 0,
    utilization: term?.performance?.utilizationRate || 0,
    value: term?.financialImpact?.estimatedAnnualValue || 0
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );



  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <ApprovedIcon sx={{ color: 'success.main' }} />;
      case 'pending_approval': return <PendingIcon sx={{ color: 'warning.main' }} />;
      case 'rejected': return <RejectedIcon sx={{ color: 'error.main' }} />;
      case 'expired': return <ExpiringIcon sx={{ color: 'error.main' }} />;
      default: return <PendingIcon sx={{ color: 'grey.500' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending_approval': return 'warning';
      case 'rejected': return 'error';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading trading terms reports...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TradingTermsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            Trading Terms Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive trading terms analysis, performance tracking, and compliance monitoring
          </Typography>
        </Box>
        <Box>
          <Button
            startIcon={<FilterIcon />}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Filter
          </Button>
          <Button
            startIcon={<DateRangeIcon />}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Date Range
          </Button>
          <IconButton onClick={handleMenuClick}>
            <MoreIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>
              <DownloadIcon sx={{ mr: 1 }} />
              Export PDF
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <DownloadIcon sx={{ mr: 1 }} />
              Export Excel
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Estimated Value
              </Typography>
              <Typography variant="h4" color="primary">
                {formatCurrency(totalEstimatedValue)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +15.2% vs last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Cost to Company
              </Typography>
              <Typography variant="h4" color="warning.main">
                {formatCurrency(totalCost)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'warning.main', mr: 0.5 }} />
                <Typography variant="body2" color="warning.main">
                  +5.8% vs last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average ROI
              </Typography>
              <Typography variant="h4" color="success.main">
                {avgROI.toFixed(1)}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +2.1% vs last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Utilization
              </Typography>
              <Typography variant="h4" color="info.main">
                {avgUtilization.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={avgUtilization}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Dashboard" />
          <Tab label="Performance Analysis" />
          <Tab label="Compliance Report" />
        </Tabs>
      </Paper>

      {/* Dashboard Tab */}
      <TabPanel value={selectedTab} index={0}>
        <Grid container spacing={3}>
          {/* Performance Overview Chart */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Trading Terms Performance Overview
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="estimatedValue" fill="#7C3AED" name="Estimated Value" />
                  <Bar dataKey="actualRevenue" fill="#4caf50" name="Actual Revenue" />
                  <Bar dataKey="cost" fill="#ff9800" name="Cost" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Status Distribution */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Term Types Distribution */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Term Types Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={termTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {termTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Top Performing Terms */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Performing Terms
              </Typography>
              <List>
                {tradingTerms
                  .sort((a, b) => (b.performance?.actualROI || 0) - (a.performance?.actualROI || 0))
                  .slice(0, 5)
                  .map((term, index) => (
                    <ListItem key={term._id || index}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          {index + 1}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={term.name}
                        secondary={`ROI: ${(term.performance?.actualROI || 0).toFixed(1)}% | Value: ${formatCurrency(term.financialImpact?.estimatedAnnualValue || 0)}`}
                      />
                      <Chip
                        label={`${(term.performance?.actualROI || 0).toFixed(1)}%`}
                        color="success"
                        size="small"
                      />
                    </ListItem>
                  ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Performance Analysis Tab */}
      <TabPanel value={selectedTab} index={1}>
        <Grid container spacing={3}>
          {/* ROI vs Utilization Scatter */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                ROI vs Utilization Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={roiVsUtilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="utilization" name="Utilization %" />
                  <YAxis dataKey="roi" name="ROI %" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [
                      name === 'roi' ? `${value.toFixed(1)}%` : 
                      name === 'utilization' ? `${value.toFixed(1)}%` : 
                      formatCurrency(value), 
                      name === 'roi' ? 'ROI' : 
                      name === 'utilization' ? 'Utilization' : 'Value'
                    ]}
                  />
                  <Scatter dataKey="roi" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Performance Trends */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Performance Trends
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="roi" stroke="#8884d8" name="ROI %" />
                  <Line type="monotone" dataKey="utilization" stroke="#82ca9d" name="Utilization %" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Detailed Performance Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Detailed Performance Analysis
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Term Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Estimated Value</TableCell>
                      <TableCell align="right">Actual Revenue</TableCell>
                      <TableCell align="right">Cost</TableCell>
                      <TableCell align="right">ROI</TableCell>
                      <TableCell align="right">Utilization</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {safeTerms.map((term, index) => (
                      <TableRow key={term._id || index}>
                        <TableCell>{term.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={formatLabel(term.termType)} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(term.financialImpact?.estimatedAnnualValue)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(term.performance?.actualRevenue)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(term.financialImpact?.costToCompany)}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {(term.performance?.actualROI || 0).toFixed(1)}%
                            {(term.performance?.actualROI || 0) > 15 ? 
                              <TrendingUpIcon sx={{ color: 'success.main', ml: 0.5 }} /> :
                              <TrendingDownIcon sx={{ color: 'warning.main', ml: 0.5 }} />
                            }
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {(term.performance?.utilizationRate || 0).toFixed(1)}%
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={getStatusIcon(term.approvalWorkflow?.status)}
                            label={formatLabel(term.approvalWorkflow?.status) || 'Draft'}
                            color={getStatusColor(term.approvalWorkflow?.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Compliance Report Tab */}
      <TabPanel value={selectedTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Compliance Status Overview
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Approved Terms: {statusCounts.approved || 0} / {safeTerms.length}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={((statusCounts.approved || 0) / safeTerms.length) * 100}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <List>
                {Object.entries(statusCounts).map(([status, count]) => (
                  <ListItem key={status}>
                    <ListItemIcon>
                      {getStatusIcon(status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={formatLabel(status)}
                      secondary={`${count} terms (${((count / safeTerms.length) * 100).toFixed(1)}%)`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Expiring Terms Alert
              </Typography>
              <List>
                {safeTerms
                  .filter(term => {
                    const daysUntilExpiry = term?.daysUntilExpiry || 0;
                    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                  })
                  .map((term, index) => (
                    <ListItem key={term._id || index}>
                      <ListItemIcon>
                        <ExpiringIcon sx={{ color: 'warning.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={term.name}
                        secondary={`Expires in ${term.daysUntilExpiry || 0} days`}
                      />
                      <Chip
                        label="Action Required"
                        color="warning"
                        size="small"
                      />
                    </ListItem>
                  ))}
                {safeTerms.filter(term => {
                  const daysUntilExpiry = term?.daysUntilExpiry || 0;
                  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                }).length === 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <ApprovedIcon sx={{ color: 'success.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="No terms expiring soon"
                      secondary="All terms are compliant"
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default TradingTermsReports;
