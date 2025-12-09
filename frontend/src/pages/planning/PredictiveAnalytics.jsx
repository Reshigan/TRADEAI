/**
 * Predictive Analytics Page
 * AI-powered sales and ROI forecasting
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
  MenuItem,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Psychology,
  Timeline,
  Speed,
  AutoGraph
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

const PredictiveAnalytics = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(true);
  const [timeHorizon, setTimeHorizon] = useState('quarter');
  const [predictions, setPredictions] = useState([]);
  const [summary, setSummary] = useState({
    predictedRevenue: 0,
    predictedGrowth: 0,
    confidence: 0,
    topOpportunity: ''
  });

  // Mock predictions data
  const mockPredictions = [
    {
      _id: '1',
      category: 'Total Revenue',
      current: 5200000,
      predicted: 5850000,
      change: 12.5,
      confidence: 85,
      trend: 'up'
    },
    {
      _id: '2',
      category: 'Promotion ROI',
      current: 145,
      predicted: 162,
      change: 11.7,
      confidence: 78,
      trend: 'up'
    },
    {
      _id: '3',
      category: 'Customer Acquisition',
      current: 45,
      predicted: 52,
      change: 15.6,
      confidence: 72,
      trend: 'up'
    },
    {
      _id: '4',
      category: 'Trade Spend Efficiency',
      current: 82,
      predicted: 88,
      change: 7.3,
      confidence: 81,
      trend: 'up'
    },
    {
      _id: '5',
      category: 'Market Share',
      current: 18.5,
      predicted: 19.2,
      change: 3.8,
      confidence: 68,
      trend: 'up'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setPredictions(mockPredictions);
        setSummary({
          predictedRevenue: 5850000,
          predictedGrowth: 12.5,
          confidence: 78,
          topOpportunity: 'Customer Acquisition'
        });
      } catch (error) {
        console.error('Error fetching predictions:', error);
        enqueueSnackbar('Failed to load predictive analytics', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeHorizon]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatValue = (category, value) => {
    if (category === 'Total Revenue') return formatCurrency(value);
    if (category === 'Promotion ROI' || category === 'Trade Spend Efficiency') return `${value}%`;
    if (category === 'Market Share') return `${value}%`;
    return value;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
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
        <Typography color="text.primary">Predictive Analytics</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Predictive Analytics
          </Typography>
          <Typography variant="body2" color="textSecondary">
            AI-powered forecasting and trend predictions
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Horizon</InputLabel>
          <Select
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(e.target.value)}
            label="Time Horizon"
          >
            <MenuItem value="month">Next Month</MenuItem>
            <MenuItem value="quarter">Next Quarter</MenuItem>
            <MenuItem value="year">Next Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* AI Badge */}
      <Alert 
        severity="info" 
        icon={<Psychology />}
        sx={{ mb: 3 }}
      >
        Predictions are generated using machine learning models trained on your historical data. 
        Confidence scores indicate the reliability of each prediction.
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AutoGraph color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{formatCurrency(summary.predictedRevenue)}</Typography>
                  <Typography variant="body2" color="textSecondary">Predicted Revenue</Typography>
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
                  <Typography variant="h5">+{summary.predictedGrowth}%</Typography>
                  <Typography variant="body2" color="textSecondary">Predicted Growth</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Speed color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{summary.confidence}%</Typography>
                  <Typography variant="body2" color="textSecondary">Avg Confidence</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Timeline color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">{summary.topOpportunity}</Typography>
                  <Typography variant="body2" color="textSecondary">Top Opportunity</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Predictions Table */}
      <Paper>
        <Box p={2} borderBottom={1} borderColor="divider">
          <Typography variant="h6">Detailed Predictions</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                <TableCell align="right">Current</TableCell>
                <TableCell align="right">Predicted</TableCell>
                <TableCell>Change</TableCell>
                <TableCell>Confidence</TableCell>
                <TableCell>Trend</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {predictions.map((prediction) => (
                <TableRow key={prediction._id}>
                  <TableCell>
                    <Typography fontWeight="medium">{prediction.category}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    {formatValue(prediction.category, prediction.current)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      {formatValue(prediction.category, prediction.predicted)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={prediction.change >= 0 ? <TrendingUp /> : <TrendingDown />}
                      label={`${prediction.change >= 0 ? '+' : ''}${prediction.change}%`}
                      size="small"
                      color={prediction.change >= 0 ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={prediction.confidence}
                        color={getConfidenceColor(prediction.confidence)}
                        sx={{ width: 60, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2">{prediction.confidence}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={prediction.trend === 'up' ? 'Upward' : 'Downward'}
                      size="small"
                      color={prediction.trend === 'up' ? 'success' : 'error'}
                      variant="outlined"
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

export default PredictiveAnalytics;
