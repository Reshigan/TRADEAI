import React, { useState } from 'react';
import { Box, Container, Typography, Grid, Paper, Button, Chip, Divider } from '@mui/material';
import { 
  Timeline as TimelineIcon, 
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material';
import ProcessStepper from '../components/common/ProcessStepper.enhanced';
import ProcessTracker from '../components/common/ProcessTracker';
import ProcessFlow from '../components/common/ProcessFlow';
import ProcessWizard from '../components/common/ProcessWizard';

/**
 * Process UI Showcase
 * Demonstrates all world-class process components
 */
const ProcessShowcase = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [activeStep, setActiveStep] = useState(2);

  // Sample process data
  const processSteps = [
    {
      id: 'planning',
      title: 'Planning & Strategy',
      description: 'Define objectives, budget, and target metrics',
      status: 'completed',
      estimatedTime: '3 days',
      actualTime: '2.5 days',
      assignee: 'Sarah Chen',
      confidence: 95,
      timestamp: 'Jan 15, 2024',
      details: () => (
        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="body2" paragraph>
            <strong>Key Deliverables:</strong>
          </Typography>
          <ul>
            <li>Budget allocation: $500,000</li>
            <li>Target ROI: 180%</li>
            <li>Timeline: Q1 2024</li>
          </ul>
        </Box>
      ),
    },
    {
      id: 'approval',
      title: 'Management Approval',
      description: 'Review and approve by department heads',
      status: 'completed',
      estimatedTime: '2 days',
      actualTime: '1.5 days',
      assignee: 'Michael Ross',
      confidence: 92,
      timestamp: 'Jan 18, 2024',
    },
    {
      id: 'execution',
      title: 'Campaign Execution',
      description: 'Launch and monitor promotional activities',
      status: 'active',
      estimatedTime: '14 days',
      assignee: 'Emily Watson',
      confidence: 87,
      details: () => (
        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="body2" paragraph>
            <strong>Current Activities:</strong>
          </Typography>
          <ul>
            <li>12 active promotions</li>
            <li>Budget utilized: 45%</li>
            <li>Current ROI: 165%</li>
          </ul>
        </Box>
      ),
    },
    {
      id: 'analysis',
      title: 'Performance Analysis',
      description: 'Measure results and gather insights',
      status: 'pending',
      estimatedTime: '5 days',
      assignee: 'David Kim',
      confidence: 0,
    },
    {
      id: 'optimization',
      title: 'Optimization & Scaling',
      description: 'Refine strategy and scale successful tactics',
      status: 'pending',
      estimatedTime: '7 days',
      assignee: 'Sarah Chen',
      confidence: 0,
    },
  ];

  // Wizard steps
  const wizardSteps = [
    {
      id: 'basics',
      title: 'Basic Info',
      description: 'Enter promotion details',
      content: ({ data, onChange }) => (
        <Box>
          <Typography variant="body1" color="text.secondary" paragraph>
            This is where you would enter basic promotion information.
          </Typography>
          <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2">
              Form fields would go here (name, type, budget, dates, etc.)
            </Typography>
          </Box>
        </Box>
      ),
      validate: (data) => ({ valid: true, errors: [] }),
      help: 'Provide accurate information for better AI recommendations',
    },
    {
      id: 'targeting',
      title: 'Targeting',
      description: 'Select customers and products',
      content: ({ data, onChange }) => (
        <Box>
          <Typography variant="body1" color="text.secondary" paragraph>
            Configure your target audience and product selection.
          </Typography>
          <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2">
              Customer and product selection UI would go here
            </Typography>
          </Box>
        </Box>
      ),
      validate: (data) => ({ valid: true, errors: [] }),
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Review and submit',
      content: ({ data }) => (
        <Box>
          <Typography variant="body1" color="text.secondary" paragraph>
            Review your promotion details before submitting.
          </Typography>
          <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2">
              Summary of all entered information would be displayed here
            </Typography>
          </Box>
        </Box>
      ),
    },
  ];

  if (showWizard) {
    return (
      <ProcessWizard
        steps={wizardSteps}
        onComplete={(data) => {
          console.log('Wizard completed:', data);
          setShowWizard(false);
        }}
        onSave={(data) => console.log('Auto-saved:', data)}
        enableAI={true}
        autoSave={true}
        title="Create New Promotion"
        subtitle="AI-powered promotion creation wizard"
      />
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Process UI Showcase
            </Typography>
            <Typography variant="body1" color="text.secondary">
              World-class process visualization and workflow components
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<AIIcon />}
            onClick={() => setShowWizard(true)}
            sx={{ px: 3, py: 1.5 }}
          >
            Launch Wizard Demo
          </Button>
        </Box>
      </Box>

      {/* Component Showcase Grid */}
      <Grid container spacing={4}>
        {/* ProcessTracker */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              mb: 2,
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
              1. ProcessTracker - Real-time Monitoring
            </Typography>
          </Paper>
          <ProcessTracker
            process={{
              name: 'Q1 2024 Trade Spend Process',
              description: 'Comprehensive trade spend management workflow',
              activeStep,
            }}
            steps={processSteps}
            loading={false}
          />
        </Grid>

        {/* ProcessStepper */}
        <Grid item xs={12} lg={8}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              mb: 2,
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
              2. ProcessStepper - Enhanced Step Navigation
            </Typography>
          </Paper>
          <ProcessStepper
            steps={processSteps}
            activeStep={activeStep}
            orientation="horizontal"
            interactive={true}
            onStepClick={(index) => setActiveStep(index)}
            showTimeEstimates={true}
            showConfidence={true}
            animated={true}
            variant="elevated"
          />
          
          <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label="Interactive: Click steps to navigate" 
              color="primary" 
              size="small"
            />
            <Chip 
              label="Expandable: Click arrow for details" 
              color="primary" 
              size="small"
            />
            <Chip 
              label="Animated: Smooth transitions" 
              color="primary" 
              size="small"
            />
          </Box>
        </Grid>

        {/* ProcessFlow */}
        <Grid item xs={12} lg={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              mb: 2,
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
              3. ProcessFlow - Visual Diagram
            </Typography>
          </Paper>
          <ProcessFlow
            nodes={processSteps.map((s) => ({
              id: s.id,
              title: s.title,
              description: s.description,
              type: s.status === 'active' ? 'Current' : s.status === 'completed' ? 'Done' : 'Pending',
              duration: s.estimatedTime,
              assignee: s.assignee,
            }))}
            activeNode={activeStep}
            animated={true}
          />
        </Grid>

        {/* Feature Highlights */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: alpha => `linear-gradient(135deg, ${alpha('#2563EB', 0.05)} 0%, ${alpha('#7C3AED', 0.05)} 100%)`,
            }}
          >
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
              ✨ World-Class Features
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                    }}
                  >
                    <TimelineIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Rich Metadata
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Descriptions, timestamps, assignees, confidence scores
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'success.light',
                      color: 'success.contrastText',
                    }}
                  >
                    <TrendingUpIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Real-time Tracking
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Live progress updates and bottleneck detection
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'secondary.light',
                      color: 'secondary.contrastText',
                    }}
                  >
                    <AssessmentIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      AI-Powered
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Smart suggestions and predictive insights
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'info.light',
                      color: 'info.contrastText',
                    }}
                  >
                    <TimelineIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Fully Responsive
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mobile-first design, works on all devices
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'warning.light',
                      color: 'warning.contrastText',
                    }}
                  >
                    <TimelineIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Accessible
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      WCAG 2.1 AA compliant, keyboard navigation
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'error.light',
                      color: 'error.contrastText',
                    }}
                  >
                    <TimelineIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Performance Optimized
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Lazy loading, memoization, smooth animations
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Integration Guide */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              🚀 Quick Integration
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" paragraph>
              These components are designed for easy integration. Simply import and use:
            </Typography>
            <Box
              sx={{
                p: 3,
                bgcolor: 'grey.900',
                borderRadius: 2,
                color: 'grey.100',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                overflow: 'auto',
              }}
            >
              <pre>{`// Import components
import ProcessStepper from './components/common/ProcessStepper.enhanced';
import ProcessTracker from './components/common/ProcessTracker';
import ProcessFlow from './components/common/ProcessFlow';
import ProcessWizard from './components/common/ProcessWizard';

// Use in your components
<ProcessStepper 
  steps={yourSteps} 
  activeStep={currentStep} 
  animated={true}
/>`}</pre>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              For complete documentation, see{' '}
              <code>WORLD_CLASS_PROCESS_UI.md</code>
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProcessShowcase;
