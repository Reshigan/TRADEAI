/**
 * AI Model Health Widget
 * Shows ML model status and performance metrics
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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Psychology,
  Refresh,
  CheckCircle,
  Warning,
  Error,
  InfoOutlined
} from '@mui/icons-material';
import api from '../../services/api';

const AIModelHealthWidget = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetchHealth();
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchHealth, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(
        `/ai/health`
      );

      setHealth(response.data);
    } catch (err) {
      console.error('Health check error:', err);
      setError(err.response?.data?.message || 'Failed to load health status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'operational':
        return <CheckCircle color="success" />;
      case 'degraded':
        return <Warning color="warning" />;
      case 'error':
      case 'unavailable':
        return <Error color="error" />;
      default:
        return <InfoOutlined color="info" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'operational':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'error':
      case 'unavailable':
        return 'error';
      default:
        return 'info';
    }
  };

  const getModelStatusIcon = (loaded) => {
    return loaded ? <CheckCircle fontSize="small" color="success" /> : <Warning fontSize="small" color="warning" />;
  };

  if (loading && !health) {
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
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  const modelsLoaded = Object.values(health?.models || {}).filter(m => m === true).length;
  const totalModels = Object.keys(health?.models || {}).length;
  const healthPercentage = totalModels > 0 ? (modelsLoaded / totalModels) * 100 : 0;

  return (
    <Card>
      <CardHeader
        avatar={<Psychology color="primary" />}
        title="AI/ML Service Health"
        subheader="Model status & performance"
        action={
          <Tooltip title="Refresh health status">
            <IconButton onClick={fetchHealth} size="small" disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        {health && (
          <>
            <Box display="flex" gap={1} mb={2} flexWrap="wrap" justifyContent="space-between" alignItems="center">
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                  icon={getStatusIcon(health.status)}
                  label={health.status?.toUpperCase()}
                  color={getStatusColor(health.status)}
                  size="small"
                />
                <Chip
                  label={`${modelsLoaded}/${totalModels} Models`}
                  color={modelsLoaded === totalModels ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
              <Typography variant="caption" color="textSecondary">
                Uptime: {health.uptime || 'N/A'}
              </Typography>
            </Box>

            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="textSecondary">
                  Overall Health
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {healthPercentage.toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={healthPercentage}
                color={healthPercentage >= 80 ? 'success' : healthPercentage >= 50 ? 'warning' : 'error'}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="textSecondary" gutterBottom fontWeight="bold">
              Model Status:
            </Typography>
            <List dense>
              {Object.entries(health.models || {}).map(([modelName, loaded], idx) => (
                <ListItem key={idx} disableGutters>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={1}>
                          {getModelStatusIcon(loaded)}
                          <Typography variant="body2">
                            {modelName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                        </Box>
                        <Chip
                          label={loaded ? 'Loaded' : 'Not Loaded'}
                          size="small"
                          color={loaded ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>

            {health.status === 'degraded' && (
              <>
                <Divider sx={{ my: 2 }} />
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    <strong>Degraded Mode:</strong> Some ML models are not loaded. 
                    The system is using fallback predictions with simulated data.
                  </Typography>
                </Alert>
              </>
            )}

            {health.message && (
              <Box mt={2}>
                <Typography variant="caption" color="textSecondary" display="block">
                  {health.message}
                </Typography>
              </Box>
            )}

            {health.timestamp && (
              <Box mt={2} textAlign="center">
                <Typography variant="caption" color="textSecondary">
                  Last updated: {new Date(health.timestamp).toLocaleString()}
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AIModelHealthWidget;
