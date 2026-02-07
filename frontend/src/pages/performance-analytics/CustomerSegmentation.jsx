/**
 * Customer Segmentation Analytics Page
 * ABC customer analysis and segmentation with charts
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Chip,
  CircularProgress,
  Breadcrumbs,
  Link,
  Avatar,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Star,
  TrendingUp,
  People,
  Business,
  Search,
  OpenInNew
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import api from '../../services/api';

const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0'];

const CustomerSegmentation = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [segments, setSegments] = useState({
    A: { count: 0, revenue: 0, percentage: 0 },
    B: { count: 0, revenue: 0, percentage: 0 },
    C: { count: 0, revenue: 0, percentage: 0 }
  });
  
  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [orderBy, setOrderBy] = useState('revenue');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/performance-analytics/customer-segmentation');
        const data = response.data;
        
        // Transform API data to match component format
        const transformedCustomers = (data.customers || []).map(customer => ({
          _id: customer.customerId,
          name: customer.customerName || 'Unknown Customer',
          segment: customer.segment || 'C',
          revenue: customer.revenue || 0,
          orders: customer.transactionCount || 0,
          growth: Math.round((customer.revenuePercentage || 0) * 10) / 10,
          tier: customer.tier || 'bronze'
        }));
        
        setCustomers(transformedCustomers);
        
        const totalRevenue = data.summary?.totalRevenue || 0;
        setSegments({
          A: {
            count: data.summary?.segmentA?.count || 0,
            revenue: data.summary?.segmentA?.revenue || 0,
            percentage: totalRevenue > 0 ? Math.round((data.summary?.segmentA?.revenue || 0) / totalRevenue * 100) : 0
          },
          B: {
            count: data.summary?.segmentB?.count || 0,
            revenue: data.summary?.segmentB?.revenue || 0,
            percentage: totalRevenue > 0 ? Math.round((data.summary?.segmentB?.revenue || 0) / totalRevenue * 100) : 0
          },
          C: {
            count: data.summary?.segmentC?.count || 0,
            revenue: data.summary?.segmentC?.revenue || 0,
            percentage: totalRevenue > 0 ? Math.round((data.summary?.segmentC?.revenue || 0) / totalRevenue * 100) : 0
          }
        });
      } catch (error) {
        console.error('Error fetching customer data:', error);
        enqueueSnackbar('Failed to load customer segmentation', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [enqueueSnackbar]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getSegmentColor = (segment) => {
    switch (segment) {
      case 'A': return 'success';
      case 'B': return 'primary';
      case 'C': return 'warning';
      default: return 'default';
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'platinum': return '#E5E4E2';
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return '#9E9E9E';
    }
  };

  // Sorting and filtering
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSegment = !segmentFilter || customer.segment === segmentFilter;
      const matchesTier = !tierFilter || customer.tier === tierFilter;
      return matchesSearch && matchesSegment && matchesTier;
    })
    .sort((a, b) => {
      const aVal = a[orderBy] || 0;
      const bVal = b[orderBy] || 0;
      if (typeof aVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const paginatedCustomers = filteredCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Chart data
  const segmentPieData = [
    { name: 'Segment A', value: segments.A.count, revenue: segments.A.revenue },
    { name: 'Segment B', value: segments.B.count, revenue: segments.B.revenue },
    { name: 'Segment C', value: segments.C.count, revenue: segments.C.revenue }
  ].filter(d => d.value > 0);

  const revenueBarData = [
    { name: 'Segment A', revenue: segments.A.revenue / 1000, percentage: segments.A.percentage },
    { name: 'Segment B', revenue: segments.B.revenue / 1000, percentage: segments.B.percentage },
    { name: 'Segment C', revenue: segments.C.revenue / 1000, percentage: segments.C.percentage }
  ];

  const uniqueTiers = [...new Set(customers.map(c => c.tier).filter(Boolean))];

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="/dashboard">Home</Link>
        <Link color="inherit" href="/analytics">Insights</Link>
        <Typography color="text.primary">Customer Segmentation</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Customer Segmentation
        </Typography>
        <Typography variant="body2" color="textSecondary">
          ABC analysis and customer tier classification
        </Typography>
      </Box>

      {/* Segment Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderLeft: 4, borderColor: 'success.main' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" color="success.main">Segment A</Typography>
                  <Typography variant="body2" color="textSecondary">Top Performers</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light', width: 56, height: 56 }}>
                  <Star color="success" />
                </Avatar>
              </Box>
              <Box mt={2}>
                <Typography variant="h4">{segments.A.count} Customers</Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatCurrency(segments.A.revenue)} ({segments.A.percentage}% of revenue)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderLeft: 4, borderColor: 'primary.main' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" color="primary.main">Segment B</Typography>
                  <Typography variant="body2" color="textSecondary">Growth Potential</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
                  <TrendingUp color="primary" />
                </Avatar>
              </Box>
              <Box mt={2}>
                <Typography variant="h4">{segments.B.count} Customers</Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatCurrency(segments.B.revenue)} ({segments.B.percentage}% of revenue)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" color="warning.main">Segment C</Typography>
                  <Typography variant="body2" color="textSecondary">Maintenance</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', width: 56, height: 56 }}>
                  <People color="warning" />
                </Avatar>
              </Box>
              <Box mt={2}>
                <Typography variant="h4">{segments.C.count} Customers</Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatCurrency(segments.C.revenue)} ({segments.C.percentage}% of revenue)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Customer Distribution by Segment</Typography>
            <Box sx={{ height: 300 }}>
              {segmentPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={segmentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {segmentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <RechartsTooltip formatter={(value, name, props) => [`${value} customers`, props.payload.name]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography color="textSecondary">No segment data available</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Revenue by Segment</Typography>
            <Box sx={{ height: 300 }}>
              {revenueBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueBarData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                                        <YAxis label={{ value: 'Revenue (R K)', angle: -90, position: 'insideLeft' }} />
                                        <RechartsTooltip formatter={(value, name) => [name === 'revenue' ? `R${value}K` : `${value}%`, name === 'revenue' ? 'Revenue' : 'Percentage']} />
                    <Bar dataKey="revenue" fill="#4caf50" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography color="textSecondary">No revenue data available</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Customer Table */}
      <Paper>
        <Box p={2} borderBottom={1} borderColor="divider" display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Typography variant="h6">Customer Details</Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Segment</InputLabel>
              <Select
                value={segmentFilter}
                onChange={(e) => { setSegmentFilter(e.target.value); setPage(0); }}
                label="Segment"
              >
                <MenuItem value="">All Segments</MenuItem>
                <MenuItem value="A">Segment A</MenuItem>
                <MenuItem value="B">Segment B</MenuItem>
                <MenuItem value="C">Segment C</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Tier</InputLabel>
              <Select
                value={tierFilter}
                onChange={(e) => { setTierFilter(e.target.value); setPage(0); }}
                label="Tier"
              >
                <MenuItem value="">All Tiers</MenuItem>
                {uniqueTiers.map(tier => (
                  <MenuItem key={tier} value={tier}>{tier}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Segment</TableCell>
                <TableCell>Tier</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'revenue'}
                    direction={orderBy === 'revenue' ? order : 'asc'}
                    onClick={() => handleSort('revenue')}
                  >
                    Revenue
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'orders'}
                    direction={orderBy === 'orders' ? order : 'asc'}
                    onClick={() => handleSort('orders')}
                  >
                    Orders
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'growth'}
                    direction={orderBy === 'growth' ? order : 'asc'}
                    onClick={() => handleSort('growth')}
                  >
                    Growth
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary" py={4}>
                      {searchTerm || segmentFilter || tierFilter ? 'No customers match your filters' : 'No customer data available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => (
                  <TableRow key={customer.id || customer._id} hover sx={{ cursor: 'pointer' }} onClick={() => customer._id && navigate(`/customers/${customer.id || customer._id}`)}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          <Business />
                        </Avatar>
                        <Typography fontWeight="medium">{customer.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`Segment ${customer.segment}`}
                        size="small"
                        color={getSegmentColor(customer.segment)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={customer.tier}
                        size="small"
                        sx={{ 
                          bgcolor: getTierColor(customer.tier),
                          color: customer.tier === 'platinum' || customer.tier === 'silver' ? 'text.primary' : 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(customer.revenue)}</TableCell>
                    <TableCell align="right">{customer.orders}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {customer.growth >= 0 ? (
                          <TrendingUp color="success" fontSize="small" />
                        ) : (
                          <TrendingUp color="error" fontSize="small" sx={{ transform: 'rotate(180deg)' }} />
                        )}
                        <Typography 
                          variant="body2" 
                          color={customer.growth >= 0 ? 'success.main' : 'error.main'}
                        >
                          {customer.growth >= 0 ? '+' : ''}{customer.growth}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Customer">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); customer._id && navigate(`/customers/${customer.id || customer._id}`); }}>
                          <OpenInNew fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>
    </Container>
  );
};

export default CustomerSegmentation;
