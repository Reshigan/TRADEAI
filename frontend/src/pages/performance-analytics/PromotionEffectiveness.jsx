/**
 * Promotion Effectiveness Analytics Page
 * Shows promotion ROI and effectiveness metrics
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
  LocalOffer,
  AttachMoney,
  Assessment
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

const PromotionEffectiveness = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('quarter');
  const [promotions, setPromotions] = useState([]);
  const [summary, setSummary] = useState({
    totalPromotions: 0,
    avgROI: 0,
    totalSpend: 0,
    totalRevenue: 0
  });

  // Mock data
  const mockPromotions = [
    {
      _id: '1',
      name: 'Summer Sale 2024',
      type: 'discount',
      spend: 50000,
      revenue: 125000,
      roi: 150,
      uplift: 25,
      status: 'completed'
    },
    {
      _id: '2',
      name: 'Buy One Get One',
      type: 'bogo',
      spend: 30000,
      revenue: 72000,
      roi: 140,
      uplift: 18,
      status: 'completed'
    },
    {
      _id: '3',
      name: 'Loyalty Rewards',
      type: 'loyalty',
      spend: 25000,
      revenue: 45000,
      roi: 80,
      uplift: 12,
      status: 'active'
    },
    {
      _id: '4',
      name: 'Flash Sale Weekend',
      type: 'flash',
      spend: 15000,
      revenue: 42000,
      roi: 180,
      uplift: 35,
      status: 'completed'
    },
    {
      _id: '5',
      name: 'New Product Launch',
      type: 'launch',
      spend: 40000,
      revenue: 68000,
      roi: 70,
      uplift: 8,
      status: 'completed'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setPromotions(mockPromotions);
        setSummary({
          totalPromotions: mockPromotions.length,
          avgROI: Math.round(mockPromotions.reduce((acc, p) => acc + p.roi, 0) / mockPromotions.length),
          totalSpend: mockPromotions.reduce((acc, p) => acc + p.spend, 0),
          totalRevenue: mockPromotions.reduce((acc, p) => acc + p.revenue, 0)
        });
      } catch (error) {
        console.error('Error fetching promotion data:', error);
        enqueueSnackbar('Failed to load promotion analytics', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

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
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <LocalOffer color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{summary.totalPromotions}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Promotions</Typography>
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
                  <Typography variant="body2" color="textSecondary">Average ROI</Typography>
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

      {/* Promotions Table */}
      <Paper>
        <Box p={2} borderBottom={1} borderColor="divider">
          <Typography variant="h6">Promotion Performance</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Promotion</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Spend</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell align="right">ROI</TableCell>
                <TableCell>Uplift</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {promotions.map((promo) => (
                <TableRow key={promo._id}>
                  <TableCell>
                    <Typography fontWeight="medium">{promo.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={promo.type} size="small" variant="outlined" />
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
                      />
                      <Typography variant="body2">+{promo.uplift}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={promo.status} 
                      size="small"
                      color={promo.status === 'active' ? 'success' : 'default'}
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

export default PromotionEffectiveness;
