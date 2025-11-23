import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';
import BudgetAIInsights from '../../components/ai/budgets/BudgetAIInsights';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const BudgetOverview = () => {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, allocated: 0, spent: 0, remaining: 0 });

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/budgets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        const budgetData = response.data.data;
        setBudgets(budgetData);
        
        const total = budgetData.reduce((sum, b) => sum + (b.totalBudget || 0), 0);
        const allocated = budgetData.reduce((sum, b) => sum + (b.allocated || 0), 0);
        const spent = budgetData.reduce((sum, b) => sum + (b.spent || 0), 0);
        
        setSummary({ total, allocated, spent, remaining: allocated - spent });
      }
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
  
  const getUtilizationColor = (percent) => {
    if (percent >= 90) return '#ef4444';
    if (percent >= 75) return '#f59e0b';
    return '#10b981';
  };

  const getUtilizationColorValue = (percent) => {
    if (percent >= 90) return '#ef4444';
    if (percent >= 75) return '#f59e0b';
    return '#10b981';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} mb={0.5}>
            💰 Budget Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {budgets.length} budget(s) found
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/budgets/new')}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          New Budget
        </Button>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Total Budget
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatCurrency(summary.total)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Allocated
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatCurrency(summary.allocated)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Spent
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatCurrency(summary.spent)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Remaining
            </Typography>
            <Typography variant="h5" fontWeight={700} color="success.main">
              {formatCurrency(summary.remaining)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box mb={4}>
        <BudgetAIInsights 
          budget={{
            _id: 'overview',
            name: 'Overall Budget Portfolio',
            totalAmount: summary.total,
            allocation: summary.allocated,
            spendRate: summary.allocated > 0 ? (summary.spent / summary.allocated) * 100 : 0,
            remainingAmount: summary.remaining,
            performance: budgets.map(b => ({ id: b._id, name: b.budgetName, roi: b.roi || 0 }))
          }}
          onApplyReallocation={(reallocationData) => {
            console.log('Apply reallocation:', reallocationData);
          }}
          onApplyOptimization={(optimizationData) => {
            console.log('Apply optimization:', optimizationData);
          }}
          onApplyForecasting={(forecastData) => {
            console.log('Apply forecasting:', forecastData);
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {budgets.map(budget => {
          const utilization = budget.allocated ? ((budget.spent / budget.allocated) * 100).toFixed(1) : 0;
          
          return (
            <Grid item xs={12} md={6} lg={4} key={budget._id}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 2,
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main' }
                }}
                onClick={() => navigate(`/budgets/${budget._id}`)}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={600}>
                    {budget.budgetName}
                  </Typography>
                  <Chip 
                    label={budget.status}
                    size="small"
                    color={budget.status === 'Active' ? 'success' : 'default'}
                  />
                </Box>
                
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Department: {budget.department}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Period: {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Allocated: {formatCurrency(budget.allocated)}</Typography>
                    <Typography variant="body2">Spent: {formatCurrency(budget.spent)}</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={parseFloat(utilization)} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 1,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getUtilizationColorValue(utilization)
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" display="block" textAlign="right" mt={0.5}>
                    {utilization}% utilized
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={(e) => { e.stopPropagation(); navigate(`/budgets/${budget._id}/edit`); }}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Edit Budget
                </Button>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {budgets.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" mb={3}>
            No budgets found
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/budgets/new')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Create Budget
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default BudgetOverview;
