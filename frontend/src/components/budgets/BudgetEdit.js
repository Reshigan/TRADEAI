import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Divider,
  MenuItem
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const getCurrencySymbol = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.company && user.company.currency) {
        const currencyMap = {
          'USD': '$', 'EUR': '€', 'GBP': '£', 'ZAR': 'R', 'AUD': 'A$',
          'CAD': 'C$', 'JPY': '¥', 'CNY': '¥', 'INR': '₹'
        };
        return currencyMap[user.company.currency] || 'R';
      }
    }
  } catch (error) {
    console.warn('Error getting currency symbol:', error);
  }
  return 'R';
};

const BudgetEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [budget, setBudget] = useState({
    year: new Date().getFullYear(),
    totalBudget: 0,
    budgetCategory: 'marketing',
    allocations: [],
    status: 'draft',
    description: '',
    approver: '',
    notes: ''
  });

  const [categories] = useState([
    'Trade Promotions',
    'Customer Rebates',
    'Marketing Events',
    'Product Launch Support',
    'Volume Incentives',
    'Listing Fees',
    'Co-op Advertising',
    'Contingency Reserve'
  ]);

  useEffect(() => {
    fetchBudget();
  }, [id]);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/budgets/${id}`);
      setBudget(response.data);
    } catch (err) {
      setError('Error loading budget: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setBudget(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAllocationChange = (index, field, value) => {
    const newAllocations = [...budget.allocations];
    newAllocations[index] = {
      ...newAllocations[index],
      [field]: field === 'amount' ? parseFloat(value) || 0 : value
    };
    setBudget(prev => ({
      ...prev,
      allocations: newAllocations
    }));
  };

  const addAllocation = () => {
    setBudget(prev => ({
      ...prev,
      allocations: [
        ...prev.allocations,
        {
          category: '',
          amount: 0,
          percentage: 0,
          notes: ''
        }
      ]
    }));
  };

  const removeAllocation = (index) => {
    setBudget(prev => ({
      ...prev,
      allocations: prev.allocations.filter((_, i) => i !== index)
    }));
  };

  const calculatePercentages = () => {
    const total = parseFloat(budget.totalBudget) || 0;
    if (total === 0) return budget.allocations;

    return budget.allocations.map(allocation => ({
      ...allocation,
      percentage: ((allocation.amount / total) * 100).toFixed(2)
    }));
  };

  const getTotalAllocated = () => {
    return budget.allocations.reduce((sum, allocation) => sum + (allocation.amount || 0), 0);
  };

  const getRemaining = () => {
    return (parseFloat(budget.totalBudget) || 0) - getTotalAllocated();
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!budget.year || !budget.totalBudget) {
        setError('Year and total budget are required');
        return;
      }

      if (budget.allocations.length === 0) {
        setError('At least one allocation is required');
        return;
      }

      const remaining = getRemaining();
      if (Math.abs(remaining) > 0.01) {
        setError(`Budget allocations don't match total. Remaining: $${remaining.toFixed(2)}`);
        return;
      }

      setSaving(true);
      setError('');

      const updatedBudget = {
        ...budget,
        allocations: calculatePercentages()
      };

      await axios.put(`${API_URL}/budgets/${id}`, updatedBudget);
      
      setSuccess('Budget updated successfully!');
      setTimeout(() => {
        navigate(`/budgets/${id}`);
      }, 1500);
    } catch (err) {
      setError('Error updating budget: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Edit Budget
          </Typography>
          <Chip 
            label={budget.status || 'Draft'} 
            color={budget.status === 'approved' ? 'success' : 'warning'}
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Budget Year"
              type="number"
              value={budget.year}
              onChange={(e) => handleChange('year', parseInt(e.target.value))}
              inputProps={{ min: 2020, max: 2030 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Total Budget"
              type="number"
              value={budget.totalBudget}
              onChange={(e) => handleChange('totalBudget', e.target.value)}
              InputProps={{
                startAdornment: getCurrencySymbol()
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Budget Category"
              value={budget.budgetCategory || 'marketing'}
              onChange={(e) => handleChange('budgetCategory', e.target.value)}
              required
            >
              <MenuItem value="marketing">Marketing</MenuItem>
              <MenuItem value="trade_marketing">Trade Marketing</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Status"
              value={budget.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Approver"
              value={budget.approver || ''}
              onChange={(e) => handleChange('approver', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={budget.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </Grid>

          {/* Allocations */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 2 }}>
              <Typography variant="h6">
                Budget Allocations
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addAllocation}
              >
                Add Allocation
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount ($)</TableCell>
                    <TableCell align="right">Percentage (%)</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {budget.allocations && budget.allocations.map((allocation, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={allocation.category || ''}
                          onChange={(e) => handleAllocationChange(index, 'category', e.target.value)}
                        >
                          {categories.map(cat => (
                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={allocation.amount || 0}
                          onChange={(e) => handleAllocationChange(index, 'amount', e.target.value)}
                          InputProps={{
                            startAdornment: getCurrencySymbol()
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {((allocation.amount / (budget.totalBudget || 1)) * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={allocation.notes || ''}
                          onChange={(e) => handleAllocationChange(index, 'notes', e.target.value)}
                          placeholder="Optional notes"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => removeAllocation(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell><strong>Total Allocated</strong></TableCell>
                    <TableCell align="right">
                      <strong>${getTotalAllocated().toFixed(2)}</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>{((getTotalAllocated() / (budget.totalBudget || 1)) * 100).toFixed(2)}%</strong>
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Remaining</strong></TableCell>
                    <TableCell align="right">
                      <strong style={{ color: getRemaining() < 0 ? 'red' : 'green' }}>
                        ${getRemaining().toFixed(2)}
                      </strong>
                    </TableCell>
                    <TableCell colSpan={3} />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Additional Notes */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Additional Notes
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes"
              value={budget.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional notes or comments..."
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => navigate(`/budgets/${id}`)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default BudgetEdit;
