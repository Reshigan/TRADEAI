import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Alert,
  Paper,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  AccountBalance as BudgetIcon,
  CheckCircle as ApprovedIcon,
  TrendingUp as SpentIcon,
  Savings as RemainingIcon,
} from '@mui/icons-material';

import { DataTable, StatusChip } from '../common';
import budgetService from '../../services/api/budgetService';
import BudgetForm from './BudgetForm';
import { formatCurrencyCompact } from '../../utils/formatters';

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
      const budgetData = response.data || response || [];
      setBudgets(budgetData);
      setLoading(false);
    } catch (error) {
      console.error("BudgetList: Error fetching budgets:", error);
      setError(error.message || "Failed to load budgets. Please try again.");
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
        await budgetService.update(selectedBudget.id, budgetData);
      } else {
        // Create new budget
        await budgetService.create(budgetData);
      }
      
      // Refresh budgets
      fetchBudgets();
      setOpenForm(false);
    } catch (err) {
      console.error('Error saving budget:', err);
      setError(err.message || 'Failed to save budget');
    }
  };

  // Apply filters to budgets with safe property access
  const filteredBudgets = budgets.filter((budget) => {
    try {
      // Apply year filter
      if (filters.year && budget?.year?.toString() !== filters.year) {
        return false;
      }
      
      // Apply status filter
      if (filters.status && budget?.status !== filters.status) {
        return false;
      }
      
      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        return (
          (budget?.customerName || budget?.scope?.customers?.[0]?.name || budget?.name || '').toLowerCase().includes(searchTerm) ||
          (budget?.year?.toString() || '').includes(searchTerm) ||
          (budget?.status || '').toLowerCase().includes(searchTerm)
        );
      }
      
      return true;
    } catch (err) {
      console.error('Error filtering budget:', err, budget);
      return false;
    }
  });

  // Table columns with safe formatting
  const columns = [
    { id: 'year', label: 'Year' },
    { 
      id: 'customer', 
      label: 'Customer',
      format: (value, row) => row?.customerName || row?.scope?.customers?.[0]?.name || row?.name || 'N/A'
    },
    { 
      id: 'total_amount', 
      label: 'Total Amount',
      numeric: true,
      format: (value, row) => {
        // API returns 'amount' for total budget
        const total = row?.amount || row?.totalAmount || (row?.allocated || 0) + (row?.remaining || 0);
        return formatCurrencyCompact(total);
      }
    },
    { 
      id: 'allocated', 
      label: 'Allocated',
      numeric: true,
      format: (value, row) => {
        // API returns 'utilized' for allocated amount
        const allocated = row?.utilized || row?.allocated || value || 0;
        return formatCurrencyCompact(allocated);
      }
    },
    { 
      id: 'remaining', 
      label: 'Remaining',
      numeric: true,
      format: (value, row) => {
        // Calculate remaining from amount - utilized
        const total = row?.amount || row?.totalAmount || 0;
        const utilized = row?.utilized || row?.allocated || 0;
        const remaining = row?.remaining || (total - utilized);
        return formatCurrencyCompact(remaining);
      }
    },
    { 
      id: 'status', 
      label: 'Status',
      format: (value) => <StatusChip status={value || 'unknown'} />
    },
    { 
      id: 'updatedAt', 
      label: 'Last Updated',
      format: (date) => {
        try {
          return date ? new Date(date).toLocaleDateString() : 'N/A';
        } catch (err) {
          return 'Invalid Date';
        }
      }
    }
  ];

  const budgetStats = useMemo(() => {
    const totalAmount = budgets.reduce((sum, b) => sum + (b.amount || b.totalAmount || 0), 0);
    const totalUtilized = budgets.reduce((sum, b) => sum + (b.utilized || b.allocated || 0), 0);
    const totalRemaining = totalAmount - totalUtilized;
    const approved = budgets.filter(b => b.status === 'approved').length;
    return { totalAmount, totalUtilized, totalRemaining, approved };
  }, [budgets]);

  const summaryCards = [
    { label: 'Total Budget', value: formatCurrencyCompact(budgetStats.totalAmount), icon: <BudgetIcon />, color: '#7C3AED', bg: alpha('#7C3AED', 0.08) },
    { label: 'Approved', value: budgetStats.approved, icon: <ApprovedIcon />, color: '#059669', bg: alpha('#059669', 0.08) },
    { label: 'Utilized', value: formatCurrencyCompact(budgetStats.totalUtilized), icon: <SpentIcon />, color: '#2563EB', bg: alpha('#2563EB', 0.08) },
    { label: 'Remaining', value: formatCurrencyCompact(budgetStats.totalRemaining), icon: <RemainingIcon />, color: '#D97706', bg: alpha('#D97706', 0.08) },
  ];

  if (error) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Typography variant="h5" fontWeight={700} mb={2}>Budgets</Typography>
        <Alert severity="error" sx={{ borderRadius: '12px' }}>
          <strong>Error loading budgets:</strong> {error}
          <br />
          <Button variant="outlined" size="small" onClick={fetchBudgets} sx={{ mt: 1, borderRadius: '10px', textTransform: 'none' }}>Retry</Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Budgets</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>Manage your trade spend budgets</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateBudget}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: { xs: 2, sm: 3 }, py: 1.2, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          Create Budget
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {React.cloneElement(s.icon, { sx: { color: s.color, fontSize: 22 } })}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
                <Typography variant="h6" fontWeight={700}>{s.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', mb: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField fullWidth select label="Year" name="year" value={filters.year} onChange={handleFilterChange} size="small"
            sx={{ maxWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }}>
            <MenuItem value="">All Years</MenuItem>
            <MenuItem value="2025">2025</MenuItem>
            <MenuItem value="2026">2026</MenuItem>
            <MenuItem value="2027">2027</MenuItem>
          </TextField>
          <TextField fullWidth select label="Status" name="status" value={filters.status} onChange={handleFilterChange} size="small"
            sx={{ maxWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }}>
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </TextField>
          <TextField fullWidth label="Search" name="search" value={filters.search} onChange={handleFilterChange} size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }}
            sx={{ flex: 1, minWidth: { xs: 120, sm: 200 }, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }} />
        </Box>
      </Paper>

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
