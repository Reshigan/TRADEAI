import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import deductionService from '../../services/deduction/deductionService';
import claimService from '../../services/claim/claimService';
import customerService from '../../services/customer/customerService';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';

const ReconciliationDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reconciliation, setReconciliation] = useState(null);
  const [deductions, setDeductions] = useState([]);
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getCustomers();
      setCustomers(response.data || []);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const handleReconcile = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [reconciliationResponse, deductionsResponse, claimsResponse] = await Promise.all([
        deductionService.reconcileDeductionsWithClaims(selectedCustomer, startDate, endDate),
        deductionService.getDeductionsByCustomer(selectedCustomer, startDate, endDate),
        claimService.getClaimsByCustomer(selectedCustomer, startDate, endDate)
      ]);

      setReconciliation(reconciliationResponse.data);
      setDeductions(deductionsResponse.data || []);
      setClaims(claimsResponse.data || []);

      analytics.trackEvent('reconciliation_performed', {
        customerId: selectedCustomer,
        startDate,
        endDate
      });
    } catch (err) {
      console.error('Error reconciling:', err);
      setError(err.message || 'Failed to reconcile deductions with claims');
    } finally {
      setLoading(false);
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Deductions & Claims Reconciliation
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Compare deductions taken by customers with claims submitted to identify variances
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Customer"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                {customers.map((customer) => (
                  <MenuItem key={customer.id || customer._id} value={customer.id || customer._id}>
                    {customer.name} ({customer.code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AssessmentIcon />}
                onClick={handleReconcile}
                disabled={loading || !selectedCustomer}
              >
                {loading ? 'Reconciling...' : 'Reconcile'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && <SkeletonLoader type="dashboard" />}

      {reconciliation && !loading && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Total Deductions
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(reconciliation.deductions.totalAmount)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {reconciliation.deductions.count} deductions
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                      Matched: {reconciliation.deductions.matched} | Unmatched: {reconciliation.deductions.unmatched}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(reconciliation.deductions.matched / reconciliation.deductions.count) * 100}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Total Claims
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(reconciliation.claims.totalAmount)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {reconciliation.claims.count} claims
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                      Matched: {reconciliation.claims.matched} | Unmatched: {reconciliation.claims.unmatched}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(reconciliation.claims.matched / reconciliation.claims.count) * 100}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Variance
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h4" color={reconciliation.variance.amount > 0 ? 'error' : 'success'}>
                      {formatCurrency(Math.abs(reconciliation.variance.amount))}
                    </Typography>
                    {reconciliation.variance.amount > 0 ? (
                      <TrendingUpIcon color="error" />
                    ) : (
                      <TrendingDownIcon color="success" />
                    )}
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {Math.abs(reconciliation.variance.percentage).toFixed(2)}% variance
                  </Typography>
                  <Chip
                    label={reconciliation.variance.amount > 0 ? 'Over-deducted' : 'Under-deducted'}
                    color={reconciliation.variance.amount > 0 ? 'error' : 'warning'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Match Rate
                  </Typography>
                  <Typography variant="h4">
                    {reconciliation.deductions.count > 0
                      ? ((reconciliation.deductions.matched / reconciliation.deductions.count) * 100).toFixed(1)
                      : 0}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Deductions matched to claims
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Deductions
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Deduction ID</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {deductions.slice(0, 10).map((deduction) => (
                          <TableRow key={deduction.id || deduction._id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {deduction.deductionId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDate(deduction.deductionDate)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatCurrency(deduction.deductionAmount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={deduction.claim?.claimId ? 'Matched' : 'Unmatched'}
                                color={deduction.claim?.claimId ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {deductions.length > 10 && (
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      Showing 10 of {deductions.length} deductions
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Claims
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Claim ID</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {claims.slice(0, 10).map((claim) => (
                          <TableRow key={claim.id || claim._id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {claim.claimId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDate(claim.claimDate)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatCurrency(claim.claimAmount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={formatLabel(claim.matching?.matchStatus || 'unmatched')}
                                color={claim.matching?.matchStatus === 'full' ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {claims.length > 10 && (
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      Showing 10 of {claims.length} claims
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {!reconciliation && !loading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No Reconciliation Data
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Select a customer and date range, then click "Reconcile" to view reconciliation data
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ReconciliationDashboard;
