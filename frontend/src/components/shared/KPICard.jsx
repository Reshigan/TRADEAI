import React from 'react';
import { Box, Typography } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

export default function KPICard({ title, value, subtitle, trend, trendValue, icon, color = '#1E40AF', onClick }) {
  const trendColor = trend === 'up' ? '#059669' : trend === 'down' ? '#DC2626' : '#64748B';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : TrendingFlat;

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        bgcolor: '#FFFFFF',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        '&:hover': onClick ? { borderColor: '#CBD5E1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' } : {},
        minWidth: 0,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </Typography>
        {icon && (
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
            {React.cloneElement(icon, { sx: { fontSize: 18 } })}
          </Box>
        )}
      </Box>
      <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2, mb: 0.5 }}>
        {value}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: trendColor }}>
            <TrendIcon sx={{ fontSize: 14 }} />
            {trendValue && <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: trendColor }}>{trendValue}</Typography>}
          </Box>
        )}
        {subtitle && (
          <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8' }}>{subtitle}</Typography>
        )}
      </Box>
    </Box>
  );
}
