import React from 'react';
import { Box, Stepper, Step, StepLabel, Paper, Typography } from '@mui/material';
import { useCompanyType } from '../../contexts/CompanyTypeContext';

/**
 * ProcessStepper component displays company-type-specific process steps
 * Shows the current step in the trade spend management workflow
 * 
 * @param {string} currentStep - The current step in the process
 * @param {boolean} compact - Whether to show compact version (default: false)
 */
const ProcessStepper = ({ currentStep, compact = false }) => {
  const { processSteps, companyType } = useCompanyType();
  
  const getCurrentStepIndex = () => {
    const index = processSteps.findIndex(step => 
      step.toLowerCase().replace(/\s+/g, '-') === currentStep?.toLowerCase()
    );
    return index >= 0 ? index : 0;
  };
  
  const activeStep = getCurrentStepIndex();
  
  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Process Step:
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {processSteps[activeStep]} ({activeStep + 1}/{processSteps.length})
        </Typography>
      </Box>
    );
  }
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {companyType === 'manufacturer' && 'Trade Spend Management Process'}
        {companyType === 'distributor' && 'Funding Allocation Process'}
        {companyType === 'retailer' && 'Offer Management Process'}
      </Typography>
      <Stepper activeStep={activeStep} alternativeLabel>
        {processSteps.map((label, index) => (
          <Step key={label} completed={index < activeStep}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};

export default ProcessStepper;
