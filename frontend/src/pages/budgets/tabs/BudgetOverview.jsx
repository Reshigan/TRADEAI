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
        <Typography variant="h6" gutterBottom>Annual Totals</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Total Sales</Typography>
            <Typography variant="h6">R {budget.annualTotals?.sales?.value?.toLocaleString() || '0'}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Total Trade Spend</Typography>
            <Typography variant="h6">R {budget.annualTotals?.tradeSpend?.total?.toLocaleString() || '0'}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Gross Margin</Typography>
            <Typography variant="h6">R {budget.annualTotals?.profitability?.grossMargin?.toLocaleString() || '0'}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">ROI</Typography>
            <Typography variant="h6" color={budget.annualTotals?.profitability?.roi > 0 ? 'success.main' : 'error.main'}>
              {budget.annualTotals?.profitability?.roi?.toFixed(1) || '0'}%
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default BudgetOverview;
