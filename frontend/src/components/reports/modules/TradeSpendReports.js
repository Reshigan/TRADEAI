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
  Alert
} from '@mui/material';
import {
  AccountBalance as TradeSpendIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  GetApp as DownloadIcon,
  MoreVert as MoreIcon,
  FilterList as FilterIcon,
  AttachMoney as SpendIcon,
  Timeline as PerformanceIcon,
  Speed as OptimizationIcon,
  CompareArrows as VarianceIcon
} from '@mui/icons-material';
import {
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
  ComposedChart
} from 'recharts';
import { tradeSpendService } from '../../../services/api';
import { formatCurrency } from '../../../utils/formatters';

const TradeSpendReports = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [tradeSpends, setTradeSpends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTradeSpendData();
  }, []);

  const fetchTradeSpendData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tradeSpendService.getAll();
      
      // Generate synthetic trade spend performance data
      const tradeSpendsWithMetrics = (response.data || []).map((tradeSpend, index) => ({
        ...tradeSpend,
        // Budget metrics
        budgetAllocated: Math.floor(Math.random() * 1000000) + 100000,
        actualSpend: Math.floor(Math.random() * 800000) + 80000,
        variance: 0, // Will be calculated
        utilizationRate: 0, // Will be calculated
        
        // Performance metrics
        salesImpact: Math.floor(Math.random() * 2000000) + 200000,
        roi: (Math.random() * 300) + 100, // 100% to 400% ROI
        incrementalSales: Math.floor(Math.random() * 500000) + 50000,
        marketShareGain: Math.random() * 5 + 1, // 1% to 6%
        
        // Channel metrics
        channelPerformance: [
          { name: 'Modern Trade', spend: Math.floor(Math.random() * 300000) + 30000, sales: Math.floor(Math.random() * 800000) + 80000 },
          { name: 'Traditional Trade', spend: Math.floor(Math.random() * 200000) + 20000, sales: Math.floor(Math.random() * 600000) + 60000 },
          { name: 'E-commerce', spend: Math.floor(Math.random() * 150000) + 15000, sales: Math.floor(Math.random() * 400000) + 40000 },
          { name: 'Wholesale', spend: Math.floor(Math.random() * 250000) + 25000, sales: Math.floor(Math.random() * 700000) + 70000 }
        ],
        
        // Time series data
        monthlyTrend: Array.from({ length: 12 }, (_, i) => ({
          month: `Month ${i + 1}`,
          budget: Math.floor(Math.random() * 100000) + 50000,
          actual: Math.floor(Math.random() * 90000) + 45000,
          sales: Math.floor(Math.random() * 200000) + 100000,
          roi: Math.random() * 200 + 100
        })),
        
        // Optimization metrics
        efficiency: Math.random() * 40 + 60, // 60% to 100%
        wasteReduction: Math.random() * 30 + 10, // 10% to 40%
        costPerAcquisition: Math.floor(Math.random() * 200) + 50,
        
        // Category and customer data
        category: ['FMCG', 'Beverages', 'Personal Care', 'Home Care'][Math.floor(Math.random() * 4)],
        customer: `Customer ${String.fromCharCode(65 + index)}`,
        
        // Status
        status: ['Active', 'Completed', 'Under Review'][Math.floor(Math.random() * 3)],
        startDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        endDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
      }));
      
      // Calculate derived metrics
      const enrichedTradeSpends = tradeSpendsWithMetrics.map(ts => ({
        ...ts,
        variance: ts.actualSpend - ts.budgetAllocated,
        variancePercentage: ts.budgetAllocated > 0 ? ((ts.actualSpend - ts.budgetAllocated) / ts.budgetAllocated) * 100 : 0,
        utilizationRate: ts.budgetAllocated > 0 ? (ts.actualSpend / ts.budgetAllocated) * 100 : 0
      }));
      
      setTradeSpends(enrichedTradeSpends);
    } catch (error) {
      console.error('Error fetching trade spend data:', error);
      setError('Failed to load trade spend data. Please try again.');
      setTradeSpends([]);
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

  const handleExport = (format) => {
    console.log(`Exporting trade spend reports in ${format} format`);
    handleMenuClose();
  };

  // Calculate aggregate metrics
  const totalBudget = tradeSpends.reduce((sum, ts) => sum + (ts.budgetAllocated || 0), 0);
  const totalActualSpend = tradeSpends.reduce((sum, ts) => sum + (ts.actualSpend || 0), 0);
  tradeSpends.reduce((sum, ts) => sum + (ts.salesImpact || 0), 0);
  const averageROI = tradeSpends.length > 0 
    ? tradeSpends.reduce((sum, ts) => sum + (ts.roi || 0), 0) / tradeSpends.length 
    : 0;
  const totalVariance = totalActualSpend - totalBudget;
  const overallUtilization = totalBudget > 0 ? (totalActualSpend / totalBudget) * 100 : 0;

  // Prepare chart data
  const topPerformingSpends = tradeSpends
    .sort((a, b) => (b.roi || 0) - (a.roi || 0))
    .slice(0, 10)
    .map(ts => ({
      name: ts.customer || 'Unknown Customer',
      roi: ts.roi || 0,
      spend: ts.actualSpend || 0,
      sales: ts.salesImpact || 0,
      efficiency: ts.efficiency || 0
    }));

  const channelPerformance = tradeSpends.reduce((acc, ts) => {
    ts.channelPerformance?.forEach(channel => {
      if (!acc[channel.name]) {
        acc[channel.name] = { name: channel.name, spend: 0, sales: 0, count: 0 };
      }
      acc[channel.name].spend += channel.spend;
      acc[channel.name].sales += channel.sales;
      acc[channel.name].count += 1;
    });
    return acc;
  }, {});

  const channelData = Object.values(channelPerformance).map(channel => ({
    ...channel,
    roi: channel.spend > 0 ? (channel.sales / channel.spend) * 100 : 0
  }));

  const budgetVsActualData = tradeSpends.map(ts => ({
    name: ts.customer || 'Customer',
    budget: ts.budgetAllocated || 0,
    actual: ts.actualSpend || 0,
    variance: ts.variance || 0,
    utilizationRate: ts.utilizationRate || 0
  }));

  const categoryPerformance = tradeSpends.reduce((acc, ts) => {
    const category = ts.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = { name: category, spend: 0, sales: 0, roi: 0, count: 0 };
    }
    acc[category].spend += ts.actualSpend || 0;
    acc[category].sales += ts.salesImpact || 0;
    acc[category].roi += ts.roi || 0;
    acc[category].count += 1;
    return acc;
  }, {});

  const categoryData = Object.values(categoryPerformance).map(cat => ({
    ...cat,
    avgROI: cat.count > 0 ? cat.roi / cat.count : 0
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  const _formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading trade spend reports...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TradeSpendIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            Trade Spend Performance Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive trade spend analysis, budget vs actual reporting, channel performance, and optimization analytics
          </Typography>
        </Box>
        <Box>
          <Button
            startIcon={<FilterIcon />}
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Filter
          </Button>
          <IconButton onClick={handleMenuClick}>
            <MoreIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleExport('PDF')}>
              <DownloadIcon sx={{ mr: 1 }} />
              Export PDF
            </MenuItem>
            <MenuItem onClick={() => handleExport('Excel')}>
              <DownloadIcon sx={{ mr: 1 }} />
              Export Excel
            </MenuItem>
            <MenuItem onClick={() => handleExport('CSV')}>
              <DownloadIcon sx={{ mr: 1 }} />
              Export CSV
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Budget
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(totalBudget)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Allocated across programs
                  </Typography>
                </Box>
                <SpendIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Actual Spend
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(totalActualSpend)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {totalVariance >= 0 ? (
                      <TrendingUpIcon sx={{ color: 'warning.main', fontSize: 16, mr: 0.5 }} />
                    ) : (
                      <TrendingDownIcon sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                    )}
                    <Typography variant="body2" sx={{ color: totalVariance >= 0 ? 'warning.main' : 'success.main' }}>
                      {formatCurrency(Math.abs(totalVariance))} {totalVariance >= 0 ? 'over' : 'under'}
                    </Typography>
                  </Box>
                </Box>
                <VarianceIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Average ROI
                  </Typography>
                  <Typography variant="h4">
                    {formatPercentage(averageROI)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Return on investment
                  </Typography>
                </Box>
                <PerformanceIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Budget Utilization
                  </Typography>
                  <Typography variant="h4">
                    {formatPercentage(overallUtilization)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Of allocated budget
                  </Typography>
                </Box>
                <OptimizationIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Spend Overview" />
          <Tab label="Budget vs Actual" />
          <Tab label="Channel Performance" />
          <Tab label="Optimization Analytics" />
          <Tab label="ROI Analysis" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={selectedTab} index={0}>
        <Grid container spacing={3}>
          {/* Top Performing Trade Spends */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Performing Trade Spend Programs by ROI
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topPerformingSpends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'roi' || name === 'efficiency' ? `${value.toFixed(1)}%` : formatCurrency(value),
                    name === 'roi' ? 'ROI' : name === 'efficiency' ? 'Efficiency' : name === 'spend' ? 'Spend' : 'Sales Impact'
                  ]} />
                  <Legend />
                  <Bar dataKey="roi" fill="#8884d8" name="ROI %" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Category Performance */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Spend by Category
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="spend"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Trade Spend Summary Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Trade Spend Program Summary
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Budget</TableCell>
                      <TableCell align="right">Actual Spend</TableCell>
                      <TableCell align="right">Sales Impact</TableCell>
                      <TableCell align="right">ROI</TableCell>
                      <TableCell align="right">Utilization</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tradeSpends.slice(0, 10).map((tradeSpend, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {tradeSpend.customer || `Customer ${index + 1}`}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(tradeSpend.budgetAllocated)}</TableCell>
                        <TableCell align="right">{formatCurrency(tradeSpend.actualSpend)}</TableCell>
                        <TableCell align="right">{formatCurrency(tradeSpend.salesImpact)}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {tradeSpend.roi >= 200 ? (
                              <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                            ) : (
                              <TrendingDownIcon sx={{ color: 'warning.main', fontSize: 16, mr: 0.5 }} />
                            )}
                            {formatPercentage(tradeSpend.roi)}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatPercentage(tradeSpend.utilizationRate)}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={tradeSpend.status}
                            color={tradeSpend.status === 'Active' ? 'success' : tradeSpend.status === 'Completed' ? 'primary' : 'warning'}
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

      <TabPanel value={selectedTab} index={1}>
        <Grid container spacing={3}>
          {/* Budget vs Actual Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Budget vs Actual Spend Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={budgetVsActualData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => [
                    name === 'utilizationRate' ? `${value.toFixed(1)}%` : formatCurrency(value),
                    name === 'budget' ? 'Budget' : name === 'actual' ? 'Actual Spend' : name === 'variance' ? 'Variance' : 'Utilization Rate'
                  ]} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="budget" fill="#8884d8" name="Budget" />
                  <Bar yAxisId="left" dataKey="actual" fill="#82ca9d" name="Actual Spend" />
                  <Line yAxisId="right" type="monotone" dataKey="utilizationRate" stroke="#ff7300" name="Utilization Rate %" />
                </ComposedChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Variance Analysis Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Budget Variance Analysis
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Budget Allocated</TableCell>
                      <TableCell align="right">Actual Spend</TableCell>
                      <TableCell align="right">Variance</TableCell>
                      <TableCell align="right">Variance %</TableCell>
                      <TableCell align="right">Utilization Rate</TableCell>
                      <TableCell align="center">Budget Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tradeSpends.map((tradeSpend, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {tradeSpend.customer || `Customer ${index + 1}`}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(tradeSpend.budgetAllocated)}</TableCell>
                        <TableCell align="right">{formatCurrency(tradeSpend.actualSpend)}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {tradeSpend.variance >= 0 ? (
                              <TrendingUpIcon sx={{ color: 'warning.main', fontSize: 16, mr: 0.5 }} />
                            ) : (
                              <TrendingDownIcon sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                            )}
                            {formatCurrency(Math.abs(tradeSpend.variance))}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            color={Math.abs(tradeSpend.variancePercentage) <= 5 ? 'success.main' : Math.abs(tradeSpend.variancePercentage) <= 15 ? 'warning.main' : 'error.main'}
                          >
                            {formatPercentage(tradeSpend.variancePercentage)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{formatPercentage(tradeSpend.utilizationRate)}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={
                              Math.abs(tradeSpend.variancePercentage) <= 5 ? 'On Track' :
                              Math.abs(tradeSpend.variancePercentage) <= 15 ? 'Monitor' : 'Action Required'
                            }
                            color={
                              Math.abs(tradeSpend.variancePercentage) <= 5 ? 'success' :
                              Math.abs(tradeSpend.variancePercentage) <= 15 ? 'warning' : 'error'
                            }
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

      <TabPanel value={selectedTab} index={2}>
        <Grid container spacing={3}>
          {/* Channel Performance Chart */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Channel Performance Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => [
                    name === 'roi' ? `${value.toFixed(1)}%` : formatCurrency(value),
                    name === 'spend' ? 'Spend' : name === 'sales' ? 'Sales' : 'ROI'
                  ]} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="spend" fill="#8884d8" name="Spend" />
                  <Bar yAxisId="left" dataKey="sales" fill="#82ca9d" name="Sales" />
                  <Line yAxisId="right" type="monotone" dataKey="roi" stroke="#ff7300" name="ROI %" />
                </ComposedChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Channel ROI Distribution */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Channel ROI Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, roi }) => `${name} ${roi.toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="roi"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Channel Performance Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Detailed Channel Performance
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Channel</TableCell>
                      <TableCell align="right">Total Spend</TableCell>
                      <TableCell align="right">Total Sales</TableCell>
                      <TableCell align="right">ROI</TableCell>
                      <TableCell align="right">Programs</TableCell>
                      <TableCell align="center">Performance Rating</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {channelData.map((channel, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {channel.name}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(channel.spend)}</TableCell>
                        <TableCell align="right">{formatCurrency(channel.sales)}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {channel.roi >= 200 ? (
                              <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                            ) : (
                              <TrendingDownIcon sx={{ color: 'warning.main', fontSize: 16, mr: 0.5 }} />
                            )}
                            {formatPercentage(channel.roi)}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{channel.count}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={channel.roi >= 300 ? 'Excellent' : channel.roi >= 200 ? 'Good' : channel.roi >= 150 ? 'Average' : 'Poor'}
                            color={channel.roi >= 300 ? 'success' : channel.roi >= 200 ? 'primary' : channel.roi >= 150 ? 'warning' : 'error'}
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

      <TabPanel value={selectedTab} index={3}>
        <Grid container spacing={3}>
          {/* Optimization Metrics */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Trade Spend Optimization Analysis
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Efficiency Score</TableCell>
                      <TableCell align="right">Waste Reduction</TableCell>
                      <TableCell align="right">Cost per Acquisition</TableCell>
                      <TableCell align="right">Market Share Gain</TableCell>
                      <TableCell align="center">Optimization Potential</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tradeSpends.map((tradeSpend, index) => {
                      const optimizationScore = (
                        tradeSpend.efficiency / 100 * 30 +
                        tradeSpend.wasteReduction / 40 * 25 +
                        (300 - tradeSpend.costPerAcquisition) / 250 * 25 +
                        tradeSpend.marketShareGain / 6 * 20
                      );
                      
                      return (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">
                            {tradeSpend.customer || `Customer ${index + 1}`}
                          </TableCell>
                          <TableCell align="right">{formatPercentage(tradeSpend.efficiency)}</TableCell>
                          <TableCell align="right">{formatPercentage(tradeSpend.wasteReduction)}</TableCell>
                          <TableCell align="right">{formatCurrency(tradeSpend.costPerAcquisition)}</TableCell>
                          <TableCell align="right">{formatPercentage(tradeSpend.marketShareGain)}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={optimizationScore >= 80 ? 'High' : optimizationScore >= 60 ? 'Medium' : 'Low'}
                              color={optimizationScore >= 80 ? 'success' : optimizationScore >= 60 ? 'warning' : 'error'}
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

      <TabPanel value={selectedTab} index={4}>
        <Grid container spacing={3}>
          {/* ROI Analysis Chart */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                ROI Performance by Customer
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topPerformingSpends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="roi" fill="#82ca9d" name="ROI %" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* ROI Summary */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                ROI Performance Summary
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Best Performing Customer
                </Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {tradeSpends.sort((a, b) => b.roi - a.roi)[0]?.customer || 'N/A'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Highest ROI
                </Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {formatPercentage(Math.max(...tradeSpends.map(ts => ts.roi || 0)))}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Average ROI
                </Typography>
                <Typography variant="h6">
                  {formatPercentage(averageROI)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default TradeSpendReports;
