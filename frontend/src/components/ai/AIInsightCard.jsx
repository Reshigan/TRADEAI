import React from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const severityConfig = {
  success: { icon: CheckCircleOutlineIcon, color: '#059669', bg: '#ECFDF5', label: 'Positive' },
  warning: { icon: WarningAmberIcon, color: '#F59E0B', bg: '#FFFBEB', label: 'Caution' },
  error: { icon: ErrorOutlineIcon, color: '#EF4444', bg: '#FEF2F2', label: 'Alert' },
  info: { icon: InfoOutlinedIcon, color: '#3B82F6', bg: '#EFF6FF', label: 'Info' },
};

const AIInsightCard = ({ icon, severity = 'info', title, description, impact, action, onAction, sx = {} }) => {
  const config = severityConfig[severity] || severityConfig.info;
  const Icon = icon || config.icon;

  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, borderLeft: `4px solid ${config.color}`, bgcolor: config.bg, ...sx }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Icon sx={{ color: config.color, mt: 0.25, fontSize: 20 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} color="#0F172A">{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>
          {impact && (
            <Chip label={impact} size="small" sx={{ mt: 1, bgcolor: `${config.color}22`, color: config.color, fontWeight: 600, fontSize: 11 }} />
          )}
          {action && onAction && (
            <Button size="small" onClick={onAction} sx={{ mt: 1, ml: -0.5, color: config.color, fontWeight: 600, textTransform: 'none' }}>
              {action}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AIInsightCard;
