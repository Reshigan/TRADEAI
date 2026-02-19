import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert, Grid, alpha
} from '@mui/material';
import {
  Warning as WarningIcon, Error as ErrorIcon, Info as InfoIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { promotionConflictService } from '../../../services/api';

const PromotionConflicts = ({ promotionId, promotion }) => {
  const [conflicts, setConflicts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConflicts();
  }, [promotionId]);

  const checkConflicts = async () => {
    try {
      setLoading(true);
      const pData = typeof promotion?.data === 'string' ? JSON.parse(promotion.data || '{}') : (promotion?.data || {});
      const res = await promotionConflictService.check({
        customerId: pData.customerId || promotion?.customer_id,
        productIds: pData.productIds || [],
        startDate: pData.startDate || promotion?.start_date || promotion?.created_at,
        endDate: pData.endDate || promotion?.end_date,
        promotionType: promotion?.promotion_type,
        excludeId: promotionId
      });
      setConflicts(res.data || null);
    } catch (err) {
      console.error('Error checking conflicts:', err);
      setConflicts({ conflicts: [], summary: { total: 0 }, recommendation: 'clear', message: 'Unable to check conflicts' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  const sevColor = { critical: '#DC2626', high: '#EA580C', medium: '#D97706', low: '#6B7280' };
  const sevBg = { critical: alpha('#DC2626', 0.06), high: alpha('#EA580C', 0.06), medium: alpha('#D97706', 0.06), low: alpha('#6B7280', 0.06) };
  const sevIcon = { critical: <ErrorIcon />, high: <WarningIcon />, medium: <InfoIcon />, low: <InfoIcon /> };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>Conflict Detection</Typography>
        <Chip
          icon={conflicts?.recommendation === 'clear' ? <CheckIcon /> : <WarningIcon />}
          label={conflicts?.recommendation === 'clear' ? 'No Conflicts' : `${conflicts?.summary?.total || 0} Conflict(s)`}
          color={conflicts?.recommendation === 'clear' ? 'success' : conflicts?.recommendation === 'block' ? 'error' : 'warning'}
          sx={{ fontWeight: 600 }}
        />
      </Box>

      {conflicts?.recommendation === 'clear' ? (
        <Alert severity="success" sx={{ borderRadius: '12px' }}>
          No significant conflicts detected. This promotion is clear to proceed.
        </Alert>
      ) : (
        <>
          <Alert severity={conflicts?.recommendation === 'block' ? 'error' : 'warning'} sx={{ mb: 2, borderRadius: '12px' }}>
            {conflicts?.message}
          </Alert>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            {['critical', 'high', 'medium', 'low'].map(sev => {
              const count = conflicts?.summary?.[sev] || 0;
              if (count === 0) return null;
              return (
                <Grid item xs={6} sm={3} key={sev}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={700} sx={{ color: sevColor[sev] }}>{count}</Typography>
                    <Typography variant="caption" color="text.secondary" textTransform="capitalize">{sev}</Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          {(conflicts?.conflicts || []).map((conflict, i) => (
            <Paper key={i} elevation={0} sx={{ p: 2, mb: 1.5, borderRadius: '12px', bgcolor: sevBg[conflict.severity], border: '1px solid', borderColor: alpha(sevColor[conflict.severity], 0.2) }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{ color: sevColor[conflict.severity], mt: 0.3 }}>
                  {React.cloneElement(sevIcon[conflict.severity] || <InfoIcon />, { fontSize: 'small' })}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={700}>{conflict.existingPromotion?.name || 'Unknown Promotion'}</Typography>
                    <Chip label={conflict.conflictType?.replace(/_/g, ' ')} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: alpha(sevColor[conflict.severity], 0.15), color: sevColor[conflict.severity] }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>{conflict.reason}</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">Status: <strong>{conflict.existingPromotion?.status}</strong></Typography>
                    <Typography variant="caption" color="text.secondary">Overlap: <strong>{conflict.overlapDays} days</strong></Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))}
        </>
      )}
    </Box>
  );
};

export default PromotionConflicts;
