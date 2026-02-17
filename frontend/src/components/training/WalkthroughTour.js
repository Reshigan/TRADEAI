import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Lightbulb as LightbulbIcon,
  School as SchoolIcon
} from '@mui/icons-material';

// Walkthrough tour steps
const tourSteps = [
  {
    title: 'Welcome to Trade AI Platform',
    content: 'Welcome to TRADEAI! This walkthrough will guide you through the platform. Navigate using the icon sidebar on the left — each icon takes you to a different module. On mobile, tap the menu icon in the top-left to open the navigation drawer.',
    icon: <SchoolIcon color="primary" />
  },
  {
    title: 'Dashboard Overview',
    content: 'Your dashboard shows KPI cards for Total Budget, Active Promotions, Customers, and Budget Utilization at a glance. Below you\'ll find the Budget Overview with a progress bar, AI Budget Forecast, Pending Approvals, and Top Customers — all in a clean card-based layout.',
    icon: <InfoIcon color="primary" />
  },
  {
    title: 'Sidebar Navigation',
    content: 'The left sidebar uses compact icons for quick access to all modules: Dashboard, Promotions, Budgets, Trade Spends, Analytics, Claims, Deductions, Rebates, Approvals, Forecasting, Simulation Studio, and more. Hover over any icon to see a tooltip with the page name.',
    icon: <InfoIcon color="primary" />
  },
  {
    title: 'AI-Powered Analytics',
    content: 'The Analytics page features tabbed views for different insights — spend analysis, ROI tracking, customer performance, and AI recommendations. Each page also includes an AI Insights feed on the dashboard for contextual suggestions.',
    icon: <LightbulbIcon color="primary" />
  },
  {
    title: 'Budget & Promotion Management',
    content: 'Budgets and Promotions use summary stat cards at the top, tab-based status filtering, and card grids for each record. Click any card to view details, edit, or track spend utilization with progress bars.',
    icon: <InfoIcon color="primary" />
  },
  {
    title: 'Claims, Deductions & Rebates',
    content: 'Manage claims, deductions, and rebate programs from their dedicated pages. Each uses the same modern pattern — summary cards, status tabs, search filters, and clickable record cards with key metrics.',
    icon: <InfoIcon color="primary" />
  },
  {
    title: 'Simulation Studio & Forecasting',
    content: 'Run what-if scenarios in the Simulation Studio to optimize promotions before committing budget. The Forecasting module uses AI algorithms to predict demand, revenue, and budget needs.',
    icon: <LightbulbIcon color="primary" />
  },
  {
    title: 'You\'re All Set!',
    content: 'You\'ve completed the platform tour! Use the Help Center (question mark icon in the sidebar) for detailed guides on each module. You can restart this tour anytime from the Dashboard.',
    icon: <CheckCircleIcon color="success" />
  }
];

const WalkthroughTour = ({ open, onClose, startAtStep = 0 }) => {
  const [activeStep, setActiveStep] = useState(startAtStep);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  // Reset to initial step when opened
  useEffect(() => {
    if (open) {
      setActiveStep(startAtStep);
    }
  }, [open, startAtStep]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleClose = () => {
    onClose();
  };

  const handleFinish = () => {
    // Save to localStorage that user has completed the tour
    localStorage.setItem('walkthroughCompleted', 'true');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#7C3AED',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon />
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>TRADEAI Platform Tour</Typography>
        </Box>
        <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '100%' }}>
          {/* Left sidebar with steps */}
          <Box
            sx={{
              width: { xs: '100%', md: 260 },
              bgcolor: 'background.paper',
              borderRight: { xs: 0, md: 1 },
              borderBottom: { xs: 1, md: 0 },
              borderColor: 'divider',
              p: { xs: 1.5, md: 2 },
              display: { xs: 'none', md: 'block' },
            }}
          >
            <Stepper activeStep={activeStep} orientation="vertical">
              {tourSteps.map((step, index) => (
                <Step key={step.title}>
                  <StepLabel
                    StepIconProps={{
                      icon: index === activeStep ? step.icon : index + 1
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: index === activeStep ? 'bold' : 'normal',
                        color: index === activeStep ? '#7C3AED' : 'text.primary'
                      }}
                    >
                      {step.title}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
          
          {/* Right content area */}
          <Box sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" gutterBottom>
              {tourSteps[activeStep].title}
            </Typography>
            
            <Typography variant="body1" paragraph>
              {tourSteps[activeStep].content}
            </Typography>
            
            <Paper
              elevation={0}
              sx={{
                bgcolor: '#F5F3FF',
                p: 3,
                mb: 3,
                borderRadius: 2,
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: { xs: 120, md: 200 },
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                {React.cloneElement(tourSteps[activeStep].icon, { sx: { fontSize: 48, color: '#7C3AED', mb: 1 } })}
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Step {activeStep + 1} of {tourSteps.length}
                </Typography>
              </Box>
            </Paper>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                disabled={activeStep === 0}
              >
                Back
              </Button>
              
              {activeStep === tourSteps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<CheckCircleIcon />}
                  onClick={handleFinish}
                >
                  Finish
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default WalkthroughTour;
