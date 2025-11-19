/**
 * AI Anomaly Detection Widget
 * Real-time anomaly detection and alerts
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Divider,
  Button
} from '@mui/material';
import {
  NotificationsActive,
  Refresh,
  Warning,
  Error,
  Info,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  InfoOutlined
} from '@mui/icons-material';
import axios from 'axios';

const AIAnomalyDetectionWidget = ({ scope = 'all' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [anomalies, setAnomalies] = useState(null);

  useEffect(() => {
    fetchAnomalies();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAnomalies, 300000);
    return () => clearInterval(interval);
  }, [scope]);

  const fetchAnomalies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || '/api'}/ai/detect/anomalies`,
        {
          metricType: scope === 'all' ? 'sales' : scope,
          threshold: 2.5
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = response.data;
      
      // Transform data to match widget format
      const transformedData = {
        count: data.detectedAnomalies || 0,
        status: data.warning ? 'degraded' : 'active',
        items: (data.anomalies || []).map(a => ({
          id: a.id,
          type: a.metricType,
          severity: a.severity,
          description: a.description,
          timestamp: a.date,
          value: a.actualValue,
          expectedValue: a.expectedValue,
          deviation: a.deviation
        })),
        summary: data.summary || { high: 0, medium: 0, low: 0 }
      };

      setAnomalies(transformedData);
    } catch (err) {
      console.error('Anomaly detection error:', err);
      setError(err.response?.data?.message || 'Failed to load anomalies');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <Error color="error" />;
      case 'high':
        return <Warning color="warning" />;
      case 'medium':
        return <Info color="info" />;
      default:
        return <CheckCircle color="success" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'success';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'revenue':
      case 'sales':
        return <TrendingDown color="error" />;
      case 'demand':
        return <TrendingUp color="warning" />;
      default:
        return <NotificationsActive color="primary" />;
    }
  };

  if (loading && !anomalies) {
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

  const criticalCount = anomalies?.detected?.filter(a => a.severity === 'critical').length || 0;
  const totalCount = anomalies?.detected?.length || 0;

  return (
    <Card>
      <CardHeader
        avatar={
          <Badge badgeContent={criticalCount} color="error">
            <NotificationsActive color="primary" />
          </Badge>
        }
        title="AI Anomaly Detection"
        subheader="Real-time pattern analysis"
        action={
          <Tooltip title="Refresh anomalies">
            <IconButton onClick={fetchAnomalies} size="small" disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        {anomalies && (
          <>
            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              <Chip
                label={`${totalCount} Anomalies`}
                color={criticalCount > 0 ? 'error' : totalCount > 0 ? 'warning' : 'success'}
                size="small"
              />
              <Chip
                label={`Last 24 hours`}
                variant="outlined"
                size="small"
              />
              {anomalies.status === 'degraded' && (
                <Chip
                  icon={<InfoOutlined />}
                  label="Simulated Data"
                  color="warning"
                  size="small"
                />
              )}
            </Box>

            {totalCount === 0 ? (
              <Alert severity="success">
                <Typography variant="body2">
                  No anomalies detected. All systems operating normally.
                </Typography>
              </Alert>
            ) : (
              <>
                <List dense>
                  {anomalies.detected?.slice(0, 5).map((anomaly, idx) => (
                    <React.Fragment key={idx}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          bgcolor: anomaly.severity === 'critical' ? 'error.50' : 'transparent',
                          borderRadius: 1,
                          mb: 1
                        }}
                      >
                        <ListItemIcon>
                          {getCategoryIcon(anomaly.category)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" fontWeight="bold">
                                {anomaly.title}
                              </Typography>
                              <Chip
                                icon={getSeverityIcon(anomaly.severity)}
                                label={anomaly.severity}
                                color={getSeverityColor(anomaly.severity)}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box mt={0.5}>
                              <Typography variant="caption" display="block" color="textSecondary">
                                {anomaly.description}
                              </Typography>
                              <Box display="flex" gap={1} mt={0.5}>
                                <Chip
                                  label={`Confidence: ${anomaly.confidence}%`}
                                  size="small"
                                  variant="outlined"
                                />
                                {anomaly.impact && (
                                  <Chip
                                    label={`Impact: ${anomaly.impact}`}
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                  />
                                )}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {idx < (anomalies.detected?.length || 0) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>

                {totalCount > 5 && (
                  <Box mt={2} textAlign="center">
                    <Button size="small" variant="outlined">
                      View All {totalCount} Anomalies
                    </Button>
                  </Box>
                )}
              </>
            )}

            {anomalies.summary && (
              <Box mt={2}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Summary:</strong>
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {anomalies.summary.high > 0 && (
                    <Chip
                      label={`High: ${anomalies.summary.high}`}
                      color="error"
                      size="small"
                    />
                  )}
                  {anomalies.summary.medium > 0 && (
                    <Chip
                      label={`Medium: ${anomalies.summary.medium}`}
                      color="warning"
                      size="small"
                    />
                  )}
                  {anomalies.summary.low > 0 && (
                    <Chip
                      label={`Low: ${anomalies.summary.low}`}
                      color="info"
                      size="small"
                    />
                  )}
                </Box>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAnomalyDetectionWidget;
