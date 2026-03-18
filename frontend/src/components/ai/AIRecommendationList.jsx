import React from 'react';
import { Box, Typography, Chip, Button, Divider } from '@mui/material';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const typeIcons = {
  optimize: LightbulbOutlinedIcon,
  approve: CheckCircleOutlineIcon,
  warning: WarningAmberIcon,
  alert: ErrorOutlineIcon,
};

const AIRecommendationList = ({ recommendations = [], onApply, title = 'AI Recommendations', sx = {} }) => {
  if (!recommendations.length) return null;

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', overflow: 'hidden', ...sx }}>
      <Box sx={{ px: 2, py: 1.5, bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <LightbulbOutlinedIcon sx={{ color: '#7C3AED', fontSize: 18 }} />
        <Typography variant="subtitle2" fontWeight={600}>{title}</Typography>
        <Chip label={`${recommendations.length}`} size="small" sx={{ ml: 'auto', bgcolor: '#7C3AED22', color: '#7C3AED', fontWeight: 700, fontSize: 11, height: 20 }} />
      </Box>
      {recommendations.map((rec, i) => {
        const Icon = typeIcons[rec.type] || LightbulbOutlinedIcon;
        const impactColor = rec.impact?.startsWith('+') ? '#059669' : rec.impact?.startsWith('-') ? '#EF4444' : '#3B82F6';
        return (
          <Box key={i}>
            {i > 0 && <Divider />}
            <Box sx={{ px: 2, py: 1.5, '&:hover': { bgcolor: 'background.default' } }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Icon sx={{ color: '#7C3AED', fontSize: 18, mt: 0.25 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600} color="#0F172A">{rec.suggestion || rec.title}</Typography>
                  {rec.reasoning && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{rec.reasoning}</Typography>}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    {rec.impact && <Chip label={rec.impact} size="small" sx={{ bgcolor: `${impactColor}15`, color: impactColor, fontWeight: 600, fontSize: 10, height: 20 }} />}
                    {onApply && <Button size="small" onClick={() => onApply(rec)} sx={{ color: '#7C3AED', fontWeight: 600, textTransform: 'none', fontSize: 12, minWidth: 0, p: '2px 8px' }}>Apply</Button>}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default AIRecommendationList;
