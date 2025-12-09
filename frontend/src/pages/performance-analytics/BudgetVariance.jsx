/**
 * Budget Variance Analytics Page
 * Shows budget utilization and variance analysis
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
  Chip,
  CircularProgress,
  Breadcrumbs,
  Link,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Warning,
  CheckCircle,
  Assessment
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

const BudgetVariance = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({
    totalAllocated: 0,
    totalSpent: 0,
    totalVariance: 0,
    utilizationRate: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/performance-analytics/budget-variance?year=${year}`);
        const data = response.data;
        
        // Transform API data to match component format
        const transformedBudgets = (data.budgetVariance || []).map((budget, index) => ({
          _id: index.toString(),
          name: budget.category ? `${budget.category.charAt(0).toUpperCase()}${budget.category.slice(1)} Budget` : 'Budget',
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
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AccountBalance color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{formatCurrency(summary.totalAllocated)}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Allocated</Typography>
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
                  <Typography variant="body2" color="textSecondary">
                    {summary.totalVariance > 0 ? 'Over Budget' : 'Under Budget'}
                  </Typography>
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
                  <Typography variant="body2" color="textSecondary">Utilization Rate</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Budget Table */}
      <Paper>
        <Box p={2} borderBottom={1} borderColor="divider">
          <Typography variant="h6">Budget Breakdown</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Budget</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Allocated</TableCell>
                <TableCell align="right">Spent</TableCell>
                <TableCell align="right">Variance</TableCell>
                <TableCell>Utilization</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {budgets.map((budget) => (
                <TableRow key={budget._id}>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default BudgetVariance;
