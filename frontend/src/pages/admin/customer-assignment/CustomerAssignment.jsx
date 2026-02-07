/**
 * Customer Assignment Page
 * Allows admins/managers to assign customers to KAMs (Key Account Managers)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Person,
  Business,
  Search,
  Add,
  Refresh,
  PersonAdd,
  AssignmentInd
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../../services/api';
import { formatLabel } from '../../../utils/formatters';

const CustomerAssignment = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  // State
  const [loading, setLoading] = useState(true);
  const [kamUsers, setKamUsers] = useState([]);
  const [unassignedCustomers, setUnassignedCustomers] = useState([]);
  const [selectedKam, setSelectedKam] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Fetch KAM users with their assigned customers
  const fetchKamUsers = useCallback(async () => {
    try {
      const response = await api.get('/customer-assignment');
      setKamUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching KAM users:', error);
      if (error.response?.status === 403) {
        enqueueSnackbar('Access denied. Admin or Manager role required.', { variant: 'error' });
      } else {
        enqueueSnackbar('Failed to load KAM users', { variant: 'error' });
      }
    }
  }, [enqueueSnackbar]);

  // Fetch unassigned customers
  const fetchUnassignedCustomers = useCallback(async () => {
    try {
      const response = await api.get('/customer-assignment/unassigned');
      setUnassignedCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Error fetching unassigned customers:', error);
      enqueueSnackbar('Failed to load unassigned customers', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchKamUsers(), fetchUnassignedCustomers()]);
      setLoading(false);
    };
    loadData();
  }, [fetchKamUsers, fetchUnassignedCustomers]);

  // Handle assign customers to KAM
  const handleAssignCustomers = async () => {
    if (!selectedKam || selectedCustomers.length === 0) return;

    try {
      setAssigning(true);
      
      // Get current assigned customers and add new ones
      const currentAssigned = selectedKam.assignedCustomers?.map(c => c.id || c._id) || [];
      const newAssigned = [...currentAssigned, ...selectedCustomers];
      
      await api.post('/customer-assignment/assign', {
        userId: (selectedKam.id || selectedKam._id),
        customerIds: newAssigned
      });

      enqueueSnackbar(`Successfully assigned ${selectedCustomers.length} customer(s) to ${selectedKam.firstName} ${selectedKam.lastName}`, { variant: 'success' });
      
      // Refresh data
      await Promise.all([fetchKamUsers(), fetchUnassignedCustomers()]);
      
      // Close dialog and reset
      setAssignDialogOpen(false);
      setSelectedCustomers([]);
      setSelectedKam(null);
    } catch (error) {
      console.error('Error assigning customers:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to assign customers', { variant: 'error' });
    } finally {
      setAssigning(false);
    }
  };

  // Handle unassign customer from KAM
  const handleUnassignCustomer = async (kam, customerId) => {
    try {
      await api.post('/customer-assignment/unassign', {
        userId: kam._id,
        customerId
      });

      enqueueSnackbar('Customer unassigned successfully', { variant: 'success' });
      
      // Refresh data
      await Promise.all([fetchKamUsers(), fetchUnassignedCustomers()]);
    } catch (error) {
      console.error('Error unassigning customer:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to unassign customer', { variant: 'error' });
    }
  };

  // Open assign dialog for a KAM
  const openAssignDialog = (kam) => {
    setSelectedKam(kam);
    setSelectedCustomers([]);
    setSearchTerm('');
    setAssignDialogOpen(true);
  };

  // Toggle customer selection
  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  // Filter unassigned customers by search term
  const filteredUnassignedCustomers = unassignedCustomers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get initials for avatar
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="/dashboard">Home</Link>
        <Link color="inherit" href="/admin">Admin</Link>
        <Typography color="text.primary">Customer Assignment</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Customer Assignment
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Assign customers to Key Account Managers (KAMs)
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => {
            fetchKamUsers();
            fetchUnassignedCustomers();
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AssignmentInd color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{kamUsers.length}</Typography>
                  <Typography variant="body2" color="textSecondary">KAM Users</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Business color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {kamUsers.reduce((acc, kam) => acc + (kam.assignedCustomers?.length || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">Assigned Customers</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PersonAdd color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{unassignedCustomers.length}</Typography>
                  <Typography variant="body2" color="textSecondary">Unassigned Customers</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Person color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {kamUsers.length > 0 
                      ? Math.round(kamUsers.reduce((acc, kam) => acc + (kam.assignedCustomers?.length || 0), 0) / kamUsers.length)
                      : 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">Avg per KAM</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Unassigned Customers Alert */}
      {unassignedCustomers.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          There are {unassignedCustomers.length} unassigned customer(s). Click "Assign Customers" on a KAM to assign them.
        </Alert>
      )}

      {/* KAM Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>KAM</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="center">Assigned Customers</TableCell>
                <TableCell>Customers</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {kamUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="textSecondary" py={4}>
                      No KAM users found. Create users with the KAM role first.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                kamUsers.map((kam) => (
                  <TableRow key={kam.id || kam._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getInitials(kam.firstName, kam.lastName)}
                        </Avatar>
                        <Box>
                          <Typography fontWeight="medium">
                            {kam.firstName} {kam.lastName}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{kam.email}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={kam.assignedCustomers?.length || 0} 
                        color={kam.assignedCustomers?.length > 0 ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {kam.assignedCustomers?.slice(0, 5).map((customer) => (
                          <Chip
                            key={customer.id || customer._id}
                            label={customer.name}
                            size="small"
                            onDelete={() => handleUnassignCustomer(kam, customer._id)}
                            sx={{ maxWidth: 150 }}
                          />
                        ))}
                        {kam.assignedCustomers?.length > 5 && (
                          <Chip 
                            label={`+${kam.assignedCustomers.length - 5} more`} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Assign Customers">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Add />}
                          onClick={() => openAssignDialog(kam)}
                          disabled={unassignedCustomers.length === 0}
                        >
                          Assign
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Assign Customers Dialog */}
      <Dialog 
        open={assignDialogOpen} 
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assign Customers to {selectedKam?.firstName} {selectedKam?.lastName}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />
          
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Select customers to assign ({selectedCustomers.length} selected)
          </Typography>
          
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredUnassignedCustomers.length === 0 ? (
              <ListItem>
                <ListItemText 
                  primary="No unassigned customers found"
                  secondary={searchTerm ? "Try a different search term" : "All customers are assigned"}
                />
              </ListItem>
            ) : (
              filteredUnassignedCustomers.map((customer) => (
                <ListItem
                  key={customer.id || customer._id}
                  button
                  onClick={() => toggleCustomerSelection(customer._id)}
                  selected={selectedCustomers.includes(customer.id || customer._id)}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedCustomers.includes(customer.id || customer._id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <Business />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={customer.name}
                    secondary={
                      <>
                        {customer.code && <span>Code: {customer.code}</span>}
                        {customer.customerType && <span> | Type: {formatLabel(customer.customerType)}</span>}
                        {customer.tier && <span> | Tier: {formatLabel(customer.tier)}</span>}
                      </>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignCustomers}
            disabled={selectedCustomers.length === 0 || assigning}
            startIcon={assigning ? <CircularProgress size={20} /> : <Add />}
          >
            {assigning ? 'Assigning...' : `Assign ${selectedCustomers.length} Customer(s)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomerAssignment;
