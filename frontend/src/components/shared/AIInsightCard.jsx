import React from 'react';
import { Box, Typography, Card, Chip } from '@mui/material';
import { Sparkles } from 'lucide-react';

export default function AIInsightCard({ title, insight, confidence, type = 'recommendation', actions }) {
  const typeColors = { recommendation: '#7C3AED', warning: '#D97706', opportunity: '#059669', risk: '#DC2626' };
  const color = typeColors[type] || '#7C3AED';
  return (
    <Card sx={{ p: 2, borderLeft: `3px solid ${color}`, bgcolor: `${color}08` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Sparkles size={16} color={color} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color }}>{title || 'AI Insight'}</Typography>
        {confidence && <Chip label={`${confidence}%`} size="small" sx={{ ml: 'auto', height: 20, fontSize: 11, bgcolor: `${color}15`, color }} />}
      </Box>
      <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.5 }}>{insight}</Typography>
      {actions && <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>{actions}</Box>}
    </Card>
  );
}
