import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Grid, Typography, Button, Paper, Chip, IconButton, TextField, MenuItem,
  CircularProgress, Tooltip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, alpha,
} from '@mui/material';
import {
  Add, Refresh, Edit, Delete, Visibility, AttachMoney, TrendingUp,
  CheckCircle, PieChart as PieChartIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import tradeSpendService from '../../services/tradespend/tradeSpendService';
import { formatLabel } from '../../utils/formatters';

const TradeSpendList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tradeSpends, setTradeSpends] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ spendType: '', status: '', page: 1, limit: 20 });

  const loadTradeSpends = async () => {
    setLoading(true);
    try {
      const response = await tradeSpendService.getTradeSpends(filters);
      setTradeSpends(response.data || response.tradeSpends || []);
    } catch (error) {
      console.error('Failed to load trade spends:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await tradeSpendService.getTradeSpendSummary(currentYear, 'year');
      setSummary(response.summary || null);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  useEffect(() => { loadTradeSpends(); loadSummary(); }, [filters]);

  const handleFilterChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  const handleView = (id) => navigate(`/trade-spends/${id}`);
  const handleEdit = (id) => navigate(`/trade-spends/${id}/edit`);
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this trade spend?')) {
      try { await tradeSpendService.deleteTradeSpend(id); loadTradeSpends(); } catch (error) { console.error('Failed to delete:', error); }
    }
  };

  const getStatusColor = (status) => ({ draft: 'default', submitted: 'info', approved: 'success', active: 'primary', completed: 'success', cancelled: 'error', rejected: 'error' })[status] || 'default';
  const getSpendTypeLabel = (type) => ({ marketing: 'Marketing', cash_coop: 'Cash Co-op', trading_terms: 'Trading Terms', rebate: 'Rebate', promotion: 'Promotion' })[type] || formatLabel(type);

  const summaryCards = useMemo(() => {
    if (!summary) return [];
    const utilization = summary.totalApproved > 0 ? ((summary.totalSpent / summary.totalApproved) * 100).toFixed(1) : 0;
    return [
      { label: 'Total Requested', value: `R${((summary.totalRequested || 0) / 1000).toFixed(1)}K`, icon: <AttachMoney />, color: '#7C3AED', bg: alpha('#7C3AED', 0.08) },
      { label: 'Total Approved', value: `R${((summary.totalApproved || 0) / 1000).toFixed(1)}K`, icon: <CheckCircle />, color: '#059669', bg: alpha('#059669', 0.08) },
      { label: 'Total Spent', value: `R${((summary.totalSpent || 0) / 1000).toFixed(1)}K`, icon: <TrendingUp />, color: '#2563EB', bg: alpha('#2563EB', 0.08) },
      { label: 'Utilization', value: `${utilization}%`, icon: <PieChartIcon />, color: '#D97706', bg: alpha('#D97706', 0.08) },
    ];
  }, [summary]);

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Trade Spend</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>Manage marketing, cash co-op, trading terms, and promotional spend</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadTradeSpends}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, borderColor: '#E5E7EB', color: '#6B7280', '&:hover': { borderColor: '#7C3AED', color: '#7C3AED' } }}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/trade-spends/new')}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            New Trade Spend
          </Button>
        </Box>
      </Box>

      {summaryCards.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {summaryCards.map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
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
      )}

      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField select label="Spend Type" value={filters.spendType} onChange={(e) => handleFilterChange('spendType', e.target.value)}
            sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }} size="small">
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="marketing">Marketing</MenuItem>
            <MenuItem value="cash_coop">Cash Co-op</MenuItem>
            <MenuItem value="trading_terms">Trading Terms</MenuItem>
            <MenuItem value="rebate">Rebate</MenuItem>
            <MenuItem value="promotion">Promotion</MenuItem>
          </TextField>
          <TextField select label="Status" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}
            sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }} size="small">
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </TextField>
          <Chip label={`${tradeSpends.length} records`} sx={{ alignSelf: 'center', bgcolor: alpha('#7C3AED', 0.08), color: '#7C3AED', fontWeight: 600 }} />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#7C3AED' }} /></Box>
        ) : tradeSpends.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AttachMoney sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No trade spends found. Create your first trade spend to get started.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', bgcolor: '#F9FAFB' } }}>
                  <TableCell>Spend ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Requested</TableCell>
                  <TableCell align="right">Approved</TableCell>
                  <TableCell align="right">Spent</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tradeSpends.map((spend) => (
                  <TableRow key={spend.id || spend._id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha('#7C3AED', 0.02) } }}
                    onClick={() => handleView(spend._id)}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{spend.spendId}</Typography></TableCell>
                    <TableCell><Chip label={getSpendTypeLabel(spend.spendType)} size="small" variant="outlined" sx={{ borderRadius: '6px', height: 24 }} /></TableCell>
                    <TableCell>{spend.customer?.name || spend.customerName || 'N/A'}</TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={600}>R{(spend.amount?.requested || spend.requestedAmount || spend.amount || 0).toLocaleString()}</Typography></TableCell>
                    <TableCell align="right">R{(spend.amount?.approved || spend.approvedAmount || 0).toLocaleString()}</TableCell>
                    <TableCell align="right">R{(spend.amount?.spent || spend.spentAmount || 0).toLocaleString()}</TableCell>
                    <TableCell><Chip label={formatLabel(spend.status)} color={getStatusColor(spend.status)} size="small" sx={{ borderRadius: '6px', height: 24, fontWeight: 600 }} /></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{(spend.period?.startDate || spend.startDate) ? new Date(spend.period?.startDate || spend.startDate).toLocaleDateString() : 'N/A'}</Typography></TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="View"><IconButton size="small" onClick={() => handleView(spend._id)}
                          sx={{ color: '#6B7280', '&:hover': { color: '#7C3AED', bgcolor: alpha('#7C3AED', 0.08) } }}><Visibility fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(spend._id)}
                          sx={{ color: '#6B7280', '&:hover': { color: '#7C3AED', bgcolor: alpha('#7C3AED', 0.08) } }}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(spend._id)}
                          sx={{ color: '#6B7280', '&:hover': { color: '#DC2626', bgcolor: alpha('#DC2626', 0.08) } }}><Delete fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default TradeSpendList;
