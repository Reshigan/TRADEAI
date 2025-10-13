import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { PageHeader, DataTable, StatusChip } from '../common';
import { tradeSpendService, budgetService } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import TradeSpendForm from './TradeSpendForm';

// No more mock data - using real API calls

const TradeSpendList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const budgetIdFromQuery = queryParams.get('budget_id');
  
  const [tradeSpends, setTradeSpends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [selectedTradeSpend, setSelectedTradeSpend] = useState(null);
  const [filters, setFilters] = useState({
    customer: '',
    type: '',
    status: '',
    search: ''
  });
  const [budgets, setBudgets] = useState([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState(budgetIdFromQuery || '');

  // Fetch trade spends on component mount
  useEffect(() => {
    fetchTradeSpends();
    fetchBudgets();
  }, []);

  // Fetch trade spends from API
  const fetchTradeSpends = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tradeSpendService.getAll();
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
      // In a real app, we would call the API
      const response = await budgetService.getAll();
      setBudgets(response.data);
      
      // Using mock data for development
      const mockBudgets = [
        { id: '1', year: 2025, customer: { id: '1', name: 'Walmart' } },
        { id: '2', year: 2025, customer: { id: '2', name: 'Target' } },
        { id: '3', year: 2025, customer: { id: '3', name: 'Costco' } },
        { id: '4', year: 2025, customer: { id: '4', name: 'Test Company' } }
      ];
      setBudgets(mockBudgets);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
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

  // Apply filters to trade spends
  const filteredTradeSpends = tradeSpends.filter((tradeSpend) => {
    // Apply customer filter
    if (filters.customer && tradeSpend.customer?._id !== filters.customer) {
      return false;
    }
    
    // Apply type filter
    if (filters.type && tradeSpend.spendType !== filters.type) {
      return false;
    }
    
    // Apply status filter
    if (filters.status && tradeSpend.status !== filters.status) {
      return false;
    }
    
    // Apply budget filter
    if (selectedBudgetId && tradeSpend.budget?._id !== selectedBudgetId) {
      return false;
    }
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        tradeSpend.description?.toLowerCase().includes(searchTerm) ||
        tradeSpend.customer?.name?.toLowerCase().includes(searchTerm) ||
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
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Customer"
                name="customer"
                value={filters.customer}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
              >
                <MenuItem value="">All Customers</MenuItem>
                {Array.from(new Set(tradeSpends.filter(ts => ts.customer?._id).map(ts => ts.customer._id))).map(customerId => {
                  const customer = tradeSpends.find(ts => ts.customer?._id === customerId)?.customer;
                  return customer ? (
                    <MenuItem key={customerId} value={customerId}>
                      {customer.name}
                    </MenuItem>
                  ) : null;
                })}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
                <MenuItem value="promotion">Promotion</MenuItem>
                <MenuItem value="listing">Listing</MenuItem>
                <MenuItem value="display">Display</MenuItem>
                <MenuItem value="rebate">Rebate</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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