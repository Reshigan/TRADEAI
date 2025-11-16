import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  Button
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../../services/api/apiClient';

const PromotionBudget = ({ promotionId, promotion, onUpdate }) => {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBudget();
  }, [promotionId]);

  const loadBudget = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/promotions/${promotionId}/budget`);
      setBudget(response.data.data || response.data || null);
    } catch (error) {
      console.error('Error loading budget:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load budget');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const budgetData = budget || {
    totalBudget: 0,
    allocatedBudget: 0,
    spentBudget: 0,
    remainingBudget: 0,
    currency: 'ZAR'
  };

  const spentPercentage = budgetData.totalBudget > 0 
    ? (budgetData.spentBudget / budgetData.totalBudget) * 100 
    : 0;

  const allocatedPercentage = budgetData.totalBudget > 0 
    ? (budgetData.allocatedBudget / budgetData.totalBudget) * 100 
    : 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Budget Overview</Typography>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          disabled={promotion.status !== 'draft'}
        >
          Edit Budget
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Budget
              </Typography>
              <Typography variant="h5">
                R {budgetData.totalBudget?.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Allocated
              </Typography>
              <Typography variant="h5">
                R {budgetData.allocatedBudget?.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {allocatedPercentage.toFixed(1)}% of total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Spent
              </Typography>
              <Typography variant="h5">
                R {budgetData.spentBudget?.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {spentPercentage.toFixed(1)}% of total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Remaining
              </Typography>
              <Typography variant="h5" color={budgetData.remainingBudget < 0 ? 'error' : 'success'}>
                R {budgetData.remainingBudget?.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Budget Utilization
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Spent</Typography>
                <Typography variant="body2">{spentPercentage.toFixed(1)}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(spentPercentage, 100)} 
                color={spentPercentage > 100 ? 'error' : spentPercentage > 80 ? 'warning' : 'primary'}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          </Paper>
        </Grid>

        {!budget && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No budget data available for this promotion
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PromotionBudget;
