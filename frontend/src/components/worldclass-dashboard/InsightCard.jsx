import React from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Alert
} from '@mui/material';
import { 
  WarningAmber, 
  CheckCircle, 
  Info, 
  ArrowForward 
} from '@mui/icons-material';

// Insight Card Component (Zero-Slop Law 3, 11)
const InsightCard = ({ 
  title, 
  description, 
  impact = 'medium', 
  action = null, 
  onAction = null 
}) => {
  // Determine impact styling
  const getImpactStyle = () => {
    switch (impact) {
      case 'high':
        return {
          icon: <WarningAmber />,
          color: '#d32f2f',
          bgColor: '#ffebee',
          borderColor: '#ffcdd2'
        };
      case 'medium':
        return {
          icon: <Info />,
          color: '#ed6c02',
          bgColor: '#fff3e0',
          borderColor: '#ffe0b2'
        };
      case 'low':
        return {
          icon: <Info />,
          color: '#1976d2',
          bgColor: '#e3f2fd',
          borderColor: '#bbdefb'
        };
      case 'positive':
        return {
          icon: <CheckCircle />,
          color: '#2e7d32',
          bgColor: '#e8f5e9',
          borderColor: '#c8e6c9'
        };
      default:
        return {
          icon: <Info />,
          color: '#7b1fa2',
          bgColor: '#f3e5f5',
          borderColor: '#e1bee7'
        };
    }
  };

  const impactStyle = getImpactStyle();

  return (
    <Alert
      icon={impactStyle.icon}
      severity={impact === 'high' ? 'error' : 
               impact === 'medium' ? 'warning' : 
               impact === 'positive' ? 'success' : 'info'}
      sx={{ 
        bgcolor: impactStyle.bgColor,
        border: `1px solid ${impactStyle.borderColor}`,
        borderRadius: 2,
        '& .MuiAlert-icon': {
          color: impactStyle.color
        }
      }}
      action={
        action && onAction && (
          <Button
            color="inherit"
            size="small"
            endIcon={<ArrowForward />}
            onClick={() => onAction(action)}
            sx={{ minWidth: 'auto', px: 1 }}
          >
            Fix
          </Button>
        )
      }
    >
      <Box sx={{ pr: action ? 8 : 0 }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 600, 
            mb: 0.5,
            color: impactStyle.color
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.primary',
            lineHeight: 1.4
          }}
        >
          {description}
        </Typography>
      </Box>
    </Alert>
  );
};

export default InsightCard;