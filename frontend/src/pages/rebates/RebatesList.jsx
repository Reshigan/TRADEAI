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
  IconButton
} from '@mui/material';
import {Add, Edit, Delete, Visibility} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatLabel } from '../../utils/formatters';

const RebatesList = () => {
  const navigate = useNavigate();
  const [rebates, setRebates] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRebates = async () => {
    try {
      const response = await api.get('/rebates');
      if (response.data.success) {
        setRebates(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load rebates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRebates();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rebate?')) {
      try {
        await api.delete(`/rebates/${id}`);
        loadRebates();
      } catch (error) {
        console.error('Failed to delete rebate:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      active: 'success',
      calculating: 'info',
      inactive: 'warning',
      expired: 'error'
    };
    return colors[status] || 'default';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'volume': 'Volume Rebate',
      'growth': 'Growth Rebate',
      'early-payment': 'Early Payment',
      'slotting': 'Slotting Fee',
      'coop': 'Co-op Marketing',
      'off-invoice': 'Off-Invoice',
      'billback': 'Bill-Back',
      'display': 'Display/Feature'
    };
    return labels[type] || formatLabel(type);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Rebates Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure and manage all rebate programs
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/rebates/new')}
        >
          New Rebate
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Rate/Amount</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Accrued</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rebates.map((rebate) => (
              <TableRow key={rebate.id || rebate._id}>
                <TableCell>{rebate.name}</TableCell>
                <TableCell>
                  <Chip label={getTypeLabel(rebate.rebateType || rebate.type)} size="small" />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={formatLabel(rebate.status)}
                    color={getStatusColor(rebate.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {rebate.rateType === 'percentage' || rebate.calculationType === 'percentage'
                    ? `${rebate.rate || 0}%`
                    : `R ${(rebate.amount || 0).toLocaleString()}`
                  }
                </TableCell>
                <TableCell>
                  {rebate.startDate
                    ? new Date(rebate.startDate).toLocaleDateString() 
                    : '-'}
                </TableCell>
                <TableCell>R {(rebate.accruedAmount || rebate.totalAccrued || 0).toLocaleString()}</TableCell>
                <TableCell>R {(rebate.settledAmount || rebate.totalPaid || 0).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => navigate(`/rebates/${rebate.id || rebate._id}`)}>
                    <Visibility />
                  </IconButton>
                  <IconButton size="small" onClick={() => navigate(`/rebates/${rebate.id || rebate._id}/edit`)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(rebate.id || rebate._id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default RebatesList;
