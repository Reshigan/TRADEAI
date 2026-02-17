import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Grid, Paper, Chip, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, alpha, CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, Visibility, AccountBalance, TrendingUp, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatLabel } from '../../utils/formatters';

const RebatesList = () => {
  const navigate = useNavigate();
  const [rebates, setRebates] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRebates = async () => {
    try {
      const response = await api.get('/rebates');
      if (response.data.success) setRebates(response.data.data);
    } catch (error) {
      console.error('Failed to load rebates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRebates(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rebate?')) {
      try { await api.delete(`/rebates/${id}`); loadRebates(); } catch (error) { console.error('Failed to delete rebate:', error); }
    }
  };

  const getStatusColor = (status) => ({ draft: 'default', active: 'success', calculating: 'info', inactive: 'warning', expired: 'error' })[status] || 'default';
  const getTypeLabel = (type) => ({ volume: 'Volume Rebate', growth: 'Growth Rebate', 'early-payment': 'Early Payment', slotting: 'Slotting Fee', coop: 'Co-op Marketing', 'off-invoice': 'Off-Invoice', billback: 'Bill-Back', display: 'Display/Feature' })[type] || formatLabel(type);

  const stats = useMemo(() => {
    const total = rebates.length;
    const active = rebates.filter(r => r.status === 'active').length;
    const totalAccrued = rebates.reduce((s, r) => s + (r.accruedAmount || r.totalAccrued || 0), 0);
    return { total, active, totalAccrued };
  }, [rebates]);

  const summaryCards = [
    { label: 'Total Rebates', value: stats.total, icon: <AccountBalance />, color: '#7C3AED', bg: alpha('#7C3AED', 0.08) },
    { label: 'Active', value: stats.active, icon: <CheckCircle />, color: '#059669', bg: alpha('#059669', 0.08) },
    { label: 'Total Accrued', value: `R${(stats.totalAccrued / 1000).toFixed(1)}K`, icon: <TrendingUp />, color: '#2563EB', bg: alpha('#2563EB', 0.08) },
  ];

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#7C3AED' }} /></Box>;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Rebates</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>Configure and manage all rebate programs</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/rebates/new')}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3, py: 1.2, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
          New Rebate
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((s) => (
          <Grid item xs={12} sm={4} key={s.label}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {React.cloneElement(s.icon, { sx: { color: s.color, fontSize: 22 } })}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
                <Typography variant="h6" fontWeight={700}>{s.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', bgcolor: '#F9FAFB' } }}>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Rate/Amount</TableCell>
                <TableCell>Period</TableCell>
                <TableCell align="right">Accrued</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rebates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <AccountBalance sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No rebates found. Create your first rebate program.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rebates.map((rebate) => (
                  <TableRow key={rebate.id || rebate._id} hover sx={{ '&:hover': { bgcolor: alpha('#7C3AED', 0.02) } }}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{rebate.name}</Typography></TableCell>
                    <TableCell><Chip label={getTypeLabel(rebate.rebateType || rebate.type)} size="small" variant="outlined" sx={{ borderRadius: '6px', height: 24 }} /></TableCell>
                    <TableCell><Chip label={formatLabel(rebate.status)} color={getStatusColor(rebate.status)} size="small" sx={{ borderRadius: '6px', height: 24, fontWeight: 600 }} /></TableCell>
                    <TableCell>{rebate.rateType === 'percentage' || rebate.calculationType === 'percentage' ? `${rebate.rate || 0}%` : `R ${(rebate.amount || 0).toLocaleString()}`}</TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{rebate.startDate ? new Date(rebate.startDate).toLocaleDateString() : '-'}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={600}>R {(rebate.accruedAmount || rebate.totalAccrued || 0).toLocaleString()}</Typography></TableCell>
                    <TableCell align="right">R {(rebate.settledAmount || rebate.totalPaid || 0).toLocaleString()}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="View"><IconButton size="small" onClick={() => navigate(`/rebates/${rebate.id || rebate._id}`)}
                          sx={{ color: '#6B7280', '&:hover': { color: '#7C3AED', bgcolor: alpha('#7C3AED', 0.08) } }}><Visibility fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/rebates/${rebate.id || rebate._id}/edit`)}
                          sx={{ color: '#6B7280', '&:hover': { color: '#7C3AED', bgcolor: alpha('#7C3AED', 0.08) } }}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(rebate.id || rebate._id)}
                          sx={{ color: '#6B7280', '&:hover': { color: '#DC2626', bgcolor: alpha('#DC2626', 0.08) } }}><Delete fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default RebatesList;
