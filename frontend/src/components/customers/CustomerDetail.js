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
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Avatar
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  Notes as NotesIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { PageHeader, StatusChip, ConfirmDialog } from '../common';
import { customerService, budgetService, promotionService, tradeSpendService } from '../../services/api';
import { CustomerIntelligencePanel } from '../contextual-ai';
import CustomerForm from './CustomerForm';
import { formatCurrency } from '../../utils/formatters';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [tradeSpends, setTradeSpends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch customer and related data on component mount
  useEffect(() => {
    fetchCustomer();
    fetchBudgets();
    fetchPromotions();
    fetchTradeSpends();
  }, [id]);

  // Fetch customer from API
  const fetchCustomer = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await customerService.getById(id);
      setCustomer(response.data || response);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "An error occurred");
      setLoading(false);
    }
  };

  // Fetch budgets from API
  const fetchBudgets = async () => {
    try {
      const response = await budgetService.getAll({ customer_id: id });
      setBudgets(response.data || response || []);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
      setBudgets([]);
    }
  };

  // Fetch promotions from API
  const fetchPromotions = async () => {
    try {
      const response = await promotionService.getAll({ customer_id: id });
      setPromotions(response.data || response || []);
    } catch (err) {
      console.error('Failed to fetch promotions:', err);
      setPromotions([]);
    }
  };

  // Fetch trade spends from API
  const fetchTradeSpends = async () => {
    try {
      const response = await tradeSpendService.getAll({ customer_id: id });
      setTradeSpends(response.data || response || []);
    } catch (error) {
      console.error('Failed to fetch trade spends:', error);
      setTradeSpends([]);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle edit customer
  const handleEditCustomer = () => {
    navigate(`/customers/${id}/edit`);
  };

  // Handle delete customer
  const handleDeleteCustomer = () => {
    setOpenDeleteDialog(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    
    try {
      // In a real app, we would call the API
      // await customerService.delete(id);
      
      // Simulate API call
      setTimeout(() => {
        setDeleteLoading(false);
        setOpenDeleteDialog(false);
        navigate('/customers');
      }, 1000);
    } catch (error) {
      console.error('Failed to delete customer:', error);
      setDeleteLoading(false);
      setError(error.message || "An error occurred");
    }
  };

  // Handle form submit
  const handleFormSubmit = async (customerData) => {
    try {
      // In a real app, we would call the API
      // await customerService.update(id, customerData);
      
      // Refresh customer
      fetchCustomer();
      setOpenEditForm(false);
    } catch (error) {
      console.error('Error updating customer:', error);
      setError(error.message || "An error occurred");
    }
  };



  // Format date
  const formatDate = (date) => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Get customer initials for avatar
  const getCustomerInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get avatar color based on customer name
  const getAvatarColor = (name) => {
    const colors = [
      '#1976d2', // blue
      '#388e3c', // green
      '#d32f2f', // red
      '#f57c00', // orange
      '#7b1fa2', // purple
      '#0288d1', // light blue
      '#c2185b', // pink
      '#00796b', // teal
      '#fbc02d'  // yellow
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
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
          onClick={() => navigate('/customers')}
          sx={{ mt: 2 }}
        >
          Back to Customers
        </Button>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="warning">Customer not found.</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/customers')}
          sx={{ mt: 2 }}
        >
          Back to Customers
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`Customer: ${customer.name}`}
        subtitle={`Customer ID: ${customer.id}`}
        breadcrumbs={[
          { text: 'Customers', link: '/customers' },
          { text: customer.name }
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/customers')}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEditCustomer}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteCustomer}
            >
              Delete
            </Button>
          </Box>
        }
      />

      <Grid container spacing={3}>
        {/* LEFT: Customer Information (70%) */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: getAvatarColor(customer.name),
                    width: 64,
                    height: 64,
                    mr: 2
                  }}
                >
                  {getCustomerInitials(customer.name)}
                </Avatar>
                <Box>
                  <Typography variant="h5">
                    {customer.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {customer.code}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <StatusChip status={customer.status} />
                  </Box>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Basic Information
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Type: {customer.type.charAt(0).toUpperCase() + customer.type.slice(1)}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Contact Information
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ mr: 1, color: 'text.secondary', width: 24 }}>
                  <Typography variant="body2" color="text.secondary">
                    Contact:
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2">
                    {customer.contact.name}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2">
                    <a href={`mailto:${customer.contact.email}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {customer.contact.email}
                    </a>
                  </Typography>
                </Box>
              </Box>
              
              {customer.contact.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2">
                      <a href={`tel:${customer.contact.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {customer.contact.phone}
                      </a>
                    </Typography>
                  </Box>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Address
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <LocationIcon sx={{ mr: 1, color: 'text.secondary', mt: 0.5 }} />
                <Box>
                  {customer.address.street && (
                    <Typography variant="body2">
                      {customer.address.street}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    {customer.address.city}, {customer.address.state} {customer.address.zip}
                  </Typography>
                  <Typography variant="body2">
                    {customer.address.country}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          {customer.notes && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Notes
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex' }}>
                  <NotesIcon sx={{ mr: 1, color: 'text.secondary', mt: 0.5 }} />
                  <Typography variant="body2">
                    {customer.notes}
                  </Typography>
                </Box>
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
              <Tab label="Budgets" />
              <Tab label="Promotions" />
              <Tab label="Trade Spends" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Budgets
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/budgets/new', { state: { customer_id: customer.id } })}
                    >
                      Create Budget
                    </Button>
                  </Box>
                  
                  {budgets.length === 0 ? (
                    <Alert severity="info">
                      No budgets found for this customer.
                    </Alert>
                  ) : (
                    <List>
                      {budgets.map((budget) => (
                        <React.Fragment key={budget.id}>
                          <ListItem
                            button
                            onClick={() => navigate(`/budgets/${budget.id}`)}
                          >
                            <ListItemText
                              primary={`${budget.year} Budget`}
                              secondary={`Total: ${formatCurrency(budget.total_amount)} | Remaining: ${formatCurrency(budget.remaining_amount)}`}
                            />
                            <ListItemSecondaryAction>
                              <StatusChip status={budget.status} sx={{ mr: 1 }} />
                              <IconButton
                                edge="end"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/budgets/${budget.id}/edit`);
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Promotions
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/promotions/new', { state: { customer_id: customer.id } })}
                    >
                      Create Promotion
                    </Button>
                  </Box>
                  
                  {promotions.length === 0 ? (
                    <Alert severity="info">
                      No promotions found for this customer.
                    </Alert>
                  ) : (
                    <List>
                      {promotions.map((promotion) => (
                        <React.Fragment key={promotion.id}>
                          <ListItem
                            button
                            onClick={() => navigate(`/promotions/${promotion.id}`)}
                          >
                            <ListItemText
                              primary={promotion.name}
                              secondary={`${formatDate(promotion.start_date)} - ${formatDate(promotion.end_date)} | Budget: ${formatCurrency(promotion.budget)}`}
                            />
                            <ListItemSecondaryAction>
                              <StatusChip status={promotion.status} sx={{ mr: 1 }} />
                              <IconButton
                                edge="end"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/promotions/${promotion.id}/edit`);
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
              
              {tabValue === 2 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Trade Spends
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/trade-spends/new', { state: { customer_id: customer.id } })}
                    >
                      Create Trade Spend
                    </Button>
                  </Box>
                  
                  {tradeSpends.length === 0 ? (
                    <Alert severity="info">
                      No trade spends found for this customer.
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
                              secondary={`${tradeSpend.type.charAt(0).toUpperCase() + tradeSpend.type.slice(1)} | Amount: ${formatCurrency(tradeSpend.amount)}`}
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
            </Box>
          </Paper>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Financial Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total Budget (2025)
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {formatCurrency(budgets.find(b => b.year === 2025)?.total_amount || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Remaining Budget (2025)
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {formatCurrency(budgets.find(b => b.year === 2025)?.remaining_amount || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Active Promotions
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {promotions.filter(p => p.status === 'active').length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Active Trade Spends
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {tradeSpends.filter(t => t.status === 'approved' || t.status === 'active').length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT: AI Intelligence Panel (30%) */}
        <Grid item xs={12} md={4}>
          <CustomerIntelligencePanel
            customerId={id}
            customerData={{
              avgOrderValue: 42000,
              daysSinceLastOrder: 5,
              avgOrderFrequency: 7
            }}
          />
        </Grid>
      </Grid>

      {/* Edit Customer Form */}
      {openEditForm && (
        <CustomerForm
          open={openEditForm}
          onClose={() => setOpenEditForm(false)}
          onSubmit={handleFormSubmit}
          customer={customer}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone and will also delete all associated budgets, promotions, and trade spends."
        confirmText="Delete"
        confirmColor="error"
        loading={deleteLoading}
      />
    </Box>
  );
};

export default CustomerDetail;