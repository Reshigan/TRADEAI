/**
 * Budget Variance Analytics Page
 * Shows budget utilization and variance analysis with charts
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
  AccountBalance,
  Warning,
  CheckCircle,
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

const COLORS = ['#4caf50', '#8B5CF6', '#ff9800', '#f44336', '#9c27b0'];

const BudgetVariance = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({
    totalAllocated: 0,
    totalSpent: 0,
    totalVariance: 0,
    utilizationRate: 0
  });
  
  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [orderBy, setOrderBy] = useState('utilizationRate');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/performance-analytics/budget-variance?year=${year}`);
        const data = response.data;
        
        // Transform API data to match component format
        const transformedBudgets = (data.budgetVariance || []).map((budget, index) => ({
          _id: index.toString(),
          name: budget.category ? `${formatLabel(budget.category)} Budget` : 'Budget',
          category: budget.category || 'general',
          allocated: budget.allocated || 0,
          spent: budget.spent || 0,
          variance: (budget.spent || 0) - (budget.allocated || 0),
          utilizationRate: Math.round(budget.utilizationRate || 0)
        }));
        
        setBudgets(transformedBudgets);
        setSummary({
          totalAllocated: data.summary?.totalAllocated || 0,
          totalSpent: data.summary?.totalSpent || 0,
          totalVariance: (data.summary?.totalSpent || 0) - (data.summary?.totalAllocated || 0),
          utilizationRate: Math.round(data.summary?.overallUtilization || 0)
        });
      } catch (error) {
        console.error('Error fetching budget data:', error);
        enqueueSnackbar('Failed to load budget analytics', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year, enqueueSnackbar]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getVarianceColor = (variance) => {
    if (variance > 0) return 'error';
    if (variance < -10000) return 'success';
    return 'warning';
  };

  const getUtilizationColor = (rate) => {
    if (rate > 100) return 'error';
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'warning';
    return 'info';
  };

  // Sorting and filtering
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredBudgets = budgets
    .filter(budget => {
      const matchesSearch = budget.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || budget.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const aVal = a[orderBy] || 0;
      const bVal = b[orderBy] || 0;
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const paginatedBudgets = filteredBudgets.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Chart data
  const barChartData = budgets.map(b => ({
    name: b.category?.substring(0, 10) || 'Other',
    allocated: b.allocated / 1000,
    spent: b.spent / 1000
  }));

  const utilizationPieData = [
    { name: 'On Track (80-100%)', value: budgets.filter(b => b.utilizationRate >= 80 && b.utilizationRate <= 100).length },
    { name: 'Under (< 80%)', value: budgets.filter(b => b.utilizationRate < 80).length },
    { name: 'Over (> 100%)', value: budgets.filter(b => b.utilizationRate > 100).length }
  ].filter(d => d.value > 0);

  const uniqueCategories = [...new Set(budgets.map(b => b.category).filter(Boolean))];

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
        <Typography color="text.primary">Budget Variance</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Budget Variance Analysis
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Track budget utilization and identify variances
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            label="Year"
          >
            <MenuItem value={2024}>2024</MenuItem>
            <MenuItem value={2025}>2025</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => navigate('/budgets')}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AccountBalance color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{formatCurrency(summary.totalAllocated)}</Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="body2" color="textSecondary">Total Allocated</Typography>
                    <Tooltip title="Click to view all budgets">
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
                <Assessment color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{formatCurrency(summary.totalSpent)}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Spent</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                {summary.totalVariance > 0 ? (
                  <TrendingUp color="error" sx={{ fontSize: 40 }} />
                ) : (
                  <TrendingDown color="success" sx={{ fontSize: 40 }} />
                )}
                <Box>
                  <Typography variant="h5" color={summary.totalVariance > 0 ? 'error.main' : 'success.main'}>
                    {formatCurrency(Math.abs(summary.totalVariance))}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="body2" color="textSecondary">
                      {summary.totalVariance > 0 ? 'Over Budget' : 'Under Budget'}
                    </Typography>
                    <Tooltip title="Variance = Spent - Allocated">
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
                {summary.utilizationRate > 100 ? (
                  <Warning color="warning" sx={{ fontSize: 40 }} />
                ) : (
                  <CheckCircle color="success" sx={{ fontSize: 40 }} />
                )}
                <Box>
                  <Typography variant="h5">{summary.utilizationRate}%</Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="body2" color="textSecondary">Utilization Rate</Typography>
                    <Tooltip title="Utilization = (Spent / Allocated) × 100">
                      <Info sx={{ fontSize: 14, color: 'text.secondary' }} />
                    </Tooltip>
                  </Box>
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
            <Typography variant="h6" gutterBottom>Allocated vs Spent by Category</Typography>
            <Box sx={{ height: 300 }}>
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                                        <YAxis label={{ value: 'Amount (R K)', angle: -90, position: 'insideLeft' }} />
                                        <RechartsTooltip formatter={(value) => [`R${value}K`, '']} />
                    <Legend />
                    <Bar dataKey="allocated" fill="#8B5CF6" name="Allocated" />
                    <Bar dataKey="spent" fill="#ff9800" name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography color="textSecondary">No budget data available</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Budget Status Distribution</Typography>
            <Box sx={{ height: 300 }}>
              {utilizationPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={utilizationPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {utilizationPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography color="textSecondary">No status data available</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Budget Table */}
      <Paper>
        <Box p={2} borderBottom={1} borderColor="divider" display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Typography variant="h6">Budget Breakdown</Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search budgets..."
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
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {uniqueCategories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Budget</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'allocated'}
                    direction={orderBy === 'allocated' ? order : 'asc'}
                    onClick={() => handleSort('allocated')}
                  >
                    Allocated
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'spent'}
                    direction={orderBy === 'spent' ? order : 'asc'}
                    onClick={() => handleSort('spent')}
                  >
                    Spent
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'variance'}
                    direction={orderBy === 'variance' ? order : 'asc'}
                    onClick={() => handleSort('variance')}
                  >
                    Variance
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'utilizationRate'}
                    direction={orderBy === 'utilizationRate' ? order : 'asc'}
                    onClick={() => handleSort('utilizationRate')}
                  >
                    Utilization
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedBudgets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary" py={4}>
                      {searchTerm || categoryFilter ? 'No budgets match your filters' : 'No budget data available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBudgets.map((budget) => (
                  <TableRow key={budget.id || budget._id} hover sx={{ cursor: 'pointer' }} onClick={() => budget._id && navigate(`/budgets/${budget.id || budget._id}`)}>
                    <TableCell>
                      <Typography fontWeight="medium">{budget.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={budget.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(budget.allocated)}</TableCell>
                    <TableCell align="right">{formatCurrency(budget.spent)}</TableCell>
                    <TableCell align="right">
                      <Typography color={budget.variance > 0 ? 'error.main' : 'success.main'}>
                        {budget.variance > 0 ? '+' : ''}{formatCurrency(budget.variance)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(budget.utilizationRate, 100)} 
                          color={getUtilizationColor(budget.utilizationRate)}
                          sx={{ width: 80, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2">{budget.utilizationRate}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={budget.utilizationRate > 100 ? 'Over' : budget.utilizationRate >= 80 ? 'On Track' : 'Under'}
                        size="small"
                        color={getUtilizationColor(budget.utilizationRate)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); budget._id && navigate(`/budgets/${budget.id || budget._id}`); }}>
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
          count={filteredBudgets.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>
    </Container>
  );
};

export default BudgetVariance;
