import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { PageHeader, DataTable, StatusChip } from '../common';
import { promotionService, customerService } from '../../services/api';
import PromotionForm from './PromotionForm';

// No more mock data - using real API calls

const PromotionList = () => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [filters, setFilters] = useState({
    customer: '',
    status: '',
    search: ''
  });
  const [customers, setCustomers] = useState([]);

  // Fetch promotions on component mount
  useEffect(() => {
    fetchPromotions();
    fetchCustomers();
  }, []);

  // Fetch promotions from API
  const fetchPromotions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await promotionService.getAll();
      setPromotions(response.data || response);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch promotions:', err);
      setError('Failed to fetch promotions. Please try again.');
      setLoading(false);
    }
  };

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAll();
      setCustomers(response.data || response);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      // Set empty array if API fails
      setCustomers([]);
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
  const handleRowClick = (promotion) => {
    navigate(`/promotions/${promotion.id}`);
  };

  // Handle create promotion
  const handleCreatePromotion = () => {
    setSelectedPromotion(null);
    setOpenForm(true);
  };

  // Handle form close
  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedPromotion(null);
  };

  // Handle form submit
  const handleFormSubmit = async (promotionData) => {
    try {
      if (selectedPromotion) {
        // Update existing promotion
        await promotionService.update(selectedPromotion.id, promotionData);
      } else {
        // Create new promotion
        await promotionService.create(promotionData);
      }
      
      // Refresh promotions
      fetchPromotions();
      setOpenForm(false);
    } catch (err) {
      console.error('Error saving promotion:', err);
      setError('Failed to save promotion. Please try again.');
    }
  };

  // Apply filters to promotions
  const filteredPromotions = promotions.filter((promotion) => {
    // Apply customer filter
    if (filters.customer && promotion.customer.id !== filters.customer) {
      return false;
    }
    
    // Apply status filter
    if (filters.status && promotion.status !== filters.status) {
      return false;
    }
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        promotion.name.toLowerCase().includes(searchTerm) ||
        promotion.customer.name.toLowerCase().includes(searchTerm) ||
        promotion.description.toLowerCase().includes(searchTerm) ||
        promotion.status.toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  });

  // Table columns
  const columns = [
    { 
      id: 'name', 
      label: 'Promotion Name'
    },
    { 
      id: 'customer', 
      label: 'Customer',
      format: (customer) => customer.name
    },
    { 
      id: 'budget', 
      label: 'Budget',
      numeric: true,
      format: (value) => `$${value.toLocaleString()}`
    },
    { 
      id: 'start_date', 
      label: 'Start Date',
      format: (date) => format(new Date(date), 'MMM d, yyyy')
    },
    { 
      id: 'end_date', 
      label: 'End Date',
      format: (date) => format(new Date(date), 'MMM d, yyyy')
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
        title="Promotions"
        subtitle="Manage your promotional campaigns"
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreatePromotion}
          >
            Create Promotion
          </Button>
        }
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
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
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
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
                <MenuItem value="planned">Planned</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
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
          </Grid>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={filteredPromotions}
        title="Promotion List"
        loading={loading}
        error={error}
        onRowClick={handleRowClick}
      />

      {openForm && (
        <PromotionForm
          open={openForm}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          promotion={selectedPromotion}
          customers={customers}
        />
      )}
    </Box>
  );
};

export default PromotionList;