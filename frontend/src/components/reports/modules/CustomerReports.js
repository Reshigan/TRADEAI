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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  People as CustomersIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  GetApp as DownloadIcon,
  MoreVert as MoreIcon,
  DateRange as DateRangeIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  ShoppingCart as OrdersIcon,
  AttachMoney as RevenueIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { customerService } from '../../../services/api';
import { formatCurrency } from '../../../utils/formatters';

const CustomerReports = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const response = await customerService.getAll();
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customer data:', error);
      setCustomers([]);
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

  // Calculate customer metrics with mock performance data
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const totalRevenue = customers.reduce((sum, customer) => {
    // Mock revenue calculation based on customer tier
    const tierMultiplier = {
      'platinum': 500000,
      'gold': 300000,
      'silver': 150000,
      'bronze': 75000
    };
    return sum + (tierMultiplier[customer.tier] || 100000);
  }, 0);
  const avgOrderValue = totalRevenue / Math.max(totalCustomers * 12, 1); // Assuming 12 orders per year

  // Customer segmentation
  const tierDistribution = customers.reduce((acc, customer) => {
    const tier = customer.tier || 'bronze';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});

  const typeDistribution = customers.reduce((acc, customer) => {
    const type = customer.type || 'independent';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Prepare chart data with enhanced metrics
  const customerPerformanceData = customers.map((customer, index) => {
    const tierMultiplier = {
      'platinum': 500000,
      'gold': 300000,
      'silver': 150000,
      'bronze': 75000
    };
    const baseRevenue = tierMultiplier[customer.tier] || 100000;
    const orders = Math.floor(Math.random() * 50) + 10;
    const satisfaction = Math.floor(Math.random() * 30) + 70;
    
    return {
      name: customer.name,
      revenue: baseRevenue + (Math.random() * 100000),
      orders: orders,
      avgOrderValue: baseRevenue / orders,
      satisfaction: satisfaction,
      tier: customer.tier,
      type: customer.type,
      growth: (Math.random() * 40) - 10 // -10% to +30% growth
    };
  });

  const tierData = Object.entries(tierDistribution).map(([tier, count]) => ({
    name: tier.toUpperCase(),
    value: count,
    percentage: ((count / totalCustomers) * 100).toFixed(1)
  }));

  const typeData = Object.entries(typeDistribution).map(([type, count]) => ({
    name: type.replace('_', ' ').toUpperCase(),
    value: count,
    percentage: ((count / totalCustomers) * 100).toFixed(1)
  }));

  // Top customers by revenue
  const topCustomers = customerPerformanceData
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Customer satisfaction radar data
  const satisfactionData = [
    { subject: 'Product Quality', A: 85, fullMark: 100 },
    { subject: 'Service', A: 78, fullMark: 100 },
    { subject: 'Delivery', A: 92, fullMark: 100 },
    { subject: 'Pricing', A: 73, fullMark: 100 },
    { subject: 'Support', A: 88, fullMark: 100 },
    { subject: 'Innovation', A: 81, fullMark: 100 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'platinum': return '#E5E4E2';
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading customer reports...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CustomersIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            Customer Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Customer analytics, performance metrics, and relationship insights
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
                Total Customers
              </Typography>
              <Typography variant="h4" color="primary">
                {totalCustomers}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +8.5% vs last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Customers
              </Typography>
              <Typography variant="h4" color="success.main">
                {activeCustomers}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {((activeCustomers / totalCustomers) * 100).toFixed(1)}% active rate
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" color="warning.main">
                {formatCurrency(totalRevenue)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +12.3% vs last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Order Value
              </Typography>
              <Typography variant="h4" color="info.main">
                {formatCurrency(avgOrderValue)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +5.7% vs last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Analytics Dashboard" />
          <Tab label="Performance Report" />
          <Tab label="Relationship Analysis" />
        </Tabs>
      </Paper>

      {/* Analytics Dashboard Tab */}
      <TabPanel value={selectedTab} index={0}>
        <Grid container spacing={3}>
          {/* Customer Revenue Chart */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Customer Revenue Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topCustomers.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#1976d2" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Customer Tier Distribution */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Customer Tier Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tierData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Customer Satisfaction Radar */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Customer Satisfaction Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={satisfactionData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Satisfaction"
                    dataKey="A"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Top Customers List */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Revenue Customers
              </Typography>
              <List>
                {topCustomers.slice(0, 6).map((customer, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getTierColor(customer.tier) }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={customer.name}
                      secondary={`Revenue: ${formatCurrency(customer.revenue)} | Orders: ${customer.orders}`}
                    />
                    <Chip
                      label={customer.tier?.toUpperCase()}
                      size="small"
                      sx={{ bgcolor: getTierColor(customer.tier), color: 'white' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Performance Report Tab */}
      <TabPanel value={selectedTab} index={1}>
        <Grid container spacing={3}>
          {/* Customer Growth Trends */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Customer Growth Trends
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={customerPerformanceData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
                  <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Detailed Performance Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Customer Performance Details
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer Name</TableCell>
                      <TableCell>Tier</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Orders</TableCell>
                      <TableCell align="right">Avg Order Value</TableCell>
                      <TableCell align="right">Growth</TableCell>
                      <TableCell align="center">Satisfaction</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customerPerformanceData.slice(0, 10).map((customer, index) => (
                      <TableRow key={index}>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={customer.tier?.toUpperCase()}
                            size="small"
                            sx={{ bgcolor: getTierColor(customer.tier), color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={customer.type?.replace('_', ' ').toUpperCase()}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(customer.revenue)}
                        </TableCell>
                        <TableCell align="right">
                          {customer.orders}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(customer.avgOrderValue)}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {customer.growth.toFixed(1)}%
                            {customer.growth > 0 ? 
                              <TrendingUpIcon sx={{ color: 'success.main', ml: 0.5 }} /> :
                              <TrendingDownIcon sx={{ color: 'error.main', ml: 0.5 }} />
                            }
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {customer.satisfaction}%
                            <StarIcon sx={{ color: 'gold', ml: 0.5 }} />
                          </Box>
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

      {/* Relationship Analysis Tab */}
      <TabPanel value={selectedTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Customer Type Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Relationship Health Score
              </Typography>
              <List>
                {customers.slice(0, 8).map((customer, index) => {
                  const healthScore = Math.floor(Math.random() * 30) + 70;
                  const getHealthColor = (score) => {
                    if (score >= 85) return 'success';
                    if (score >= 70) return 'warning';
                    return 'error';
                  };
                  
                  return (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getTierColor(customer.tier) }}>
                          {customer.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={customer.name}
                        secondary={`${customer.tier?.toUpperCase()} • ${customer.type?.replace('_', ' ').toUpperCase()}`}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {healthScore}%
                        </Typography>
                        <Chip
                          label={healthScore >= 85 ? 'Excellent' : healthScore >= 70 ? 'Good' : 'Needs Attention'}
                          color={getHealthColor(healthScore)}
                          size="small"
                        />
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default CustomerReports;