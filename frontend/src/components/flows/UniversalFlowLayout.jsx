import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Collapse
} from '@mui/material';
import {
  Close as CloseIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { checkAPIHealth } from '../../utils/apiHealth';

/**
 * UniversalFlowLayout - Main wrapper for all flow-based interfaces
 * 
 * Features:
 * - 70/30 split layout (main content / AI panel)
 * - Collapsible AI sidebar
 * - Real-time API health monitoring
 * - Auto-save functionality
 * - Responsive design
 */
const UniversalFlowLayout = ({
  title,
  subtitle,
  children,
  aiPanel,
  onSave,
  onClose,
  showApiStatus = true,
  autoSave = true,
  autoSaveDelay = 2000
}) => {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [apiHealth, setApiHealth] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Check API health on mount and periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await checkAPIHealth();
        setApiHealth(health);
        setIsOnline(health.ok);
      } catch (error) {
        setIsOnline(false);
        setApiHealth({ ok: false, error: error.message });
      }
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    
    return () => clearInterval(interval);
  }, []);
  
  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !onSave) return;
    
    const timeout = setTimeout(async () => {
      if (onSave) {
        setIsSaving(true);
        try {
          await onSave();
          setLastSaved(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, autoSaveDelay);
    
    return () => clearTimeout(timeout);
  }, [autoSave, onSave, autoSaveDelay]);
  
  const toggleAIPanel = () => {
    setAiPanelOpen(!aiPanelOpen);
  };
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      bgcolor: '#f5f7fa'
    }}>
      {/* Header */}
      <Paper sx={{ 
        p: 2, 
        mb: 2, 
        borderRadius: 0,
        borderBottom: '2px solid #6D28D9'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#6D28D9' }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* API Status */}
            {showApiStatus && (
              <Chip
                icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
                label={isOnline ? 'Connected' : 'Offline'}
                color={isOnline ? 'success' : 'error'}
                size="small"
                sx={{ fontWeight: 500 }}
              />
            )}
            
            {/* Environment Badge */}
            <Chip
              label={process.env.NODE_ENV === 'production' ? 'LIVE' : 'DEV'}
              color={process.env.NODE_ENV === 'production' ? 'error' : 'warning'}
              size="small"
              sx={{ fontWeight: 600 }}
            />
            
            {/* Auto-save indicator */}
            {autoSave && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isSaving ? (
                  <>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">
                      Saving...
                    </Typography>
                  </>
                ) : lastSaved ? (
                  <Typography variant="caption" color="text.secondary">
                    Saved {new Date(lastSaved).toLocaleTimeString()}
                  </Typography>
                ) : null}
              </Box>
            )}
            
            {/* Close button */}
            {onClose && (
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </Paper>
      
      {/* API Health Alert */}
      {!isOnline && (
        <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
          API connection lost. Your changes may not be saved. Check your connection and try again.
        </Alert>
      )}
      
      {/* Main Content Area */}
      <Box sx={{ 
        display: 'flex', 
        flex: 1,
        overflow: 'hidden',
        px: 2,
        gap: 2
      }}>
        {/* Main Content (70% when panel open, 100% when closed) */}
        <Paper sx={{ 
          flex: aiPanelOpen ? '0 0 70%' : '1',
          overflow: 'auto',
          p: 3,
          transition: 'all 0.3s ease',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {children}
        </Paper>
        
        {/* AI Panel Toggle Button */}
        <IconButton
          onClick={toggleAIPanel}
          sx={{
            position: aiPanelOpen ? 'relative' : 'fixed',
            right: aiPanelOpen ? 0 : 16,
            top: aiPanelOpen ? '50%' : '50%',
            transform: 'translateY(-50%)',
            bgcolor: '#6D28D9',
            color: 'white',
            '&:hover': {
              bgcolor: '#5B21B6'
            },
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(30,64,175,0.4)'
          }}
        >
          {aiPanelOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
        
        {/* AI Insights Panel (30%) */}
        <Collapse orientation="horizontal" in={aiPanelOpen}>
          <Paper sx={{ 
            width: '400px',
            overflow: 'auto',
            background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)',
            color: 'white',
            p: 3,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            {aiPanel || (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
                  🤖 AI Assistant
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  AI insights will appear here as you work
                </Typography>
              </Box>
            )}
          </Paper>
        </Collapse>
      </Box>
      
      {/* Footer Status Bar */}
      <Paper sx={{ 
        p: 1.5, 
        mt: 2,
        borderRadius: 0,
        borderTop: '1px solid #e0e0e0',
        bgcolor: '#fafafa'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          px: 2
        }}>
          <Typography variant="caption" color="text.secondary">
            Trade AI Platform v2.3.0
          </Typography>
          
          {apiHealth && (
            <Typography variant="caption" color="text.secondary">
              API: {isOnline ? '🟢' : '🔴'} {apiHealth.latency ? `${apiHealth.latency}ms` : ''}
            </Typography>
          )}
          
          <Typography variant="caption" color="text.secondary">
            {new Date().toLocaleString()}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default UniversalFlowLayout;
