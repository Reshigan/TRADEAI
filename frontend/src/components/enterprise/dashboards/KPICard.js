import React from 'react';
import { Card, CardContent, Typography, Box, Chip, LinearProgress } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export default function KPICard({
  title,
  value,
  change,
  changeType = 'percentage', // 'percentage' | 'absolute'
  target,
  icon: Icon,
  color = 'primary',
  format = 'currency', // 'currency' | 'number' | 'percentage'
  loading = false
}) {
  const formatValue = (val) => {
    if (val === null || val === undefined) return 'N/A';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      
      case 'percentage':
        return `${val.toFixed(2)}%`;
      
      case 'number':
        return val.toLocaleString('en-US');
      
      default:
        return val;
    }
  };

  const formatChange = (val) => {
    if (val === null || val === undefined) return '';
    
    const prefix = val > 0 ? '+' : '';
    
    if (changeType === 'percentage') {
      return `${prefix}${val.toFixed(2)}%`;
    }
    
    return `${prefix}${formatValue(val)}`;
  };

  const isPositiveChange = change > 0;
  const changeColor = isPositiveChange ? 'success' : 'error';
  const progress = target ? (value / target) * 100 : 0;

  return (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)'
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {Icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                backgroundColor: `${color}.light`,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Icon sx={{ fontSize: 20, color: `${color}.main` }} />
            </Box>
          )}
        </Box>

        {loading ? (
          <Box sx={{ py: 2 }}>
            <LinearProgress />
          </Box>
        ) : (
          <>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {formatValue(value)}
            </Typography>

            {change !== null && change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isPositiveChange ? (
                  <TrendingUp sx={{ fontSize: 18, color: `${changeColor}.main` }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 18, color: `${changeColor}.main` }} />
                )}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: `${changeColor}.main`,
                    fontWeight: 600
                  }}
                >
                  {formatChange(change)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  vs last period
                </Typography>
              </Box>
            )}

            {target && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Target: {formatValue(target)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {progress.toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(progress, 100)} 
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      backgroundColor: progress >= 100 ? 'success.main' : progress >= 75 ? 'info.main' : 'warning.main'
                    }
                  }}
                />
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
