import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip 
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon
} from '@mui/icons-material';

const KpiCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  color = '#1E3A8A',
  format = 'number',
  onClick 
}) => {
  // Format values according to type (Zero-Slop Law 24-27)
  const formatValue = (val) => {
    if (format === 'currency') {
      return val >= 1000000 
        ? `R${(val / 1000000).toFixed(1)}M` 
        : val >= 1000 
          ? `R${(val / 1000).toFixed(1)}K` 
          : `R${val.toFixed(0)}`;
    }
    
    if (format === 'percentage') {
      return `${val.toFixed(1)}%`;
    }
    
    return val?.toLocaleString() || '0';
  };

  // Determine trend icon and color
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUpIcon />;
    if (trend === 'down') return <TrendingDownIcon />;
    return <TrendingFlatIcon />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return '#2e7d32';
    if (trend === 'down') return '#d32f2f';
    return '#9e9e9e';
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 8,
        } : {},
        border: `1px solid rgba(0, 0, 0, 0.05)`,
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={onClick}
    >
      {/* Decorative accent */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 4,
          background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`
        }} 
      />
      
      <CardContent sx={{ pt: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 600, 
                mb: 0.5,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                color: 'text.primary',
                transition: 'color 0.2s'
              }}
            >
              {formatValue(value)}
            </Typography>
          </Box>
          
          {Icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${color}15`,
                color: color,
              }}
            >
              <Icon sx={{ fontSize: 24 }} />
            </Box>
          )}
        </Box>
        
        {/* Change indicator */}
        {change !== null && change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box 
              sx={{ 
                width: 20, 
                height: 20, 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: `${getTrendColor()}15`,
                color: getTrendColor()
              }}
            >
              {getTrendIcon()}
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                color: getTrendColor(),
                fontWeight: 600
              }}
            >
              {change >= 0 ? '+' : ''}{format === 'percentage' ? `${change.toFixed(1)}%` : change.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
              vs last period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default KpiCard;