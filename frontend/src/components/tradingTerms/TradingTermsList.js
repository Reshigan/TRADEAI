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

const TradingTermsList = () => {
  const navigate = useNavigate();
  const [tradingTerms, setTradingTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTradingTerms();
  }, []);

  const fetchTradingTerms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/trading-terms', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTradingTerms(data);
      } else {
        setError('Failed to fetch trading terms');
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
                {tradingTerms.map((term) => (
                  <TableRow key={term.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {term.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {term.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={term.type}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={term.status}
                        size="small"
                        color={getStatusColor(term.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getApprovalStatusIcon(term.approvalStatus)}
                        label={term.approvalStatus}
                        size="small"
                        color={getApprovalStatusColor(term.approvalStatus)}
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
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default TradingTermsList;