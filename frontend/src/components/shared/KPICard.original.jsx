import React from 'react';
import { Box, Typography, Card } from '@mui/material';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({ title, value, subtitle, trend, trendLabel, icon: Icon, color = '#2563EB', onClick }) {
  const trendColor = trend > 0 ? '#059669' : trend < 0 ? '#DC2626' : '#94A3B8';
  return (
    <Card onClick={onClick} sx={{ p: 2.5, cursor: onClick ? 'pointer' : 'default', '&:hover': onClick ? { borderColor: color, boxShadow: `0 0 0 1px ${color}20` } : {} }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</Typography>
        {Icon && <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color={color} /></Box>}
      </Box>
      <Typography variant="h2" sx={{ mb: 0.5, color: 'text.primary' }}>{value}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: trendColor }}>
            {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{Math.abs(trend)}%</Typography>
          </Box>
        )}
        {(subtitle || trendLabel) && <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{subtitle || trendLabel}</Typography>}
      </Box>
    </Card>
  );
}
