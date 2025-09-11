import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  LocationOn as LocationOnIcon,
  Category as CategoryIcon,
  Public as PublicIcon,
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  ArrowBack as ArrowBackIcon,
  History as HistoryIcon
} from '@mui/icons-material';

import { PageHeader } from '../common';

// Mock data for development
const mockCompany = {
  id: '3',
  name: 'Tech Innovations Inc',
  industry: 'Technology',
  region: 'North America',
  address: '123 Tech Blvd, San Francisco, CA 94105',
  phone: '+1 (555) 123-4567',
  website: 'https://techinnovations.example.com',
  status: 'active',
  currency: 'USD',
  taxId: 'US-987654321',
  notes: 'Leading technology company specializing in AI solutions.',
  createdAt: '2025-03-10T14:45:00Z',
  updatedAt: '2025-08-15T09:30:00Z'
};

// Mock budgets
const mockBudgets = [
  { id: '1', name: 'Q1 Marketing Budget', amount: 250000, used: 180000, remaining: 70000, status: 'active' },
  { id: '2', name: 'Q2 Marketing Budget', amount: 300000, used: 120000, remaining: 180000, status: 'active' },
  { id: '3', name: 'Annual Trade Show Budget', amount: 150000, used: 75000, remaining: 75000, status: 'active' }
];

// Mock trade spends
const mockTradeSpends = [
  { id: '1', name: 'Summer Promotion', amount: 50000, startDate: '2025-06-01', endDate: '2025-08-31', status: 'active' },
  { id: '2', name: 'Holiday Campaign', amount: 75000, startDate: '2025-11-01', endDate: '2025-12-31', status: 'pending' },
  { id: '3', name: 'Product Launch', amount: 100000, startDate: '2025-09-15', endDate: '2025-10-15', status: 'active' }
];

// Currency display mapping
const currencyDisplay = {
  'USD': '$ (USD)',
  'EUR': '€ (EUR)',
  'GBP': '£ (GBP)',
  'JPY': '¥ (JPY)',
  'CAD': 'C$ (CAD)',
  'AUD': 'A$ (AUD)',
  'BRL': 'R$ (BRL)',
  'CNY': '¥ (CNY)',
  'INR': '₹ (INR)',
  'MXN': '$ (MXN)'
};

// Currency symbols
const currencySymbols = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'CAD': 'C$',
  'AUD': 'A$',
  'BRL': 'R$',
  'CNY': '¥',
  'INR': '₹',
  'MXN': '$'
};

const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Load company data
  useEffect(() => {
    // In a real app, we would fetch data from the API
    // For now, we'll use mock data
    setLoading(true);
    
  }, [id]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle delete dialog open
  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
  };
  
  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };
  
  // Handle delete company
  const handleDeleteCompany = () => {
    // In a real app, we would call the API to delete the company
    setSnackbar({
      open: true,
      message: `Company ${company.name} has been deleted`,
      severity: 'success'
    });
    
    handleDeleteDialogClose();
    
    // Navigate back to company list after successful delete
    setTimeout(() => {
      navigate('/companies');
    }, 1500);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar((prevSnackbar) => ({
      ...prevSnackbar,
      open: false
    }));
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  // Format currency
  const formatCurrency = (amount, currencyCode = 'USD') => {
    const symbol = currencySymbols[currencyCode] || '$';
    
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <Box>
      <PageHeader
        title="Company Details"
        subtitle="View and manage company information"
      />
      
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          component={Link}
          to="/companies"
        >
          Back to Companies
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2
                      }}
                    >
                      <BusinessIcon sx={{ fontSize: 60 }} />
                    </Box>
                    
                    <Typography variant="h5" gutterBottom>
                      {company.name}
                    </Typography>
                    
                    <Chip
                      label={company.industry}
                      color="primary"
                      sx={{ mb: 1 }}
                    />
                    
                    <Chip
                      label={company.status === 'active' ? 'Active' : 'Inactive'}
                      color={company.status === 'active' ? 'success' : 'default'}
                      sx={{ mb: 1 }}
                    />
                    
                    <Chip
                      label={currencyDisplay[company.currency] || company.currency}
                      color="secondary"
                      sx={{ mb: 2 }}
                    />
                    
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        component={Link}
                        to={`/companies/${id}/edit`}
                      >
                        Edit
                      </Button>
                      
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDeleteDialogOpen}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    Company Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <LocationOnIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Address"
                        secondary={company.address || 'Not provided'}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Phone"
                        secondary={company.phone || 'Not provided'}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <LanguageIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Website"
                        secondary={
                          company.website ? (
                            <a href={company.website} target="_blank" rel="noopener noreferrer">
                              {company.website}
                            </a>
                          ) : (
                            'Not provided'
                          )
                        }
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <CategoryIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Industry"
                        secondary={company.industry}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <PublicIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Region"
                        secondary={company.region}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <AttachMoneyIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Currency"
                        secondary={currencyDisplay[company.currency] || company.currency}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <ReceiptIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Tax ID"
                        secondary={company.taxId || 'Not provided'}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <HistoryIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Created"
                        secondary={formatDate(company.createdAt)}
                      />
                    </ListItem>
                  </List>
                  
                  {company.notes && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Notes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {company.notes}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Paper>
          
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Budgets" />
              <Tab label="Trade Spends" />
              <Tab label="Analytics" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Budgets
                    </Typography>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      component={Link}
                      to="/budgets/new"
                      size="small"
                    >
                      Create Budget
                    </Button>
                  </Box>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Total Amount</TableCell>
                          <TableCell>Used</TableCell>
                          <TableCell>Remaining</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mockBudgets.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              No budgets found for this company.
                            </TableCell>
                          </TableRow>
                        ) : (
                          mockBudgets.map((budget) => (
                            <TableRow key={budget.id} hover>
                              <TableCell>
                                <Link to={`/budgets/${budget.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {budget.name}
                                  </Typography>
                                </Link>
                              </TableCell>
                              <TableCell>
                                {currencySymbols[company.currency] || '$'}{formatCurrency(budget.amount, company.currency)}
                              </TableCell>
                              <TableCell>
                                {currencySymbols[company.currency] || '$'}{formatCurrency(budget.used, company.currency)}
                              </TableCell>
                              <TableCell>
                                {currencySymbols[company.currency] || '$'}{formatCurrency(budget.remaining, company.currency)}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={budget.status === 'active' ? 'Active' : 'Inactive'}
                                  color={budget.status === 'active' ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Tooltip title="View Details">
                                  <IconButton
                                    component={Link}
                                    to={`/budgets/${budget.id}`}
                                    size="small"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
              
              {tabValue === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Trade Spends
                    </Typography>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      component={Link}
                      to="/trade-spends/new"
                      size="small"
                    >
                      Create Trade Spend
                    </Button>
                  </Box>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Start Date</TableCell>
                          <TableCell>End Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mockTradeSpends.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              No trade spends found for this company.
                            </TableCell>
                          </TableRow>
                        ) : (
                          mockTradeSpends.map((tradeSpend) => (
                            <TableRow key={tradeSpend.id} hover>
                              <TableCell>
                                <Link to={`/trade-spends/${tradeSpend.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {tradeSpend.name}
                                  </Typography>
                                </Link>
                              </TableCell>
                              <TableCell>
                                {currencySymbols[company.currency] || '$'}{formatCurrency(tradeSpend.amount, company.currency)}
                              </TableCell>
                              <TableCell>{formatDate(tradeSpend.startDate)}</TableCell>
                              <TableCell>{formatDate(tradeSpend.endDate)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={tradeSpend.status === 'active' ? 'Active' : tradeSpend.status === 'pending' ? 'Pending' : 'Inactive'}
                                  color={
                                    tradeSpend.status === 'active' ? 'success' :
                                    tradeSpend.status === 'pending' ? 'warning' : 'default'
                                  }
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Tooltip title="View Details">
                                  <IconButton
                                    component={Link}
                                    to={`/trade-spends/${tradeSpend.id}`}
                                    size="small"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
              
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Analytics
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Budget Utilization
                          </Typography>
                          
                          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              Budget utilization chart will be displayed here.
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Trade Spend ROI
                          </Typography>
                          
                          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              Trade spend ROI chart will be displayed here.
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          component={Link}
                          to="/analytics"
                        >
                          View Full Analytics
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </Paper>
          
          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={handleDeleteDialogClose}
          >
            <DialogTitle>Delete Company</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete the company "{company.name}"? This action cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDeleteDialogClose}>Cancel</Button>
              <Button onClick={handleDeleteCompany} color="error" autoFocus>
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyDetail;