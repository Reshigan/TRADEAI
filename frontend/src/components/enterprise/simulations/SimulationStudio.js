import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Psychology,
  AttachMoney,
  ShowChart,
  CompareArrows,
  TrendingUp,
  Help
} from '@mui/icons-material';
import PromotionSimulator from './PromotionSimulator';
import BudgetOptimizer from './BudgetOptimizer';
import PricingSimulator from './PricingSimulator';
import WhatIfAnalyzer from './WhatIfAnalyzer';

function TabPanel({ children, value, index }) {
  return (
    <Fade in={value === index}>
      <div role="tabpanel" hidden={value !== index}>
        {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
      </div>
    </Fade>
  );
}

const simulationTypes = [
  {
    id: 'promotion',
    label: 'Promotion Impact',
    icon: <TrendingUp />,
    description: 'Analyze the impact of promotions on sales and profitability',
    color: '#0088FE'
  },
  {
    id: 'budget',
    label: 'Budget Optimization',
    icon: <AttachMoney />,
    description: 'Optimize budget allocation across categories',
    color: '#00C49F'
  },
  {
    id: 'pricing',
    label: 'Pricing Strategy',
    icon: <ShowChart />,
    description: 'Simulate pricing changes and their market impact',
    color: '#FFBB28'
  },
  {
    id: 'whatif',
    label: 'What-If Analysis',
    icon: <CompareArrows />,
    description: 'Model multiple scenarios and compare outcomes',
    color: '#FF8042'
  }
];

export default function SimulationStudio() {
  const [activeTab, setActiveTab] = useState(0);
  const [savedScenarios, setSavedScenarios] = useState([]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSaveScenario = (scenario) => {
    setSavedScenarios([...savedScenarios, { ...scenario, id: Date.now() }]);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            <Psychology sx={{ mr: 1, verticalAlign: 'middle', fontSize: 32 }} />
            Simulation Studio
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Run advanced simulations and scenario analyses to optimize your trade strategy
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Help">
            <IconButton color="primary">
              <Help />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<CompareArrows />}
            disabled={savedScenarios.length < 2}
          >
            Compare Scenarios ({savedScenarios.length})
          </Button>
        </Box>
      </Box>

      {/* Simulation Type Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {simulationTypes.map((type, index) => (
          <Grid item xs={12} sm={6} md={3} key={type.id}>
            <Paper
              sx={{
                p: 2,
                cursor: 'pointer',
                border: activeTab === index ? 2 : 1,
                borderColor: activeTab === index ? type.color : 'divider',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-4px)'
                }
              }}
              onClick={() => setActiveTab(index)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: `${type.color}20`,
                    color: type.color,
                    mr: 1
                  }}
                >
                  {type.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {type.label}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                {type.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Main Simulation Area */}
      <Paper sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, bgcolor: 'grey.50' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Promotion Impact" icon={<TrendingUp />} iconPosition="start" />
            <Tab label="Budget Optimization" icon={<AttachMoney />} iconPosition="start" />
            <Tab label="Pricing Strategy" icon={<ShowChart />} iconPosition="start" />
            <Tab label="What-If Analysis" icon={<CompareArrows />} iconPosition="start" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <TabPanel value={activeTab} index={0}>
            <PromotionSimulator onSaveScenario={handleSaveScenario} />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <BudgetOptimizer onSaveScenario={handleSaveScenario} />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <PricingSimulator onSaveScenario={handleSaveScenario} />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <WhatIfAnalyzer 
              onSaveScenario={handleSaveScenario}
              savedScenarios={savedScenarios}
            />
          </TabPanel>
        </Box>
      </Paper>

      {/* Saved Scenarios Panel */}
      {savedScenarios.length > 0 && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Saved Scenarios ({savedScenarios.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {savedScenarios.map((scenario) => (
              <Chip
                key={scenario.id}
                label={scenario.name || `Scenario ${scenario.id}`}
                color="primary"
                variant="outlined"
                onDelete={() => setSavedScenarios(savedScenarios.filter(s => s.id !== scenario.id))}
              />
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
