import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

const ConfidenceMeter = ({ confidence = 0, label = 'Confidence', dataPoints = 0, size = 64, sx = {} }) => {
  const pct = Math.round((confidence || 0) * 100);
  const color = pct >= 75 ? '#059669' : pct >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', ...sx }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress variant="determinate" value={pct} size={size}
          sx={{ color, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
        <CircularProgress variant="determinate" value={100} size={size}
          sx={{ color: '#E2E8F0', position: 'absolute', left: 0 }} />
        <CircularProgress variant="determinate" value={pct} size={size}
          sx={{ color, position: 'absolute', left: 0, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="caption" fontWeight={700} sx={{ color, fontSize: size > 50 ? 14 : 11 }}>{pct}%</Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>{label}</Typography>
      {dataPoints > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{dataPoints} pts</Typography>
      )}
    </Box>
  );
};

export default ConfidenceMeter;
