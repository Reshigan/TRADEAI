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
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { PageHeader, DataTable, StatusChip } from '../common';
import { budgetService } from '../../services/api';
import BudgetForm from './BudgetForm';

// No more mock data - using real API calls

const BudgetList = () => {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [filters, setFilters] = useState({
    year: '',
    status: '',
    search: ''
  });

  // Fetch budgets on component mount
  useEffect(() => {
    fetchBudgets();
  }, []);

  // Fetch budgets from API
  const fetchBudgets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await budgetService.getAll();
      setBudgets(response.data || response);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "An error occurred");
      setLoading(false);
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
  const handleRowClick = (budget) => {
    navigate(`/budgets/${budget.id}`);
  };

  // Handle create budget
  const handleCreateBudget = () => {
    setSelectedBudget(null);
    setOpenForm(true);
  };

  // Handle form close
  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedBudget(null);
  };

  // Handle form submit
  const handleFormSubmit = async (budgetData) => {
    try {
      if (selectedBudget) {
        // Update existing budget
        // await budgetService.update(selectedBudget.id, budgetData);
      } else {
        // Create new budget
        // await budgetService.create(budgetData);
      }
      
      // Refresh budgets
      fetchBudgets();
      setOpenForm(false);
    } catch (err) {
      console.error('Error saving budget:', err);
      // Handle error
    }
  };

  // Apply filters to budgets
  const filteredBudgets = budgets.filter((budget) => {
    // Apply year filter
    if (filters.year && budget.year.toString() !== filters.year) {
      return false;
    }
    
    // Apply status filter
    if (filters.status && budget.status !== filters.status) {
      return false;
    }
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        budget.customer.name.toLowerCase().includes(searchTerm) ||
        budget.year.toString().includes(searchTerm) ||
        budget.status.toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  });

  // Table columns
  const columns = [
    { id: 'year', label: 'Year' },
    { 
      id: 'customer', 
      label: 'Customer',
      format: (customer) => customer.name
    },
    { 
      id: 'total_amount', 
      label: 'Total Amount',
      numeric: true,
      format: (value) => `$${value.toLocaleString()}`
    },
    { 
      id: 'allocated_amount', 
      label: 'Allocated',
      numeric: true,
      format: (value) => `$${value.toLocaleString()}`
    },
    { 
      id: 'remaining_amount', 
      label: 'Remaining',
      numeric: true,
      format: (value) => `$${value.toLocaleString()}`
    },
    { 
      id: 'status', 
      label: 'Status',
      format: (value) => <StatusChip status={value} />
    },
    { 
      id: 'updated_at', 
      label: 'Last Updated',
      format: (date) => format(new Date(date), 'MMM d, yyyy')
    }
  ];

  return (
    <Box>
      <PageHeader
        title="Budgets"
        subtitle="Manage your trade spend budgets"
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateBudget}
          >
            Create Budget
          </Button>
        }
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                select
                label="Year"
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
              >
                <MenuItem value="">All Years</MenuItem>
                <MenuItem value="2025">2025</MenuItem>
                <MenuItem value="2026">2026</MenuItem>
                <MenuItem value="2027">2027</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
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
                <MenuItem value="rejected">Rejected</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4} md={6}>
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
        data={filteredBudgets}
        title="Budget List"
        loading={loading}
        error={error}
        onRowClick={handleRowClick}
      />

      {openForm && (
        <BudgetForm
          open={openForm}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          budget={selectedBudget}
        />
      )}
    </Box>
  );
};

export default BudgetList;