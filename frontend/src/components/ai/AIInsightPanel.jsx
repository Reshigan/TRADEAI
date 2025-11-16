import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Collapse
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  CheckCircle as ApplyIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import aiOrchestratorService from '../../services/ai/aiOrchestratorService';

const AIInsightPanel = ({ 
  intent,
  context = {},
  onApply,
  onDismiss,
  autoLoad = true,
  title = "AI Insights"
}) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (autoLoad && intent && !dismissed) {
      loadInsights();
    }
  }, [intent, context, autoLoad, dismissed]);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await aiOrchestratorService.orchestrate(intent, context);
      setInsights(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (onApply && insights?.data) {
      onApply(insights.data);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleRefresh = () => {
    aiOrchestratorService.clearCache();
    loadInsights();
  };

  if (dismissed) {
    return null;
  }

  if (loading) {
    return (
      <Card sx={{ mb: 2, bgcolor: '#f5f5ff' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              Analyzing with AI...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 2, bgcolor: '#fff5f5' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Alert 
              severity="error" 
              sx={{ flex: 1 }}
              action={
                <IconButton size="small" onClick={handleRefresh}>
                  <RefreshIcon />
                </IconButton>
              }
            >
              {error}
            </Alert>
            <IconButton size="small" onClick={handleDismiss}>
              <CloseIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <Card sx={{ mb: 2, bgcolor: '#f5f5ff', border: '2px solid #6366f1' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <AIIcon sx={{ color: '#6366f1' }} />
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            <Chip 
              label={`${Math.round((insights.confidence || 0.85) * 100)}% confident`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
          <Box>
            <IconButton size="small" onClick={handleRefresh} title="Refresh">
              <RefreshIcon />
            </IconButton>
            <IconButton size="small" onClick={handleDismiss} title="Dismiss">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {insights.explanation && (
          <Typography variant="body1" paragraph sx={{ color: '#1e293b' }}>
            {insights.explanation}
          </Typography>
        )}

        {insights.data && (
          <Box mb={2}>
            <Button
              size="small"
              startIcon={<InfoIcon />}
              onClick={() => setShowExplanation(!showExplanation)}
              sx={{ mb: 1 }}
            >
              {showExplanation ? 'Hide Details' : 'Show Details'}
            </Button>
            
            <Collapse in={showExplanation}>
              <Box 
                sx={{ 
                  bgcolor: 'white', 
                  p: 2, 
                  borderRadius: 1,
                  maxHeight: 300,
                  overflow: 'auto'
                }}
              >
                <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                  {JSON.stringify(insights.data, null, 2)}
                </pre>
              </Box>
            </Collapse>
          </Box>
        )}

        {onApply && (
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ApplyIcon />}
              onClick={handleApply}
              size="small"
            >
              Apply Suggestion
            </Button>
            <Button
              variant="outlined"
              onClick={handleDismiss}
              size="small"
            >
              Dismiss
            </Button>
          </Box>
        )}

        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          Tool: {insights.tool} • Duration: {insights.duration}ms
        </Typography>
      </CardContent>
    </Card>
  );
};

export default AIInsightPanel;
