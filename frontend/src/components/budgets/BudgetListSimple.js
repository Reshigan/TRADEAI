import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// TEMPORARILY REMOVE ALL COMMON IMPORTS TO TEST
// import { PageHeader, DataTable } from '../common';
// TEMPORARILY REMOVE budgetService import to test
// import { budgetService } from '../../services/api';

const BudgetListSimple = () => {
  console.log('BudgetListSimple component rendering...');
  
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchBudgets = async () => {
      console.log('Starting fetchBudgets...');
      
      try {
        console.log('Setting loading to true...');
        setLoading(true);
        
        // TEMPORARILY DISABLE API CALL TO TEST
        console.log('SKIPPING API CALL - Testing without budgetService.getAll()');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set test data directly
        const testData = [
          { id: 1, name: 'Test Budget 1 (No API)', amount: 10000, status: 'active' },
          { id: 2, name: 'Test Budget 2 (No API)', amount: 15000, status: 'pending' }
        ];
        
        console.log('Setting test budgets data...');
        setBudgets(testData);
        setError(null);
        console.log('Successfully set budgets state');
        
      } catch (err) {
        console.error('Error in fetchBudgets:', err);
        setError(err.message || 'Failed to fetch budgets');
        
      } finally {
        console.log('Setting loading to false...');
        setLoading(false);
        console.log('fetchBudgets completed');
      }
    };
    
    // Wrap the entire effect in try-catch
    try {
      fetchBudgets();
    } catch (err) {
      console.error('Error in useEffect:', err);
      setError('Critical error in component initialization');
      setLoading(false);
    }
  }, []);
  
  const columns = [
    { id: 'name', label: 'Budget Name' },
    { id: 'amount', label: 'Amount', format: (value) => `$${value.toLocaleString()}` },
    { id: 'status', label: 'Status' }
  ];
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Budget Management (Simple Test)
      </Typography>
      
      <Typography variant="body1" gutterBottom>
        Testing without PageHeader and DataTable components
      </Typography>
      
      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
      )}
      
      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Budgets ({budgets.length})
          </Typography>
          {budgets.map(budget => (
            <Box key={budget.id} sx={{ mb: 1, p: 1, border: '1px solid #ccc' }}>
              <Typography variant="body1">{budget.name}</Typography>
              <Typography variant="body2">Amount: ${budget.amount.toLocaleString()}</Typography>
              <Typography variant="body2">Status: {budget.status}</Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default BudgetListSimple;