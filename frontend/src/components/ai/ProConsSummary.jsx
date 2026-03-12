import React from 'react';
import { Box, Typography, Chip, Grid } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const riskColors = { low: '#059669', medium: '#F59E0B', high: '#EF4444' };

const ProConsSummary = ({ pros = [], cons = [], riskScore = 'low', sx = {} }) => {
  return (
    <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#fff', ...sx }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600}>AI Assessment</Typography>
        <Chip label={`Risk: ${riskScore.toUpperCase()}`} size="small"
          sx={{ bgcolor: `${riskColors[riskScore]}22`, color: riskColors[riskScore], fontWeight: 700, fontSize: 11 }} />
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" fontWeight={600} color="#059669" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Pros</Typography>
          {pros.map((p, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 1 }}>
              <CheckIcon sx={{ color: '#059669', fontSize: 16, mt: 0.25 }} />
              <Typography variant="body2" color="text.secondary">{p}</Typography>
            </Box>
          ))}
          {pros.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No pros identified</Typography>}
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" fontWeight={600} color="#EF4444" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Cons</Typography>
          {cons.map((c, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 1 }}>
              <CloseIcon sx={{ color: '#EF4444', fontSize: 16, mt: 0.25 }} />
              <Typography variant="body2" color="text.secondary">{c}</Typography>
            </Box>
          ))}
          {cons.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No cons identified</Typography>}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProConsSummary;
