/**
 * Customer Segmentation Analytics Page
 * ABC customer analysis and segmentation
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
  Avatar
} from '@mui/material';
import {
  Star,
  TrendingUp,
  People,
  Business
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

const CustomerSegmentation = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [segments, setSegments] = useState({
    A: { count: 0, revenue: 0, percentage: 0 },
    B: { count: 0, revenue: 0, percentage: 0 },
    C: { count: 0, revenue: 0, percentage: 0 }
  });

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

      {/* Customer Table */}
      <Paper>
        <Box p={2} borderBottom={1} borderColor="divider">
          <Typography variant="h6">Customer Details</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Segment</TableCell>
                <TableCell>Tier</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell align="right">Orders</TableCell>
                <TableCell>Growth</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer._id}>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default CustomerSegmentation;
