import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { PageHeader, DataTable, StatusChip } from '../common';
import tradeSpendService from '../../services/api/tradeSpendService';
import budgetService from '../../services/api/budgetService';
import customerService from '../../services/api/customerService';
import { vendorService } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import TradeSpendForm from './TradeSpendForm';

const TradeSpendList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const budgetIdFromQuery = searchParams.get('budget_id');
  
  const [tradeSpends, setTradeSpends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [selectedTradeSpend, setSelectedTradeSpend] = useState(null);
  const [filters, setFilters] = useState({
    customerId: searchParams.get('customerId') || '',
    vendorId: searchParams.get('vendorId') || '',
    type: '',
    status: '',
    search: ''
  });
  const [budgets, setBudgets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState(budgetIdFromQuery || '');

  // Fetch trade spends when filters change
  useEffect(() => {
    fetchTradeSpends();
  }, [filters.customerId, filters.vendorId, filters.type, filters.status]);

  useEffect(() => {
    fetchCustomers();
    fetchVendors();
    fetchBudgets();
  }, []);

  // Fetch trade spends from API with filters
  const fetchTradeSpends = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {};
      if (filters.customerId) params.customerId = filters.customerId;
      if (filters.vendorId) params.vendorId = filters.vendorId;
      if (filters.type) params.spendType = filters.type;
      if (filters.status) params.status = filters.status;
      
      const response = await tradeSpendService.getAll(params);
      setTradeSpends(response.data || response);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(error.message || "An error occurred");
      setLoading(false);
    }
  };

  // Fetch budgets from API
  const fetchBudgets = async () => {
    try {
      const response = await budgetService.getAll();
      setBudgets(response.data);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    }
  };

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAll();
      setCustomers(response.data || response);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setCustomers([]);
    }
  };

  // Fetch vendors from API
  const fetchVendors = async () => {
    try {
      const response = await vendorService.getAll();
      setVendors(response.data || response);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
      setVendors([]);
    }
  };

  // Handle filter changes
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value
    }));
  };

  // Handle row click
  const handleRowClick = (tradeSpend) => {
    navigate(`/trade-spends/${tradeSpend.id}`);
  };

  // Handle create trade spend
  const handleCreateTradeSpend = () => {
    setSelectedTradeSpend(null);
    setOpenForm(true);
  };

  // Handle form close
  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedTradeSpend(null);
  };

  // Handle form submit
  const handleFormSubmit = async (tradeSpendData) => {
    try {
      if (selectedTradeSpend) {
        // Update existing trade spend
        // await tradeSpendService.update(selectedTradeSpend.id, tradeSpendData);
      } else {
        // Create new trade spend
        // await tradeSpendService.create(tradeSpendData);
      }
      
      // Refresh trade spends
      fetchTradeSpends();
      setOpenForm(false);
    } catch (err) {
      console.error('Error saving trade spend:', err);
      // Handle error
    }
  };

  // Apply client-side filters (backend handles customer/vendor/type/status filtering)
  const filteredTradeSpends = tradeSpends.filter((tradeSpend) => {
    // Apply budget filter
    if (selectedBudgetId && (tradeSpend.budget?.id || tradeSpend.budget?._id) !== selectedBudgetId) {
      return false;
    }
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        tradeSpend.description?.toLowerCase().includes(searchTerm) ||
        tradeSpend.customer?.name?.toLowerCase().includes(searchTerm) ||
        tradeSpend.vendor?.name?.toLowerCase().includes(searchTerm) ||
        tradeSpend.spendType?.toLowerCase().includes(searchTerm) ||
        tradeSpend.status?.toLowerCase().includes(searchTerm) ||
        tradeSpend.category?.toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  });

  // Table columns - adapted for backend structure
  const columns = [
    { 
      id: 'customer', 
      label: 'Customer',
      format: (customer) => customer?.name || 'N/A'
    },
    { 
      id: 'description', 
      label: 'Description'
    },
    { 
      id: 'spendType', 
      label: 'Type',
      format: (value) => value ? value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'
    },
    { 
      id: 'category', 
      label: 'Category'
    },
    { 
      id: 'amount', 
      label: 'Requested',
      numeric: true,
      format: (value) => value?.requested ? formatCurrency(value.requested) : formatCurrency(0)
    },
    { 
      id: 'period', 
      label: 'Period',
      format: (period) => {
        if (!period?.startDate) return 'N/A';
        return `${format(new Date(period.startDate), 'MMM d')} - ${format(new Date(period.endDate), 'MMM d, yyyy')}`;
      }
    },
    { 
      id: 'status', 
      label: 'Status',
      format: (value) => <StatusChip status={value} />
    }
  ];

  return (
    <Box>
      <PageHeader
        title="Trade Spends"
        subtitle="Manage your trade spend activities"
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateTradeSpend}
          >
            Create Trade Spend
          </Button>
        }
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                select
                label="Customer"
                name="customerId"
                value={filters.customerId}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
              >
                <MenuItem value="">All Customers</MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer._id || customer.id} value={customer._id || customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                select
                label="Vendor"
                name="vendorId"
                value={filters.vendorId}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
              >
                <MenuItem value="">All Vendors</MenuItem>
                {vendors.map((vendor) => (
                  <MenuItem key={vendor._id || vendor.id} value={vendor._id || vendor.id}>
                    {vendor.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                select
                label="Type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="marketing">Marketing</MenuItem>
                <MenuItem value="cash_coop">Cash Co-op</MenuItem>
                <MenuItem value="trading_terms">Trading Terms</MenuItem>
                <MenuItem value="rebate">Rebate</MenuItem>
                <MenuItem value="promotion">Promotion</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                label="Search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            {budgetIdFromQuery && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 1 }}>
                  Showing trade spends for selected budget. 
                  <Button 
                    size="small" 
                    onClick={() => {
                      setSelectedBudgetId('');
                      navigate('/trade-spends');
                    }}
                    sx={{ ml: 1 }}
                  >
                    Clear Filter
                  </Button>
                </Alert>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={filteredTradeSpends}
        title="Trade Spend List"
        loading={loading}
        error={error}
        onRowClick={handleRowClick}
      />

      {openForm && (
        <TradeSpendForm
          open={openForm}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          tradeSpend={selectedTradeSpend}
          budgets={budgets}
          initialBudgetId={selectedBudgetId}
        />
      )}
    </Box>
  );
};

export default TradeSpendList;
