import React, { useState } from 'react';
import {
  Box,
  Container,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert
} from '@mui/material';
import { CheckCircle, ArrowForward, ArrowBack } from '@mui/icons-material';

const steps = [
  'Define Objectives',
  'Target Customers',
  'Set Budget & Timeline',
  'AI Optimization',
  'Configure Mechanics',
  'Approval Process',
  'Launch & Monitor'
];

const PromotionFlow = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [promotionData, setPromotionData] = useState({
    name: '',
    objective: '',
    targetCustomers: [],
    budget: '',
    startDate: '',
    endDate: '',
    discountType: '',
    discountValue: ''
  });

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (field, value) => {
    setPromotionData({ ...promotionData, [field]: value });
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Define Your Promotion Objectives
            </Typography>
            <TextField
              fullWidth
              label="Promotion Name"
              value={promotionData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Promotion Objective</InputLabel>
              <Select
                value={promotionData.objective}
                onChange={(e) => handleInputChange('objective', e.target.value)}
              >
                <MenuItem value="revenue">Increase Revenue</MenuItem>
                <MenuItem value="volume">Increase Volume</MenuItem>
                <MenuItem value="market-share">Gain Market Share</MenuItem>
                <MenuItem value="clearance">Clearance/Stock Rotation</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>AI Recommendation:</strong> Based on historical data, revenue-focused promotions have 23% higher ROI in your category.
            </Alert>
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Target Customers
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              <strong>AI Segmentation:</strong> 3 high-value customer segments identified for this promotion type.
            </Alert>
            <FormControl fullWidth margin="normal">
              <InputLabel>Customer Segment</InputLabel>
              <Select
                multiple
                value={promotionData.targetCustomers}
                onChange={(e) => handleInputChange('targetCustomers', e.target.value)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="premium">Premium Retailers</MenuItem>
                <MenuItem value="standard">Standard Retailers</MenuItem>
                <MenuItem value="value">Value Retailers</MenuItem>
                <MenuItem value="wholesale">Wholesale Customers</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Set Budget & Timeline
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Budget Amount (ZAR)"
                  type="number"
                  value={promotionData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={promotionData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={promotionData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
        );
      
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              AI Optimization Engine
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              <strong>AI Analysis Complete!</strong> Predicted ROI: 4.8x
            </Alert>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" gutterBottom>
                Optimization Recommendations:
              </Typography>
              <ul>
                <li>Recommended discount: 15-20% for maximum ROI</li>
                <li>Best launch day: Thursday (highest engagement)</li>
                <li>Expected incremental revenue: R 245,000</li>
                <li>Predicted customer participation: 67%</li>
              </ul>
            </Paper>
          </Box>
        );
      
      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Promotion Mechanics
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Discount Type</InputLabel>
              <Select
                value={promotionData.discountType}
                onChange={(e) => handleInputChange('discountType', e.target.value)}
              >
                <MenuItem value="percentage">Percentage Off</MenuItem>
                <MenuItem value="fixed">Fixed Amount Off</MenuItem>
                <MenuItem value="bogo">Buy One Get One</MenuItem>
                <MenuItem value="bundle">Bundle Deal</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Discount Value"
              type="number"
              value={promotionData.discountValue}
              onChange={(e) => handleInputChange('discountValue', e.target.value)}
              margin="normal"
            />
          </Box>
        );
      
      case 5:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Approval Workflow
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              This promotion requires approval from: Trade Marketing Manager → Finance Director
            </Alert>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Approval Status:
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2">✅ Created by: Current User</Typography>
                <Typography variant="body2">⏳ Pending: Trade Marketing Manager</Typography>
                <Typography variant="body2">⏳ Pending: Finance Director</Typography>
              </Box>
            </Paper>
          </Box>
        );
      
      case 6:
        return (
          <Box textAlign="center">
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Promotion Ready to Launch!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Once approved, your promotion will go live automatically on the start date.
            </Typography>
            <Paper sx={{ p: 3, mt: 3, textAlign: 'left' }}>
              <Typography variant="h6" gutterBottom>
                Promotion Summary:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Name:</Typography>
                  <Typography variant="body1">{promotionData.name || 'Not set'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Budget:</Typography>
                  <Typography variant="body1">R {promotionData.budget || '0'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Duration:</Typography>
                  <Typography variant="body1">
                    {promotionData.startDate} to {promotionData.endDate}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Predicted ROI:</Typography>
                  <Typography variant="body1" color="success.main">4.8x</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        AI-Powered Promotion Creation
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Create data-driven promotions with AI optimization
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 4, minHeight: 400 }}>
        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBack />}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={activeStep === steps.length - 1 ? <CheckCircle /> : <ArrowForward />}
          >
            {activeStep === steps.length - 1 ? 'Submit for Approval' : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default PromotionFlow;
