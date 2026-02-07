/**
 * Promotion Effectiveness Analytics Page
 * Shows promotion ROI and effectiveness metrics with charts and visualizations
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
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  LocalOffer,
  AttachMoney,
  Assessment,
  Search,
  Info,
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
import { formatLabel } from '../../utils/formatters';

const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0'];

const PromotionEffectiveness = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('quarter');
  const [promotions, setPromotions] = useState([]);
  const [summary, setSummary] = useState({
    totalPromotions: 0,
    avgROI: 0,
    totalSpend: 0,
    totalRevenue: 0
  });
  
  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [orderBy, setOrderBy] = useState('roi');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/performance-analytics/promotion-effectiveness');
        const data = response.data;
        
        // Transform API data to match component format
        const transformedPromotions = (data.scorecard || []).map(promo => ({
          _id: promo.promotionId,
          name: promo.promotionName,
          type: promo.promotionType || 'discount',
          spend: promo.metrics?.tradeSpend || 0,
          revenue: promo.metrics?.revenue || 0,
          roi: Math.round(promo.metrics?.roi || 0),
          uplift: Math.round((promo.metrics?.expectedLift - 1) * 100) || 0,
          status: promo.status
        }));
        
        setPromotions(transformedPromotions);
        setSummary({
          totalPromotions: data.summary?.totalPromotions || transformedPromotions.length,
          avgROI: Math.round(data.summary?.averageROI || 0),
          totalSpend: data.summary?.totalSpend || 0,
          totalRevenue: data.summary?.totalRevenue || 0
        });
      } catch (error) {
        console.error('Error fetching promotion data:', error);
        enqueueSnackbar('Failed to load promotion analytics', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange, enqueueSnackbar]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getROIColor = (roi) => {
    if (roi >= 150) return 'success';
    if (roi >= 100) return 'primary';
    if (roi >= 50) return 'warning';
    return 'error';
  };

  // Sorting and filtering
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredPromotions = promotions
    .filter(promo => {
      const matchesSearch = promo.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !typeFilter || promo.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const aVal = a[orderBy] || 0;
      const bVal = b[orderBy] || 0;
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const paginatedPromotions = filteredPromotions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Chart data
  const roiChartData = promotions
    .filter(p => p.roi > 0)
    .slice(0, 10)
    .map(p => ({
      name: p.name?.substring(0, 15) + (p.name?.length > 15 ? '...' : ''),
      roi: p.roi,
      spend: p.spend / 1000,
      revenue: p.revenue / 1000
    }));

  const typeDistribution = promotions.reduce((acc, promo) => {
    const type = promo.type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const pieChartData = Object.entries(typeDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const uniqueTypes = [...new Set(promotions.map(p => p.type).filter(Boolean))];

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
        <Typography color="text.primary">Promotion Effectiveness</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Promotion Effectiveness
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Analyze promotion ROI and performance metrics
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="Time Range"
          >
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="quarter">This Quarter</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => navigate('/promotions')}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <LocalOffer color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{summary.totalPromotions}</Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="body2" color="textSecondary">Total Promotions</Typography>
                    <Tooltip title="Click to view all promotions">
                      <OpenInNew sx={{ fontSize: 14, color: 'text.secondary' }} />
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{summary.avgROI}%</Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="body2" color="textSecondary">Average ROI</Typography>
                    <Tooltip title="ROI = (Revenue - Spend) / Spend × 100">
                      <Info sx={{ fontSize: 14, color: 'text.secondary' }} />
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AttachMoney color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{formatCurrency(summary.totalSpend)}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Spend</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Assessment color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{formatCurrency(summary.totalRevenue)}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Revenue</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>ROI by Promotion (Top 10)</Typography>
            <Box sx={{ height: 300 }}>
              {roiChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roiChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis label={{ value: 'ROI %', angle: -90, position: 'insideLeft' }} />
                    <RechartsTooltip 
                      formatter={(value, name) => [
                        name === 'roi' ? `${value}%` : `R${value}K`,
                        name === 'roi' ? 'ROI' : name === 'spend' ? 'Spend' : 'Revenue'
                      ]}
                    />
                    <Bar dataKey="roi" fill="#4caf50" name="ROI" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography color="textSecondary">No promotion data available</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Promotion Types</Typography>
            <Box sx={{ height: 300 }}>
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography color="textSecondary">No type data available</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Promotions Table */}
      <Paper>
        <Box p={2} borderBottom={1} borderColor="divider" display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Typography variant="h6">Promotion Performance</Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search promotions..."
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
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                label="Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {uniqueTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Promotion</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'spend'}
                    direction={orderBy === 'spend' ? order : 'asc'}
                    onClick={() => handleSort('spend')}
                  >
                    Spend
                  </TableSortLabel>
                </TableCell>
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
                    active={orderBy === 'roi'}
                    direction={orderBy === 'roi' ? order : 'asc'}
                    onClick={() => handleSort('roi')}
                  >
                    ROI
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'uplift'}
                    direction={orderBy === 'uplift' ? order : 'asc'}
                    onClick={() => handleSort('uplift')}
                  >
                    Uplift
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPromotions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary" py={4}>
                      {searchTerm || typeFilter ? 'No promotions match your filters' : 'No promotion data available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPromotions.map((promo) => (
                  <TableRow key={promo.id || promo._id} hover sx={{ cursor: 'pointer' }} onClick={() => promo._id && navigate(`/promotions/${promo.id || promo._id}`)}>
                    <TableCell>
                      <Typography fontWeight="medium">{promo.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={formatLabel(promo.type)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(promo.spend)}</TableCell>
                    <TableCell align="right">{formatCurrency(promo.revenue)}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        icon={promo.roi >= 100 ? <TrendingUp /> : <TrendingDown />}
                        label={`${promo.roi}%`}
                        size="small"
                        color={getROIColor(promo.roi)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(promo.uplift * 2, 100)} 
                          sx={{ width: 60, height: 8, borderRadius: 4 }}
                          color={promo.uplift >= 20 ? 'success' : promo.uplift >= 10 ? 'primary' : 'warning'}
                        />
                        <Typography variant="body2">+{promo.uplift}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={formatLabel(promo.status)} 
                        size="small"
                        color={promo.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); promo._id && navigate(`/promotions/${promo.id || promo._id}`); }}>
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
          count={filteredPromotions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>
    </Container>
  );
};

export default PromotionEffectiveness;
