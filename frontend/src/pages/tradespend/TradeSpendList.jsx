import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Add,
  Refresh,
  Edit,
  Delete,
  CheckCircle,
  Visibility,
  AttachMoney,
  TrendingUp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import tradeSpendService from '../../services/tradespend/tradeSpendService';

const TradeSpendList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tradeSpends, setTradeSpends] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    spendType: '',
    status: '',
    page: 1,
    limit: 20
  });

  const loadTradeSpends = async () => {
    setLoading(true);
    try {
      const response = await tradeSpendService.getTradeSpends(filters);
      setTradeSpends(response.tradeSpends || []);
    } catch (error) {
      console.error('Failed to load trade spends:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await tradeSpendService.getTradeSpendSummary(currentYear, 'year');
      setSummary(response.summary || null);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  useEffect(() => {
    loadTradeSpends();
    loadSummary();
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page on filter change
    }));
  };

  const handleCreateNew = () => {
    navigate('/trade-spends/new');
  };

  const handleView = (id) => {
    navigate(`/trade-spends/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/trade-spends/${id}/edit`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this trade spend?')) {
      try {
        await tradeSpendService.deleteTradeSpend(id);
        loadTradeSpends();
      } catch (error) {
        console.error('Failed to delete trade spend:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      submitted: 'info',
      approved: 'success',
      active: 'primary',
      completed: 'success',
      cancelled: 'error',
      rejected: 'error'
    };
    return colors[status] || 'default';
  };

  const getSpendTypeLabel = (type) => {
    const labels = {
      marketing: 'Marketing',
      cash_coop: 'Cash Co-op',
      trading_terms: 'Trading Terms',
      rebate: 'Rebate',
      promotion: 'Promotion'
    };
    return labels[type] || type;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <div>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Trade Spend Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage marketing, cash co-op, trading terms, and promotional spend
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadTradeSpends}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateNew}
          >
            New Trade Spend
          </Button>
        </Box>
      </Box>

      {summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachMoney color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Requested
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  ${(summary.totalRequested / 1000 || 0).toFixed(1)}K
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Approved
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  ${(summary.totalApproved / 1000 || 0).toFixed(1)}K
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUp color="info" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Spent
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                  ${(summary.totalSpent / 1000 || 0).toFixed(1)}K
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Utilization
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {summary.totalApproved > 0 
                    ? ((summary.totalSpent / summary.totalApproved) * 100).toFixed(1)
                    : 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              select
              label="Spend Type"
              value={filters.spendType}
              onChange={(e) => handleFilterChange('spendType', e.target.value)}
              sx={{ minWidth: 200 }}
              size="small"
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="marketing">Marketing</MenuItem>
              <MenuItem value="cash_coop">Cash Co-op</MenuItem>
              <MenuItem value="trading_terms">Trading Terms</MenuItem>
              <MenuItem value="rebate">Rebate</MenuItem>
              <MenuItem value="promotion">Promotion</MenuItem>
            </TextField>
            <TextField
              select
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              sx={{ minWidth: 200 }}
              size="small"
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : tradeSpends.length === 0 ? (
            <Alert severity="info">
              No trade spends found. Create your first trade spend to get started.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Spend ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Requested</TableCell>
                    <TableCell align="right">Approved</TableCell>
                    <TableCell align="right">Spent</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tradeSpends.map((spend) => (
                    <TableRow key={spend._id} hover>
                      <TableCell>{spend.spendId}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getSpendTypeLabel(spend.spendType)} 
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{spend.category}</TableCell>
                      <TableCell>{spend.customer?.name || 'N/A'}</TableCell>
                      <TableCell align="right">
                        ${(spend.amount?.requested || 0).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ${(spend.amount?.approved || 0).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ${(spend.amount?.spent || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={spend.status} 
                          color={getStatusColor(spend.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {spend.period?.startDate 
                          ? new Date(spend.period.startDate).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => handleView(spend._id)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEdit(spend._id)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(spend._id)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TradeSpendList;
