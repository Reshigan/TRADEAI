import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  Tabs,
  Tab,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';

import { PageHeader, StatusChip, ConfirmDialog } from '../common';
import { budgetService, tradeSpendService } from '../../services/api';
import BudgetForm from './BudgetForm';
import { DetailPageSkeleton } from '../common/SkeletonLoader';
import { useToast } from '../common/ToastNotification';
import analytics from '../../utils/analytics';


const BudgetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [budget, setBudget] = useState(null);
  const [tradeSpends, setTradeSpends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchBudget();
    fetchTradeSpends();
    analytics.trackPageView('budget_detail', { budgetId: id });
  }, [id]);

  const fetchBudget = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const startTime = Date.now();
      const response = await budgetService.getById(id);
      setBudget(response.data || response);
      setLoading(false);
      
      analytics.trackEvent('budget_detail_loaded', {
        budgetId: id,
        loadTime: Date.now() - startTime
      });
    } catch (error) {
      console.error('Error loading budget:', error);
      const errorMsg = error.message || 'Failed to load budget';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  // Fetch trade spends from API
  const fetchTradeSpends = async () => {
    try {
      const response = await tradeSpendService.getAll({ budget_id: id });
      setTradeSpends(response.data || response || []);
    } catch (err) {
      console.error('Failed to fetch trade spends:', err);
      setTradeSpends([]);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditBudget = () => {
    analytics.trackEvent('budget_edit_clicked', { budgetId: id });
    navigate(`/budgets/${id}/edit`);
  };

  const handleDeleteBudget = () => {
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    
    try {
      await budgetService.delete(id);
      analytics.trackEvent('budget_deleted', { budgetId: id });
      toast.success('Budget deleted successfully!');
      setDeleteLoading(false);
      setOpenDeleteDialog(false);
      navigate('/budgets');
    } catch (err) {
      console.error('Failed to delete budget:', err);
      const errorMsg = err.message || 'Failed to delete budget';
      toast.error(errorMsg);
      setDeleteLoading(false);
    }
  };

  const handleFormSubmit = async (budgetData) => {
    try {
      await budgetService.update(id, budgetData);
      analytics.trackEvent('budget_updated', { budgetId: id });
      toast.success('Budget updated successfully!');
      fetchBudget();
      setOpenEditForm(false);
    } catch (err) {
      console.error('Error updating budget:', err);
      const errorMsg = err.message || 'Failed to update budget';
      toast.error(errorMsg);
    }
  };

  // Calculate budget utilization percentage
  const calculateUtilization = () => {
    if (!budget || !budget.allocated || !budget.remaining) return 0;
    const total = budget.allocated + budget.remaining;
    if (total === 0) return 0;
    return Math.round((budget.allocated / total) * 100);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/budgets')}
          sx={{ mt: 2 }}
        >
          Back to Budgets
        </Button>
      </Box>
    );
  }

  if (!budget) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="warning">Budget not found.</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/budgets')}
          sx={{ mt: 2 }}
        >
          Back to Budgets
        </Button>
      </Box>
    );
  }

  const customerName = budget.scope?.customers?.[0]?.name || 'N/A';
  
  return (
    <Box>
      <PageHeader
        title={`Budget: ${customerName} (${budget.year})`}
        subtitle={`Budget ID: ${budget.id}`}
        breadcrumbs={[
          { text: 'Budgets', link: '/budgets' },
          { text: `${customerName} (${budget.year})` }
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/budgets')}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEditBudget}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteBudget}
            >
              Delete
            </Button>
          </Box>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Budget Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {customerName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Year
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {budget.year}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <StatusChip status={budget.status} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(budget.updatedAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Total Budget
                  </Typography>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {formatCurrency(budget.allocated + budget.remaining)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Allocated
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatCurrency(budget.allocated)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Remaining
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatCurrency(budget.remaining)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Budget Utilization ({calculateUtilization()}%)
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={calculateUtilization()}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {budget.notes && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2">
                  {budget.notes}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Trade Spends" />
              <Tab label="Activity Log" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Trade Spends
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={fetchTradeSpends}
                      >
                        Refresh
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => navigate(`/trade-spends/new?budget_id=${budget.id}`)}
                      >
                        Add Trade Spend
                      </Button>
                    </Box>
                  </Box>
                  
                  {tradeSpends.length === 0 ? (
                    <Alert severity="info">
                      No trade spends found for this budget.
                    </Alert>
                  ) : (
                    <List>
                      {tradeSpends.map((tradeSpend) => (
                        <React.Fragment key={tradeSpend.id}>
                          <ListItem
                            button
                            onClick={() => navigate(`/trade-spends/${tradeSpend.id}`)}
                          >
                            <ListItemText
                              primary={tradeSpend.description}
                              secondary={`${tradeSpend.type} - ${formatCurrency(tradeSpend.amount)}`}
                            />
                            <ListItemSecondaryAction>
                              <StatusChip status={tradeSpend.status} sx={{ mr: 1 }} />
                              <IconButton
                                edge="end"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/trade-spends/${tradeSpend.id}/edit`);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                          <Divider component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </Box>
              )}
              
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Activity Log
                  </Typography>
                  <Alert severity="info">
                    Activity log feature coming soon.
                  </Alert>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Budget Form */}
      {openEditForm && (
        <BudgetForm
          open={openEditForm}
          onClose={() => setOpenEditForm(false)}
          onSubmit={handleFormSubmit}
          budget={budget}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Budget"
        message="Are you sure you want to delete this budget? This action cannot be undone."
        confirmText="Delete"
        confirmColor="error"
        loading={deleteLoading}
      />
    </Box>
  );
};

export default BudgetDetail;
