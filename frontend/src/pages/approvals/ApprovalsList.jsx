import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  AccessTime as ClockIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import approvalService from '../../services/approval/approvalService';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { trackEvent } from '../../utils/analytics';

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

  useEffect(() => {
    loadApprovals();
    trackEvent('approvals_list_viewed', { filter });
  }, [filter]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (filter === 'pending') {
        response = await approvalService.getPendingApprovals();
      } else if (filter === 'overdue') {
        response = await approvalService.getOverdueApprovals();
      }
      
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
      await approvalService.approveApproval(selectedApproval._id, actionComment);
      
      trackEvent('approval_approved', {
        approvalId: selectedApproval._id,
        entityType: selectedApproval.entityType
      });
      
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
      await approvalService.rejectApproval(selectedApproval._id, actionComment);
      
      trackEvent('approval_rejected', {
        approvalId: selectedApproval._id,
        entityType: selectedApproval.entityType
      });
      
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'cancelled':
        return 'default';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const isOverdue = (approval) => {
    return approval.sla?.isOverdue || (approval.sla?.dueDate && new Date(approval.sla.dueDate) < new Date());
  };

  const formatCurrency = (amount, currency = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <SkeletonLoader type="table" />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Approvals Management</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="pending">Pending Approvals</MenuItem>
                <MenuItem value="overdue">Overdue Approvals</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Chip
                  label={`${approvals.length} Total`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`${approvals.filter(a => isOverdue(a)).length} Overdue`}
                  color="error"
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Approval ID</TableCell>
              <TableCell>Entity Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Requested By</TableCell>
              <TableCell>Requested At</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {approvals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No approvals found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              approvals.map((approval) => (
                <TableRow
                  key={approval._id}
                  sx={{
                    backgroundColor: isOverdue(approval) ? 'rgba(211, 47, 47, 0.08)' : 'inherit'
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isOverdue(approval) && (
                        <Tooltip title="Overdue">
                          <WarningIcon color="error" fontSize="small" />
                        </Tooltip>
                      )}
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {approval.approvalId}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={approval.entityType.replace('_', ' ').toUpperCase()}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(approval.amount, approval.currency)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {approval.requestedBy?.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {formatDate(approval.requestedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={approval.status.toUpperCase()}
                      color={getStatusColor(approval.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`Level ${approval.currentApprovalLevel}/${approval.approvalChain?.length || 0}`}
                      size="small"
                      icon={<ClockIcon />}
                    />
                  </TableCell>
                  <TableCell>
                    {approval.sla?.dueDate && (
                      <Typography
                        variant="body2"
                        color={isOverdue(approval) ? 'error' : 'textSecondary'}
                      >
                        {formatDate(approval.sla.dueDate)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/approvals/${approval._id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {approval.status === 'pending' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => openActionDialog(approval, 'approve')}
                            >
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openActionDialog(approval, 'reject')}
                            >
                              <RejectIcon />
                            </IconButton>
                          </Tooltip>
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

      <Dialog
        open={actionDialog.open}
        onClose={() => !actionLoading && setActionDialog({ open: false, type: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionDialog.type === 'approve' ? 'Approve Request' : 'Reject Request'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={actionDialog.type === 'approve' ? 'Comments (Optional)' : 'Reason for Rejection'}
            value={actionComment}
            onChange={(e) => setActionComment(e.target.value)}
            sx={{ mt: 2 }}
            required={actionDialog.type === 'reject'}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setActionDialog({ open: false, type: null })}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={actionDialog.type === 'approve' ? handleApprove : handleReject}
            variant="contained"
            color={actionDialog.type === 'approve' ? 'success' : 'error'}
            disabled={actionLoading || (actionDialog.type === 'reject' && !actionComment)}
          >
            {actionLoading ? 'Processing...' : actionDialog.type === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalsList;
