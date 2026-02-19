import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, TextField, Grid, Paper, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, alpha, Tabs, Tab,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon, Cancel as RejectIcon, Visibility as ViewIcon,
  Warning as WarningIcon, AccessTime as ClockIcon, AssignmentTurnedIn as ApprovalIcon,
  HourglassEmpty as PendingIcon, ErrorOutline as OverdueIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import approvalService from '../../services/approval/approvalService';
import { smartApprovalsService } from '../../services/api';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';

const ApprovalsList = () => {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: null });
  const [actionComment, setActionComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [riskScores, setRiskScores] = useState({});
  const [smartLoading, setSmartLoading] = useState(false);

  useEffect(() => {
    loadApprovals();
    analytics.trackEvent('approvals_list_viewed', { filter });
  }, [filter]);

  useEffect(() => {
    if (approvals.length > 0 && Object.keys(riskScores).length === 0) {
      loadSmartEvaluations();
    }
  }, [approvals]);

  const loadSmartEvaluations = async () => {
    try {
      setSmartLoading(true);
      const res = await smartApprovalsService.bulkEvaluate();
      if (res.success && res.data?.evaluations) {
        const scores = {};
        res.data.evaluations.forEach(ev => { scores[ev.id] = ev; });
        setRiskScores(scores);
      }
    } catch (err) {
      console.error('Error loading smart evaluations:', err);
    } finally {
      setSmartLoading(false);
    }
  };

  const loadApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      let response;
      if (filter === 'pending') response = await approvalService.getPendingApprovals();
      else if (filter === 'overdue') response = await approvalService.getOverdueApprovals();
      setApprovals(response.data || []);
    } catch (err) {
      console.error('Error loading approvals:', err);
      setError(err.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await approvalService.approveApproval((selectedApproval.id || selectedApproval._id), actionComment);
      analytics.trackEvent('approval_approved', { approvalId: (selectedApproval.id || selectedApproval._id), entityType: selectedApproval.entityType });
      setActionDialog({ open: false, type: null });
      setActionComment('');
      setSelectedApproval(null);
      loadApprovals();
    } catch (err) {
      console.error('Error approving:', err);
      setError(err.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await approvalService.rejectApproval((selectedApproval.id || selectedApproval._id), actionComment);
      analytics.trackEvent('approval_rejected', { approvalId: (selectedApproval.id || selectedApproval._id), entityType: selectedApproval.entityType });
      setActionDialog({ open: false, type: null });
      setActionComment('');
      setSelectedApproval(null);
      loadApprovals();
    } catch (err) {
      console.error('Error rejecting:', err);
      setError(err.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const openActionDialog = (approval, type) => {
    setSelectedApproval(approval);
    setActionDialog({ open: true, type });
    setActionComment('');
  };

  const getStatusColor = (status) => ({ pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'default', expired: 'error' })[status] || 'default';
  const isOverdue = (approval) => {
    const dueDate = approval.dueDate || approval.sla?.dueDate;
    return approval.sla?.isOverdue || (dueDate && new Date(dueDate) < new Date());
  };
  const formatCurrency = (amount, currency = 'ZAR') => new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(amount);
  const formatDate = (date) => new Date(date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const approvalStats = useMemo(() => ({
    total: approvals.length,
    overdue: approvals.filter(a => isOverdue(a)).length,
    pending: approvals.filter(a => a.status === 'pending').length,
  }), [approvals]);

  if (loading) return <SkeletonLoader type="table" />;

  const summaryCards = [
    { label: 'Total Pending', value: approvalStats.total, icon: <ApprovalIcon />, color: '#7C3AED', bg: alpha('#7C3AED', 0.08) },
    { label: 'Awaiting Action', value: approvalStats.pending, icon: <PendingIcon />, color: '#D97706', bg: alpha('#D97706', 0.08) },
    { label: 'Overdue', value: approvalStats.overdue, icon: <OverdueIcon />, color: '#DC2626', bg: alpha('#DC2626', 0.08) },
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Approvals</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>Review and action pending approval requests</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError(null)}>{error}</Alert>}

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
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
          <Tabs value={filter === 'pending' ? 0 : 1} onChange={(_, v) => setFilter(v === 0 ? 'pending' : 'overdue')}
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48, fontSize: '0.875rem' }, '& .Mui-selected': { color: '#7C3AED' }, '& .MuiTabs-indicator': { bgcolor: '#7C3AED' } }}>
            <Tab label="Pending" />
            <Tab label="Overdue" />
          </Tabs>
          <Chip label={`${approvals.length} items`} size="small" sx={{ bgcolor: alpha('#7C3AED', 0.08), color: '#7C3AED', fontWeight: 600 }} />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', bgcolor: '#F9FAFB' } }}>
                <TableCell>Request</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Risk</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {approvals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <ApprovalIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No approvals found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                approvals.map((approval) => (
                  <TableRow key={approval.id || approval._id} hover
                    sx={{ bgcolor: isOverdue(approval) ? alpha('#DC2626', 0.03) : 'inherit', '&:hover': { bgcolor: alpha('#7C3AED', 0.02) } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isOverdue(approval) && <Tooltip title="Overdue"><WarningIcon color="error" sx={{ fontSize: 18 }} /></Tooltip>}
                        <Typography variant="body2" fontWeight={600}>{approval.approvalId}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={formatLabel(approval.entityType)} size="small" variant="outlined" sx={{ borderRadius: '6px', height: 24 }} /></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={700}>{formatCurrency(approval.amount, approval.currency)}</Typography></TableCell>
                    <TableCell>
                      {riskScores[approval.id || approval._id] ? (
                        <Chip
                          label={`${riskScores[approval.id || approval._id].riskScore || 0} — ${riskScores[approval.id || approval._id].recommendation || 'review'}`}
                          size="small"
                          sx={{
                            borderRadius: '6px', height: 24, fontWeight: 600, fontSize: '0.7rem',
                            bgcolor: alpha(
                              (riskScores[approval.id || approval._id].riskScore || 0) <= 20 ? '#059669' :
                              (riskScores[approval.id || approval._id].riskScore || 0) <= 40 ? '#D97706' :
                              (riskScores[approval.id || approval._id].riskScore || 0) <= 70 ? '#EA580C' : '#DC2626', 0.1),
                            color:
                              (riskScores[approval.id || approval._id].riskScore || 0) <= 20 ? '#059669' :
                              (riskScores[approval.id || approval._id].riskScore || 0) <= 40 ? '#D97706' :
                              (riskScores[approval.id || approval._id].riskScore || 0) <= 70 ? '#EA580C' : '#DC2626'
                          }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell><Typography variant="body2">{typeof approval.requestedBy === 'object' ? (approval.requestedBy?.name || 'Unknown') : (approval.requestedByName || approval.requestedBy || 'Unknown')}</Typography></TableCell>
                    <TableCell>
                      {(approval.dueDate || approval.sla?.dueDate) && (
                        <Typography variant="body2" color={isOverdue(approval) ? 'error' : 'text.secondary'} fontWeight={isOverdue(approval) ? 600 : 400}>
                          {formatDate(approval.dueDate || approval.sla.dueDate)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={approval.currentApprovalLevel != null ? `Level ${approval.currentApprovalLevel}/${approval.approvalChain?.length || 0}` : formatLabel(approval.priority || 'normal')}
                        size="small" icon={<ClockIcon />}
                        color={approval.priority === 'high' ? 'error' : approval.priority === 'medium' ? 'warning' : 'default'}
                        sx={{ borderRadius: '6px', height: 24 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="View"><IconButton size="small" onClick={() => navigate(`/approvals/${approval.id || approval._id}`)}
                          sx={{ color: '#6B7280', '&:hover': { bgcolor: alpha('#7C3AED', 0.08), color: '#7C3AED' } }}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                        {approval.status === 'pending' && (
                          <>
                            <Tooltip title="Approve"><IconButton size="small" onClick={() => openActionDialog(approval, 'approve')}
                              sx={{ color: '#059669', '&:hover': { bgcolor: alpha('#059669', 0.08) } }}><ApproveIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Reject"><IconButton size="small" onClick={() => openActionDialog(approval, 'reject')}
                              sx={{ color: '#DC2626', '&:hover': { bgcolor: alpha('#DC2626', 0.08) } }}><RejectIcon fontSize="small" /></IconButton></Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={actionDialog.open} onClose={() => !actionLoading && setActionDialog({ open: false, type: null })} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{actionDialog.type === 'approve' ? 'Approve Request' : 'Reject Request'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={4}
            label={actionDialog.type === 'approve' ? 'Comments (Optional)' : 'Reason for Rejection'}
            value={actionComment} onChange={(e) => setActionComment(e.target.value)}
            sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            required={actionDialog.type === 'reject'} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setActionDialog({ open: false, type: null })} disabled={actionLoading}
            sx={{ borderRadius: '10px', textTransform: 'none' }}>Cancel</Button>
          <Button onClick={actionDialog.type === 'approve' ? handleApprove : handleReject} variant="contained"
            color={actionDialog.type === 'approve' ? 'success' : 'error'}
            disabled={actionLoading || (actionDialog.type === 'reject' && !actionComment)}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
            {actionLoading ? 'Processing...' : actionDialog.type === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalsList;
