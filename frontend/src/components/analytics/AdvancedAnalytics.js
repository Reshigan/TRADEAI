import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  FilterList,
  Download,
  Refresh,
  PieChart,
  BarChart,
  ShowChart,
  TableChart,
  Analytics
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  LineChart,
  Line,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';
import {format, subDays} from 'date-fns';
import api from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdvancedAnalytics = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [filters, setFilters] = useState({
    customer: 'all',
    product: 'all',
    promotion: 'all',
    region: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [, setError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState({
    roiAnalysis: [],
    liftAnalysis: [],
    customerSegments: [],
    productPerformance: [],
    promotionEffectiveness: [],
    trendAnalysis: [],
    correlationMatrix: [],
    predictiveInsights: [],
    kpis: {
      totalROI: 0,
      averageLift: 0,
      topPerformingSegment: '',
      conversionRate: 0
    }
  });

  // Chart configuration state
  const [chartConfig, setChartConfig] = useState({
    showTrendlines: true,
    showConfidenceIntervals: false,
    aggregationLevel: 'daily',
    smoothing: 0.1,
    outlierDetection: true
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, filters]);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate comprehensive mock data for advanced analytics
      const mockData = generateMockAnalyticsData();
      setAnalyticsData(mockData);

    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, filters]);

  const generateMockAnalyticsData = () => {
    const days = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
    
    // ROI Analysis over time
    const roiAnalysis = Array.from({ length: days }, (_, i) => ({
      date: format(subDays(dateRange.end, days - 1 - i), 'yyyy-MM-dd'),
      roi: 120 + Math.random() * 80 + Math.sin(i / 7) * 20,
      baseline: 100,
      target: 150,
      confidence: 0.85 + Math.random() * 0.1
    }));

    // Lift Analysis by promotion
    const liftAnalysis = [
      { promotion: 'Summer Sale', lift: 25.5, confidence: 0.92, pValue: 0.001 },
      { promotion: 'Back to School', lift: 18.2, confidence: 0.88, pValue: 0.003 },
      { promotion: 'Holiday Special', lift: 32.1, confidence: 0.95, pValue: 0.0001 },
      { promotion: 'Flash Sale', lift: 15.8, confidence: 0.82, pValue: 0.008 },
      { promotion: 'Clearance', lift: 12.3, confidence: 0.78, pValue: 0.015 }
    ];

    // Customer Segments Performance
    const customerSegments = [
      { segment: 'Premium', revenue: 850000, customers: 120, avgOrderValue: 7083, retention: 95 },
      { segment: 'Regular', revenue: 1200000, customers: 480, avgOrderValue: 2500, retention: 78 },
      { segment: 'New', revenue: 320000, customers: 280, avgOrderValue: 1143, retention: 45 },
      { segment: 'Inactive', revenue: 80000, customers: 150, avgOrderValue: 533, retention: 12 }
    ];

    // Product Performance Matrix
    const productPerformance = [
      { product: 'Product A', revenue: 450000, margin: 35, velocity: 85, roi: 180 },
      { product: 'Product B', revenue: 380000, margin: 28, velocity: 72, roi: 145 },
      { product: 'Product C', revenue: 520000, margin: 42, velocity: 91, roi: 220 },
      { product: 'Product D', revenue: 290000, margin: 25, velocity: 58, roi: 125 },
      { product: 'Product E', revenue: 410000, margin: 38, velocity: 79, roi: 165 }
    ];

    // Promotion Effectiveness
    const promotionEffectiveness = Array.from({ length: 10 }, (_, i) => ({
      week: `Week ${i + 1}`,
      withPromotion: 45000 + Math.random() * 15000,
      withoutPromotion: 32000 + Math.random() * 8000,
      lift: 15 + Math.random() * 20
    }));

    // Trend Analysis
    const trendAnalysis = Array.from({ length: days }, (_, i) => ({
      date: format(subDays(dateRange.end, days - 1 - i), 'yyyy-MM-dd'),
      actual: 35000 + Math.random() * 10000 + Math.sin(i / 7) * 5000,
      predicted: 36000 + Math.random() * 8000 + Math.sin(i / 7) * 4000,
      upperBound: 42000 + Math.random() * 5000,
      lowerBound: 28000 + Math.random() * 5000
    }));

    // Correlation Matrix
    const correlationMatrix = [
      { metric1: 'Revenue', metric2: 'Marketing Spend', correlation: 0.78 },
      { metric1: 'Revenue', metric2: 'Customer Satisfaction', correlation: 0.65 },
      { metric1: 'Revenue', metric2: 'Promotion Frequency', correlation: 0.42 },
      { metric1: 'Customer Satisfaction', metric2: 'Retention Rate', correlation: 0.89 },
      { metric1: 'Marketing Spend', metric2: 'New Customers', correlation: 0.71 },
      { metric1: 'Promotion Frequency', metric2: 'Average Order Value', correlation: -0.23 }
    ];

    // Predictive Insights
    const predictiveInsights = [
      {
        insight: 'Revenue is expected to increase by 15% next month based on current trends',
        confidence: 0.87,
        impact: 'high',
        recommendation: 'Increase inventory for top-performing products'
      },
      {
        insight: 'Customer churn risk is elevated for the Regular segment',
        confidence: 0.72,
        impact: 'medium',
        recommendation: 'Launch targeted retention campaign'
      },
      {
        insight: 'Optimal promotion frequency is 2.3 times per month',
        confidence: 0.91,
        impact: 'high',
        recommendation: 'Adjust promotion calendar accordingly'
      }
    ];

    return {
      roiAnalysis,
      liftAnalysis,
      customerSegments,
      productPerformance,
      promotionEffectiveness,
      trendAnalysis,
      correlationMatrix,
      predictiveInsights,
      kpis: {
        totalROI: 156.8,
        averageLift: 20.8,
        topPerformingSegment: 'Premium',
        conversionRate: 3.2
      }
    };
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleExport = async (format) => {
    try {
      const response = await api.post('/analytics/export', {
        format,
        dateRange,
        filters,
        data: analyticsData
      });
      
      // Handle file download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics_${format}_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getCorrelationColor = (correlation) => {
    const abs = Math.abs(correlation);
    if (abs > 0.8) return '#4CAF50';
    if (abs > 0.6) return '#FF9800';
    if (abs > 0.4) return '#FFC107';
    return '#F44336';
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            Advanced Analytics
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              startIcon={<FilterList />}
              onClick={() => setSettingsOpen(true)}
            >
              Filters
            </Button>
            <Button
              startIcon={<Download />}
              onClick={() => setExportDialogOpen(true)}
            >
              Export
            </Button>
            <Button
              startIcon={<Refresh />}
              onClick={fetchAnalyticsData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* KPI Summary */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total ROI
                </Typography>
                <Typography variant="h4">
                  {analyticsData.kpis.totalROI}%
                </Typography>
                <Chip
                  icon={<TrendingUp />}
                  label="+12.5%"
                  color="success"
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Lift
                </Typography>
                <Typography variant="h4">
                  {analyticsData.kpis.averageLift}%
                </Typography>
                <Chip
                  icon={<TrendingUp />}
                  label="+8.2%"
                  color="success"
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Top Segment
                </Typography>
                <Typography variant="h4">
                  {analyticsData.kpis.topPerformingSegment}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  95% retention
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Conversion Rate
                </Typography>
                <Typography variant="h4">
                  {analyticsData.kpis.conversionRate}%
                </Typography>
                <Chip
                  icon={<TrendingDown />}
                  label="-0.3%"
                  color="error"
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Analytics Tabs */}
        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="ROI Analysis" icon={<ShowChart />} />
            <Tab label="Lift Analysis" icon={<TrendingUp />} />
            <Tab label="Customer Segments" icon={<PieChart />} />
            <Tab label="Product Performance" icon={<BarChart />} />
            <Tab label="Trend Analysis" icon={<Analytics />} />
            <Tab label="Correlations" icon={<TableChart />} />
          </Tabs>

          {/* ROI Analysis Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      ROI Trend Analysis
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart data={analyticsData.roiAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="roi"
                          fill="#8884d8"
                          fillOpacity={0.3}
                          stroke="#8884d8"
                        />
                        <Line
                          type="monotone"
                          dataKey="baseline"
                          stroke="#ff7300"
                          strokeDasharray="5 5"
                        />
                        <Line
                          type="monotone"
                          dataKey="target"
                          stroke="#00ff00"
                          strokeDasharray="5 5"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Lift Analysis Tab */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Promotion Lift Analysis
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <RechartsBarChart data={analyticsData.liftAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="promotion" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="lift" fill="#8884d8" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Statistical Significance
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Promotion</TableCell>
                            <TableCell>P-Value</TableCell>
                            <TableCell>Confidence</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analyticsData.liftAnalysis.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row.promotion}</TableCell>
                              <TableCell>{row.pValue}</TableCell>
                              <TableCell>
                                <Chip
                                  label={`${(row.confidence * 100).toFixed(0)}%`}
                                  color={row.confidence > 0.9 ? 'success' : 'warning'}
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
              </Grid>
            </Grid>
          </TabPanel>

          {/* Customer Segments Tab */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Revenue by Segment
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={analyticsData.customerSegments}
                          dataKey="revenue"
                          nameKey="segment"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label
                        >
                          {analyticsData.customerSegments.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Segment Performance Matrix
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart data={analyticsData.customerSegments}>
                        <CartesianGrid />
                        <XAxis dataKey="avgOrderValue" name="Avg Order Value" />
                        <YAxis dataKey="retention" name="Retention %" />
                        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter dataKey="customers" fill="#8884d8" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Product Performance Tab */}
          <TabPanel value={activeTab} index={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Product Performance Matrix
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Margin %</TableCell>
                        <TableCell align="right">Velocity</TableCell>
                        <TableCell align="right">ROI %</TableCell>
                        <TableCell align="center">Performance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyticsData.productPerformance.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell>{product.product}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(product.revenue)}
                          </TableCell>
                          <TableCell align="right">{product.margin}%</TableCell>
                          <TableCell align="right">{product.velocity}</TableCell>
                          <TableCell align="right">{product.roi}%</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                product.roi > 180 ? 'Excellent' :
                                product.roi > 150 ? 'Good' :
                                product.roi > 120 ? 'Average' : 'Poor'
                              }
                              color={
                                product.roi > 180 ? 'success' :
                                product.roi > 150 ? 'primary' :
                                product.roi > 120 ? 'warning' : 'error'
                              }
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

          {/* Trend Analysis Tab */}
          <TabPanel value={activeTab} index={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Predictive Trend Analysis
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={analyticsData.trendAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="upperBound"
                          stackId="1"
                          stroke="none"
                          fill="#F5F3FF"
                          fillOpacity={0.3}
                        />
                        <Area
                          type="monotone"
                          dataKey="lowerBound"
                          stackId="1"
                          stroke="none"
                          fill="#ffffff"
                        />
                        <Line
                          type="monotone"
                          dataKey="actual"
                          stroke="#8B5CF6"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="predicted"
                          stroke="#ff9800"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Predictive Insights
                    </Typography>
                    {analyticsData.predictiveInsights.map((insight, index) => (
                      <Alert
                        key={index}
                        severity={insight.impact === 'high' ? 'warning' : 'info'}
                        sx={{ mb: 2 }}
                      >
                        <Typography variant="body1" gutterBottom>
                          {insight.insight}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Confidence: {(insight.confidence * 100).toFixed(0)}% | 
                          Recommendation: {insight.recommendation}
                        </Typography>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Correlations Tab */}
          <TabPanel value={activeTab} index={5}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Correlation Matrix
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric 1</TableCell>
                        <TableCell>Metric 2</TableCell>
                        <TableCell align="center">Correlation</TableCell>
                        <TableCell align="center">Strength</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyticsData.correlationMatrix.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.metric1}</TableCell>
                          <TableCell>{row.metric2}</TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                color: getCorrelationColor(row.correlation),
                                fontWeight: 'bold'
                              }}
                            >
                              {row.correlation.toFixed(2)}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                Math.abs(row.correlation) > 0.8 ? 'Strong' :
                                Math.abs(row.correlation) > 0.6 ? 'Moderate' :
                                Math.abs(row.correlation) > 0.4 ? 'Weak' : 'Very Weak'
                              }
                              color={
                                Math.abs(row.correlation) > 0.8 ? 'success' :
                                Math.abs(row.correlation) > 0.6 ? 'primary' :
                                Math.abs(row.correlation) > 0.4 ? 'warning' : 'error'
                              }
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
        </Paper>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
          <DialogTitle>Export Analytics Data</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Choose the format for exporting your analytics data:
            </Typography>
            <Box display="flex" gap={2} mt={2}>
              <Button
                variant="outlined"
                onClick={() => handleExport('pdf')}
                startIcon={<Download />}
              >
                PDF Report
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleExport('xlsx')}
                startIcon={<Download />}
              >
                Excel Spreadsheet
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleExport('csv')}
                startIcon={<Download />}
              >
                CSV Data
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Analytics Settings & Filters</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.start}
                  onChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="End Date"
                  value={dateRange.end}
                  onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Customer Segment</InputLabel>
                  <Select
                    value={filters.customer}
                    onChange={(e) => handleFilterChange('customer', e.target.value)}
                  >
                    <MenuItem value="all">All Customers</MenuItem>
                    <MenuItem value="premium">Premium</MenuItem>
                    <MenuItem value="regular">Regular</MenuItem>
                    <MenuItem value="new">New</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Product Category</InputLabel>
                  <Select
                    value={filters.product}
                    onChange={(e) => handleFilterChange('product', e.target.value)}
                  >
                    <MenuItem value="all">All Products</MenuItem>
                    <MenuItem value="electronics">Electronics</MenuItem>
                    <MenuItem value="clothing">Clothing</MenuItem>
                    <MenuItem value="home">Home & Garden</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography gutterBottom>Chart Configuration</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={chartConfig.showTrendlines}
                      onChange={(e) => setChartConfig(prev => ({
                        ...prev,
                        showTrendlines: e.target.checked
                      }))}
                    />
                  }
                  label="Show Trendlines"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={chartConfig.showConfidenceIntervals}
                      onChange={(e) => setChartConfig(prev => ({
                        ...prev,
                        showConfidenceIntervals: e.target.checked
                      }))}
                    />
                  }
                  label="Show Confidence Intervals"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={() => { setSettingsOpen(false); fetchAnalyticsData(); }} variant="contained">
              Apply Filters
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AdvancedAnalytics;
