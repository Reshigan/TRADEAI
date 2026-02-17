import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Chip, IconButton, TextField, MenuItem,
  CircularProgress, Tooltip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, alpha, Grid,
} from '@mui/material';
import { Add, Refresh, Edit, Delete, Visibility, Gavel, CheckCircle, TrendingUp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import tradingTermsService from '../../services/tradingterms/tradingTermsService';
import { formatLabel } from '../../utils/formatters';

const TradingTermsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tradingTerms, setTradingTerms] = useState([]);
  const [filters, setFilters] = useState({ termType: '', status: '', isActive: '' });

  const loadTradingTerms = async () => {
    setLoading(true);
    try {
      const response = await tradingTermsService.getTradingTerms(filters);
      const terms = response.tradingTerms || response.data || response || [];
      setTradingTerms(Array.isArray(terms) ? terms : []);
    } catch (error) {
      console.error('Failed to load trading terms:', error);
      setTradingTerms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTradingTerms(); }, [filters]);

  const handleFilterChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));
  const handleView = (id) => navigate(`/trading-terms/${id}`);
  const handleEdit = (id) => navigate(`/trading-terms/${id}/edit`);
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this trading term?')) {
      try { await tradingTermsService.deleteTradingTerm(id); loadTradingTerms(); } catch (error) { console.error('Failed to delete:', error); }
    }
  };

  const getStatusColor = (status) => ({ draft: 'default', pending_approval: 'warning', approved: 'success', rejected: 'error', expired: 'default', suspended: 'warning' })[status] || 'default';
  const getTermTypeLabel = (type) => ({ volume_discount: 'Volume Discount', early_payment: 'Early Payment', prompt_payment: 'Prompt Payment', rebate: 'Rebate', listing_fee: 'Listing Fee', promotional_support: 'Promotional Support', marketing_contribution: 'Marketing Contribution', settlement_discount: 'Settlement Discount', cash_discount: 'Cash Discount', quantity_discount: 'Quantity Discount', loyalty_bonus: 'Loyalty Bonus', growth_incentive: 'Growth Incentive' })[type] || formatLabel(type);

  const stats = useMemo(() => ({
    total: tradingTerms.length,
    approved: tradingTerms.filter(t => t.status === 'approved').length,
    active: tradingTerms.filter(t => t.isActive !== false).length,
  }), [tradingTerms]);

  const summaryCards = [
    { label: 'Total Terms', value: stats.total, icon: <Gavel />, color: '#7C3AED', bg: alpha('#7C3AED', 0.08) },
    { label: 'Approved', value: stats.approved, icon: <CheckCircle />, color: '#059669', bg: alpha('#059669', 0.08) },
    { label: 'Active', value: stats.active, icon: <TrendingUp />, color: '#2563EB', bg: alpha('#2563EB', 0.08) },
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Trading Terms</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>Manage volume discounts, payment terms, rebates, and promotional support</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadTradingTerms}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, borderColor: '#E5E7EB', color: '#6B7280', '&:hover': { borderColor: '#7C3AED', color: '#7C3AED' } }}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/trading-terms/new')}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            New Trading Term
          </Button>
        </Box>
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
        <Box sx={{ p: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField select label="Term Type" value={filters.termType} onChange={(e) => handleFilterChange('termType', e.target.value)}
            sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }} size="small">
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="volume_discount">Volume Discount</MenuItem>
            <MenuItem value="early_payment">Early Payment</MenuItem>
            <MenuItem value="prompt_payment">Prompt Payment</MenuItem>
            <MenuItem value="rebate">Rebate</MenuItem>
            <MenuItem value="listing_fee">Listing Fee</MenuItem>
            <MenuItem value="promotional_support">Promotional Support</MenuItem>
            <MenuItem value="marketing_contribution">Marketing Contribution</MenuItem>
            <MenuItem value="settlement_discount">Settlement Discount</MenuItem>
          </TextField>
          <TextField select label="Status" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}
            sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }} size="small">
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="pending_approval">Pending Approval</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="expired">Expired</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </TextField>
          <TextField select label="Active" value={filters.isActive} onChange={(e) => handleFilterChange('isActive', e.target.value)}
            sx={{ minWidth: 120, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }} size="small">
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </TextField>
          <Chip label={`${tradingTerms.length} terms`} sx={{ alignSelf: 'center', bgcolor: alpha('#7C3AED', 0.08), color: '#7C3AED', fontWeight: 600 }} />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#7C3AED' }} /></Box>
        ) : tradingTerms.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Gavel sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No trading terms found. Create your first trading term to get started.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', bgcolor: '#F9FAFB' } }}>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Valid From</TableCell>
                  <TableCell>Valid To</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tradingTerms.map((term) => (
                  <TableRow key={term.id || term._id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha('#7C3AED', 0.02) } }}
                    onClick={() => handleView(term.id || term._id)}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{term.code}</Typography></TableCell>
                    <TableCell>{term.name}</TableCell>
                    <TableCell><Chip label={getTermTypeLabel(term.termType)} size="small" variant="outlined" sx={{ borderRadius: '6px', height: 24 }} /></TableCell>
                    <TableCell><Chip label={formatLabel(term.status || 'draft')} color={getStatusColor(term.status)} size="small" sx={{ borderRadius: '6px', height: 24, fontWeight: 600 }} /></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{term.startDate ? new Date(term.startDate).toLocaleDateString() : 'N/A'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{term.endDate ? new Date(term.endDate).toLocaleDateString() : 'N/A'}</Typography></TableCell>
                    <TableCell align="right">{term.rateType === 'percentage' ? `${term.rate || 0}%` : `R${(term.rate || 0).toLocaleString()}`}</TableCell>
                    <TableCell>
                      <Chip label={formatLabel(term.priority || 'medium')} size="small"
                        color={term.priority === 'critical' ? 'error' : term.priority === 'high' ? 'warning' : 'default'}
                        sx={{ borderRadius: '6px', height: 24 }} />
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="View"><IconButton size="small" onClick={() => handleView(term.id || term._id)}
                          sx={{ color: '#6B7280', '&:hover': { color: '#7C3AED', bgcolor: alpha('#7C3AED', 0.08) } }}><Visibility fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(term.id || term._id)}
                          sx={{ color: '#6B7280', '&:hover': { color: '#7C3AED', bgcolor: alpha('#7C3AED', 0.08) } }}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(term.id || term._id)}
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

export default TradingTermsList;
