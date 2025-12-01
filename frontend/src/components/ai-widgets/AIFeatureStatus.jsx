/**
 * AI Feature Status Component
 * Displays clear status indicators for AI/ML features
 * Shows whether features are production-ready, beta, or experimental
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  Alert,
  Collapse,
  IconButton
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Science,
  Info,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

// Feature status definitions
const FEATURE_STATUS = {
  PRODUCTION: {
    label: 'Production Ready',
    color: 'success',
    icon: CheckCircle,
    description: 'This feature is fully tested and ready for production use.'
  },
  BETA: {
    label: 'Beta',
    color: 'primary',
    icon: Science,
    description: 'This feature is functional but may have limited accuracy. Uses LLM + rules-based analysis.'
  },
  EXPERIMENTAL: {
    label: 'Experimental',
    color: 'warning',
    icon: Warning,
    description: 'This feature is in development. Results should be validated manually.'
  },
  DEGRADED: {
    label: 'Degraded Mode',
    color: 'error',
    icon: Warning,
    description: 'ML models unavailable. Using fallback rules-based calculations.'
  }
};

// AI Feature configurations
export const AI_FEATURES = {
  DEMAND_FORECAST: {
    name: 'Demand Forecasting',
    status: 'BETA',
    description: 'Predicts future demand based on historical patterns using LLM analysis and statistical models.',
    methodology: 'LLM + Time Series Analysis'
  },
  PRICE_OPTIMIZATION: {
    name: 'Price Optimization',
    status: 'BETA',
    description: 'Suggests optimal pricing based on market conditions and historical performance.',
    methodology: 'LLM + Rules-based Analysis'
  },
  CUSTOMER_SEGMENTATION: {
    name: 'Customer Segmentation',
    status: 'PRODUCTION',
    description: 'Groups customers by behavior patterns and value metrics.',
    methodology: 'RFM Analysis + Business Rules'
  },
  ANOMALY_DETECTION: {
    name: 'Anomaly Detection',
    status: 'BETA',
    description: 'Identifies unusual patterns in trade spend and sales data.',
    methodology: 'Statistical Analysis + LLM Interpretation'
  },
  BUDGET_OPTIMIZATION: {
    name: 'Budget Optimization',
    status: 'BETA',
    description: 'Recommends budget allocations based on ROI analysis.',
    methodology: 'LLM + Historical ROI Analysis'
  },
  PROMOTION_INSIGHTS: {
    name: 'Promotion Insights',
    status: 'PRODUCTION',
    description: 'Analyzes promotion performance and provides recommendations.',
    methodology: 'Business Rules + Historical Analysis'
  }
};

/**
 * Status Chip Component
 */
export const AIStatusChip = ({ status, size = 'small', showTooltip = true }) => {
  const statusConfig = FEATURE_STATUS[status] || FEATURE_STATUS.BETA;
  const Icon = statusConfig.icon;
  
  const chip = (
    <Chip
      icon={<Icon sx={{ fontSize: size === 'small' ? 16 : 20 }} />}
      label={statusConfig.label}
      color={statusConfig.color}
      size={size}
      variant="outlined"
    />
  );
  
  if (showTooltip) {
    return (
      <Tooltip title={statusConfig.description} arrow>
        {chip}
      </Tooltip>
    );
  }
  
  return chip;
};

AIStatusChip.propTypes = {
  status: PropTypes.oneOf(['PRODUCTION', 'BETA', 'EXPERIMENTAL', 'DEGRADED']).isRequired,
  size: PropTypes.oneOf(['small', 'medium']),
  showTooltip: PropTypes.bool
};

/**
 * Feature Info Banner Component
 */
export const AIFeatureBanner = ({ featureKey, showDetails = false }) => {
  const [expanded, setExpanded] = React.useState(false);
  const feature = AI_FEATURES[featureKey];
  
  if (!feature) return null;
  
  const statusConfig = FEATURE_STATUS[feature.status];
  
  return (
    <Alert 
      severity={statusConfig.color === 'success' ? 'success' : statusConfig.color === 'error' ? 'error' : 'info'}
      icon={<statusConfig.icon />}
      action={
        showDetails && (
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )
      }
      sx={{ mb: 2 }}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="body2" fontWeight="medium">
          {feature.name}
        </Typography>
        <AIStatusChip status={feature.status} size="small" showTooltip={false} />
      </Box>
      <Collapse in={expanded || !showDetails}>
        <Typography variant="caption" display="block" mt={0.5}>
          {feature.description}
        </Typography>
        <Typography variant="caption" color="textSecondary" display="block">
          Methodology: {feature.methodology}
        </Typography>
      </Collapse>
    </Alert>
  );
};

AIFeatureBanner.propTypes = {
  featureKey: PropTypes.oneOf(Object.keys(AI_FEATURES)).isRequired,
  showDetails: PropTypes.bool
};

/**
 * AI Features Overview Component
 * Shows all AI features with their status
 */
export const AIFeaturesOverview = () => {
  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Info color="primary" />
        <Typography variant="h6">AI/ML Feature Status</Typography>
      </Box>
      
      <Typography variant="body2" color="textSecondary" mb={2}>
        TRADEAI uses a combination of Large Language Models (LLM), statistical analysis, and business rules 
        to provide intelligent insights. Features are categorized by their production readiness:
      </Typography>
      
      <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
        {Object.entries(FEATURE_STATUS).map(([key, config]) => (
          <Tooltip key={key} title={config.description}>
            <Chip
              icon={<config.icon sx={{ fontSize: 16 }} />}
              label={config.label}
              color={config.color}
              size="small"
              variant="outlined"
            />
          </Tooltip>
        ))}
      </Box>
      
      <Box display="flex" flexDirection="column" gap={1}>
        {Object.entries(AI_FEATURES).map(([key, feature]) => {
          const statusConfig = FEATURE_STATUS[feature.status];
          return (
            <Box 
              key={key} 
              display="flex" 
              alignItems="center" 
              justifyContent="space-between"
              p={1.5}
              bgcolor="grey.50"
              borderRadius={1}
            >
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {feature.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {feature.methodology}
                </Typography>
              </Box>
              <AIStatusChip status={feature.status} />
            </Box>
          );
        })}
      </Box>
      
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="caption">
          <strong>Note:</strong> When ML models are unavailable, the system automatically falls back to 
          rules-based calculations. All AI-generated insights should be reviewed before making business decisions.
        </Typography>
      </Alert>
    </Box>
  );
};

/**
 * Main AIFeatureStatus Component
 * Compact status indicator for use in widget headers
 */
const AIFeatureStatus = ({ featureKey, variant = 'chip' }) => {
  const feature = AI_FEATURES[featureKey];
  
  if (!feature) {
    return <AIStatusChip status="BETA" />;
  }
  
  if (variant === 'banner') {
    return <AIFeatureBanner featureKey={featureKey} showDetails />;
  }
  
  return <AIStatusChip status={feature.status} />;
};

AIFeatureStatus.propTypes = {
  featureKey: PropTypes.oneOf(Object.keys(AI_FEATURES)),
  variant: PropTypes.oneOf(['chip', 'banner'])
};

export default AIFeatureStatus;
