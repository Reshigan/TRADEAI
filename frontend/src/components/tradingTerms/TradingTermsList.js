import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

import { PageHeader } from '../common';
import { formatLabel } from '../../utils/formatters';
import api from '../../services/api';

const TradingTermsList = () => {
  const navigate = useNavigate();
  const [tradingTerms, setTradingTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  console.log('TradingTermsList render - tradingTerms:', tradingTerms, 'type:', typeof tradingTerms, 'isArray:', Array.isArray(tradingTerms));
  // Debug: Force rebuild with different hash v2

  useEffect(() => {
    fetchTradingTerms();
  }, []);

  const fetchTradingTerms = async () => {
    try {
      const response = await api.get('/trading-terms');
      const data = response.data;
      const tradingTermsArray = data?.data?.tradingTerms || data?.data || data || [];
      if (Array.isArray(tradingTermsArray)) {
        setTradingTerms(tradingTermsArray);
      } else {
        setTradingTerms([]);
      }
    } catch (error) {
      console.error('Error fetching trading terms:', error);
      setError('Failed to load trading terms');
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
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Trading Terms"
        subtitle="Manage trading terms and conditions"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/trading-terms/new')}
          >
            Add Trading Term
          </Button>
        }
      />

      <Paper sx={{ mt: 3 }}>
        {error ? (
          <Box p={4} textAlign="center">
            <Alert severity="error">
              {error}
            </Alert>
          </Box>
        ) : tradingTerms.length === 0 && !loading ? (
          <Box p={4} textAlign="center">
            <Alert severity="info">
              No trading terms found. Click "Add Trading Term" to create your first trading term.
            </Alert>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Approval Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(tradingTerms) ? tradingTerms.map((term) => (
                  <TableRow key={term.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {term.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {term.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatLabel(term.termType)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatLabel(term.isActive ? 'active' : 'inactive')}
                        size="small"
                        color={getStatusColor(term.isActive ? 'active' : 'inactive')}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getApprovalStatusIcon(term.approvalWorkflow?.status)}
                        label={formatLabel(term.approvalWorkflow?.status || 'draft')}
                        size="small"
                        color={getApprovalStatusColor(term.approvalWorkflow?.status)}
                      />
                    </TableCell>
                    <TableCell>{formatDate(term.createdAt)}</TableCell>
                    <TableCell>{formatDate(term.updatedAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/trading-terms/${term.id}`)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/trading-terms/${term.id}/edit`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No trading terms available
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default TradingTermsList;
