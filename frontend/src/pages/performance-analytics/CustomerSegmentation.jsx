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

const CustomerSegmentation = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [segments, setSegments] = useState({
    A: { count: 0, revenue: 0, percentage: 0 },
    B: { count: 0, revenue: 0, percentage: 0 },
    C: { count: 0, revenue: 0, percentage: 0 }
  });

  // Mock data
  const mockCustomers = [
    {
      _id: '1',
      name: 'Mega Retailer Corp',
      segment: 'A',
      revenue: 2500000,
      orders: 450,
      growth: 15,
      tier: 'platinum'
    },
    {
      _id: '2',
      name: 'SuperMart Chain',
      segment: 'A',
      revenue: 1800000,
      orders: 320,
      growth: 12,
      tier: 'platinum'
    },
    {
      _id: '3',
      name: 'Regional Stores Inc',
      segment: 'B',
      revenue: 750000,
      orders: 180,
      growth: 8,
      tier: 'gold'
    },
    {
      _id: '4',
      name: 'City Grocers',
      segment: 'B',
      revenue: 520000,
      orders: 145,
      growth: 5,
      tier: 'gold'
    },
    {
      _id: '5',
      name: 'Corner Shop Network',
      segment: 'C',
      revenue: 180000,
      orders: 85,
      growth: 2,
      tier: 'silver'
    },
    {
      _id: '6',
      name: 'Local Mart',
      segment: 'C',
      revenue: 95000,
      orders: 42,
      growth: -3,
      tier: 'bronze'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setCustomers(mockCustomers);
        
        const totalRevenue = mockCustomers.reduce((acc, c) => acc + c.revenue, 0);
        const segmentA = mockCustomers.filter(c => c.segment === 'A');
        const segmentB = mockCustomers.filter(c => c.segment === 'B');
        const segmentC = mockCustomers.filter(c => c.segment === 'C');
        
        setSegments({
          A: {
            count: segmentA.length,
            revenue: segmentA.reduce((acc, c) => acc + c.revenue, 0),
            percentage: Math.round((segmentA.reduce((acc, c) => acc + c.revenue, 0) / totalRevenue) * 100)
          },
          B: {
            count: segmentB.length,
            revenue: segmentB.reduce((acc, c) => acc + c.revenue, 0),
            percentage: Math.round((segmentB.reduce((acc, c) => acc + c.revenue, 0) / totalRevenue) * 100)
          },
          C: {
            count: segmentC.length,
            revenue: segmentC.reduce((acc, c) => acc + c.revenue, 0),
            percentage: Math.round((segmentC.reduce((acc, c) => acc + c.revenue, 0) / totalRevenue) * 100)
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
  }, []);

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
