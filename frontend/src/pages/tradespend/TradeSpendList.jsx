import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Grid, Typography, Button, Paper, Chip, IconButton, TextField, MenuItem,
  CircularProgress, Tooltip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, TablePagination, alpha, Alert, InputAdornment} from '@mui/material';
import {
  Add, Refresh, Edit, Delete, Visibility, AttachMoney, TrendingUp,
  CheckCircle, PieChart as PieChartIcon, Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { tradeSpendService } from '../../services/api';
import { formatLabel } from '../../utils/formatters';
import { useToast } from '../../components/common/ToastNotification';
import useConfirmDialog from '../../hooks/useConfirmDialog';

const TradeSpendList = () => {
  const toast = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [tradeSpends, setTradeSpends] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ spendType: '', status: '', page: 1, limit: 20 });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const loadTradeSpends = async () => {
    setLoading(true);
    try {
      const response = await tradeSpendService.getTradeSpends(filters);
      setTradeSpends(response.data || response.tradeSpends || []);
    } catch (error) {
      console.error('Failed to load trade spends:', error); toast.error('Failed to load trade spends'); setFetchError(error.message || 'Failed to load data'); } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    setFetchError(null);
    try {
      const currentYear = new Date().getFullYear();
      const response = await tradeSpendService.getTradeSpendSummary(currentYear, 'year');
      setSummary(response.summary || null);
    } catch (error) {
      console.error('Failed to load summary:', error); toast.error('Failed to load summary'); }
  };

  useEffect(() => { loadTradeSpends(); loadSummary(); }, [filters]);

  const handleFilterChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  const handleView = (id) => navigate(`/trade-spends/${id}`);
  const handleEdit = (id) => navigate(`/trade-spends/${id}/edit`);
  const handleDelete = async (id) => {
    if (await confirm('Are you sure you want to delete this trade spend?', { severity: 'error' })) {
      try { await tradeSpendService.deleteTradeSpend(id); loadTradeSpends(); } catch (error) { console.error('Failed to delete:', error); toast.error('Failed to delete'); }
    }
  };

  const handleSort = (field) => {
    setSortDir(sortField === field && sortDir === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  const filteredSpends = useMemo(() => {
    if (!searchQuery) return tradeSpends;
    const q = searchQuery.toLowerCase();
    return tradeSpends.filter(s => (s.spendId || '').toLowerCase().includes(q) || (s.customer?.name || s.customerName || '').toLowerCase().includes(q));
  }, [tradeSpends, searchQuery]);

  const sortedSpends = useMemo(() => {
    if (!sortField) return filteredSpends;
    return [...filteredSpends].sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      const cmp = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredSpends, sortField, sortDir]);

  const paginatedSpends = sortedSpends.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getStatusColor = (status) => ({ draft: 'default', submitted: 'info', approved: 'success', active: 'primary', completed: 'success', cancelled: 'error', rejected: 'error' })[status] || 'default';
  const getSpendTypeLabel = (type) => ({ marketing: 'Marketing', cash_coop: 'Cash Co-op', trading_terms: 'Trading Terms', rebate: 'Rebate', promotion: 'Promotion' })[type] || formatLabel(type);

  const summaryCards = useMemo(() => {
    if (!summary) return [];
    const utilization = summary.totalApproved > 0 ? ((summary.totalSpent / summary.totalApproved) * 100).toFixed(1) : 0;
    return [
      { label: 'Total Requested', value: `R${((summary.totalRequested || 0) / 1000).toFixed(1)}K`, icon: <AttachMoney />, color: '#1E40AF', bg: alpha('#1E40AF', 0.08) },
      { label: 'Total Approved', value: `R${((summary.totalApproved || 0) / 1000).toFixed(1)}K`, icon: <CheckCircle />, color: '#059669', bg: alpha('#059669', 0.08) },
      { label: 'Total Spent', value: `R${((summary.totalSpent || 0) / 1000).toFixed(1)}K`, icon: <TrendingUp />, color: '#2563EB', bg: alpha('#2563EB', 0.08) },
      { label: 'Utilization', value: `${utilization}%`, icon: <PieChartIcon />, color: '#D97706', bg: alpha('#D97706', 0.08) },
    ];
  }, [summary]);

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => { setFetchError(null); loadTradeSpends(); loadSummary(); }}>Retry</Button>}>
          {fetchError}
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Trade Spend</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5} sx={{ display: { xs: 'none', sm: 'block' } }}>Manage marketing, cash co-op, trading terms, and promotional spend</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadTradeSpends}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' }, borderColor: '#E5E7EB', color: '#6B7280', '&:hover': { borderColor: '#1E40AF', color: 'primary.dark' } }}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/trade-spends/new')}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' }, bgcolor: 'primary.dark', '&:hover': { bgcolor: 'primary.dark', filter: 'brightness(0.85)' } }}>
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
            sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'background.default' } }} size="small">
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="marketing">Marketing</MenuItem>
            <MenuItem value="cash_coop">Cash Co-op</MenuItem>
            <MenuItem value="trading_terms">Trading Terms</MenuItem>
            <MenuItem value="rebate">Rebate</MenuItem>
            <MenuItem value="promotion">Promotion</MenuItem>
          </TextField>
          <TextField select label="Status" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}
            sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'background.default' } }} size="small">
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </TextField>
          <TextField placeholder="Search trade spends..." value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }} size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }}
            sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'background.default' } }} />
          <Chip label={`${filteredSpends.length} records`} sx={{ alignSelf: 'center', bgcolor: alpha('#1E40AF', 0.08), color: 'primary.dark', fontWeight: 600 }} />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: 'primary.dark' }} /></Box>
        ) : filteredSpends.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AttachMoney sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No trade spends found. Create your first trade spend to get started.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', bgcolor: 'background.default' } }}>
                  <TableCell><TableSortLabel active={sortField === 'spendId'} direction={sortField === 'spendId' ? sortDir : 'asc'} onClick={() => handleSort('spendId')}>Spend ID</TableSortLabel></TableCell>
                  <TableCell><TableSortLabel active={sortField === 'spendType'} direction={sortField === 'spendType' ? sortDir : 'asc'} onClick={() => handleSort('spendType')}>Type</TableSortLabel></TableCell>
                  <TableCell><TableSortLabel active={sortField === 'customerName'} direction={sortField === 'customerName' ? sortDir : 'asc'} onClick={() => handleSort('customerName')}>Customer</TableSortLabel></TableCell>
                  <TableCell align="right">Requested</TableCell>
                  <TableCell align="right">Approved</TableCell>
                  <TableCell align="right">Spent</TableCell>
                  <TableCell><TableSortLabel active={sortField === 'status'} direction={sortField === 'status' ? sortDir : 'asc'} onClick={() => handleSort('status')}>Status</TableSortLabel></TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSpends.map((spend) => (
                  <TableRow key={spend.id || spend._id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha('#1E40AF', 0.02) } }}
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
                          sx={{ color: '#6B7280', '&:hover': { color: 'primary.dark', bgcolor: alpha('#1E40AF', 0.08) } }}><Visibility fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(spend._id)}
                          sx={{ color: '#6B7280', '&:hover': { color: 'primary.dark', bgcolor: alpha('#1E40AF', 0.08) } }}><Edit fontSize="small" /></IconButton></Tooltip>
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
        {filteredSpends.length > 0 && (
          <TablePagination component="div" count={sortedSpends.length} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]} />
        )}
      </Paper>
    {ConfirmDialogComponent}
    </Box>
  );
};

export default TradeSpendList;
