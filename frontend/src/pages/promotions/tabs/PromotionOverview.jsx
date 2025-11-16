import React from 'react';
import { Box, Paper, Typography, Grid, Chip } from '@mui/material';

const PromotionOverview = ({ promotion }) => {
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Basic Information</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Promotion Type</Typography>
            <Typography variant="body1">{promotion.promotionType || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Chip label={promotion.status} size="small" />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Start Date</Typography>
            <Typography variant="body1">
              {promotion.period?.startDate ? new Date(promotion.period.startDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">End Date</Typography>
            <Typography variant="body1">
              {promotion.period?.endDate ? new Date(promotion.period.endDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Financial Summary</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Estimated Cost</Typography>
            <Typography variant="h6">
              R {promotion.financial?.costs?.totalCost?.toLocaleString() || '0'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Actual Cost</Typography>
            <Typography variant="h6">
              R {promotion.financial?.actual?.totalCost?.toLocaleString() || '0'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Incremental Revenue</Typography>
            <Typography variant="h6">
              R {promotion.financial?.actual?.incrementalRevenue?.toLocaleString() || '0'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">ROI</Typography>
            <Typography variant="h6" color={promotion.financial?.profitability?.roi > 0 ? 'success.main' : 'error.main'}>
              {promotion.financial?.profitability?.roi?.toFixed(1) || '0'}%
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Description</Typography>
        <Typography variant="body1">
          {promotion.description || 'No description available'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default PromotionOverview;
