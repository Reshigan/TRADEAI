import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';

const BudgetOverview = ({ budget }) => {
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Budget Information</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Budget Type</Typography>
            <Typography variant="body1">{budget.budgetType || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Year</Typography>
            <Typography variant="body1">{budget.year || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Typography variant="body1">{budget.status || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Version</Typography>
            <Typography variant="body1">{budget.version || 1}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Budget Summary</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Total Amount</Typography>
            <Typography variant="h6">R {(budget.amount || budget.annualTotals?.sales?.value || 0).toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Utilized</Typography>
            <Typography variant="h6">R {(budget.utilized || budget.annualTotals?.tradeSpend?.total || 0).toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Remaining</Typography>
            <Typography variant="h6">R {((budget.amount || 0) - (budget.utilized || 0)).toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Utilization</Typography>
            <Typography variant="h6" color={(budget.utilized || 0) / (budget.amount || 1) > 0.8 ? 'error.main' : 'success.main'}>
              {budget.amount ? ((budget.utilized || 0) / budget.amount * 100).toFixed(1) : '0'}%
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default BudgetOverview;
