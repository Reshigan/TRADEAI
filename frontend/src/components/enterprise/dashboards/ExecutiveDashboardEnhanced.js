import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Refresh,
  Download,
  Psychology,
  TrendingUp,
  AttachMoney,
  ShowChart,
  Inventory,
  Group,
  ShoppingCart,
  Assessment,
  Warning
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import enterpriseApi from '../../../services/enterpriseApi';
import KPICard from './KPICard';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ExecutiveDashboardEnhanced() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('month');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await enterpriseApi.dashboards.executive({
        timeRange,
        includeForecasts: true
      });
      
      setData(response.data);
    } catch (err) {
      console.error('Failed to load executive dashboard:', err);
      setError(err.error?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting dashboard data...');
  };

  if (loading && !data) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Executive Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            <DashboardIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 32 }} />
            Executive Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time business performance overview and key metrics
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
              size="small"
            >
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="quarter">Last Quarter</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
            </Select>
          </FormControl>
          
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing}
            color="primary"
          >
            <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Psychology />}
            href="/simulations"
          >
            Run Simulation
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Key Performance Indicators */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Revenue"
            value={data?.kpis?.revenue?.current || 45678900}
            change={data?.kpis?.revenue?.change || 12.5}
            target={data?.kpis?.revenue?.target || 50000000}
            icon={AttachMoney}
            color="success"
            format="currency"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Gross Margin"
            value={data?.kpis?.margin?.current || 15234567}
            change={data?.kpis?.margin?.change || -2.3}
            target={data?.kpis?.margin?.target || 18000000}
            icon={TrendingUp}
            color="info"
            format="currency"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Trade Spend"
            value={data?.kpis?.tradeSpend?.current || 8765432}
            change={data?.kpis?.tradeSpend?.change || 5.7}
            target={data?.kpis?.tradeSpend?.target || 10000000}
            icon={ShowChart}
            color="warning"
            format="currency"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Sales Volume"
            value={data?.kpis?.volume?.current || 1234567}
            change={data?.kpis?.volume?.change || 8.2}
            target={data?.kpis?.volume?.target || 1500000}
            icon={Inventory}
            color="primary"
            format="number"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Alerts & Notifications */}
      {data?.alerts && data.alerts.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.light' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Warning sx={{ mr: 1, color: 'warning.dark' }} />
            <Typography variant="h6" sx={{ color: 'warning.dark' }}>
              Attention Required ({data.alerts.length})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {data.alerts.slice(0, 3).map((alert, index) => (
              <Chip
                key={index}
                label={alert.message}
                color={alert.severity}
                size="small"
                icon={<Warning />}
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Tabs for Different Views */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="Overview" />
            <Tab label="Sales Performance" />
            <Tab label="Top Products" />
            <Tab label="Top Customers" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Overview Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              {/* Revenue Trend */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Revenue & Margin Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={data?.trends?.revenue || [
                        { month: 'Jan', revenue: 4200000, margin: 1400000 },
                        { month: 'Feb', revenue: 4500000, margin: 1500000 },
                        { month: 'Mar', revenue: 4800000, margin: 1600000 },
                        { month: 'Apr', revenue: 5100000, margin: 1700000 },
                        { month: 'May', revenue: 4900000, margin: 1650000 },
                        { month: 'Jun', revenue: 5300000, margin: 1800000 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `R ${value.toLocaleString()}`} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#0088FE" 
                        fill="#0088FE" 
                        fillOpacity={0.6} 
                        name="Revenue"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="margin" 
                        stroke="#00C49F" 
                        fill="#00C49F" 
                        fillOpacity={0.6} 
                        name="Margin"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Category Split */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Revenue by Category
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data?.categories || [
                          { name: 'Snacks', value: 15000000 },
                          { name: 'Beverages', value: 12000000 },
                          { name: 'Confectionery', value: 10000000 },
                          { name: 'Biscuits', value: 8000000 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(data?.categories || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `R ${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Sales Performance Tab */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Monthly Sales Performance
                  </Typography>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={data?.salesPerformance || [
                        { month: 'Jan', target: 5000000, actual: 4200000 },
                        { month: 'Feb', target: 5000000, actual: 4500000 },
                        { month: 'Mar', target: 5000000, actual: 4800000 },
                        { month: 'Apr', target: 5000000, actual: 5100000 },
                        { month: 'May', target: 5000000, actual: 4900000 },
                        { month: 'Jun', target: 5000000, actual: 5300000 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `R ${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="target" fill="#82ca9d" name="Target" />
                      <Bar dataKey="actual" fill="#0088FE" name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Top Products Tab */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={2}>
              {(data?.topProducts || [
                { name: 'Oreo Cookies', revenue: 3500000, volume: 450000, margin: 25.5 },
                { name: 'Cadbury Dairy Milk', revenue: 3200000, volume: 420000, margin: 28.2 },
                { name: 'Halls Cough Drops', revenue: 2800000, volume: 380000, margin: 32.1 },
                { name: 'Trident Gum', revenue: 2500000, volume: 350000, margin: 30.5 },
                { name: 'Ritz Crackers', revenue: 2200000, volume: 320000, margin: 24.8 }
              ]).map((product, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {index + 1}. {product.name}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Revenue</Typography>
                          <Typography variant="h6" color="success.main">
                            R {(product.revenue / 1000000).toFixed(1)}M
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Volume</Typography>
                          <Typography variant="h6">
                            {(product.volume / 1000).toFixed(0)}K
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Margin</Typography>
                          <Typography variant="h6" color="info.main">
                            {product.margin.toFixed(1)}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Top Customers Tab */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={2}>
              {(data?.topCustomers || [
                { name: 'Shoprite', revenue: 8500000, volume: 1200000, orders: 245 },
                { name: 'Pick n Pay', revenue: 7800000, volume: 1100000, orders: 232 },
                { name: 'Checkers', revenue: 6900000, volume: 980000, orders: 218 },
                { name: 'Spar', revenue: 5600000, volume: 820000, orders: 195 },
                { name: 'Woolworths', revenue: 4800000, volume: 650000, orders: 178 }
              ]).map((customer, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {index + 1}. {customer.name}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Revenue</Typography>
                          <Typography variant="h6" color="success.main">
                            R {(customer.revenue / 1000000).toFixed(1)}M
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Volume</Typography>
                          <Typography variant="h6">
                            {(customer.volume / 1000).toFixed(0)}K
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Orders</Typography>
                          <Typography variant="h6" color="info.main">
                            {customer.orders}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}
