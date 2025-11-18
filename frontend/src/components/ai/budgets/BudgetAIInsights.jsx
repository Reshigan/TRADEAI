import React, { useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import AIInsightPanel from '../AIInsightPanel';

const BudgetAIInsights = ({ 
  budget = {},
  onApplyReallocation,
  onApplyOptimization,
  onApplyForecasting
}) => {
  const [activeInsights, setActiveInsights] = useState({
    reallocation: true,
    optimization: true,
    forecasting: true,
    roi: true
  });

  const handleDismiss = (type) => {
    setActiveInsights(prev => ({ ...prev, [type]: false }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <span>🤖</span> AI-Powered Budget Insights
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          {activeInsights.reallocation && (
            <AIInsightPanel
              title="Budget Reallocation Recommendations"
              intent={`Analyze budget allocation for ${budget.name || 'this budget'} and recommend optimal reallocation to maximize ROI`}
              context={{
                budgetId: budget._id,
                totalAmount: budget.totalAmount,
                currentAllocation: budget.allocation,
                performance: budget.performance
              }}
              onApply={onApplyReallocation}
              onDismiss={() => handleDismiss('reallocation')}
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {activeInsights.optimization && (
            <AIInsightPanel
              title="Budget Optimization Strategy"
              intent={`Optimize budget utilization for ${budget.name || 'this budget'} to improve efficiency and reduce waste`}
              context={{
                budgetId: budget._id,
                spendRate: budget.spendRate,
                remainingAmount: budget.remainingAmount,
                daysRemaining: budget.daysRemaining
              }}
              onApply={onApplyOptimization}
              onDismiss={() => handleDismiss('optimization')}
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {activeInsights.forecasting && (
            <AIInsightPanel
              title="Budget Forecasting"
              intent={`Forecast budget requirements and spending patterns for the next quarter based on historical data`}
              context={{
                budgetId: budget._id,
                historicalSpend: budget.historicalSpend,
                seasonality: budget.seasonality
              }}
              onApply={onApplyForecasting}
              onDismiss={() => handleDismiss('forecasting')}
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {activeInsights.roi && (
            <AIInsightPanel
              title="Expected ROI Analysis"
              intent={`Calculate expected ROI for different budget allocation scenarios`}
              context={{
                budgetId: budget._id,
                totalAmount: budget.totalAmount,
                historicalROI: budget.historicalROI
              }}
              onDismiss={() => handleDismiss('roi')}
            />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default BudgetAIInsights;
