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
  MenuItem
} from '@mui/material';
import {
  AccountBalance as BudgetIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  GetApp as DownloadIcon,
  MoreVert as MoreIcon,
  DateRange as DateRangeIcon,
  FilterList as FilterIcon
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
  ResponsiveContainer
} from 'recharts';
import { budgetService } from '../../../services/api';
import { formatCurrency } from '../../../utils/formatters';

const BudgetReports = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const response = await budgetService.getAll();
      setBudgets(response.data || []);
    } catch (error) {
      console.error('Error fetching budget data:', error);
      setBudgets([]);
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

  // Calculate budget metrics
  const totalBudget = budgets.reduce((sum, budget) => sum + (budget.allocated || 0), 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);
  const totalRemaining = budgets.reduce((sum, budget) => sum + (budget.remaining || 0), 0);
  const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Prepare chart data
  const budgetTrendData = budgets.map((budget, index) => ({
    name: budget.scope?.customers?.[0]?.name || `Budget ${index + 1}`,
    allocated: budget.allocated || 0,
    spent: budget.spent || 0,
    remaining: budget.remaining || 0,
    utilization: budget.allocated > 0 ? ((budget.spent || 0) / budget.allocated) * 100 : 0
  }));

  const utilizationData = budgets.map((budget, index) => ({
    name: budget.scope?.customers?.[0]?.name || `Budget ${index + 1}`,
    value: budget.allocated > 0 ? ((budget.spent || 0) / budget.allocated) * 100 : 0
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );



  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading budget reports...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BudgetIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            Marketing Budget Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive budget analysis, allocation tracking, and performance insights
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
                Total Budget Allocated
              </Typography>
              <Typography variant="h4" color="primary">
                {formatCurrency(totalBudget)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +12.5% vs last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Spent
              </Typography>
              <Typography variant="h4" color="warning.main">
                {formatCurrency(totalSpent)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'warning.main', mr: 0.5 }} />
                <Typography variant="body2" color="warning.main">
                  +8.3% vs last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Remaining Budget
              </Typography>
              <Typography variant="h4" color="success.main">
                {formatCurrency(totalRemaining)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingDownIcon sx={{ color: 'error.main', mr: 0.5 }} />
                <Typography variant="body2" color="error.main">
                  -5.2% vs last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Utilization Rate
              </Typography>
              <Typography variant="h4" color="info.main">
                {utilizationRate.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={utilizationRate}
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
          <Tab label="Budget Allocation" />
          <Tab label="Spend Tracking" />
        </Tabs>
      </Paper>

      {/* Dashboard Tab */}
      <TabPanel value={selectedTab} index={0}>
        <Grid container spacing={3}>
          {/* Budget Trend Chart */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Budget vs Spend Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="allocated" fill="#1976d2" name="Allocated" />
                  <Bar dataKey="spent" fill="#ff9800" name="Spent" />
                  <Bar dataKey="remaining" fill="#4caf50" name="Remaining" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Utilization Pie Chart */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Budget Utilization
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={utilizationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {utilizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Budget Performance Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Budget Performance Summary
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Allocated</TableCell>
                      <TableCell align="right">Spent</TableCell>
                      <TableCell align="right">Remaining</TableCell>
                      <TableCell align="right">Utilization</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {budgets.map((budget, index) => {
                      const utilization = budget.allocated > 0 ? ((budget.spent || 0) / budget.allocated) * 100 : 0;
                      const getStatusColor = (util) => {
                        if (util < 50) return 'success';
                        if (util < 80) return 'warning';
                        return 'error';
                      };
                      
                      return (
                        <TableRow key={budget._id || index}>
                          <TableCell>
                            {budget.scope?.customers?.[0]?.name || `Budget ${index + 1}`}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(budget.allocated)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(budget.spent)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(budget.remaining)}
                          </TableCell>
                          <TableCell align="right">
                            {utilization.toFixed(1)}%
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={utilization < 50 ? 'On Track' : utilization < 80 ? 'Monitor' : 'Over Budget'}
                              color={getStatusColor(utilization)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Budget Allocation Tab */}
      <TabPanel value={selectedTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Budget Allocation Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={budgetTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="allocated"
                    stackId="1"
                    stroke="#1976d2"
                    fill="#1976d2"
                    name="Allocated"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Spend Tracking Tab */}
      <TabPanel value={selectedTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Spend Tracking Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={budgetTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="spent"
                    stroke="#ff9800"
                    strokeWidth={3}
                    name="Spent"
                  />
                  <Line
                    type="monotone"
                    dataKey="allocated"
                    stroke="#1976d2"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Budget Limit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default BudgetReports;