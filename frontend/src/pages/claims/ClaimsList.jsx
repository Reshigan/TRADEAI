import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, Grid, Paper, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Alert, alpha, Tabs, Tab,
} from '@mui/material';
import {
  Add as AddIcon, Visibility as ViewIcon, PlayArrow as AutoMatchIcon,
  Receipt as ClaimsIcon, CheckCircle as ApprovedIcon, HourglassEmpty as PendingIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import claimService from '../../services/claim/claimService';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';

const ClaimsList = () => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('all');
  const [statistics, setStatistics] = useState(null);
  const [statusTab, setStatusTab] = useState(0);

  useEffect(() => {
    loadClaims();
    loadStatistics();
    analytics.trackEvent('claims_list_viewed', { filter });
  }, [filter]);

  const loadClaims = async () => {
    try {
      setLoading(true);
      setError(null);
      let response;
      if (filter === 'unmatched') response = await claimService.getUnmatchedClaims();
      else if (filter === 'pending') response = await claimService.getPendingApprovalClaims();
      else response = await claimService.getAllClaims();
      setClaims(response.data || []);
    } catch (err) {
      console.error('Error loading claims:', err);
      setError(err.message || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await claimService.getClaimStatistics();
      setStatistics(response.data);
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  const handleAutoMatch = async () => {
    try {
      setLoading(true);
      const response = await claimService.autoMatchClaims();
      analytics.trackEvent('claims_auto_matched', { matchCount: response.data?.length || 0 });
      setSuccess(`Successfully matched ${response.data?.length || 0} claims`);
      loadClaims();
      loadStatistics();
    } catch (err) {
      console.error('Error auto-matching claims:', err);
      setError(err.message || 'Failed to auto-match claims');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const map = { draft: 'default', submitted: 'info', under_review: 'warning', approved: 'success', rejected: 'error', paid: 'success', disputed: 'error' };
    return map[status] || 'default';
  };

  const getMatchStatusColor = (matchStatus) => {
    const map = { unmatched: 'error', partial: 'warning', full: 'success', overmatch: 'error' };
    return map[matchStatus] || 'default';
  };

  const formatCurrency = (amount, currency = 'ZAR') => new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(amount);
  const formatDate = (date) => new Date(date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });

  const claimStats = useMemo(() => {
    const total = claims.length;
    const approved = claims.filter(c => c.status === 'approved' || c.status === 'paid').length;
    const pending = claims.filter(c => c.status === 'submitted' || c.status === 'under_review').length;
    const totalAmount = claims.reduce((sum, c) => sum + (c.claimAmount || c.claimed_amount || 0), 0);
    return { total, approved, pending, totalAmount };
  }, [claims]);

  const statusTabs = ['All', 'Submitted', 'Under Review', 'Approved', 'Paid', 'Rejected'];
  const statusTabValues = ['all', 'submitted', 'under_review', 'approved', 'paid', 'rejected'];
  const filteredByTab = useMemo(() => {
    if (statusTab === 0) return claims;
    return claims.filter(c => c.status === statusTabValues[statusTab]);
  }, [claims, statusTab]);

  if (loading && claims.length === 0) return <SkeletonLoader type="table" />;

  const summaryCards = [
    { label: 'Total Claims', value: claimStats.total, icon: <ClaimsIcon />, color: '#7C3AED', bg: alpha('#7C3AED', 0.08) },
    { label: 'Approved', value: claimStats.approved, icon: <ApprovedIcon />, color: '#059669', bg: alpha('#059669', 0.08) },
    { label: 'Pending', value: claimStats.pending, icon: <PendingIcon />, color: '#D97706', bg: alpha('#D97706', 0.08) },
    { label: 'Total Value', value: formatCurrency(claimStats.totalAmount), icon: <MoneyIcon />, color: '#2563EB', bg: alpha('#2563EB', 0.08) },
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Claims Management</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>Track, match, and manage trade claims</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<AutoMatchIcon />} onClick={handleAutoMatch} disabled={loading}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' }, borderColor: '#7C3AED', color: '#7C3AED', '&:hover': { borderColor: '#6D28D9', bgcolor: alpha('#7C3AED', 0.04) } }}>
            Auto-Match
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/claims/create')}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' }, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            Create Claim
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setSuccess(null)}>{success}</Alert>}

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

      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Tabs value={statusTab} onChange={(_, v) => setStatusTab(v)}
            sx={{ px: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48, fontSize: '0.875rem' }, '& .Mui-selected': { color: '#7C3AED' }, '& .MuiTabs-indicator': { bgcolor: '#7C3AED' } }}>
            {statusTabs.map((t) => <Tab key={t} label={t} />)}
          </Tabs>
          <Box sx={{ pr: 2 }}>
            <TextField select value={filter} onChange={(e) => setFilter(e.target.value)} size="small" label="Source"
              sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }}>
              <MenuItem value="all">All Claims</MenuItem>
              <MenuItem value="unmatched">Unmatched</MenuItem>
              <MenuItem value="pending">Pending Approval</MenuItem>
            </TextField>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', bgcolor: '#F9FAFB' } }}>
                <TableCell>Claim ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Match</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredByTab.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <ClaimsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No claims found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredByTab.map((claim) => (
                  <TableRow key={claim.id || claim._id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha('#7C3AED', 0.02) } }}
                    onClick={() => navigate(`/claims/${claim.id || claim._id}`)}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {claim.claimNumber || claim.claimId || claim.id || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell><Chip label={formatLabel(claim.claimType)} size="small" variant="outlined" sx={{ borderRadius: '6px', height: 24 }} /></TableCell>
                    <TableCell><Typography variant="body2">{claim.customerName || claim.customer?.name || 'Unknown'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{formatDate(claim.claimDate)}</Typography></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>{formatCurrency(claim.claimAmount || claim.claimed_amount || 0, claim.currency)}</Typography>
                      {(claim.approvedAmount || claim.approved_amount) > 0 && (claim.approvedAmount || claim.approved_amount) !== (claim.claimAmount || claim.claimed_amount) && (
                        <Typography variant="caption" color="text.secondary" display="block">Approved: {formatCurrency(claim.approvedAmount || claim.approved_amount, claim.currency)}</Typography>
                      )}
                    </TableCell>
                    <TableCell><Chip label={formatLabel(claim.status)} color={getStatusColor(claim.status)} size="small" sx={{ borderRadius: '6px', height: 24, fontWeight: 600 }} /></TableCell>
                    <TableCell><Chip label={formatLabel(claim.matching?.matchStatus || 'unmatched')} color={getMatchStatusColor(claim.matching?.matchStatus)} size="small" sx={{ borderRadius: '6px', height: 24 }} /></TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => navigate(`/claims/${claim.id || claim._id}`)}
                          sx={{ color: '#7C3AED', '&:hover': { bgcolor: alpha('#7C3AED', 0.08) } }}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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

export default ClaimsList;
