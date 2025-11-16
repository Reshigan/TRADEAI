import React, { useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import AIInsightPanel from '../AIInsightPanel';

const CustomerAIInsights = ({ 
  customer = {},
  onApplySegmentation,
  onApplyNextBestAction,
  onApplyRecommendations
}) => {
  const [activeInsights, setActiveInsights] = useState({
    ltv: true,
    churn: true,
    segment: true,
    recommendations: true
  });

  const handleDismiss = (type) => {
    setActiveInsights(prev => ({ ...prev, [type]: false }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <span>🤖</span> AI-Powered Customer Insights
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          {activeInsights.ltv && (
            <AIInsightPanel
              title="Customer Lifetime Value Prediction"
              intent={`Predict the lifetime value for customer ${customer.name || customer.customerName || 'this customer'}`}
              context={{
                customerId: customer._id,
                currentRevenue: customer.totalRevenue,
                purchaseFrequency: customer.purchaseFrequency
              }}
              onDismiss={() => handleDismiss('ltv')}
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {activeInsights.churn && (
            <AIInsightPanel
              title="Churn Risk Analysis"
              intent={`Analyze churn risk for customer ${customer.name || customer.customerName || 'this customer'} and identify retention strategies`}
              context={{
                customerId: customer._id,
                lastPurchaseDate: customer.lastPurchaseDate,
                purchaseFrequency: customer.purchaseFrequency
              }}
              onDismiss={() => handleDismiss('churn')}
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {activeInsights.segment && (
            <AIInsightPanel
              title="Customer Segmentation"
              intent={`Determine the optimal segment for customer ${customer.name || customer.customerName || 'this customer'} using RFM analysis`}
              context={{
                customerId: customer._id,
                recency: customer.recency,
                frequency: customer.frequency,
                monetary: customer.monetary
              }}
              onApply={onApplySegmentation}
              onDismiss={() => handleDismiss('segment')}
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {activeInsights.recommendations && (
            <AIInsightPanel
              title="Product Recommendations"
              intent={`Generate personalized product recommendations for customer ${customer.name || customer.customerName || 'this customer'}`}
              context={{
                customerId: customer._id,
                purchaseHistory: customer.purchaseHistory,
                preferences: customer.preferences
              }}
              onApply={onApplyRecommendations}
              onDismiss={() => handleDismiss('recommendations')}
            />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerAIInsights;
