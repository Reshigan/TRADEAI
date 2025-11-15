import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  TextField,
  MenuItem,
  Chip,
  Divider,
  Paper,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Tooltip,
  Select,
  FormControl,
  InputLabel,
  Slider
} from '@mui/material';
import {
  Add,
  Delete,
  ContentCopy,
  PlayArrow,
  Compare,
  Save,
  Share,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShowChart,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import simulationService from '../../services/simulation/simulationService';
import HierarchySelector from '../../components/hierarchy/HierarchySelector';
import customerService from '../../services/customer/customerService';
import productService from '../../services/product/productService';

const SimulationStudio = () => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([
    {
      id: 'baseline',
      name: 'Baseline',
      isBaseline: true,
      config: {
        discountPercent: 0,
        duration: 14,
        budget: 0
      },
      results: null,
      loading: false
    }
  ]);
  const [activeScenario, setActiveScenario] = useState('baseline');
  const [compareMode, setCompareMode] = useState(false);
  const [globalConstraints, setGlobalConstraints] = useState({
    totalBudget: 100000,
    minROI: 1.5,
    maxConcurrentPromotions: 5
  });
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [lockRatios, setLockRatios] = useState(false);

  const handleAddScenario = () => {
    const newScenario = {
      id: `scenario-${Date.now()}`,
      name: `Scenario ${scenarios.length}`,
      isBaseline: false,
      config: {
        discountPercent: 10,
        duration: 14,
        budget: 10000
      },
      results: null,
      loading: false
    };
    setScenarios([...scenarios, newScenario]);
    setActiveScenario(newScenario.id);
  };

  const handleDuplicateScenario = (scenarioId) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const newScenario = {
      ...scenario,
      id: `scenario-${Date.now()}`,
      name: `${scenario.name} (Copy)`,
      isBaseline: false,
      results: null
    };
    setScenarios([...scenarios, newScenario]);
    setActiveScenario(newScenario.id);
  };

  const handleDeleteScenario = (scenarioId) => {
    if (scenarios.length <= 1) return;
    const newScenarios = scenarios.filter(s => s.id !== scenarioId);
    setScenarios(newScenarios);
    if (activeScenario === scenarioId) {
      setActiveScenario(newScenarios[0].id);
    }
  };

  const handleUpdateScenario = (scenarioId, updates) => {
    setScenarios(scenarios.map(s => 
      s.id === scenarioId ? { ...s, ...updates } : s
    ));
  };

  const handleRunScenario = async (scenarioId) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    handleUpdateScenario(scenarioId, { loading: true });

    try {
      const response = await simulationService.simulatePromotion({
        customers: selectedCustomers.map(c => c.id),
        products: selectedProducts.map(p => p.id),
        discountPercent: scenario.config.discountPercent,
        duration: scenario.config.duration,
        budget: scenario.config.budget,
        lockRatios
      });

      handleUpdateScenario(scenarioId, { 
        results: response.simulation,
        loading: false 
      });
    } catch (error) {
      console.error('Failed to run simulation:', error);
      handleUpdateScenario(scenarioId, { loading: false });
    }
  };

  const handleRunAllScenarios = async () => {
    for (const scenario of scenarios) {
      await handleRunScenario(scenario.id);
    }
  };

  const handleCompareScenarios = async () => {
    const scenariosToCompare = scenarios
      .filter(s => s.results)
      .map(s => ({
        name: s.name,
        config: s.config,
        results: s.results
      }));

    if (scenariosToCompare.length < 2) {
      alert('Please run at least 2 scenarios to compare');
      return;
    }

    try {
      const response = await simulationService.compareScenarios(scenariosToCompare);
      console.log('Comparison results:', response);
      setCompareMode(true);
    } catch (error) {
      console.error('Failed to compare scenarios:', error);
    }
  };

  const handleApplyScenario = (scenarioId) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario || !scenario.results) return;

    if (window.confirm(`Apply "${scenario.name}" and create promotion?`)) {
      navigate('/promotions/new-flow', {
        state: {
          prefill: {
            customers: selectedCustomers,
            products: selectedProducts,
            discountPercent: scenario.config.discountPercent,
            duration: scenario.config.duration,
            budget: scenario.config.budget,
            simulation: scenario.results
          }
        }
      });
    }
  };

  const renderScenarioConfig = (scenario) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <TextField
            value={scenario.name}
            onChange={(e) => handleUpdateScenario(scenario.id, { name: e.target.value })}
            variant="standard"
            sx={{ fontWeight: 600, fontSize: '1.1rem' }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!scenario.isBaseline && (
              <>
                <Tooltip title="Duplicate">
                  <IconButton size="small" onClick={() => handleDuplicateScenario(scenario.id)}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteScenario(scenario.id)}
                    color="error"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Discount %"
              type="number"
              value={scenario.config.discountPercent}
              onChange={(e) => handleUpdateScenario(scenario.id, {
                config: { ...scenario.config, discountPercent: parseFloat(e.target.value) }
              })}
              disabled={scenario.isBaseline}
              InputProps={{ inputProps: { min: 0, max: 100, step: 1 } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Duration (days)"
              type="number"
              value={scenario.config.duration}
              onChange={(e) => handleUpdateScenario(scenario.id, {
                config: { ...scenario.config, duration: parseInt(e.target.value) }
              })}
              disabled={scenario.isBaseline}
              InputProps={{ inputProps: { min: 1, max: 365, step: 1 } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Budget"
              type="number"
              value={scenario.config.budget}
              onChange={(e) => handleUpdateScenario(scenario.id, {
                config: { ...scenario.config, budget: parseFloat(e.target.value) }
              })}
              disabled={scenario.isBaseline}
              InputProps={{ 
                startAdornment: '$',
                inputProps: { min: 0, step: 1000 } 
              }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={scenario.loading ? <CircularProgress size={16} /> : <PlayArrow />}
            onClick={() => handleRunScenario(scenario.id)}
            disabled={scenario.loading || selectedCustomers.length === 0 || selectedProducts.length === 0}
            fullWidth
          >
            {scenario.loading ? 'Running...' : 'Run Simulation'}
          </Button>
          {scenario.results && (
            <Button
              variant="outlined"
              onClick={() => handleApplyScenario(scenario.id)}
              fullWidth
            >
              Apply to Promotion
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const renderScenarioResults = (scenario) => {
    if (!scenario.results) {
      return (
        <Alert severity="info">
          Configure and run this scenario to see results
        </Alert>
      );
    }

    const results = scenario.results;
    const netRevenue = results.netRevenue || 0;
    const roi = results.roi || 0;
    const uplift = results.uplift || 0;

    return (
      <Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Net Revenue Impact
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: netRevenue >= 0 ? 'success.main' : 'error.main' }}>
                ${netRevenue.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                {netRevenue >= 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  vs baseline
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ROI
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: roi >= 1.5 ? 'success.main' : 'warning.main' }}>
                {roi.toFixed(2)}x
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {roi >= globalConstraints.minROI ? 'Meets target' : 'Below target'}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Uplift
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                {uplift.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Volume increase
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Confidence
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {((results.confidence || 0.75) * 100).toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Prediction accuracy
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Revenue Waterfall
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 1 }}>
            {[
              { label: 'Baseline', value: results.baselineRevenue || 0, color: 'grey.400' },
              { label: 'Uplift', value: results.upliftRevenue || 0, color: 'success.light' },
              { label: 'Spend', value: -(scenario.config.budget || 0), color: 'error.light' },
              { label: 'Net', value: netRevenue, color: netRevenue >= 0 ? 'success.main' : 'error.main' }
            ].map((item, idx) => {
              const maxValue = Math.max(
                results.baselineRevenue || 0,
                results.upliftRevenue || 0,
                scenario.config.budget || 0,
                Math.abs(netRevenue)
              );
              const height = (Math.abs(item.value) / maxValue) * 100;
              
              return (
                <Box key={idx} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    ${Math.abs(item.value).toLocaleString()}
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      height: `${height}%`,
                      bgcolor: item.color,
                      borderRadius: 1,
                      minHeight: 20
                    }}
                  />
                  <Typography variant="caption" sx={{ mt: 1 }}>
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>

        {results.hierarchyBreakdown && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Hierarchy Breakdown
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {results.hierarchyBreakdown.map((item, idx) => (
              <Box key={idx} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{item.name}</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ${item.netRevenue.toLocaleString()} ({item.allocation.toFixed(1)}%)
                  </Typography>
                </Box>
                <Box sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
                  <Box
                    sx={{
                      height: '100%',
                      bgcolor: item.netRevenue >= 0 ? 'success.main' : 'error.main',
                      width: `${item.allocation}%`
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Paper>
        )}
      </Box>
    );
  };

  const activeScenarioData = scenarios.find(s => s.id === activeScenario);

  return (
    <Box sx={{ p: 3, maxWidth: 1800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 4 }}>
        <div>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Simulation Studio
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compare multiple promotion scenarios with hierarchy-based revenue impact
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PlayArrow />}
            onClick={handleRunAllScenarios}
            disabled={selectedCustomers.length === 0 || selectedProducts.length === 0}
          >
            Run All
          </Button>
          <Button
            variant="outlined"
            startIcon={<Compare />}
            onClick={handleCompareScenarios}
            disabled={scenarios.filter(s => s.results).length < 2}
          >
            Compare
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddScenario}
            disabled={scenarios.length >= 4}
          >
            Add Scenario
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Global Constraints
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TextField
                fullWidth
                label="Total Budget"
                type="number"
                value={globalConstraints.totalBudget}
                onChange={(e) => setGlobalConstraints({
                  ...globalConstraints,
                  totalBudget: parseFloat(e.target.value)
                })}
                sx={{ mb: 2 }}
                InputProps={{ startAdornment: '$' }}
              />
              <TextField
                fullWidth
                label="Min ROI"
                type="number"
                value={globalConstraints.minROI}
                onChange={(e) => setGlobalConstraints({
                  ...globalConstraints,
                  minROI: parseFloat(e.target.value)
                })}
                sx={{ mb: 2 }}
                InputProps={{ endAdornment: 'x' }}
              />
              <TextField
                fullWidth
                label="Max Concurrent"
                type="number"
                value={globalConstraints.maxConcurrentPromotions}
                onChange={(e) => setGlobalConstraints({
                  ...globalConstraints,
                  maxConcurrentPromotions: parseInt(e.target.value)
                })}
              />
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
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

        <Grid item xs={12} md={9}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={activeScenario}
              onChange={(e, newValue) => setActiveScenario(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {scenarios.map(scenario => (
                <Tab
                  key={scenario.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {scenario.name}
                      {scenario.results && (
                        <Chip
                          label={`ROI: ${(scenario.results.roi || 0).toFixed(2)}x`}
                          size="small"
                          color={scenario.results.roi >= globalConstraints.minROI ? 'success' : 'warning'}
                        />
                      )}
                    </Box>
                  }
                  value={scenario.id}
                />
              ))}
            </Tabs>
          </Box>

          {activeScenarioData && (
            <Box>
              {renderScenarioConfig(activeScenarioData)}
              {renderScenarioResults(activeScenarioData)}
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimulationStudio;
