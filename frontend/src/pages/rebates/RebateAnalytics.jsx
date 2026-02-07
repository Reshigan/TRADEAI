import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  LocalOffer,
  CheckCircle
} from '@mui/icons-material';
import rebateService from '../../services/rebateService';
import { formatLabel } from '../../utils/formatters';

const RebateAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }

      const response = await rebateService.getRebateAnalytics({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount || 0);
  };

  const MetricCard = ({ title, value, icon, trend, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend > 0 ? (
                  <TrendingUp fontSize="small" color="success" />
                ) : (
                  <TrendingDown fontSize="small" color="error" />
                )}
                <Typography
                  variant="body2"
                  color={trend > 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(trend)}% vs last period
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading || !analytics) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading analytics...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Rebate Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track rebate performance and accruals
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            label="Period"
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="quarter">Last Quarter</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Rebates"
            value={analytics.totalRebates || 0}
            icon={<LocalOffer color="primary" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Rebates"
            value={analytics.activeRebates || 0}
            icon={<CheckCircle color="success" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Accrued"
            value={formatCurrency(analytics.totalAccrued || 0)}
            icon={<AttachMoney color="info" />}
            trend={analytics.accruedTrend || 0}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Paid"
            value={formatCurrency(analytics.totalPaid || 0)}
            icon={<TrendingUp color="warning" />}
            trend={analytics.paidTrend || 0}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Performing Rebates
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rebate Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Accrued</TableCell>
                    <TableCell align="right">Claims</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.topRebates?.map((rebate) => (
                    <TableRow key={rebate.id || rebate._id}>
                      <TableCell>{rebate.name}</TableCell>
                      <TableCell>
                        <Chip label={formatLabel(rebate.type)} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(rebate.totalAccrued)}
                      </TableCell>
                      <TableCell align="right">{rebate.claimCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Rebate Status Distribution
            </Typography>
            <Box sx={{ mt: 2 }}>
              {analytics.statusDistribution?.map((status) => (
                <Box key={status.id || status._id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{formatLabel(status._id)}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {status.count}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      height: 8,
                      bgcolor: 'grey.200',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      sx={{
                        width: `${(status.count / analytics.totalRebates) * 100}%`,
                        height: '100%',
                        bgcolor: 'primary.main',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Accruals
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Rebate</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.recentAccruals?.map((accrual) => (
                    <TableRow key={accrual.id || accrual._id}>
                      <TableCell>
                        {new Date(accrual.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{accrual.rebateName}</TableCell>
                      <TableCell>{accrual.customerName}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(accrual.amount)}
                      </TableCell>
                      <TableCell>
                        <Chip label={formatLabel(accrual.status)} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RebateAnalytics;
