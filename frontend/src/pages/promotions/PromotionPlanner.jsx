import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Stepper,
  Step,
  StepLabel,
  TextField,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Slider
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Save,
  PlayArrow,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import HierarchySelector from '../../components/hierarchy/HierarchySelector';
import simulationService from '../../services/simulation/simulationService';

const steps = ['Select Hierarchy', 'Configure Promotion', 'Review & Simulate', 'Finalize'];

const PromotionPlanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [lockRatios, setLockRatios] = useState(false);
  const [config, setConfig] = useState({
    name: '',
    type: 'price_discount',
    discountPercent: 10,
    startDate: '',
    endDate: '',
    duration: 14,
    budget: 10000,
    objectives: [],
    constraints: {}
  });
  const [simulation, setSimulation] = useState(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [aiRationale, setAiRationale] = useState(null);

  useEffect(() => {
    if (location.state?.prefill) {
      const prefill = location.state.prefill;
      if (prefill.customers) setSelectedCustomers(prefill.customers);
      if (prefill.products) setSelectedProducts(prefill.products);
      if (prefill.discountPercent) setConfig(prev => ({ ...prev, discountPercent: prefill.discountPercent }));
      if (prefill.duration) setConfig(prev => ({ ...prev, duration: prefill.duration }));
      if (prefill.budget) setConfig(prev => ({ ...prev, budget: prefill.budget }));
    }
  }, [location.state]);

  const handleNext = () => {
    if (activeStep === 2) {
      handleRunSimulation();
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleRunSimulation = async () => {
    setSimulationLoading(true);
    try {
      const response = await simulationService.simulatePromotion({
        customers: selectedCustomers.map(c => c.id),
        products: selectedProducts.map(p => p.id),
        discountPercent: config.discountPercent,
        duration: config.duration,
        budget: config.budget,
        lockRatios
      });

      setSimulation(response.simulation);
      setAiRationale(response.rationale);

      const conflictResponse = await simulationService.getConflictPreview({
        customers: selectedCustomers.map(c => c.id),
        products: selectedProducts.map(p => p.id),
        startDate: config.startDate,
        endDate: config.endDate
      });

      setConflicts(conflictResponse.conflicts || []);
    } catch (error) {
      console.error('Failed to run simulation:', error);
    } finally {
      setSimulationLoading(false);
    }
  };

  const handleSaveAndSubmit = async () => {
    try {
      const promotionData = {
        name: config.name,
        type: config.type,
        customers: selectedCustomers.map(c => c.id),
        products: selectedProducts.map(p => p.id),
        discountPercent: config.discountPercent,
        startDate: config.startDate,
        endDate: config.endDate,
        budget: config.budget,
        simulation: simulation,
        lockRatios
      };

      console.log('Creating promotion:', promotionData);

      navigate('/promotions', { 
        state: { 
          message: 'Promotion created successfully and submitted for approval' 
        } 
      });
    } catch (error) {
      console.error('Failed to create promotion:', error);
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return selectedCustomers.length > 0 && selectedProducts.length > 0;
      case 1:
        return config.name && config.startDate && config.endDate && config.budget > 0;
      case 2:
        return simulation !== null;
      default:
        return true;
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <HierarchySelector
                    type="customer"
                    selected={selectedCustomers}
                    onSelectionChange={setSelectedCustomers}
                    showAllocation={true}
                    lockRatios={lockRatios}
                    onLockRatiosChange={setLockRatios}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <HierarchySelector
                    type="product"
                    selected={selectedProducts}
                    onSelectionChange={setSelectedProducts}
                    showAllocation={false}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                Select customers and products from the hierarchy. Budget will be allocated proportionally based on revenue/volume.
              </Alert>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Promotion Configuration
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Promotion Name"
                        value={config.name}
                        onChange={(e) => setConfig({ ...config, name: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        select
                        label="Promotion Type"
                        value={config.type}
                        onChange={(e) => setConfig({ ...config, type: e.target.value })}
                      >
                        <MenuItem value="price_discount">Price Discount</MenuItem>
                        <MenuItem value="bogo">Buy One Get One</MenuItem>
                        <MenuItem value="bundle">Bundle Deal</MenuItem>
                        <MenuItem value="volume_discount">Volume Discount</MenuItem>
                        <MenuItem value="rebate">Rebate</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Discount %"
                        type="number"
                        value={config.discountPercent}
                        onChange={(e) => setConfig({ ...config, discountPercent: parseFloat(e.target.value) })}
                        InputProps={{ inputProps: { min: 0, max: 100, step: 1 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Start Date"
                        type="date"
                        value={config.startDate}
                        onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="End Date"
                        type="date"
                        value={config.endDate}
                        onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Total Budget"
                        type="number"
                        value={config.budget}
                        onChange={(e) => setConfig({ ...config, budget: parseFloat(e.target.value) })}
                        InputProps={{ 
                          startAdornment: '$',
                          inputProps: { min: 0, step: 1000 } 
                        }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" gutterBottom>
                        Discount Sensitivity
                      </Typography>
                      <Slider
                        value={config.discountPercent}
                        onChange={(e, value) => setConfig({ ...config, discountPercent: value })}
                        min={0}
                        max={50}
                        step={1}
                        marks={[
                          { value: 0, label: '0%' },
                          { value: 10, label: '10%' },
                          { value: 20, label: '20%' },
                          { value: 30, label: '30%' },
                          { value: 50, label: '50%' }
                        ]}
                        valueLabelDisplay="auto"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Live Preview
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Selected Customers
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {selectedCustomers.length}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Selected Products
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {selectedProducts.length}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Duration
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {config.startDate && config.endDate 
                        ? `${Math.ceil((new Date(config.endDate) - new Date(config.startDate)) / (1000 * 60 * 60 * 24))} days`
                        : 'Not set'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Budget
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      ${config.budget.toLocaleString()}
                    </Typography>
                  </Box>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="caption">
                      Budget will be allocated proportionally across selected hierarchy levels
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Simulation Results
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={simulationLoading ? <CircularProgress size={16} /> : <PlayArrow />}
                      onClick={handleRunSimulation}
                      disabled={simulationLoading}
                    >
                      {simulationLoading ? 'Running...' : 'Re-run Simulation'}
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  
                  {simulationLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                      <CircularProgress />
                    </Box>
                  ) : simulation ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Net Revenue Impact
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: simulation.netRevenue >= 0 ? 'success.main' : 'error.main' }}>
                            ${simulation.netRevenue?.toLocaleString() || 0}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            ROI
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: simulation.roi >= 1.5 ? 'success.main' : 'warning.main' }}>
                            {simulation.roi?.toFixed(2) || 0}x
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Uplift
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                            {simulation.uplift?.toFixed(1) || 0}%
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Confidence
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {((simulation.confidence || 0.75) * 100).toFixed(0)}%
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  ) : (
                    <Alert severity="info">
                      Click "Run Simulation" to see expected results
                    </Alert>
                  )}

                  {aiRationale && (
                    <Alert severity="info" sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        AI Rationale
                      </Typography>
                      <Typography variant="body2">
                        {aiRationale}
                      </Typography>
                    </Alert>
                  )}

                  {conflicts.length > 0 && (
                    <Alert severity="warning" sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Conflicts Detected
                      </Typography>
                      {conflicts.map((conflict, idx) => (
                        <Typography key={idx} variant="body2">
                          • {conflict.description}
                        </Typography>
                      ))}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Review & Submit
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Promotion Details
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Name</Typography>
                        <Typography variant="body1">{config.name}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Type</Typography>
                        <Typography variant="body1">{config.type}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Discount</Typography>
                        <Typography variant="body1">{config.discountPercent}%</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Duration</Typography>
                        <Typography variant="body1">{config.startDate} to {config.endDate}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Budget</Typography>
                        <Typography variant="body1">${config.budget.toLocaleString()}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Expected Results
                      </Typography>
                      {simulation && (
                        <>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">Net Revenue Impact</Typography>
                            <Typography variant="body1" sx={{ color: simulation.netRevenue >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
                              ${simulation.netRevenue?.toLocaleString() || 0}
                            </Typography>
                          </Box>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">ROI</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {simulation.roi?.toFixed(2) || 0}x
                            </Typography>
                          </Box>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">Confidence</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {((simulation.confidence || 0.75) * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Grid>
                  </Grid>

                  <Alert severity="success" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                      Ready to submit for approval. This promotion will be sent to your manager for review.
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          Promotion Planner
        </Typography>
        <Typography variant="body2" color="text.secondary">
          AI-guided promotion planning with hierarchy-based revenue impact
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSaveAndSubmit}
                  startIcon={<CheckCircle />}
                  disabled={!canProceed()}
                >
                  Submit for Approval
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                  disabled={!canProceed()}
                >
                  {activeStep === 2 ? 'Review' : 'Next'}
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PromotionPlanner;
