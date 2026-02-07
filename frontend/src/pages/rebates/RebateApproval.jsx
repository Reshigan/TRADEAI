import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import rebateService from '../../services/rebateService';
import { formatLabel } from '../../utils/formatters';

const RebateApproval = () => {
  const [rebates, setRebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRebate, setSelectedRebate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState(''); // 'approve' or 'reject'
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPendingRebates();
  }, []);

  const loadPendingRebates = async () => {
    try {
      setLoading(true);
      const response = await rebateService.getAllRebates({ status: 'pending_approval' });
      if (response.success) {
        setRebates(response.data);
      }
    } catch (error) {
      console.error('Failed to load pending rebates:', error);
      setError('Failed to load pending rebates');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (rebate, actionType) => {
    setSelectedRebate(rebate);
    setAction(actionType);
    setComments('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRebate(null);
    setAction('');
    setComments('');
  };

  const handleApprovalAction = async () => {
    if (!selectedRebate) return;

    try {
      setLoading(true);
      let response;
      
      if (action === 'approve') {
        response = await rebateService.approveRebate(selectedRebate._id, {
          comments,
          approvedAt: new Date().toISOString()
        });
      } else {
        response = await rebateService.rejectRebate(selectedRebate._id, {
          comments,
          rejectedAt: new Date().toISOString()
        });
      }

      if (response.success) {
        setSuccess(`Rebate ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        handleCloseDialog();
        loadPendingRebates();
      }
    } catch (error) {
      console.error(`Failed to ${action} rebate:`, error);
      setError(error.response?.data?.message || `Failed to ${action} rebate`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_approval: 'warning',
      approved: 'success',
      rejected: 'error',
      active: 'success',
      draft: 'default'
    };
    return colors[status] || 'default';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Rebate Approval Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and approve pending rebate requests
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rebate Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Customers</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : rebates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No pending rebates for approval</TableCell>
              </TableRow>
            ) : (
              rebates.map((rebate) => (
                <TableRow key={rebate._id}>
                  <TableCell>
                    <Typography variant="subtitle2">{rebate.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rebate.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={formatLabel(rebate.type)} size="small" />
                  </TableCell>
                  <TableCell>
                    {rebate.calculation?.method === 'percentage'
                      ? `${rebate.calculation.value}%`
                      : formatCurrency(rebate.calculation?.value)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(rebate.terms?.startDate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      to {formatDate(rebate.terms?.endDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {rebate.eligibility?.customerIds?.length || 0} customers
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatLabel(rebate.status)}
                      color={getStatusColor(rebate.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleOpenDialog(rebate, 'approve')}
                        title="Approve"
                      >
                        <CheckCircle />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDialog(rebate, 'reject')}
                        title="Reject"
                      >
                        <Cancel />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Approval/Rejection Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {action === 'approve' ? 'Approve Rebate' : 'Reject Rebate'}
        </DialogTitle>
        <DialogContent>
          {selectedRebate && (
            <Box sx={{ mt: 2 }}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="h6">{selectedRebate.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedRebate.description}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Type</Typography>
                      <Typography variant="body1">{formatLabel(selectedRebate.type)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Calculation</Typography>
                      <Typography variant="body1">
                        {selectedRebate.calculation?.method === 'percentage'
                          ? `${selectedRebate.calculation.value}%`
                          : formatCurrency(selectedRebate.calculation?.value)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Start Date</Typography>
                      <Typography variant="body1">{formatDate(selectedRebate.terms?.startDate)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">End Date</Typography>
                      <Typography variant="body1">{formatDate(selectedRebate.terms?.endDate)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Minimum Purchase</Typography>
                      <Typography variant="body1">
                        {formatCurrency(selectedRebate.eligibility?.minimumPurchase)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Payment Terms</Typography>
                      <Typography variant="body1">{selectedRebate.terms?.paymentTerms}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Divider sx={{ my: 2 }} />

              <TextField
                fullWidth
                label={action === 'approve' ? 'Approval Comments' : 'Rejection Reason'}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                multiline
                rows={4}
                placeholder={action === 'approve' 
                  ? 'Add any comments or conditions for approval...'
                  : 'Provide reason for rejection...'}
                required={action === 'reject'}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleApprovalAction}
            variant="contained"
            color={action === 'approve' ? 'success' : 'error'}
            disabled={loading || (action === 'reject' && !comments.trim())}
          >
            {action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RebateApproval;
