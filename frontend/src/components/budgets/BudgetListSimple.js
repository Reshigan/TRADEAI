import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// Test importing the common components one by one
import { PageHeader, DataTable } from '../common';

const BudgetListSimple = () => {
  console.log('BudgetListSimple component rendering...');
  
  const [budgets, setBudgets] = useState([
    { id: 1, name: 'Test Budget 1', amount: 10000, status: 'active' },
    { id: 2, name: 'Test Budget 2', amount: 15000, status: 'pending' }
  ]);
  const [loading, setLoading] = useState(false);
  
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
          Testing DataTable component:
        </Typography>
        <DataTable
          columns={columns}
          data={budgets}
          title="Test Budgets"
          loading={loading}
        />
      </Paper>
    </Box>
  );
};

export default BudgetListSimple;