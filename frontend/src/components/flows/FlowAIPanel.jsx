import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Chip,
  IconButton,
  Collapse,
  Divider,
  CircularProgress,
  Tooltip,
  Button
} from '@mui/material';
import {
  Lightbulb,
  Warning,
  CheckCircle,
  TrendingUp,
  Close,
  Refresh,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

/**
 * FlowAIPanel - AI Recommendations Sidebar
 * 
 * Displays context-aware AI insights, warnings, and recommendations
 * for the current flow step.
 * 
 * @param {Object} props
 * @param {Array} props.recommendations - AI recommendations array
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onRefresh - Refresh recommendations
 * @param {Function} props.onApply - Apply recommendation callback
 */
const FlowAIPanel = ({
  recommendations = [],
  loading = false,
  onRefresh,
  onApply,
  stepData = null
}) => {
  const [collapsed, setCollapsed] = useState({});
  const [visible, setVisible] = useState(true);

  // Group recommendations by type
  const groupedRecommendations = recommendations.reduce((acc, rec) => {
    const type = rec.type || 'insight';
    if (!acc[type]) acc[type] = [];
    acc[type].push(rec);
    return acc;
  }, {});

  // Type configurations
  const typeConfig = {
    insight: {
      icon: <Lightbulb />,
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      title: '💡 AI Insights',
      priority: 1
    },
    warning: {
      icon: <Warning />,
      color: '#f59e0b',
      bgColor: '#fffbeb',
      title: '⚠️ Warnings',
      priority: 2
    },
    suggestion: {
      icon: <TrendingUp />,
      color: '#10b981',
      bgColor: '#f0fdf4',
      title: '✅ Suggestions',
      priority: 3
    },
    'best-practice': {
      icon: <CheckCircle />,
      color: '#2563eb',
      bgColor: '#eff6ff',
      title: '📚 Best Practices',
      priority: 4
    }
  };

  const toggleSection = (type) => {
    setCollapsed(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <Chip label="High Priority" size="small" color="error" />;
      case 'medium':
        return <Chip label="Medium" size="small" color="warning" />;
      case 'low':
        return <Chip label="Low" size="small" color="default" />;
      default:
        return null;
    }
  };

  if (!visible) {
    return (
      <Box
        sx={{
          position: 'fixed',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000
        }}
      >
        <Tooltip title="Show AI Recommendations" placement="left">
          <IconButton
            onClick={() => setVisible(true)}
            sx={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              '&:hover': {
                backgroundColor: '#7c3aed'
              }
            }}
          >
            <Lightbulb />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        width: 350,
        maxHeight: 'calc(100vh - 200px)',
        overflow: 'auto',
        position: 'sticky',
        top: 100,
        borderRadius: 2,
        border: '2px solid #e0e7ff'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)',
          color: 'white',
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lightbulb />
          <Typography variant="h6" fontWeight="bold">
            AI Recommendations
          </Typography>
        </Box>
        <Box>
          {onRefresh && (
            <Tooltip title="Refresh recommendations">
              <IconButton
                size="small"
                onClick={onRefresh}
                disabled={loading}
                sx={{ color: 'white' }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Hide panel">
            <IconButton
              size="small"
              onClick={() => setVisible(false)}
              sx={{ color: 'white' }}
            >
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Analyzing data...
          </Typography>
        </Box>
      )}

      {/* No Recommendations */}
      {!loading && recommendations.length === 0 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No recommendations available yet.
            <br />
            Fill in more details to get AI insights.
          </Typography>
        </Box>
      )}

      {/* Recommendations by Type */}
      {!loading && recommendations.length > 0 && (
        <Box sx={{ p: 2 }}>
          {Object.entries(typeConfig)
            .sort((a, b) => a[1].priority - b[1].priority)
            .map(([type, config]) => {
              const recs = groupedRecommendations[type];
              if (!recs || recs.length === 0) return null;

              const isCollapsed = collapsed[type];

              return (
                <Box key={type} sx={{ mb: 2 }}>
                  <Box
                    onClick={() => toggleSection(type)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: config.bgColor,
                      '&:hover': {
                        opacity: 0.8
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: config.color }}>{config.icon}</Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {config.title}
                      </Typography>
                      <Chip label={recs.length} size="small" />
                    </Box>
                    {isCollapsed ? <ExpandMore /> : <ExpandLess />}
                  </Box>

                  <Collapse in={!isCollapsed}>
                    <Box sx={{ mt: 1 }}>
                      {recs.map((rec, idx) => (
                        <Alert
                          key={idx}
                          severity={
                            type === 'warning' ? 'warning' :
                            type === 'insight' ? 'info' : 'success'
                          }
                          sx={{
                            mb: 1,
                            '& .MuiAlert-message': {
                              width: '100%'
                            }
                          }}
                          action={
                            rec.priority && getPriorityIcon(rec.priority)
                          }
                        >
                          {rec.title && (
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              {rec.title}
                            </Typography>
                          )}
                          <Typography variant="body2">
                            {rec.message}
                          </Typography>

                          {/* Metric Display */}
                          {rec.metric && (
                            <Box
                              sx={{
                                mt: 1,
                                p: 1,
                                backgroundColor: 'rgba(0,0,0,0.05)',
                                borderRadius: 1
                              }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                {rec.metric.label}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" fontWeight="bold">
                                  {rec.metric.value}
                                </Typography>
                                {rec.metric.change !== undefined && (
                                  <Chip
                                    label={`${rec.metric.change > 0 ? '+' : ''}${rec.metric.change}%`}
                                    size="small"
                                    color={rec.metric.change > 0 ? 'success' : 'error'}
                                  />
                                )}
                              </Box>
                            </Box>
                          )}

                          {/* Action Button */}
                          {rec.action && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => {
                                if (rec.action.onClick) {
                                  rec.action.onClick();
                                } else if (onApply) {
                                  onApply(rec);
                                }
                              }}
                              sx={{ mt: 1 }}
                            >
                              {rec.action.label || 'Apply'}
                            </Button>
                          )}
                        </Alert>
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
        </Box>
      )}

      {/* Footer with confidence score */}
      {!loading && recommendations.length > 0 && (
        <>
          <Divider />
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Powered by Trade AI ML Engine
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default FlowAIPanel;
