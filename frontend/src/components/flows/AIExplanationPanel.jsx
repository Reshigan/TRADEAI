import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Button,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  Star as StarIcon
} from '@mui/icons-material';

/**
 * AI Explanation Panel - Builds Trust Through Transparency
 * 
 * Shows users WHY the AI recommends something, not just WHAT it recommends.
 * This builds confidence and teaches users to make better decisions.
 */
const AIExplanationPanel = ({ 
  recommendation, 
  confidence, 
  reasoning, 
  dataPoints,
  alternatives,
  onFeedback,
  onApply
}) => {
  const [expanded, setExpanded] = useState('reasoning');
  const [feedback, setFeedback] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleFeedback = (type) => {
    setFeedback(type);
    if (onFeedback) {
      onFeedback(type, recommendation);
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    // Save to user's favorites/insights
    setTimeout(() => setIsSaved(false), 2000);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#4caf50';
    if (confidence >= 60) return '#ff9800';
    return '#f44336';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 80) return 'High Confidence';
    if (confidence >= 60) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PsychologyIcon sx={{ fontSize: 28, color: '#9c27b0' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              AI Insights
            </Typography>
          </Box>
          <Tooltip title={isSaved ? "Saved!" : "Save this insight"}>
            <IconButton 
              size="small" 
              onClick={handleSave}
              sx={{ color: isSaved ? '#ffd700' : 'inherit' }}
            >
              <StarIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Confidence Indicator */}
        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', border: `2px solid ${getConfidenceColor(confidence)}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {getConfidenceLabel(confidence)}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: getConfidenceColor(confidence) }}>
              {confidence}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={confidence} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: getConfidenceColor(confidence)
              }
            }}
          />
          <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
            Based on {dataPoints || 150} historical data points
          </Typography>
        </Paper>
      </Box>

      {/* Main Recommendation */}
      <Paper sx={{ 
        p: 2, 
        mb: 2, 
        background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <LightbulbIcon sx={{ mt: 0.5 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5, opacity: 0.9 }}>
              💡 AI Recommendation
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
              {recommendation}
            </Typography>
            {onApply && (
              <Button
                variant="contained"
                size="small"
                onClick={onApply}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  mt: 1
                }}
                startIcon={<TrendingUpIcon />}
              >
                Apply This Recommendation
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Expandable Sections */}
      
      {/* 1. Why This Recommendation */}
      <Accordion 
        expanded={expanded === 'reasoning'} 
        onChange={handleAccordionChange('reasoning')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            <Typography sx={{ fontWeight: 600 }}>Why This Recommendation?</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
              {reasoning || "Our ML model analyzed your historical data and market trends to generate this recommendation."}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              🎯 Key Factors Considered:
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                • Historical performance (last 12 months)
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                • Market trends and seasonality
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                • Competitor pricing analysis
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                • Customer behavior patterns
              </Typography>
              <Typography variant="body2">
                • Risk factors and constraints
              </Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* 2. Historical Context */}
      <Accordion 
        expanded={expanded === 'historical'} 
        onChange={handleAccordionChange('historical')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="success" />
            <Typography sx={{ fontWeight: 600 }}>Historical Context</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Similar decisions in the past have yielded:
            </Typography>
            
            <Box sx={{ bgcolor: '#e8f5e9', p: 2, borderRadius: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Average Success Rate</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                  78%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Average ROI</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                  2.8x
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Similar Campaigns</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                  23 successful
                </Typography>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>Best performing case:</strong> Similar strategy in Q2 2024 achieved 3.5x ROI with 92% success rate
              </Typography>
            </Alert>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* 3. Alternative Options */}
      {alternatives && alternatives.length > 0 && (
        <Accordion 
          expanded={expanded === 'alternatives'} 
          onChange={handleAccordionChange('alternatives')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              <Typography sx={{ fontWeight: 600 }}>Alternative Scenarios</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Consider these alternatives if circumstances change:
            </Typography>
            
            {alternatives.map((alt, idx) => (
              <Paper key={idx} sx={{ p: 2, mb: 1, bgcolor: '#fff3e0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {alt.name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {alt.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={`ROI: ${alt.roi}x`} size="small" />
                  <Chip label={`Risk: ${alt.risk}`} size="small" color={alt.risk === 'Low' ? 'success' : 'warning'} />
                </Box>
              </Paper>
            ))}
          </AccordionDetails>
        </Accordion>
      )}

      {/* 4. Risks & Considerations */}
      <Accordion 
        expanded={expanded === 'risks'} 
        onChange={handleAccordionChange('risks')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="error" />
            <Typography sx={{ fontWeight: 600 }}>Risks & Mitigation</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Be aware of these potential risks:
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                ⚠️ Market Volatility
              </Typography>
              <Typography variant="caption">
                Current market conditions show 12% higher volatility. Consider reducing initial investment by 20%.
              </Typography>
            </Alert>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                💡 Mitigation Strategy
              </Typography>
              <Typography variant="caption">
                Start with a pilot phase (30% of budget) and scale up after validating results in week 2.
              </Typography>
            </Alert>
            
            <Typography variant="caption" sx={{ display: 'block', mt: 2, opacity: 0.7 }}>
              📊 Risk score is recalculated daily based on market conditions
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Feedback Section */}
      <Paper sx={{ p: 2, bgcolor: '#fafafa' }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          Was this insight helpful?
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant={feedback === 'helpful' ? 'contained' : 'outlined'}
            color="success"
            startIcon={<ThumbUpIcon />}
            onClick={() => handleFeedback('helpful')}
          >
            Yes, helpful
          </Button>
          <Button
            size="small"
            variant={feedback === 'not-helpful' ? 'contained' : 'outlined'}
            color="error"
            startIcon={<ThumbDownIcon />}
            onClick={() => handleFeedback('not-helpful')}
          >
            Not helpful
          </Button>
        </Box>
        {feedback && (
          <Alert severity="success" sx={{ mt: 1 }}>
            <Typography variant="caption">
              Thank you! Your feedback helps improve our AI recommendations.
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Learning Indicator */}
      <Box sx={{ mt: 2, p: 1.5, bgcolor: '#F5F3FF', borderRadius: 2 }}>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PsychologyIcon fontSize="small" />
          <strong>AI is learning:</strong> This model improves with every decision you make
        </Typography>
      </Box>
    </Box>
  );
};

export default AIExplanationPanel;
