import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  Badge,
  Divider,
  Alert,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import api from '../services/api';


/**
 * Smart Insights Widget - Proactive Intelligence
 * 
 * Surfaces critical insights, anomalies, and opportunities automatically.
 * Makes users feel like they have a smart assistant watching their business 24/7.
 */
const SmartInsightsWidget = ({ userId, compact = false }) => {
  const [insights, setInsights] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);

  // Fetch smart insights
  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(
          `/ai/smart-insights`,
          {
          }
        );
        setInsights(response.data.insights || []);
        setUnreadCount(response.data.unreadCount || 0);
      } catch (error) {
        console.error('Error fetching insights:', error);
        setInsights([]);
        setUnreadCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchInsights, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  const getInsightIcon = (type) => {
    switch (type) {
      case 'opportunity':
        return <LightbulbIcon sx={{ color: '#4caf50' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: '#ff9800' }} />;
      case 'trend':
        return <TrendingUpIcon sx={{ color: '#2196f3' }} />;
      case 'anomaly':
        return <WarningIcon sx={{ color: '#f44336' }} />;
      case 'success':
        return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      default:
        return <InfoIcon sx={{ color: '#9e9e9e' }} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(timestamp)) / 1000); // seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleDismiss = (insightId) => {
    setInsights(insights.filter(i => i.id !== insightId));
    if (unreadCount > 0) setUnreadCount(unreadCount - 1);
  };

  const handleAction = (insight) => {
    window.location.href = insight.actionUrl;
  };

  if (isLoading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <NotificationsIcon color="primary" />
          <Typography variant="h6">Smart Insights</Typography>
        </Box>
        <LinearProgress />
      </Paper>
    );
  }

  if (compact) {
    // Compact mode for dashboard header
    return (
      <Tooltip title="View all insights">
        <IconButton onClick={() => setExpanded(true)} aria-label="View all insights">
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon color="primary" />
          </Badge>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Smart Insights
          </Typography>
        </Box>
        <Chip 
          label={`${insights.length} active`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>

      {insights.length === 0 && (
        <Alert severity="info">
          No new insights. Your business is running smoothly! 🎉
        </Alert>
      )}

      {/* Insights List */}
      <Box>
        {insights.map((insight, index) => (
          <Box key={insight.id}>
            <Paper 
              sx={{ 
                p: 2, 
                mb: 1,
                bgcolor: insight.priority === 'high' ? '#fff3e0' : '#fafafa',
                border: insight.priority === 'high' ? '2px solid #ff9800' : '1px solid #e0e0e0',
                position: 'relative'
              }}
            >
              {/* Priority Indicator */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 4,
                  height: '100%',
                  bgcolor: getPriorityColor(insight.priority)
                }}
              />
              
              <Box sx={{ pl: 1 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    {getInsightIcon(insight.type)}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {insight.title}
                    </Typography>
                  </Box>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDismiss(insight.id)}
                    sx={{ ml: 1 }}
                    aria-label="Dismiss insight"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Message */}
                <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                  {insight.message}
                </Typography>

                {/* Impact & Confidence */}
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                  <Chip 
                    label={insight.impact}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  <Chip 
                    label={`${insight.confidence}% confident`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip 
                    label={formatTimestamp(insight.timestamp)}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                {/* Action Button */}
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleAction(insight)}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    background: insight.priority === 'high' 
                      ? 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)'
                      : 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
                  }}
                >
                  {insight.action}
                </Button>
              </Box>
            </Paper>
            {index < insights.length - 1 && <Divider sx={{ my: 1 }} />}
          </Box>
        ))}
      </Box>

      {/* Footer */}
      {insights.length > 0 && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: '#e3f2fd', borderRadius: 2 }}>
          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <InfoIcon fontSize="small" />
            Insights refresh every 5 minutes. AI monitors your business 24/7.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SmartInsightsWidget;
