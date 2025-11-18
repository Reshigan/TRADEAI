/**
 * ConfidenceIndicator - AI Confidence Score Badge
 * 
 * Shows prediction confidence/accuracy with visual indicator
 */

import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import {CheckCircle} from '@mui/icons-material';

const ConfidenceIndicator = ({ 
  confidence, 
  label = 'Confidence',
  showIcon = true 
}) => {
  const getColor = () => {
    if (confidence >= 85) return 'success';
    if (confidence >= 70) return 'primary';
    if (confidence >= 50) return 'warning';
    return 'error';
  };

  const getTooltip = () => {
    if (confidence >= 85) return 'High confidence - Based on strong historical data';
    if (confidence >= 70) return 'Good confidence - Reliable prediction';
    if (confidence >= 50) return 'Moderate confidence - Use with caution';
    return 'Low confidence - Limited historical data';
  };

  return (
    <Tooltip title={getTooltip()}>
      <Chip
        icon={showIcon ? <CheckCircle /> : undefined}
        label={`${label}: ${confidence}%`}
        size="small"
        color={getColor()}
      />
    </Tooltip>
  );
};

export default ConfidenceIndicator;
