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
  PlayArrow as AutoMatchIcon
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
      if (filter === 'unmatched') {
        response = await claimService.getUnmatchedClaims();
      } else if (filter === 'pending') {
        response = await claimService.getPendingApprovalClaims();
      } else {
        response = await claimService.getUnmatchedClaims();
      }
      
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
      
      analytics.trackEvent('claims_auto_matched', {
        matchCount: response.data?.length || 0
      });
      
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
    switch (status) {
      case 'draft':
        return 'default';
      case 'submitted':
        return 'info';
      case 'under_review':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'paid':
        return 'success';
      case 'disputed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getMatchStatusColor = (matchStatus) => {
    switch (matchStatus) {
      case 'unmatched':
        return 'error';
      case 'partial':
        return 'warning';
      case 'full':
        return 'success';
      case 'overmatch':
        return 'error';
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

  if (loading && claims.length === 0) {
    return <SkeletonLoader type="table" />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Claims Management</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AutoMatchIcon />}
            onClick={handleAutoMatch}
            disabled={loading}
          >
            Auto-Match Claims
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/claims/create')}
          >
            Create Claim
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
                <MenuItem value="all">All Claims</MenuItem>
                <MenuItem value="unmatched">Unmatched Claims</MenuItem>
                <MenuItem value="pending">Pending Approval</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Chip
                  label={`${claims.length} Claims`}
                  color="primary"
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
              <TableCell>Claim ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Claim Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Match Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {claims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No claims found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              claims.map((claim) => (
                <TableRow key={claim._id}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {claim.claimId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatLabel(claim.claimType)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {claim.customer?.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {formatDate(claim.claimDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(claim.claimAmount || claim.claimed_amount || 0, claim.currency)}
                    </Typography>
                    {(claim.approvedAmount || claim.approved_amount) > 0 && 
                     (claim.approvedAmount || claim.approved_amount) !== (claim.claimAmount || claim.claimed_amount) && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        Approved: {formatCurrency(claim.approvedAmount || claim.approved_amount, claim.currency)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatLabel(claim.status)}
                      color={getStatusColor(claim.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatLabel(claim.matching?.matchStatus || 'unmatched')}
                      color={getMatchStatusColor(claim.matching?.matchStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/claims/${claim._id}`)}
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

export default ClaimsList;
