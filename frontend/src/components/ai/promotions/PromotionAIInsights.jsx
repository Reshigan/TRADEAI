import React, { useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import AIInsightPanel from '../AIInsightPanel';

const PromotionAIInsights = ({ 
  promotion = {},
  onApplyUplift,
  onApplyPricing,
  onApplyTiming,
  onApplyBudget
}) => {
  const [activeInsights, setActiveInsights] = useState({
    uplift: true,
    pricing: true,
    timing: true,
    budget: true
  });

  const handleDismiss = (type) => {
    setActiveInsights(prev => ({ ...prev, [type]: false }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <span>🤖</span> AI-Powered Promotion Insights
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          {activeInsights.uplift && (
            <AIInsightPanel
              title="Promotion Uplift Prediction"
              intent={`Predict the expected sales uplift for a ${promotion.type || 'discount'} promotion on ${promotion.productName || 'this product'} with ${promotion.discountPercentage || 15}% discount`}
              context={{
                promotionId: promotion._id,
                productId: promotion.productId,
                discountPercentage: promotion.discountPercentage,
                duration: promotion.duration
              }}
              onApply={onApplyUplift}
              onDismiss={() => handleDismiss('uplift')}
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {activeInsights.pricing && (
            <AIInsightPanel
              title="Optimal Pricing Recommendation"
              intent={`Optimize pricing for ${promotion.productName || 'this product'} to maximize profit while maintaining competitiveness`}
              context={{
                productId: promotion.productId,
                currentPrice: promotion.basePrice,
                targetMargin: 0.4
              }}
              onApply={onApplyPricing}
              onDismiss={() => handleDismiss('pricing')}
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {activeInsights.timing && (
            <AIInsightPanel
              title="Optimal Timing Analysis"
              intent={`Analyze the best timing for running this promotion based on seasonality and historical patterns`}
              context={{
                productId: promotion.productId,
                customerId: promotion.customerId,
                proposedStartDate: promotion.startDate
              }}
              onApply={onApplyTiming}
              onDismiss={() => handleDismiss('timing')}
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {activeInsights.budget && (
            <AIInsightPanel
              title="Budget Allocation Recommendation"
              intent={`Recommend optimal budget allocation for this promotion to maximize ROI`}
              context={{
                promotionId: promotion._id,
                estimatedCost: promotion.estimatedCost,
                expectedRevenue: promotion.expectedRevenue
              }}
              onApply={onApplyBudget}
              onDismiss={() => handleDismiss('budget')}
            />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default PromotionAIInsights;
