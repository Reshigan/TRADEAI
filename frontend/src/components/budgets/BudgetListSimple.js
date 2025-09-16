import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// Test importing the common components one by one
import { PageHeader } from '../common';

const BudgetListSimple = () => {
  console.log('BudgetListSimple component rendering...');
  
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  
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
        <Typography variant="body1">
          Testing PageHeader component - SUCCESS!
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          PageHeader is working correctly.
        </Typography>
      </Paper>
    </Box>
  );
};

export default BudgetListSimple;