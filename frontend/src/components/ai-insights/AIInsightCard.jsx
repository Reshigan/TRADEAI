import React from 'react';
import { Card, CardContent, Typography, Chip, Box, Button, LinearProgress } from '@mui/material';
import { TrendingUp, CheckCircle, Warning, Info } from '@mui/icons-material';

const AIInsightCard = ({ insight }) => {
  const {
    title,
    description,
    confidence = 0,
    impact = 'medium',
    _category = 'general',
    actionable = true,
    recommended_action,
    timestamp
  } = insight || {};

  const getImpactColor = (impact) => {
    switch(impact) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getIcon = () => {
    switch(impact) {
      case 'high': return <Warning color="error" />;
      case 'medium': return <Info color="warning" />;
      case 'low': return <TrendingUp color="info" />;
      default: return <CheckCircle />;
    }
  };

  return (
    <Card sx={{ mb: 2, borderLeft: `4px solid`, borderLeftColor: `${getImpactColor(impact)}.main` }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            {getIcon()}
            <Typography variant="h6">{title || 'AI Insight'}</Typography>
          </Box>
          <Chip 
            label={`${Math.round(confidence * 100)}% confidence`} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {description || 'No description available'}
        </Typography>

        <Box mb={2}>
          <Typography variant="caption" color="text.secondary">
            Confidence Level
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={confidence * 100} 
            sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
          />
        </Box>

        {actionable && recommended_action && (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button 
              variant="contained" 
              size="small" 
              startIcon={<CheckCircle />}
            >
              {recommended_action}
            </Button>
            <Button 
              variant="outlined" 
              size="small"
            >
              Learn More
            </Button>
          </Box>
        )}

        {timestamp && (
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Generated: {new Date(timestamp).toLocaleString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsightCard;
