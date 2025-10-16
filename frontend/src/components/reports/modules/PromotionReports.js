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
  Alert
} from '@mui/material';
import {
  Campaign as PromotionIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as ReportIcon,
  GetApp as DownloadIcon,
  MoreVert as MoreIcon,
  DateRange as DateRangeIcon,
  FilterList as FilterIcon,
  AttachMoney as ROIIcon,
  Visibility as ReachIcon,
  ShoppingCart as ConversionIcon,
  Speed as EffectivenessIcon,
  Timeline as UpliftIcon
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
  ScatterChart,
  Scatter
} from 'recharts';
import { promotionService } from '../../../services/api';
import { formatCurrency } from '../../../utils/formatters';

const PromotionReports = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPromotionData();
  }, []);

  const fetchPromotionData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await promotionService.getAll();
      
      // Generate synthetic promotion performance data
      const promotionsWithMetrics = (response.data || []).map((promotion, index) => ({
        ...promotion,
        // Campaign metrics
        totalSpend: Math.floor(Math.random() * 500000) + 50000,
        totalRevenue: Math.floor(Math.random() * 1500000) + 200000,
        impressions: Math.floor(Math.random() * 1000000) + 100000,
        clicks: Math.floor(Math.random() * 50000) + 5000,
        conversions: Math.floor(Math.random() * 5000) + 500,
        
        // Performance metrics
        roi: (Math.random() * 400) + 100, // 100% to 500% ROI
        uplift: (Math.random() * 30) + 5, // 5% to 35% uplift
        ctr: Math.random() * 8 + 2, // 2% to 10% click-through rate
        conversionRate: Math.random() * 15 + 5, // 5% to 20% conversion rate
        cpa: Math.floor(Math.random() * 100) + 20, // R20 to R120 cost per acquisition
        
        // Effectiveness metrics
        brandAwareness: Math.random() * 40 + 60, // 60% to 100%
        customerSatisfaction: Math.random() * 2 + 3, // 3 to 5 stars
        repeatPurchase: Math.random() * 50 + 30, // 30% to 80%
        
        // Channel performance
        channels: [
          { name: 'Digital', spend: Math.floor(Math.random() * 200000) + 20000, roi: Math.random() * 300 + 150 },
          { name: 'Print', spend: Math.floor(Math.random() * 100000) + 10000, roi: Math.random() * 200 + 100 },
          { name: 'TV', spend: Math.floor(Math.random() * 300000) + 30000, roi: Math.random() * 250 + 120 },
          { name: 'Radio', spend: Math.floor(Math.random() * 80000) + 8000, roi: Math.random() * 180 + 90 }
        ],
        
        // Time series data
        dailyPerformance: Array.from({ length: 30 }, (_, i) => ({
          day: i + 1,
          spend: Math.floor(Math.random() * 20000) + 2000,
          revenue: Math.floor(Math.random() * 60000) + 6000,
          impressions: Math.floor(Math.random() * 50000) + 5000,
          conversions: Math.floor(Math.random() * 200) + 20
        })),
        
        // Status
        status: ['Active', 'Completed', 'Paused'][Math.floor(Math.random() * 3)],
        startDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        endDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
      }));
      
      setPromotions(promotionsWithMetrics);
    } catch (error) {
      console.error('Error fetching promotion data:', error);
      setError('Failed to load promotion data. Please try again.');
      setPromotions([]);
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
    console.log(`Exporting promotion reports in ${format} format`);
    handleMenuClose();
  };

  // Calculate aggregate metrics
  const totalSpend = promotions.reduce((sum, promo) => sum + (promo.totalSpend || 0), 0);
  const totalRevenue = promotions.reduce((sum, promo) => sum + (promo.totalRevenue || 0), 0);
  const averageROI = promotions.length > 0 
    ? promotions.reduce((sum, promo) => sum + (promo.roi || 0), 0) / promotions.length 
    : 0;
  const averageUplift = promotions.length > 0
    ? promotions.reduce((sum, promo) => sum + (promo.uplift || 0), 0) / promotions.length
    : 0;
  const totalConversions = promotions.reduce((sum, promo) => sum + (promo.conversions || 0), 0);

  // Prepare chart data
  const topPerformingPromotions = promotions
    .sort((a, b) => (b.roi || 0) - (a.roi || 0))
    .slice(0, 10)
    .map(promo => ({
      name: promo.name || 'Unknown Campaign',
      roi: promo.roi || 0,
      spend: promo.totalSpend || 0,
      revenue: promo.totalRevenue || 0,
      uplift: promo.uplift || 0,
      conversions: promo.conversions || 0
    }));

  const channelPerformance = promotions.reduce((acc, promo) => {
    promo.channels?.forEach(channel => {
      if (!acc[channel.name]) {
        acc[channel.name] = { name: channel.name, spend: 0, roi: 0, count: 0 };
      }
      acc[channel.name].spend += channel.spend;
      acc[channel.name].roi += channel.roi;
      acc[channel.name].count += 1;
    });
    return acc;
  }, {});

  const channelData = Object.values(channelPerformance).map(channel => ({
    ...channel,
    roi: channel.count > 0 ? channel.roi / channel.count : 0
  }));

  const roiVsSpendData = promotions.map(promo => ({
    name: promo.name || 'Campaign',
    spend: promo.totalSpend || 0,
    roi: promo.roi || 0,
    uplift: promo.uplift || 0
  }));

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

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading promotion reports...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PromotionIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            Promotion Performance Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive promotion analytics, ROI analysis, uplift measurement, and campaign effectiveness
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
                    Total ROI
                  </Typography>
                  <Typography variant="h4">
                    {formatPercentage(averageROI)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Average across campaigns
                  </Typography>
                </Box>
                <ROIIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
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
                    Total Spend
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(totalSpend)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Campaign investment
                  </Typography>
                </Box>
                <PromotionIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
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
                    Avg Uplift
                  </Typography>
                  <Typography variant="h4">
                    {formatPercentage(averageUplift)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2" sx={{ color: 'success.main' }}>
                      Sales increase
                    </Typography>
                  </Box>
                </Box>
                <UpliftIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
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
                    Total Conversions
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(totalConversions)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Across all campaigns
                  </Typography>
                </Box>
                <ConversionIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
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
          <Tab label="Campaign Overview" />
          <Tab label="ROI Analysis" />
          <Tab label="Uplift Measurement" />
          <Tab label="Channel Performance" />
          <Tab label="Effectiveness Report" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={selectedTab} index={0}>
        <Grid container spacing={3}>
          {/* Top Performing Campaigns */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Performing Campaigns by ROI
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topPerformingPromotions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'roi' ? `${value.toFixed(1)}%` : 
                    name === 'spend' || name === 'revenue' ? formatCurrency(value) : 
                    formatNumber(value),
                    name === 'roi' ? 'ROI' : 
                    name === 'spend' ? 'Spend' : 
                    name === 'revenue' ? 'Revenue' : 'Conversions'
                  ]} />
                  <Legend />
                  <Bar dataKey="roi" fill="#8884d8" name="ROI %" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Campaign Status Distribution */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Campaign Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Active', value: promotions.filter(p => p.status === 'Active').length },
                      { name: 'Completed', value: promotions.filter(p => p.status === 'Completed').length },
                      { name: 'Paused', value: promotions.filter(p => p.status === 'Paused').length }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        <Grid container spacing={3}>
          {/* ROI vs Spend Scatter Plot */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                ROI vs Campaign Spend Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={roiVsSpendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="spend" name="Spend" type="number" />
                  <YAxis dataKey="roi" name="ROI" type="number" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [
                      name === 'spend' ? formatCurrency(value) : `${value.toFixed(1)}%`,
                      name === 'spend' ? 'Spend' : 'ROI'
                    ]}
                  />
                  <Scatter dataKey="roi" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* ROI Performance Table */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                ROI Performance Summary
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Best Performing Campaign
                </Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {promotions.sort((a, b) => b.roi - a.roi)[0]?.name || 'N/A'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Highest ROI
                </Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {formatPercentage(Math.max(...promotions.map(p => p.roi || 0)))}
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

          {/* ROI Performance Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Campaign ROI Analysis
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Campaign Name</TableCell>
                      <TableCell align="right">Spend</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">ROI</TableCell>
                      <TableCell align="right">Conversions</TableCell>
                      <TableCell align="right">CPA</TableCell>
                      <TableCell align="center">Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {promotions.slice(0, 10).map((promotion, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {promotion.name || `Campaign ${index + 1}`}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(promotion.totalSpend)}</TableCell>
                        <TableCell align="right">{formatCurrency(promotion.totalRevenue)}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {promotion.roi >= 200 ? (
                              <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                            ) : (
                              <TrendingDownIcon sx={{ color: 'warning.main', fontSize: 16, mr: 0.5 }} />
                            )}
                            {formatPercentage(promotion.roi)}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatNumber(promotion.conversions)}</TableCell>
                        <TableCell align="right">{formatCurrency(promotion.cpa)}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={promotion.roi >= 300 ? 'Excellent' : promotion.roi >= 200 ? 'Good' : promotion.roi >= 150 ? 'Average' : 'Poor'}
                            color={promotion.roi >= 300 ? 'success' : promotion.roi >= 200 ? 'primary' : promotion.roi >= 150 ? 'warning' : 'error'}
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
          {/* Uplift Analysis Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Sales Uplift by Campaign
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topPerformingPromotions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="uplift" fill="#82ca9d" name="Sales Uplift %" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Uplift Measurement Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Uplift Measurement Analysis
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Campaign</TableCell>
                      <TableCell align="right">Sales Uplift</TableCell>
                      <TableCell align="right">Revenue Impact</TableCell>
                      <TableCell align="right">Brand Awareness</TableCell>
                      <TableCell align="right">Customer Satisfaction</TableCell>
                      <TableCell align="center">Uplift Category</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {promotions.map((promotion, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {promotion.name || `Campaign ${index + 1}`}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                            {formatPercentage(promotion.uplift)}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(promotion.totalRevenue)}</TableCell>
                        <TableCell align="right">{formatPercentage(promotion.brandAwareness)}</TableCell>
                        <TableCell align="right">{promotion.customerSatisfaction.toFixed(1)}/5</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={promotion.uplift >= 25 ? 'High Impact' : promotion.uplift >= 15 ? 'Medium Impact' : 'Low Impact'}
                            color={promotion.uplift >= 25 ? 'success' : promotion.uplift >= 15 ? 'warning' : 'default'}
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
          {/* Channel Performance Chart */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Channel Performance Comparison
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => [
                    name === 'spend' ? formatCurrency(value) : `${value.toFixed(1)}%`,
                    name === 'spend' ? 'Spend' : 'ROI'
                  ]} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="spend" fill="#8884d8" name="Spend" />
                  <Bar yAxisId="right" dataKey="roi" fill="#82ca9d" name="ROI %" />
                </BarChart>
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
        </Grid>
      </TabPanel>

      <TabPanel value={selectedTab} index={4}>
        <Grid container spacing={3}>
          {/* Effectiveness Metrics */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Campaign Effectiveness Analysis
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Campaign</TableCell>
                      <TableCell align="right">CTR</TableCell>
                      <TableCell align="right">Conversion Rate</TableCell>
                      <TableCell align="right">Brand Awareness</TableCell>
                      <TableCell align="right">Repeat Purchase</TableCell>
                      <TableCell align="right">Customer Satisfaction</TableCell>
                      <TableCell align="center">Overall Effectiveness</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {promotions.map((promotion, index) => {
                      const effectivenessScore = (
                        promotion.ctr / 10 * 20 +
                        promotion.conversionRate / 20 * 20 +
                        promotion.brandAwareness / 100 * 20 +
                        promotion.repeatPurchase / 80 * 20 +
                        promotion.customerSatisfaction / 5 * 20
                      );
                      
                      return (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">
                            {promotion.name || `Campaign ${index + 1}`}
                          </TableCell>
                          <TableCell align="right">{formatPercentage(promotion.ctr)}</TableCell>
                          <TableCell align="right">{formatPercentage(promotion.conversionRate)}</TableCell>
                          <TableCell align="right">{formatPercentage(promotion.brandAwareness)}</TableCell>
                          <TableCell align="right">{formatPercentage(promotion.repeatPurchase)}</TableCell>
                          <TableCell align="right">{promotion.customerSatisfaction.toFixed(1)}/5</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={effectivenessScore >= 80 ? 'Highly Effective' : effectivenessScore >= 60 ? 'Effective' : effectivenessScore >= 40 ? 'Moderately Effective' : 'Needs Improvement'}
                              color={effectivenessScore >= 80 ? 'success' : effectivenessScore >= 60 ? 'primary' : effectivenessScore >= 40 ? 'warning' : 'error'}
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
    </Box>
  );
};

export default PromotionReports;