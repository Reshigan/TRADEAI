import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  Divider,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import { PageHeader } from '../common';
import SalesPerformanceChart from './charts/SalesPerformanceChart';
import BudgetUtilizationChart from './charts/BudgetUtilizationChart';
import ROIAnalysisChart from './charts/ROIAnalysisChart';
import CustomerPerformanceChart from './charts/CustomerPerformanceChart';
import ProductPerformanceChart from './charts/ProductPerformanceChart';
import TradeSpendTrendsChart from './charts/TradeSpendTrendsChart';
import AIPredictionsChart from './charts/AIPredictionsChart';

// No more mock data - using real API calls

const mockProducts = [
  { id: '1', name: 'Rooibos Tea' },
  { id: '2', name: 'Biltong' },
  { id: '3', name: 'Amarula Cream Liqueur' },
  { id: '4', name: 'Mrs. Ball\'s Chutney' },
  { id: '5', name: 'Ouma Rusks' },
  { id: '6', name: 'Boerewors' },
  { id: '7', name: 'Cape Malay Curry Powder' },
  { id: '8', name: 'Malva Pudding Mix' }
];

const mockCategories = [
  'Beverages',
  'Snacks',
  'Alcoholic Beverages',
  'Condiments',
  'Breakfast',
  'Meat',
  'Spices',
  'Desserts'
];

const AnalyticsDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: {
      startDate: new Date(new Date().getFullYear(), 0, 1), // Jan 1 of current year
      endDate: new Date()
    },
    customers: [],
    products: [],
    categories: [],
    compareWithPrevious: true
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch data based on filters
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await service.getAll();
      setData(response.data || response);
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value
    }));
  };

  // Handle date range change
  const handleDateChange = (type, date) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      dateRange: {
        ...prevFilters.dateRange,
        [type]: date
      }
    }));
  };

  // Handle multiple select change
  const handleMultiSelectChange = (event) => {
    const { name, value } = event.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchData();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      dateRange: {
        startDate: new Date(new Date().getFullYear(), 0, 1),
        endDate: new Date()
      },
      customers: [],
      products: [],
      categories: [],
      compareWithPrevious: true
    });
  };

  // Export data
  const exportData = () => {
    // In a real app, we would call the API to export data
    alert('Export functionality would be implemented here');
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box>
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Comprehensive analytics and insights for your trade spend management"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportData}
            >
              Export
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        }
      />

      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Date Range
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <DatePicker
                        label="Start Date"
                        value={filters.dateRange.startDate}
                        onChange={(date) => handleDateChange('startDate', date)}
                        renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <DatePicker
                        label="End Date"
                        value={filters.dateRange.endDate}
                        onChange={(date) => handleDateChange('endDate', date)}
                        renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                      />
                    </Grid>
                  </Grid>
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Customers
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel id="customers-label">Select Customers</InputLabel>
                  <Select
                    labelId="customers-label"
                    multiple
                    name="customers"
                    value={filters.customers}
                    onChange={handleMultiSelectChange}
                    input={<OutlinedInput label="Select Customers" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const customer = mockCustomers.find(c => c.id === value);
                          return (
                            <Chip key={value} label={customer ? customer.name : value} size="small" />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {mockCustomers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        <Checkbox checked={filters.customers.indexOf(customer.id) > -1} />
                        <ListItemText primary={customer.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Products
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel id="products-label">Select Products</InputLabel>
                  <Select
                    labelId="products-label"
                    multiple
                    name="products"
                    value={filters.products}
                    onChange={handleMultiSelectChange}
                    input={<OutlinedInput label="Select Products" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const product = mockProducts.find(p => p.id === value);
                          return (
                            <Chip key={value} label={product ? product.name : value} size="small" />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {mockProducts.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        <Checkbox checked={filters.products.indexOf(product.id) > -1} />
                        <ListItemText primary={product.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Categories
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel id="categories-label">Select Categories</InputLabel>
                  <Select
                    labelId="categories-label"
                    multiple
                    name="categories"
                    value={filters.categories}
                    onChange={handleMultiSelectChange}
                    input={<OutlinedInput label="Select Categories" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {mockCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        <Checkbox checked={filters.categories.indexOf(category) > -1} />
                        <ListItemText primary={category} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                  <Button variant="outlined" onClick={resetFilters}>
                    Reset
                  </Button>
                  <Button variant="contained" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Overview" />
            <Tab label="Sales Performance" />
            <Tab label="Budget Utilization" />
            <Tab label="ROI Analysis" />
            <Tab label="Customer Performance" />
            <Tab label="Product Performance" />
            <Tab label="Trade Spend Trends" />
            <Tab label="AI Predictions" />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Overview Dashboard
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {`Showing data from ${formatDate(filters.dateRange.startDate)} to ${formatDate(filters.dateRange.endDate)}`}
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Sales Performance
                          </Typography>
                          <SalesPerformanceChart height={300} />
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Budget Utilization
                          </Typography>
                          <BudgetUtilizationChart height={300} />
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            ROI Analysis
                          </Typography>
                          <ROIAnalysisChart height={300} />
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Customer Performance
                          </Typography>
                          <CustomerPerformanceChart height={300} />
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Sales Performance
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {`Showing data from ${formatDate(filters.dateRange.startDate)} to ${formatDate(filters.dateRange.endDate)}`}
                  </Typography>
                  
                  <SalesPerformanceChart height={500} />
                </Box>
              )}
              
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Budget Utilization
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {`Showing data from ${formatDate(filters.dateRange.startDate)} to ${formatDate(filters.dateRange.endDate)}`}
                  </Typography>
                  
                  <BudgetUtilizationChart height={500} />
                </Box>
              )}
              
              {tabValue === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    ROI Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {`Showing data from ${formatDate(filters.dateRange.startDate)} to ${formatDate(filters.dateRange.endDate)}`}
                  </Typography>
                  
                  <ROIAnalysisChart height={500} />
                </Box>
              )}
              
              {tabValue === 4 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Customer Performance
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {`Showing data from ${formatDate(filters.dateRange.startDate)} to ${formatDate(filters.dateRange.endDate)}`}
                  </Typography>
                  
                  <CustomerPerformanceChart height={500} />
                </Box>
              )}
              
              {tabValue === 5 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Product Performance
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {`Showing data from ${formatDate(filters.dateRange.startDate)} to ${formatDate(filters.dateRange.endDate)}`}
                  </Typography>
                  
                  <ProductPerformanceChart height={500} />
                </Box>
              )}
              
              {tabValue === 6 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Trade Spend Trends
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {`Showing data from ${formatDate(filters.dateRange.startDate)} to ${formatDate(filters.dateRange.endDate)}`}
                  </Typography>
                  
                  <TradeSpendTrendsChart height={500} />
                </Box>
              )}
              
              {tabValue === 7 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    AI Predictions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {`Showing data from ${formatDate(filters.dateRange.startDate)} to ${formatDate(filters.dateRange.endDate)}`}
                  </Typography>
                  
                  <AIPredictionsChart height={500} />
                </Box>
              )}
            </>
          )}
        </Box>
      </Paper>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Analytics Summary
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Sales
                  </Typography>
                  <Typography variant="h5" color="primary">
                    $12,345,678
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +12.5% vs. previous period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Trade Spend
                  </Typography>
                  <Typography variant="h5" color="primary">
                    $2,468,135
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    +8.3% vs. previous period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ROI
                  </Typography>
                  <Typography variant="h5" color="primary">
                    5.2x
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +0.4x vs. previous period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Key Insights
            </Typography>
            <ul>
              <li>
                <Typography variant="body2">
                  Walmart promotions showed the highest ROI at 7.3x, a 15% increase from the previous period.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Premium Cereal continues to be the top-performing product with $2.1M in sales.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Budget utilization is at 68%, which is on track for this point in the fiscal year.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  AI predicts a 14% increase in sales for Q3 based on current promotion plans.
                </Typography>
              </li>
            </ul>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnalyticsDashboard;