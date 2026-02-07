import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Visibility
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import tradingTermsService from '../../services/tradingterms/tradingTermsService';
import { formatLabel } from '../../utils/formatters';

const TradingTermsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tradingTerms, setTradingTerms] = useState([]);
  const [filters, setFilters] = useState({
    termType: '',
    status: '',
    isActive: ''
  });

  const loadTradingTerms = async () => {
    setLoading(true);
    try {
      const response = await tradingTermsService.getTradingTerms(filters);
      const terms = response.tradingTerms || response.data || response || [];
      setTradingTerms(Array.isArray(terms) ? terms : []);
    } catch (error) {
      console.error('Failed to load trading terms:', error);
      setTradingTerms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTradingTerms();
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateNew = () => {
    navigate('/trading-terms/new');
  };

  const handleView = (id) => {
    navigate(`/trading-terms/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/trading-terms/${id}/edit`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this trading term?')) {
      try {
        await tradingTermsService.deleteTradingTerm(id);
        loadTradingTerms();
      } catch (error) {
        console.error('Failed to delete trading term:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      pending_approval: 'warning',
      approved: 'success',
      rejected: 'error',
      expired: 'default',
      suspended: 'warning'
    };
    return colors[status] || 'default';
  };

  const getTermTypeLabel = (type) => {
    const labels = {
      volume_discount: 'Volume Discount',
      early_payment: 'Early Payment',
      prompt_payment: 'Prompt Payment',
      rebate: 'Rebate',
      listing_fee: 'Listing Fee',
      promotional_support: 'Promotional Support',
      marketing_contribution: 'Marketing Contribution',
      settlement_discount: 'Settlement Discount',
      cash_discount: 'Cash Discount',
      quantity_discount: 'Quantity Discount',
      loyalty_bonus: 'Loyalty Bonus',
      growth_incentive: 'Growth Incentive'
    };
    return labels[type] || formatLabel(type);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <div>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Trading Terms Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage volume discounts, payment terms, rebates, and promotional support
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadTradingTerms}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateNew}
          >
            New Trading Term
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              select
              label="Term Type"
              value={filters.termType}
              onChange={(e) => handleFilterChange('termType', e.target.value)}
              sx={{ minWidth: 250 }}
              size="small"
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="volume_discount">Volume Discount</MenuItem>
              <MenuItem value="early_payment">Early Payment</MenuItem>
              <MenuItem value="prompt_payment">Prompt Payment</MenuItem>
              <MenuItem value="rebate">Rebate</MenuItem>
              <MenuItem value="listing_fee">Listing Fee</MenuItem>
              <MenuItem value="promotional_support">Promotional Support</MenuItem>
              <MenuItem value="marketing_contribution">Marketing Contribution</MenuItem>
              <MenuItem value="settlement_discount">Settlement Discount</MenuItem>
              <MenuItem value="cash_discount">Cash Discount</MenuItem>
              <MenuItem value="quantity_discount">Quantity Discount</MenuItem>
              <MenuItem value="loyalty_bonus">Loyalty Bonus</MenuItem>
              <MenuItem value="growth_incentive">Growth Incentive</MenuItem>
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
              <MenuItem value="pending_approval">Pending Approval</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </TextField>
            <TextField
              select
              label="Active Status"
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              sx={{ minWidth: 150 }}
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </TextField>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : tradingTerms.length === 0 ? (
            <Alert severity="info">
              No trading terms found. Create your first trading term to get started.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Valid From</TableCell>
                    <TableCell>Valid To</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="right">Threshold</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tradingTerms.map((term) => (
                    <TableRow key={term._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {term.code}
                        </Typography>
                      </TableCell>
                      <TableCell>{term.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getTermTypeLabel(term.termType)} 
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                          <Chip 
                            label={formatLabel(term.status || 'draft')} 
                            color={getStatusColor(term.status)}
                            size="small"
                          />
                      </TableCell>
                      <TableCell>
                          {term.startDate 
                            ? new Date(term.startDate).toLocaleDateString()
                            : 'N/A'}
                      </TableCell>
                      <TableCell>
                          {term.endDate 
                            ? new Date(term.endDate).toLocaleDateString()
                            : 'N/A'}
                      </TableCell>
                      <TableCell align="right">
                        R{(term.rate || 0).toLocaleString()}{term.rateType === 'percentage' ? '%' : ''}
                      </TableCell>
                      <TableCell align="right">
                        {term.threshold ? `${term.threshold.toLocaleString()}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={formatLabel(term.priority || 'medium')} 
                          size="small"
                          color={term.priority === 'critical' ? 'error' : term.priority === 'high' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => handleView(term._id)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEdit(term._id)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(term._id)}
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

export default TradingTermsList;
