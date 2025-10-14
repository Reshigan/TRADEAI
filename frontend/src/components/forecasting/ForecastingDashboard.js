import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  Analytics,
  Psychology as PredictiveAnalytics,
  Timeline,
  Assessment,
  Download,
  Refresh,
  Settings,
  Info
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart
} from 'recharts';
import { forecastingService } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const ForecastingDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Forecast data
  const [salesForecast, setSalesForecast] = useState(null);
  const [demandForecast, setDemandForecast] = useState(null);
  const [budgetForecast, setBudgetForecast] = useState(null);
  const [scenarioAnalysis, setScenarioAnalysis] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    productId: '',
    customerId: '',
    horizon: 12,
    algorithm: 'ensemble',
    includeSeasonality: true,
    includePromotions: true
  });

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load products and customers for filters
      const [productsRes, customersRes] = await Promise.all([
        forecastingService.getProducts(),
        forecastingService.getCustomers()
      ]);
      
      setProducts(productsRes.data || []);
      setCustomers(customersRes.data || []);
      
      // Load default forecasts
      await loadForecasts();
      
    } catch (err) {
      setError('Failed to load initial data');
      console.error('Initial data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadForecasts = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = [];

      // Sales Forecast
      if (activeTab === 0 || activeTab === 3) {
        promises.push(
          forecastingService.generateSalesForecast(filters)
            .then(res => setSalesForecast(res.data))
            .catch(err => console.error('Sales forecast error:', err))
        );
      }

      // Demand Forecast
      if (activeTab === 1 || activeTab === 3) {
        promises.push(
          forecastingService.generateDemandForecast({
            productIds: filters.productId ? [filters.productId] : [],
            customerIds: filters.customerId ? [filters.customerId] : [],
            horizon: filters.horizon
          })
            .then(res => setDemandForecast(res.data))
            .catch(err => console.error('Demand forecast error:', err))
        );
      }

      // Budget Forecast
      if (activeTab === 2 || activeTab === 3) {
        promises.push(
          forecastingService.generateBudgetForecast({
            horizon: filters.horizon,
            includeInflation: true
          })
            .then(res => setBudgetForecast(res.data))
            .catch(err => console.error('Budget forecast error:', err))
        );
      }

      await Promise.all(promises);

    } catch (err) {
      setError('Failed to load forecasts');
      console.error('Forecast loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const exportForecast = async (type) => {
    try {
      const response = await forecastingService.exportForecast(type, filters);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_forecast_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err) {
      setError(`Failed to export ${type} forecast`);
      console.error('Export error:', err);
    }
  };

  const renderFilters = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Forecast Parameters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Product</InputLabel>
              <Select
                value={filters.productId}
                onChange={(e) => handleFilterChange('productId', e.target.value)}
                label="Product"
              >
                <MenuItem value="">All Products</MenuItem>
                {products.map(product => (
                  <MenuItem key={product._id} value={product._id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Customer</InputLabel>
              <Select
                value={filters.customerId}
                onChange={(e) => handleFilterChange('customerId', e.target.value)}
                label="Customer"
              >
                <MenuItem value="">All Customers</MenuItem>
                {customers.map(customer => (
                  <MenuItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Horizon (months)"
              type="number"
              value={filters.horizon}
              onChange={(e) => handleFilterChange('horizon', parseInt(e.target.value))}
              inputProps={{ min: 1, max: 24 }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Algorithm</InputLabel>
              <Select
                value={filters.algorithm}
                onChange={(e) => handleFilterChange('algorithm', e.target.value)}
                label="Algorithm"
              >
                <MenuItem value="ensemble">Ensemble</MenuItem>
                <MenuItem value="sma">Moving Average</MenuItem>
                <MenuItem value="exponential">Exponential Smoothing</MenuItem>
                <MenuItem value="linear">Linear Regression</MenuItem>
                <MenuItem value="seasonal">Seasonal</MenuItem>
                <MenuItem value="arima">ARIMA</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
              <Button
                variant="contained"
                onClick={loadForecasts}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
              >
                Update
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderSalesForecast = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Sales Forecast</Typography>
              <Box>
                <Tooltip title="Export to Excel">
                  <IconButton onClick={() => exportForecast('sales')}>
                    <Download />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            {salesForecast && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {salesForecast.accuracy?.accuracy || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Forecast Accuracy
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {salesForecast.seasonalityDetected?.detected ? 'Yes' : 'No'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Seasonality Detected
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          {salesForecast.trendAnalysis?.direction || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Trend Direction
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {salesForecast.algorithm}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Algorithm Used
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>

                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={salesForecast.forecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="confidenceUpper"
                      stackId="1"
                      stroke="none"
                      fill="#e3f2fd"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="confidenceLower"
                      stackId="1"
                      stroke="none"
                      fill="#ffffff"
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#1976d2"
                      strokeWidth={3}
                      dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Sales Forecast</Typography>
            </Box>
            {salesForecast ? (
              <>
                <Typography variant="h4" color="primary" gutterBottom>
                  {salesForecast.accuracy?.accuracy || 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Forecast Accuracy
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip 
                    label={`${salesForecast.algorithm} Algorithm`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No data available
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Analytics sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">Demand Analysis</Typography>
            </Box>
            {demandForecast ? (
              <>
                <Typography variant="h4" color="success.main" gutterBottom>
                  {demandForecast.riskAnalysis?.riskLevel?.toUpperCase() || 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Risk Level
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip 
                    label={`${Object.keys(demandForecast.scenarios || {}).length} Scenarios`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No data available
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Assessment sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6">Budget Forecast</Typography>
            </Box>
            {budgetForecast ? (
              <>
                <Typography variant="h4" color="warning.main" gutterBottom>
                  {formatCurrency(budgetForecast.finalForecast?.reduce((sum, f) => sum + f.value, 0) || 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Budget
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip 
                    label={`${budgetForecast.budgetRisk?.level || 'Unknown'} Risk`}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No data available
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadInitialData}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <PredictiveAnalytics sx={{ mr: 2 }} />
        AI-Powered Forecasting
      </Typography>

      {renderFilters()}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Sales Forecast" icon={<TrendingUp />} />
          <Tab label="Overview" icon={<Timeline />} />
        </Tabs>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <>
          {activeTab === 0 && renderSalesForecast()}
          {activeTab === 1 && renderOverview()}
        </>
      )}
    </Box>
  );
};

export default ForecastingDashboard;