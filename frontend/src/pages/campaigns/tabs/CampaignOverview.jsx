import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { formatLabel } from '../../../utils/formatters';

const CampaignOverview = ({ campaign }) => {
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Campaign Information</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Campaign Code</Typography>
            <Typography variant="body1">{campaign.campaignCode || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Type</Typography>
            <Typography variant="body1">{campaign.campaignType ? formatLabel(campaign.campaignType) : 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Start Date</Typography>
            <Typography variant="body1">{campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">End Date</Typography>
            <Typography variant="body1">{campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Description</Typography>
            <Typography variant="body1">{campaign.description || 'N/A'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Campaign Metrics</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Total Budget</Typography>
            <Typography variant="h6">R {(campaign.budgetAmount || campaign.budget?.total || 0).toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Spent</Typography>
            <Typography variant="h6">R {(campaign.spentAmount || campaign.budget?.spent || 0).toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Remaining</Typography>
            <Typography variant="h6">
              R {((campaign.budgetAmount || campaign.budget?.total || 0) - (campaign.spentAmount || campaign.budget?.spent || 0)).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Promotions</Typography>
            <Typography variant="h6">{campaign.promotionIds?.length || campaign.promotions?.length || 0}</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default CampaignOverview;
