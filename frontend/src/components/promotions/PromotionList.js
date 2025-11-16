import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { PageHeader, DataTable, StatusChip } from '../common';
import { promotionService, customerService, productService } from '../../services/api';
import PromotionForm from './PromotionForm';

const PromotionList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [filters, setFilters] = useState({
    customerId: searchParams.get('customerId') || '',
    productId: searchParams.get('productId') || '',
    status: '',
    search: ''
  });
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Fetch promotions when filters change
  useEffect(() => {
    fetchPromotions();
  }, [filters.customerId, filters.productId, filters.status]);

  // Fetch customers and products on mount
  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  // Fetch promotions from API with filters
  const fetchPromotions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {};
      if (filters.customerId) params.customerId = filters.customerId;
      if (filters.productId) params.productId = filters.productId;
      if (filters.status) params.status = filters.status;
      
      const response = await promotionService.getAll(params);
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
      setCustomers([]);
    }
  };

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data || response);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
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

  // Apply client-side search filter (backend handles customer/product/status filtering)
  const filteredPromotions = promotions.filter((promotion) => {
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        promotion.name?.toLowerCase().includes(searchTerm) ||
        promotion.customer?.name?.toLowerCase().includes(searchTerm) ||
        promotion.description?.toLowerCase().includes(searchTerm) ||
        promotion.status?.toLowerCase().includes(searchTerm)
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
      format: (customerId) => {
        // Find customer by ID
        const customer = customers.find(c => c._id === customerId);
        return customer ? customer.name : customerId;
      }
    },
    { 
      id: 'budget', 
      label: 'Budget',
      numeric: true,
      format: (value) => value ? `$${value.toLocaleString()}` : '-'
    },
    { 
      id: 'startDate', 
      label: 'Start Date',
      format: (date) => {
        if (!date) return '-';
        try {
          return format(new Date(date), 'MMM d, yyyy');
        } catch (error) {
          return '-';
        }
      }
    },
    { 
      id: 'endDate', 
      label: 'End Date',
      format: (date) => {
        if (!date) return '-';
        try {
          return format(new Date(date), 'MMM d, yyyy');
        } catch (error) {
          return '-';
        }
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
            <Grid item xs={12} sm={3}>
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
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                select
                label="Product"
                name="productId"
                value={filters.productId}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
              >
                <MenuItem value="">All Products</MenuItem>
                {products.map((product) => (
                  <MenuItem key={product._id || product.id} value={product._id || product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
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
            <Grid item xs={12} sm={3}>
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
