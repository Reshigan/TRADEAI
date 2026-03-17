import React, { useState } from 'react';
import { Box, Typography, Stepper, Step, StepLabel, StepContent, Button, LinearProgress, Card } from '@mui/material';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WizardPage({ title, steps = [], onSubmit, backPath, loading = false }) {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const progress = ((activeStep + 1) / steps.length) * 100;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        {backPath && <Box component="button" onClick={() => navigate(backPath)} sx={{ border: 'none', bgcolor: 'transparent', cursor: 'pointer', p: 0.5, borderRadius: 1, '&:hover': { bgcolor: '#F1F5F9' } }}><ArrowLeft size={20} /></Box>}
        <Typography variant="h1">{title}</Typography>
      </Box>
      <LinearProgress variant="determinate" value={progress} sx={{ mb: 3, borderRadius: 2, height: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#2563EB', borderRadius: 2 } }} />

      <Box sx={{ display: 'flex', gap: 4 }}>
        <Box sx={{ width: 240, flexShrink: 0 }}>
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ '& .MuiStepLabel-label': { fontSize: 13 }, '& .MuiStepIcon-root.Mui-completed': { color: '#059669' }, '& .MuiStepIcon-root.Mui-active': { color: '#2563EB' } }}>
            {steps.map((step, i) => (
              <Step key={i} completed={i < activeStep}>
                <StepLabel onClick={() => i < activeStep && setActiveStep(i)} sx={{ cursor: i < activeStep ? 'pointer' : 'default' }}>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card sx={{ p: 3, mb: 3, minHeight: 300 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>{steps[activeStep]?.label}</Typography>
            {steps[activeStep]?.description && <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 3 }}>{steps[activeStep].description}</Typography>}
            {steps[activeStep]?.content}
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => activeStep > 0 ? setActiveStep(activeStep - 1) : navigate(backPath)} startIcon={<ArrowLeft size={16} />}>
              {activeStep > 0 ? 'Back' : 'Cancel'}
            </Button>
            {activeStep < steps.length - 1 ? (
              <Button variant="contained" onClick={() => setActiveStep(activeStep + 1)} endIcon={<ArrowRight size={16} />} disabled={steps[activeStep]?.validate && !steps[activeStep].validate()}>Next</Button>
            ) : (
              <Button variant="contained" onClick={onSubmit} endIcon={<Check size={16} />} disabled={loading} color="success">Submit</Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
