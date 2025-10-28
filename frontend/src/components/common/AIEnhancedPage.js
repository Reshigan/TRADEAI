import React, { useState } from 'react';
import {
  Box,
  Paper,
  Fab,
  Tooltip,
  Drawer,
  IconButton,
  Typography,
  Divider,
  Chip,
  Alert,
  Collapse,
  useTheme,
  alpha
} from '@mui/material';
import {
  Psychology as AIIcon,
  Close as CloseIcon,
  AutoAwesome as InsightsIcon,
  TipsAndUpdates as TipsIcon,
  Speed as QuickActionsIcon
} from '@mui/icons-material';

/**
 * AIEnhancedPage - Wrapper component that adds contextual AI assistance to any page
 * 
 * Features:
 * - Floating AI assistant button
 * - Contextual insights drawer
 * - Page-specific AI recommendations
 * - Quick actions panel
 * - Smart tips and suggestions
 */
const AIEnhancedPage = ({ 
  children, 
  pageContext, // 'dashboard', 'customers', 'products', etc.
  contextData = {}, // Current page data for AI context
  aiInsights = [],
  quickActions = [],
  tips = [],
  onAIAction,
  showAIButton = true
}) => {
  const theme = useTheme();
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [showTips, setShowTips] = useState(true);

  const handleAIClick = () => {
    setAiDrawerOpen(true);
  };

  const handleCloseAI = () => {
    setAiDrawerOpen(false);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Main content */}
      {children}

      {/* Tips Banner */}
      {tips.length > 0 && showTips && (
        <Collapse in={showTips}>
          <Alert
            icon={<TipsIcon />}
            severity="info"
            sx={{
              position: 'fixed',
              bottom: showAIButton ? 100 : 24,
              right: 24,
              maxWidth: 400,
              zIndex: 1200,
              boxShadow: theme.shadows[8]
            }}
            onClose={() => setShowTips(false)}
          >
            <Typography variant="subtitle2" gutterBottom>
              💡 Smart Tip
            </Typography>
            <Typography variant="body2">
              {tips[0]}
            </Typography>
          </Alert>
        </Collapse>
      )}

      {/* Floating AI Button */}
      {showAIButton && (
        <Tooltip title="AI Assistant" placement="left">
          <Fab
            color="secondary"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1300,
              background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.primary.dark} 100%)`,
                transform: 'scale(1.1)',
              },
              transition: 'all 0.3s ease'
            }}
            onClick={handleAIClick}
          >
            <AIIcon />
          </Fab>
        </Tooltip>
      )}

      {/* AI Insights Drawer */}
      <Drawer
        anchor="right"
        open={aiDrawerOpen}
        onClose={handleCloseAI}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 400 },
            p: 3
          }
        }}
      >
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h5" fontWeight="bold">
                AI Assistant
              </Typography>
            </Box>
            <IconButton onClick={handleCloseAI}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Chip 
            label={`Context: ${pageContext}`} 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ mb: 3 }}
          />

          <Divider sx={{ mb: 3 }} />

          {/* AI Insights Section */}
          {aiInsights.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <InsightsIcon color="primary" />
                <Typography variant="h6" fontWeight="600">
                  AI Insights
                </Typography>
              </Box>
              {aiInsights.map((insight, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    borderLeft: `4px solid ${theme.palette.primary.main}`
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="600" color="primary" gutterBottom>
                    {insight.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {insight.description}
                  </Typography>
                  {insight.confidence && (
                    <Chip
                      label={`${Math.round(insight.confidence * 100)}% confidence`}
                      size="small"
                      sx={{ mt: 1 }}
                      color={insight.confidence > 0.8 ? 'success' : 'warning'}
                    />
                  )}
                </Paper>
              ))}
            </Box>
          )}

          {/* Quick Actions Section */}
          {quickActions.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <QuickActionsIcon color="secondary" />
                <Typography variant="h6" fontWeight="600">
                  Quick Actions
                </Typography>
              </Box>
              {quickActions.map((action, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: alpha(theme.palette.secondary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      transform: 'translateX(4px)'
                    }
                  }}
                  onClick={() => onAIAction && onAIAction(action)}
                >
                  <Typography variant="body1" fontWeight="600" gutterBottom>
                    {action.icon} {action.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}

          {/* All Tips Section */}
          {tips.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TipsIcon color="info" />
                <Typography variant="h6" fontWeight="600">
                  Smart Tips
                </Typography>
              </Box>
              {tips.map((tip, index) => (
                <Alert key={index} severity="info" sx={{ mb: 2 }}>
                  {tip}
                </Alert>
              ))}
            </Box>
          )}

          {/* No content state */}
          {aiInsights.length === 0 && quickActions.length === 0 && tips.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <AIIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                AI Learning Your Context
              </Typography>
              <Typography variant="body2" color="text.secondary">
                As you use this page, AI will provide personalized insights and recommendations.
              </Typography>
            </Box>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default AIEnhancedPage;
