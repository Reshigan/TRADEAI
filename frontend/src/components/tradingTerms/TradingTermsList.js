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

// Mock data for development
const mockTradingTerms = [
  {
    id: '1',
    title: 'Standard Payment Terms',
    description: 'Net 30 payment terms for standard customers',
    type: 'payment',
    status: 'active',
    approvalStatus: 'approved',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-15T10:30:00Z'
  },
  {
    id: '2',
    title: 'Volume Discount Terms',
    description: '5% discount for orders over $10,000',
    type: 'discount',
    status: 'active',
    approvalStatus: 'pending',
    createdAt: '2025-01-10T14:20:00Z',
    updatedAt: '2025-01-12T09:15:00Z'
  },
  {
    id: '3',
    title: 'Return Policy',
    description: '30-day return policy for all products',
    type: 'return',
    status: 'inactive',
    approvalStatus: 'approved',
    createdAt: '2025-01-05T16:45:00Z',
    updatedAt: '2025-01-08T11:30:00Z'
  }
];

const TradingTermsList = () => {
  const navigate = useNavigate();
  const [tradingTerms, setTradingTerms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTradingTerms(mockTradingTerms);
      setLoading(false);
    }, 1000);
  }, []);

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
        {tradingTerms.length === 0 ? (
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