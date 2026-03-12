import React from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Check as CheckIcon,
  Close as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const CustomConnector = styled(StepConnector)(() => ({
  '& .MuiStepConnector-line': {
    borderColor: '#E2E8F0',
    borderLeftWidth: 2,
    minHeight: 24,
  },
  '&.Mui-active .MuiStepConnector-line': {
    borderColor: '#1E40AF',
  },
  '&.Mui-completed .MuiStepConnector-line': {
    borderColor: '#059669',
  },
}));

const CustomStepIcon = ({ active, completed, icon }) => (
  <Box
    sx={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: completed ? '#059669' : active ? '#1E40AF' : '#E2E8F0',
      color: completed || active ? '#FFFFFF' : '#64748B',
      fontSize: '0.8125rem',
      fontWeight: 700,
      transition: 'all 0.2s',
    }}
  >
    {completed ? <CheckIcon sx={{ fontSize: 16 }} /> : icon}
  </Box>
);

const WizardPage = ({
  title,
  steps = [],
  activeStep = 0,
  onNext,
  onBack,
  onCancel,
  onSubmit,
  children,
  loading = false,
  nextLabel = 'Next',
  backLabel = 'Back',
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  nextDisabled = false,
}) => {
  const navigate = useNavigate();
  const progress = ((activeStep + 1) / steps.length) * 100;
  const isLastStep = activeStep === steps.length - 1;

  const handleCancel = () => {
    if (onCancel) onCancel();
    else navigate(-1);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={handleCancel} sx={{ ml: -0.5 }}>
          <CancelIcon sx={{ fontSize: 20, color: '#64748B' }} />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A' }}>{title}</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mt: 0.25 }}>
            Step {activeStep + 1} of {steps.length}: {steps[activeStep]?.label}
          </Typography>
        </Box>
      </Box>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          mb: 3,
          height: 4,
          borderRadius: 2,
          bgcolor: '#E2E8F0',
          '& .MuiLinearProgress-bar': { bgcolor: '#1E40AF', borderRadius: 2 },
        }}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: 3 }}>
        <Card
          sx={{
            border: '1px solid #E2E8F0',
            boxShadow: 'none',
            borderRadius: '12px',
            p: 2,
            display: { xs: 'none', md: 'block' },
            alignSelf: 'start',
            position: 'sticky',
            top: 80,
          }}
        >
          <Stepper
            activeStep={activeStep}
            orientation="vertical"
            connector={<CustomConnector />}
          >
            {steps.map((step, i) => (
              <Step key={i} completed={i < activeStep}>
                <StepLabel
                  StepIconComponent={(props) => (
                    <CustomStepIcon {...props} icon={i + 1} />
                  )}
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: '0.8125rem',
                      fontWeight: i === activeStep ? 600 : 400,
                      color: i === activeStep ? '#0F172A' : i < activeStep ? '#059669' : '#64748B',
                    },
                  }}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Card>

        <Box>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', borderRadius: '12px', p: 3, mb: 2, minHeight: 300 }}>
            {children}
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={activeStep === 0 ? handleCancel : onBack}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' }}
            >
              {activeStep === 0 ? cancelLabel : backLabel}
            </Button>

            <Button
              variant="contained"
              endIcon={isLastStep ? <CheckIcon /> : <NextIcon />}
              onClick={isLastStep ? onSubmit : onNext}
              disabled={nextDisabled || loading}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', px: 3 }}
            >
              {loading ? 'Processing...' : isLastStep ? submitLabel : nextLabel}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default WizardPage;
