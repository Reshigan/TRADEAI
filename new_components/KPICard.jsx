import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const KPICard = ({ 
  title, 
  value, 
  trend, 
  trendPercentage, 
  icon: Icon, 
  color = 'primary',
  onClick 
}) => {
  const isPositive = trend === 'up';
  
  return (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', my: 1 }}>
              {value}
            </Typography>
            {trendPercentage && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isPositive ? (
                  <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: 'error.main', fontSize: 20 }} />
                )}
                <Typography 
                  variant="body2" 
                  sx={{ color: isPositive ? 'success.main' : 'error.main' }}
                >
                  {trendPercentage}% vs last month
                </Typography>
              </Box>
            )}
          </Box>
          {Icon && (
            <Box 
              sx={{ 
                bgcolor: `${color}.main`,
                color: 'white',
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon sx={{ fontSize: 32 }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default KPICard;
