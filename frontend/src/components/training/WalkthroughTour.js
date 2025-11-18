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
    content: 'This interactive walkthrough will guide you through the key features of the Trade AI Platform. You can access this tour anytime from the Help menu.',
    image: '/public/images/walkthrough/welcome.png',
    icon: <SchoolIcon color="primary" />
  },
  {
    title: 'Dashboard Overview',
    content: 'The dashboard provides a comprehensive view of your trade spend activities, budget utilization, and key performance metrics. Use the filters to customize your view.',
    image: '/public/images/walkthrough/dashboard.png',
    icon: <InfoIcon color="primary" />
  },
  {
    title: 'AI-Powered Analytics',
    content: 'Our AI engine analyzes your trade spend data to provide actionable insights and recommendations. Look for the AI insights panel on each page.',
    image: '/public/images/walkthrough/analytics.png',
    icon: <LightbulbIcon color="primary" />
  },
  {
    title: 'Budget Management',
    content: 'Create and manage multi-year budgets with ML-powered forecasting. The system will alert you when spending approaches thresholds.',
    image: '/public/images/walkthrough/budgets.png',
    icon: <InfoIcon color="primary" />
  },
  {
    title: 'Trade Spend Tracking',
    content: 'Track all types of trade spend activities from planning to execution. Use the calendar view to visualize your promotional calendar.',
    image: '/public/images/walkthrough/trade-spend.png',
    icon: <InfoIcon color="primary" />
  },
  {
    title: 'Promotion Management',
    content: 'Plan and execute promotions with end-to-end lifecycle management. The ROI calculator helps you estimate the impact of your promotions.',
    image: '/public/images/walkthrough/promotions.png',
    icon: <InfoIcon color="primary" />
  },
  {
    title: 'AI Assistant',
    content: 'Your AI Assistant is available throughout the platform to answer questions, provide insights, and help you optimize your trade spend activities.',
    image: '/public/images/walkthrough/ai-assistant.png',
    icon: <LightbulbIcon color="primary" />
  },
  {
    title: 'You\'re All Set!',
    content: 'You\'ve completed the walkthrough tour. Remember, you can access this tour anytime from the Help menu. Happy planning!',
    image: '/public/images/walkthrough/complete.png',
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
          bgcolor: 'primary.main',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon />
          <Typography variant="h6">Trade AI Platform Walkthrough</Typography>
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
              width: { xs: '100%', md: 280 },
              bgcolor: 'background.paper',
              borderRight: { xs: 0, md: 1 },
              borderBottom: { xs: 1, md: 0 },
              borderColor: 'divider',
              p: 2
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
                        color: index === activeStep ? 'primary.main' : 'text.primary'
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
            
            {/* Image placeholder - in a real app, this would be actual screenshots */}
            <Paper
              elevation={0}
              sx={{
                bgcolor: 'grey.100',
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                borderRadius: 1,
                flexGrow: 1
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {tourSteps[activeStep].image ? 'Screenshot would appear here' : 'No image available'}
              </Typography>
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