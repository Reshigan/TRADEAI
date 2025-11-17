import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Tooltip
} from '@mui/material';
import {
  NavigateNext,
  NavigateBefore,
  Save,
  CheckCircle,
  Lightbulb
} from '@mui/icons-material';

/**
 * ProcessWizard - Master component for guided workflow processes
 * 
 * Handles the complete revenue process lifecycle with AI integration
 * 
 * @param {Object} props
 * @param {string} props.processType - Type of process (promotion, budget, customer, accrual)
 * @param {Array} props.steps - Array of step configurations
 * @param {Function} props.onComplete - Callback when process completes
 * @param {boolean} props.aiEnabled - Enable AI recommendations
 * @param {boolean} props.saveProgress - Auto-save progress
 * @param {Object} props.initialData - Pre-populated data for editing
 */
const ProcessWizard = ({
  processType,
  steps = [],
  onComplete,
  aiEnabled = true,
  saveProgress = true,
  initialData = null,
  onStepChange,
  onCancel
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [stepData, setStepData] = useState({});
  const [aiRecommendations, setAiRecommendations] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load initial data or saved progress
  useEffect(() => {
    if (initialData) {
      setStepData(initialData);
    } else if (saveProgress) {
      loadSavedProgress();
    }
  }, [initialData, saveProgress]);

  // Load saved progress from localStorage
  const loadSavedProgress = () => {
    try {
      const saved = localStorage.getItem(`wizard_${processType}`);
      if (saved) {
        const { data, step, timestamp } = JSON.parse(saved);
        // Only load if less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setStepData(data);
          setActiveStep(step);
        }
      }
    } catch (error) {
      console.error('Failed to load saved progress:', error);
    }
  };

  // Save progress to localStorage
  const saveProgressData = () => {
    if (!saveProgress) return;
    
    try {
      localStorage.setItem(`wizard_${processType}`, JSON.stringify({
        data: stepData,
        step: activeStep,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  // Fetch AI recommendations for current step
  const fetchAiRecommendations = async (stepIndex) => {
    if (!aiEnabled || !steps[stepIndex]?.aiEndpoint) return;

    setIsLoading(true);
    try {
      const response = await fetch(steps[stepIndex].aiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          processType,
          currentData: stepData,
          stepIndex
        })
      });

      if (response.ok) {
        const recommendations = await response.json();
        setAiRecommendations(prev => ({
          ...prev,
          [stepIndex]: recommendations
        }));
      }
    } catch (error) {
      console.error('Failed to fetch AI recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate current step
  const validateStep = async (stepIndex) => {
    const step = steps[stepIndex];
    if (!step.validate) return true;

    const errors = await step.validate(stepData);
    setValidationErrors(errors || {});
    return Object.keys(errors || {}).length === 0;
  };

  // Handle step navigation
  const handleNext = async () => {
    const isValid = await validateStep(activeStep);
    if (!isValid) return;

    saveProgressData();
    
    if (activeStep === steps.length - 1) {
      // Complete the process
      await handleComplete();
    } else {
      const nextStep = activeStep + 1;
      setActiveStep(nextStep);
      fetchAiRecommendations(nextStep);
      onStepChange?.(nextStep);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setValidationErrors({});
    onStepChange?.(activeStep - 1);
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await onComplete(stepData);
      // Clear saved progress on successful completion
      localStorage.removeItem(`wizard_${processType}`);
    } catch (error) {
      console.error('Failed to complete process:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Update step data
  const updateStepData = (key, value) => {
    setStepData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Render step content
  const renderStepContent = (step, stepIndex) => {
    const StepComponent = step.component;
    
    return (
      <Box sx={{ p: 3 }}>
        {/* AI Recommendations */}
        {aiEnabled && aiRecommendations[stepIndex] && (
          <Alert 
            severity="info" 
            icon={<Lightbulb />}
            sx={{ mb: 3 }}
          >
            <Typography variant="subtitle2" gutterBottom>
              AI Recommendation
            </Typography>
            <Typography variant="body2">
              {aiRecommendations[stepIndex].message}
            </Typography>
            {aiRecommendations[stepIndex].confidence && (
              <Chip 
                label={`${Math.round(aiRecommendations[stepIndex].confidence * 100)}% confidence`}
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Alert>
        )}

        {/* Validation Errors */}
        {Object.keys(validationErrors).length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">Please fix the following errors:</Typography>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              {Object.values(validationErrors).map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Step Component */}
        <StepComponent 
          data={stepData}
          updateData={updateStepData}
          aiRecommendation={aiRecommendations[stepIndex]}
          errors={validationErrors}
        />
      </Box>
    );
  };

  // Process type configurations
  const processConfig = {
    promotion: {
      icon: '🎯',
      title: 'Promotion Creation Wizard',
      description: 'Create and launch a new trade promotion campaign'
    },
    budget: {
      icon: '💰',
      title: 'Budget Planning Wizard',
      description: 'Allocate and manage your annual budget'
    },
    customer: {
      icon: '🤝',
      title: 'Customer Deal Wizard',
      description: 'Create and negotiate customer deals'
    },
    accrual: {
      icon: '📊',
      title: 'Accrual Management Wizard',
      description: 'Process and reconcile accruals'
    }
  };

  const config = processConfig[processType] || {};

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, margin: '0 auto', p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="span" sx={{ mr: 2 }}>
            {config.icon}
          </Typography>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom>
              {config.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {config.description}
            </Typography>
          </Box>
          {saveProgress && (
            <Tooltip title="Progress is automatically saved">
              <Chip 
                icon={<Save />}
                label="Auto-save enabled"
                variant="outlined"
                size="small"
              />
            </Tooltip>
          )}
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Step {activeStep + 1} of {steps.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Math.round(((activeStep + 1) / steps.length) * 100)}% Complete
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={((activeStep + 1) / steps.length) * 100}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </Paper>

      {/* Stepper */}
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.id}>
            <StepLabel
              optional={
                step.optional && (
                  <Typography variant="caption">Optional</Typography>
                )
              }
              error={index === activeStep && Object.keys(validationErrors).length > 0}
            >
              <Typography variant="subtitle1">{step.label}</Typography>
              {step.description && (
                <Typography variant="caption" color="text.secondary">
                  {step.description}
                </Typography>
              )}
            </StepLabel>
            <StepContent>
              {renderStepContent(step, index)}
              
              {/* Navigation Buttons */}
              <Box sx={{ mb: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={isLoading || isSaving}
                  endIcon={index === steps.length - 1 ? <CheckCircle /> : <NavigateNext />}
                >
                  {isSaving ? 'Saving...' : index === steps.length - 1 ? 'Complete' : 'Continue'}
                </Button>
                <Button
                  disabled={index === 0 || isLoading}
                  onClick={handleBack}
                  startIcon={<NavigateBefore />}
                  sx={{ ml: 1 }}
                >
                  Back
                </Button>
                {onCancel && (
                  <Button
                    onClick={onCancel}
                    sx={{ ml: 1 }}
                    color="error"
                  >
                    Cancel
                  </Button>
                )}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Loading Indicator */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Loading AI recommendations...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProcessWizard;
