/**
 * ComparisonCard - ML vs AI vs User Comparison Widget
 * 
 * Reusable component for showing 3-way comparisons
 */

import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Button } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

const ComparisonCard = ({ 
  type, 
  data, 
  label, 
  isRecommended,
  onApply
}) => {
  const getRiskColor = (risk) => {
    if (risk === 'Low') return 'success';
    if (risk === 'Medium') return 'warning';
    return 'error';
  };

  return (
    <Card 
      variant="outlined"
      sx={{
        border: isRecommended ? 2 : 1,
        borderColor: isRecommended ? 'primary.main' : 'divider',
        height: '100%'
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">
            {label}
          </Typography>
          {isRecommended && (
            <Chip 
              icon={<CheckCircle />}
              label="Best" 
              color="primary" 
              size="small"
            />
          )}
        </Box>

        <Box mb={2}>
          {data.metrics && data.metrics.map((metric, index) => (
            <Box key={index} display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="textSecondary">
                {metric.label}:
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {metric.value}
              </Typography>
            </Box>
          ))}
        </Box>

        {data.risk && (
          <Box mb={2}>
            <Chip 
              label={`Risk: ${data.risk}`} 
              size="small" 
              color={getRiskColor(data.risk)}
            />
          </Box>
        )}

        {data.reason && (
          <Typography variant="caption" color="textSecondary" display="block" mb={2}>
            {data.reason}
          </Typography>
        )}

        {type !== 'user' && onApply && (
          <Button
            variant={isRecommended ? "contained" : "outlined"}
            fullWidth
            size="small"
            onClick={() => onApply(data)}
          >
            Apply This
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ComparisonCard;
