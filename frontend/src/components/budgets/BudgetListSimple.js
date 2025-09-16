import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// Test importing the common components one by one
import { PageHeader, DataTable } from '../common';
import { budgetService } from '../../services/api';

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
        
        console.log('About to call budgetService.getAll()...');
        const response = await budgetService.getAll();
        console.log('budgetService.getAll() completed. Response:', response);
        
        // budgetService.getAll() already returns response.data, so we don't need .data again
        const budgetsData = Array.isArray(response) ? response : (response.data || response.budgets || []);
        console.log('Processed budgets data:', budgetsData);
        
        console.log('Setting budgets state...');
        setBudgets(budgetsData);
        setError(null);
        console.log('Successfully set budgets state');
        
      } catch (err) {
        console.error('Error in fetchBudgets:', err);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          response: err.response
        });
        
        setError(err.message || 'Failed to fetch budgets');
        
        // Fallback to test data
        console.log('Setting fallback data...');
        setBudgets([
          { id: 1, name: 'Test Budget 1 (Fallback)', amount: 10000, status: 'active' },
          { id: 2, name: 'Test Budget 2 (Fallback)', amount: 15000, status: 'pending' }
        ]);
        
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
      <PageHeader 
        title="Marketing Budget"
        subtitle="Manage your trade spend budgets"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => console.log('Add budget clicked')}
          >
            Add Budget
          </Button>
        }
      />
      
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="body1" gutterBottom>
          Testing API call and DataTable component:
        </Typography>
        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            API Error: {error} (showing fallback data)
          </Typography>
        )}
        <DataTable
          columns={columns}
          data={budgets}
          title="Budgets from API"
          loading={loading}
        />
      </Paper>
    </Box>
  );
};

export default BudgetListSimple;