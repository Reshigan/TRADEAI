import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const BudgetListSimple = () => {
  console.log('BudgetListSimple component rendering...');
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Budgets Page - Simple Test
      </Typography>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="body1">
          This is a simple test component to verify React rendering is working.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          If you can see this text, React components are rendering correctly.
        </Typography>
      </Paper>
    </Box>
  );
};

export default BudgetListSimple;