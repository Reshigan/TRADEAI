import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';
import apiClient from '../../../services/api/apiClient';

const BudgetAllocations = ({ budgetId }) => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllocations();
  }, [budgetId]);

  const loadAllocations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/budgets/${budgetId}/allocations`);
      setAllocations(response.data.data || []);
    } catch (error) {
      console.error('Error loading allocations:', error);
      toast.error('Failed to load allocations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Monthly Allocations</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell>
              <TableCell align="right">Sales Target</TableCell>
              <TableCell align="right">Marketing</TableCell>
              <TableCell align="right">Cash Co-op</TableCell>
              <TableCell align="right">Trading Terms</TableCell>
              <TableCell align="right">Promotions</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allocations.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">No allocations yet</TableCell></TableRow>
            ) : (
              allocations.map((line) => (
                <TableRow key={line.month}>
                  <TableCell>Month {line.month}</TableCell>
                  <TableCell align="right">R {line.sales?.value?.toLocaleString() || '0'}</TableCell>
                  <TableCell align="right">R {line.tradeSpend?.marketing?.budget?.toLocaleString() || '0'}</TableCell>
                  <TableCell align="right">R {line.tradeSpend?.cashCoop?.budget?.toLocaleString() || '0'}</TableCell>
                  <TableCell align="right">R {line.tradeSpend?.tradingTerms?.budget?.toLocaleString() || '0'}</TableCell>
                  <TableCell align="right">R {line.tradeSpend?.promotions?.budget?.toLocaleString() || '0'}</TableCell>
                  <TableCell align="right">
                    R {((line.tradeSpend?.marketing?.budget || 0) + 
                        (line.tradeSpend?.cashCoop?.budget || 0) + 
                        (line.tradeSpend?.tradingTerms?.budget || 0) + 
                        (line.tradeSpend?.promotions?.budget || 0)).toLocaleString()}
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

export default BudgetAllocations;
