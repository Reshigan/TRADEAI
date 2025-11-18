import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { toast } from 'react-toastify';
import apiClient from '../../../services/api/apiClient';

const CustomerTradeSpends = ({ customerId, _customer }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customerId) loadData();
  }, [customerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/customers/${customerId}/trade-spends`);
      setData(response.data.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>TradeSpends</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center">No data available</TableCell></TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item._id || index}>
                  <TableCell>{item._id || item.id || 'N/A'}</TableCell>
                  <TableCell>{item.name || item.spendId || item.claimId || 'N/A'}</TableCell>
                  <TableCell>{item.status || 'N/A'}</TableCell>
                  <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CustomerTradeSpends;
