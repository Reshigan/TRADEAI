import React, { useState, useEffect } from 'react';
import { Grid, Container, Paper } from '@mui/material';
import ProcessWizard from './ProcessWizard';
import FlowAIPanel from './FlowAIPanel';
import { useNavigate } from 'react-router-dom';

/**
 * FlowContainer - Enhanced wrapper for ProcessWizard with AI panel
 * 
 * Provides a consistent layout for all flow-based pages with:
 * - Main content area (ProcessWizard)
 * - AI recommendations sidebar
 * - Automatic AI recommendations fetching
 * - State management
 * 
 * @param {Object} props
 * @param {string} props.title - Flow title
 * @param {string} props.description - Flow description
 * @param {Array} props.steps - Array of flow steps
 * @param {Function} props.onComplete - Completion callback
 * @param {Function} props.onCancel - Cancel callback
 * @param {Function} props.onSave - Save draft callback
 * @param {Function} props.getAIRecommendations - Function to fetch AI recommendations
 * @param {boolean} props.aiEnabled - Enable AI panel
 * @param {Object} props.initialData - Initial data for editing
 */
const FlowContainer = ({
  title,
  description,
  icon,
  steps = [],
  onComplete,
  onCancel,
  onSave,
  getAIRecommendations,
  aiEnabled = true,
  initialData = null,
  backUrl = null
}) => {
  const navigate = useNavigate();
  const [flowData, setFlowData] = useState(initialData || {});
  const [aiRecommendations, setAIRecommendations] = useState([]);
  const [aiLoading, setAILoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Fetch AI recommendations when step changes or data updates
  useEffect(() => {
    if (aiEnabled && getAIRecommendations && steps[currentStep]) {
      fetchAIRecommendations();
    }
  }, [currentStep, flowData]);

  const fetchAIRecommendations = async () => {
    setAILoading(true);
    try {
      const stepConfig = steps[currentStep];
      const recommendations = await getAIRecommendations({
        step: stepConfig.id,
        data: flowData,
        stepData: flowData[stepConfig.id] || {}
      });
      setAIRecommendations(recommendations || []);
    } catch (error) {
      console.error('Failed to fetch AI recommendations:', error);
      setAIRecommendations([]);
    } finally {
      setAILoading(false);
    }
  };

  const handleStepChange = (step) => {
    setCurrentStep(step);
  };

  const handleDataChange = (data) => {
    setFlowData(prev => ({
      ...prev,
      ...data
    }));
  };

  const handleComplete = async (data) => {
    try {
      await onComplete(data);
      if (backUrl) {
        navigate(backUrl);
      }
    } catch (error) {
      console.error('Flow completion failed:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  const handleApplyRecommendation = (recommendation) => {
    if (recommendation.data) {
      handleDataChange(recommendation.data);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Main Flow Area */}
        <Grid item xs={12} lg={aiEnabled ? 8 : 12}>
          <Paper elevation={2} sx={{ borderRadius: 2 }}>
            <ProcessWizard
              processType={title}
              steps={steps}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onSave={onSave}
              onStepChange={handleStepChange}
              initialData={initialData}
              aiEnabled={aiEnabled}
              saveProgress={true}
            />
          </Paper>
        </Grid>

        {/* AI Panel */}
        {aiEnabled && (
          <Grid item xs={12} lg={4}>
            <FlowAIPanel
              recommendations={aiRecommendations}
              loading={aiLoading}
              onRefresh={fetchAIRecommendations}
              onApply={handleApplyRecommendation}
              stepData={flowData[steps[currentStep]?.id]}
            />
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default FlowContainer;
