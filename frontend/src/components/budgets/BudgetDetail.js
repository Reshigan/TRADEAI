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

import { PageHeader, StatusChip, ConfirmDialog } from '../common';
import { budgetService, tradeSpendService } from '../../services/api';
import BudgetForm from './BudgetForm';

// Mock data for development
const mockBudget = {
  id: '1',
  year: 2025,
  customer: { id: '1', name: 'Walmart' },
  total_amount: 1000000,
  allocated_amount: 750000,
  remaining_amount: 250000,
  status: 'approved',
  notes: 'Annual budget for Walmart promotions and trade activities.',
  created_at: new Date('2025-01-15'),
  updated_at: new Date('2025-01-20')
};

const mockTradeSpends = [
  {
    id: '1',
    budget_id: '1',
    amount: 50000,
    type: 'promotion',
    description: 'Summer Promotion',
    status: 'approved',
    created_at: new Date('2025-02-10'),
    updated_at: new Date('2025-02-15')
  },
  {
    id: '2',
    budget_id: '1',
    amount: 75000,
    type: 'listing',
    description: 'New Product Listing',
    status: 'approved',
    created_at: new Date('2025-03-05'),
    updated_at: new Date('2025-03-10')
  },
  {
    id: '3',
    budget_id: '1',
    amount: 25000,
    type: 'display',
    description: 'End Cap Display',
    status: 'pending',
    created_at: new Date('2025-04-20'),
    updated_at: new Date('2025-04-20')
  }
];

const BudgetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [budget, setBudget] = useState(null);
  const [tradeSpends, setTradeSpends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch budget and trade spends on component mount
  useEffect(() => {
    fetchBudget();
    fetchTradeSpends();
  }, [id]);

  // Fetch budget from API
  const fetchBudget = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, we would call the API
      // const response = await budgetService.getById(id);
      // setBudget(response.data);
      
      // Using mock data for development
      setTimeout(() => {
        setBudget(mockBudget);
        setLoading(false);
      }, 500);
    } catch (err) {
      setError('Failed to fetch budget details. Please try again.');
      setLoading(false);
    }
  };

  // Fetch trade spends from API
  const fetchTradeSpends = async () => {
    try {
      // In a real app, we would call the API
      // const response = await tradeSpendService.getAll({ budget_id: id });
      // setTradeSpends(response.data);
      
      // Using mock data for development
      setTimeout(() => {
        setTradeSpends(mockTradeSpends);
      }, 700);
    } catch (err) {
      console.error('Failed to fetch trade spends:', err);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle edit budget
  const handleEditBudget = () => {
    setOpenEditForm(true);
  };

  // Handle delete budget
  const handleDeleteBudget = () => {
    setOpenDeleteDialog(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    
    try {
      // In a real app, we would call the API
      // await budgetService.delete(id);
      
      // Simulate API call
      setTimeout(() => {
        setDeleteLoading(false);
        setOpenDeleteDialog(false);
        navigate('/budgets');
      }, 1000);
    } catch (err) {
      console.error('Failed to delete budget:', err);
      setDeleteLoading(false);
    }
  };

  // Handle form submit
  const handleFormSubmit = async (budgetData) => {
    try {
      // In a real app, we would call the API
      // await budgetService.update(id, budgetData);
      
      // Refresh budget
      fetchBudget();
      setOpenEditForm(false);
    } catch (err) {
      console.error('Error updating budget:', err);
    }
  };

  // Calculate budget utilization percentage
  const calculateUtilization = () => {
    if (!budget) return 0;
    return Math.round((budget.allocated_amount / budget.total_amount) * 100);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
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

  return (
    <Box>
      <PageHeader
        title={`Budget: ${budget.customer.name} (${budget.year})`}
        subtitle={`Budget ID: ${budget.id}`}
        breadcrumbs={[
          { text: 'Budgets', link: '/budgets' },
          { text: `${budget.customer.name} (${budget.year})` }
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
                    {budget.customer.name}
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
                    {formatDate(budget.updated_at)}
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
                    {formatCurrency(budget.total_amount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Allocated
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatCurrency(budget.allocated_amount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Remaining
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatCurrency(budget.remaining_amount)}
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