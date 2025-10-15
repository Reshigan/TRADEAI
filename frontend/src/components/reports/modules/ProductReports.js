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
  Inventory as ProductIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as ReportIcon,
  GetApp as DownloadIcon,
  MoreVert as MoreIcon,
  DateRange as DateRangeIcon,
  FilterList as FilterIcon,
  AttachMoney as RevenueIcon,
  ShoppingCart as SalesIcon,
  Inventory2 as InventoryIcon,
  Analytics as PerformanceIcon
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
import { productService } from '../../../services/api';

const ProductReports = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProductData();
  }, []);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getAll();
      
      // Generate synthetic performance data for demonstration
      const productsWithMetrics = (response.data || []).map((product, index) => ({
        ...product,
        // Sales metrics
        totalSales: Math.floor(Math.random() * 1000000) + 100000,
        unitsSold: Math.floor(Math.random() * 10000) + 1000,
        revenue: Math.floor(Math.random() * 2000000) + 200000,
        
        // Performance metrics
        growthRate: (Math.random() * 40) - 10, // -10% to +30%
        marketShare: Math.random() * 15 + 5, // 5% to 20%
        profitMargin: Math.random() * 30 + 10, // 10% to 40%
        
        // Inventory metrics
        stockLevel: Math.floor(Math.random() * 1000) + 100,
        reorderPoint: Math.floor(Math.random() * 200) + 50,
        turnoverRate: Math.random() * 8 + 2, // 2 to 10 times per year
        
        // Customer metrics
        customerSatisfaction: Math.random() * 2 + 3, // 3 to 5 stars
        returnRate: Math.random() * 5, // 0% to 5%
        
        // Trend data for charts
        salesTrend: Array.from({ length: 12 }, (_, i) => ({
          month: `Month ${i + 1}`,
          sales: Math.floor(Math.random() * 100000) + 50000,
          units: Math.floor(Math.random() * 1000) + 500,
          revenue: Math.floor(Math.random() * 150000) + 75000
        }))
      }));
      
      setProducts(productsWithMetrics);
    } catch (error) {
      console.error('Error fetching product data:', error);
      setError('Failed to load product data. Please try again.');
      setProducts([]);
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
    console.log(`Exporting product reports in ${format} format`);
    handleMenuClose();
  };

  // Calculate aggregate metrics
  const totalRevenue = products.reduce((sum, product) => sum + (product.revenue || 0), 0);
  const totalUnitsSold = products.reduce((sum, product) => sum + (product.unitsSold || 0), 0);
  const averageGrowthRate = products.length > 0 
    ? products.reduce((sum, product) => sum + (product.growthRate || 0), 0) / products.length 
    : 0;
  const averageProfitMargin = products.length > 0
    ? products.reduce((sum, product) => sum + (product.profitMargin || 0), 0) / products.length
    : 0;

  // Prepare chart data
  const topPerformingProducts = products
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    .slice(0, 10)
    .map(product => ({
      name: product.name || 'Unknown Product',
      revenue: product.revenue || 0,
      units: product.unitsSold || 0,
      growth: product.growthRate || 0,
      margin: product.profitMargin || 0
    }));

  const categoryPerformance = products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = { name: category, revenue: 0, units: 0, count: 0 };
    }
    acc[category].revenue += product.revenue || 0;
    acc[category].units += product.unitsSold || 0;
    acc[category].count += 1;
    return acc;
  }, {});

  const categoryData = Object.values(categoryPerformance);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-ZA').format(number || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading product reports...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ProductIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            Product Performance Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive product analytics, sales tracking, inventory management, and profitability analysis
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
                    Total Revenue
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(totalRevenue)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2" sx={{ color: 'success.main' }}>
                      +{formatPercentage(averageGrowthRate)}
                    </Typography>
                  </Box>
                </Box>
                <RevenueIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
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
                    Units Sold
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(totalUnitsSold)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Across all products
                  </Typography>
                </Box>
                <SalesIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
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
                    Avg Profit Margin
                  </Typography>
                  <Typography variant="h4">
                    {formatPercentage(averageProfitMargin)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Portfolio average
                  </Typography>
                </Box>
                <PerformanceIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
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
                    Active Products
                  </Typography>
                  <Typography variant="h4">
                    {products.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    In portfolio
                  </Typography>
                </Box>
                <InventoryIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
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
          <Tab label="Performance Overview" />
          <Tab label="Sales Analytics" />
          <Tab label="Inventory Management" />
          <Tab label="Profitability Analysis" />
          <Tab label="Product Comparison" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={selectedTab} index={0}>
        <Grid container spacing={3}>
          {/* Top Performing Products Chart */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Performing Products by Revenue
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topPerformingProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                    name === 'revenue' ? 'Revenue' : name === 'units' ? 'Units Sold' : 'Growth Rate'
                  ]} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Category Performance */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Revenue by Category
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
                    dataKey="revenue"
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
        </Grid>
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        <Grid container spacing={3}>
          {/* Sales Trend Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Sales Trend Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={products[0]?.salesTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                    name === 'revenue' ? 'Revenue' : name === 'units' ? 'Units' : 'Sales'
                  ]} />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Sales" />
                  <Line type="monotone" dataKey="units" stroke="#82ca9d" name="Units" />
                  <Line type="monotone" dataKey="revenue" stroke="#ffc658" name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Sales Performance Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Product Sales Performance
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Name</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Units Sold</TableCell>
                      <TableCell align="right">Growth Rate</TableCell>
                      <TableCell align="right">Market Share</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.slice(0, 10).map((product, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {product.name || `Product ${index + 1}`}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(product.revenue)}</TableCell>
                        <TableCell align="right">{formatNumber(product.unitsSold)}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {product.growthRate >= 0 ? (
                              <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                            ) : (
                              <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                            )}
                            {formatPercentage(product.growthRate)}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatPercentage(product.marketShare)}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={product.growthRate >= 10 ? 'Excellent' : product.growthRate >= 0 ? 'Good' : 'Needs Attention'}
                            color={product.growthRate >= 10 ? 'success' : product.growthRate >= 0 ? 'primary' : 'error'}
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
          {/* Inventory Status */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Inventory Management Overview
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Name</TableCell>
                      <TableCell align="right">Stock Level</TableCell>
                      <TableCell align="right">Reorder Point</TableCell>
                      <TableCell align="right">Turnover Rate</TableCell>
                      <TableCell align="center">Stock Status</TableCell>
                      <TableCell align="center">Action Required</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.slice(0, 10).map((product, index) => {
                      const stockStatus = product.stockLevel <= product.reorderPoint ? 'Low' : 
                                         product.stockLevel <= product.reorderPoint * 2 ? 'Medium' : 'High';
                      const needsReorder = product.stockLevel <= product.reorderPoint;
                      
                      return (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">
                            {product.name || `Product ${index + 1}`}
                          </TableCell>
                          <TableCell align="right">{formatNumber(product.stockLevel)}</TableCell>
                          <TableCell align="right">{formatNumber(product.reorderPoint)}</TableCell>
                          <TableCell align="right">{product.turnoverRate.toFixed(1)}x</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={stockStatus}
                              color={stockStatus === 'High' ? 'success' : stockStatus === 'Medium' ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            {needsReorder && (
                              <Chip
                                label="Reorder Now"
                                color="error"
                                size="small"
                                variant="outlined"
                              />
                            )}
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

      <TabPanel value={selectedTab} index={3}>
        <Grid container spacing={3}>
          {/* Profitability Analysis */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Profitability by Product
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topPerformingProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="margin" fill="#82ca9d" name="Profit Margin %" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Profitability Metrics */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Profitability Metrics
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Average Profit Margin
                </Typography>
                <Typography variant="h4" sx={{ mb: 2 }}>
                  {formatPercentage(averageProfitMargin)}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Best Performing Product
                </Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {products.sort((a, b) => b.profitMargin - a.profitMargin)[0]?.name || 'N/A'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Highest Margin
                </Typography>
                <Typography variant="h6">
                  {formatPercentage(Math.max(...products.map(p => p.profitMargin || 0)))}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={selectedTab} index={4}>
        <Grid container spacing={3}>
          {/* Product Comparison Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Comprehensive Product Comparison
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Units</TableCell>
                      <TableCell align="right">Growth</TableCell>
                      <TableCell align="right">Margin</TableCell>
                      <TableCell align="right">Market Share</TableCell>
                      <TableCell align="right">Satisfaction</TableCell>
                      <TableCell align="center">Overall Rating</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product, index) => {
                      const overallScore = (
                        (product.growthRate + 10) / 40 * 25 +
                        product.profitMargin / 40 * 25 +
                        product.marketShare / 20 * 25 +
                        product.customerSatisfaction / 5 * 25
                      );
                      
                      return (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">
                            {product.name || `Product ${index + 1}`}
                          </TableCell>
                          <TableCell align="right">{formatCurrency(product.revenue)}</TableCell>
                          <TableCell align="right">{formatNumber(product.unitsSold)}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              {product.growthRate >= 0 ? (
                                <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                              ) : (
                                <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                              )}
                              {formatPercentage(product.growthRate)}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{formatPercentage(product.profitMargin)}</TableCell>
                          <TableCell align="right">{formatPercentage(product.marketShare)}</TableCell>
                          <TableCell align="right">{product.customerSatisfaction.toFixed(1)}/5</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : overallScore >= 40 ? 'Average' : 'Poor'}
                              color={overallScore >= 80 ? 'success' : overallScore >= 60 ? 'primary' : overallScore >= 40 ? 'warning' : 'error'}
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

export default ProductReports;