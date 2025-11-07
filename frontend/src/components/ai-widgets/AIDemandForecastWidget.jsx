/**
 * AI Demand Forecast Widget
 * Shows demand predictions with confidence scores and trends
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  InfoOutlined
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import axios from 'axios';

const AIDemandForecastWidget = ({ productId, customerId, days = 7 }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    fetchForecast();
  }, [productId, customerId, days]);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/ai/forecast/demand`,
        {
          productId,
          customerId,
          days
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setForecast(response.data);
    } catch (err) {
      console.error('Forecast error:', err);
      setError(err.response?.data?.message || 'Failed to load forecast');
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = () => {
    if (!forecast?.predictions || forecast.predictions.length < 2) return null;
    
    const first = forecast.predictions[0].value;
    const last = forecast.predictions[forecast.predictions.length - 1].value;
    const change = ((last - first) / first) * 100;
    
    return {
      direction: change >= 0 ? 'up' : 'down',
      percentage: Math.abs(change).toFixed(1)
    };
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 85) return 'success';
    if (confidence >= 70) return 'primary';
    if (confidence >= 50) return 'warning';
    return 'error';
  };

  const trend = calculateTrend();

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        avatar={<TrendingUp color="primary" />}
        title="AI Demand Forecast"
        subheader={`Next ${days} days prediction`}
        action={
          <Tooltip title="Refresh forecast">
            <IconButton onClick={fetchForecast} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        {forecast && (
          <>
            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              <Chip
                icon={trend?.direction === 'up' ? <TrendingUp /> : <TrendingDown />}
                label={`${trend?.direction === 'up' ? '+' : '-'}${trend?.percentage}%`}
                color={trend?.direction === 'up' ? 'success' : 'error'}
                size="small"
              />
              <Chip
                label={`Confidence: ${forecast.confidence}%`}
                color={getConfidenceColor(forecast.confidence)}
                size="small"
              />
              {forecast.status === 'degraded' && (
                <Chip
                  icon={<InfoOutlined />}
                  label="Simulated Data"
                  color="warning"
                  size="small"
                />
              )}
            </Box>

            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={forecast.predictions}>
                <defs>
                  <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1976d2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip
                  formatter={(value) => [Math.round(value), 'Units']}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#1976d2"
                  fillOpacity={1}
                  fill="url(#demandGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>Insights:</strong>
              </Typography>
              {forecast.insights?.map((insight, idx) => (
                <Typography key={idx} variant="caption" display="block" sx={{ ml: 2, mb: 0.5 }}>
                  • {insight}
                </Typography>
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AIDemandForecastWidget;
