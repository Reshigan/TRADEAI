import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

import { PageHeader } from '../common';

const TradingTermDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tradingTerm, setTradingTerm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setError] = useState('');

  useEffect(() => {
    fetchTradingTerm();
  }, [id]);

  const fetchTradingTerm = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/trading-terms/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTradingTerm(data);
      } else {
        setError('Failed to fetch trading term details');
      }
    } catch (error) {
      console.error('Error fetching trading term:', error);
      setError('Failed to load trading term details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      default:
        return 'default';
    }
  };

  const getApprovalStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getApprovalStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon fontSize="small" />;
      case 'pending':
        return <ScheduleIcon fontSize="small" />;
      case 'rejected':
        return <CancelIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!tradingTerm) {
    return (
      <Box>
        <Alert severity="error">Trading term not found.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={tradingTerm.title}
        subtitle="Trading term details"
        action={
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/trading-terms')}
            >
              Back to List
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/trading-terms/${id}/edit`)}
            >
              Edit
            </Button>
          </Box>
        }
      />

      <Paper sx={{ mt: 3, p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {tradingTerm.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Content
            </Typography>
            <Typography variant="body1" paragraph>
              {tradingTerm.content}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Details
              </Typography>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Type
                </Typography>
                <Chip
                  label={tradingTerm.type}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={tradingTerm.status}
                  size="small"
                  color={getStatusColor(tradingTerm.status)}
                />
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Approval Status
                </Typography>
                <Chip
                  icon={getApprovalStatusIcon(tradingTerm.approvalStatus)}
                  label={tradingTerm.approvalStatus}
                  size="small"
                  color={getApprovalStatusColor(tradingTerm.approvalStatus)}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Effective Date
                </Typography>
                <Typography variant="body2">
                  {formatDate(tradingTerm.effectiveDate)}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Expiry Date
                </Typography>
                <Typography variant="body2">
                  {formatDate(tradingTerm.expiryDate)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Created By
                </Typography>
                <Typography variant="body2">
                  {tradingTerm.createdBy}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body2">
                  {formatDate(tradingTerm.createdAt)}
                </Typography>
              </Box>

              {tradingTerm.approvedBy && (
                <>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Approved By
                    </Typography>
                    <Typography variant="body2">
                      {tradingTerm.approvedBy}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Approved At
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(tradingTerm.approvedAt)}
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default TradingTermDetail;