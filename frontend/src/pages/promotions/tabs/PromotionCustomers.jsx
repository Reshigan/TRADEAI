import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, CircularProgress, Chip } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../../services/api/apiClient';

const PromotionCustomers = ({ promotionId, promotion, onUpdate }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [promotionId]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/promotions/${promotionId}/customers`);
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Remove this customer from the promotion?')) return;
    
    try {
      await apiClient.delete(`/promotions/${promotionId}/customers/${customerId}`);
      toast.success('Customer removed');
      loadCustomers();
      onUpdate();
    } catch (error) {
      console.error('Error removing customer:', error);
      toast.error('Failed to remove customer');
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Customers in Scope</Typography>
        <Button variant="contained" startIcon={<AddIcon />} disabled={promotion.status !== 'draft'}>
          Add Customers
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Stores</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center">No customers added yet</TableCell></TableRow>
            ) : (
              customers.map((item) => (
                <TableRow key={item._id || item.customer?._id}>
                  <TableCell>{item.customer?.name || 'N/A'}</TableCell>
                  <TableCell>{item.customer?.code || 'N/A'}</TableCell>
                  <TableCell><Chip label={item.customer?.type || 'N/A'} size="small" /></TableCell>
                  <TableCell>{item.stores?.length || 0} stores</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleDelete(item.customer?._id || item.customer)} disabled={promotion.status !== 'draft'}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PromotionCustomers;
