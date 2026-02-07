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
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Warning as DisputeIcon,
  PlayArrow as AutoMatchIcon,
  Assessment as ReconcileIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import deductionService from '../../services/deduction/deductionService';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';

const DeductionsList = () => {
  const navigate = useNavigate();
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('all');
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadDeductions();
    loadStatistics();
    analytics.trackEvent('deductions_list_viewed', { filter });
  }, [filter]);

  const loadDeductions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (filter === 'unmatched') {
        response = await deductionService.getUnmatchedDeductions();
      } else if (filter === 'disputed') {
        response = await deductionService.getDisputedDeductions();
      } else {
        response = await deductionService.getUnmatchedDeductions();
      }
      
      setDeductions(response.data || []);
    } catch (err) {
      console.error('Error loading deductions:', err);
      setError(err.message || 'Failed to load deductions');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await deductionService.getDeductionStatistics();
      setStatistics(response.data);
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  const handleAutoMatch = async () => {
    try {
      setLoading(true);
      const response = await deductionService.autoMatchDeductions();
      
      analytics.trackEvent('deductions_auto_matched', {
        matchCount: response.data?.length || 0
      });
      
      setSuccess(`Successfully matched ${response.data?.length || 0} deductions`);
      loadDeductions();
      loadStatistics();
    } catch (err) {
      console.error('Error auto-matching deductions:', err);
      setError(err.message || 'Failed to auto-match deductions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'identified':
        return 'info';
      case 'under_review':
        return 'warning';
      case 'valid':
        return 'success';
      case 'invalid':
        return 'error';
      case 'disputed':
        return 'error';
      case 'resolved':
        return 'success';
      case 'written_off':
        return 'default';
      default:
        return 'default';
    }
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
      day: 'numeric'
    });
  };

  if (loading && deductions.length === 0) {
    return <SkeletonLoader type="table" />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Deductions Management</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ReconcileIcon />}
            onClick={() => navigate('/deductions/reconciliation')}
          >
            Reconciliation
          </Button>
          <Button
            variant="outlined"
            startIcon={<AutoMatchIcon />}
            onClick={handleAutoMatch}
            disabled={loading}
          >
            Auto-Match Deductions
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/deductions/create')}
          >
            Create Deduction
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {statistics && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {statistics.byStatus?.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary">
                    {formatLabel(stat._id)}
                  </Typography>
                  <Typography variant="h4">{stat.count}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatCurrency(stat.totalAmount)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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
                <MenuItem value="all">All Deductions</MenuItem>
                <MenuItem value="unmatched">Unmatched Deductions</MenuItem>
                <MenuItem value="disputed">Disputed Deductions</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Chip
                  label={`${deductions.length} Deductions`}
                  color="primary"
                  variant="outlined"
                />
                {statistics?.disputes && (
                  <Chip
                    label={`${statistics.disputes.reduce((sum, d) => sum + d.count, 0)} Disputed`}
                    color="error"
                    variant="outlined"
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Deduction ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Deduction Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Matched</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deductions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No deductions found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              deductions.map((deduction) => (
                <TableRow key={deduction.id || deduction._id}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {deduction.deduction_number || deduction.deductionId || deduction.id || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatLabel(deduction.deduction_type || deduction.deductionType || 'unknown')}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {deduction.customer_name || deduction.customer?.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {deduction.deduction_date || deduction.deductionDate 
                        ? formatDate(deduction.deduction_date || deduction.deductionDate)
                        : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(deduction.deduction_amount || deduction.deductionAmount || 0, deduction.currency)}
                    </Typography>
                    {(deduction.validated_amount || deduction.validatedAmount) && 
                     (deduction.validated_amount || deduction.validatedAmount) !== (deduction.deduction_amount || deduction.deductionAmount) && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        Validated: {formatCurrency(deduction.validated_amount || deduction.validatedAmount, deduction.currency)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={formatLabel(deduction.status || 'unknown')}
                        color={getStatusColor(deduction.status)}
                        size="small"
                      />
                      {deduction.dispute?.isDisputed && (
                        <Tooltip title="Disputed">
                          <DisputeIcon color="error" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={(deduction.matched_amount || 0) > 0 ? 'Matched' : 'Unmatched'}
                      color={(deduction.matched_amount || 0) > 0 ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/deductions/${deduction.id || deduction._id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DeductionsList;
