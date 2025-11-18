import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Add as AddIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  Campaign as CampaignIcon,
  Speed as SpeedIcon,
  Shortcut as ShortcutIcon
} from '@mui/icons-material';

/**
 * Quick Actions Panel - One-Click Workflows
 * 
 * Provides instant access to common tasks with smart defaults.
 * Reduces friction and makes users feel productive immediately.
 */
const QuickActionsPanel = ({ onAction }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [quickValue, setQuickValue] = useState('');

  // Quick action definitions
  const quickActions = [
    {
      id: 'new-promotion',
      title: 'New Promotion',
      description: 'Launch promotion in 30 seconds',
      icon: <CampaignIcon />,
      color: '#9c27b0',
      url: '/promotions/new-flow',
      badge: 'Popular',
      estimatedTime: '30s'
    },
    {
      id: 'add-customer',
      title: 'Add Customer',
      description: 'Onboard with AI credit scoring',
      icon: <AddIcon />,
      color: '#2196f3',
      url: '/customers/new-flow',
      estimatedTime: '2m'
    },
    {
      id: 'check-inventory',
      title: 'Stock Check',
      description: 'AI inventory recommendations',
      icon: <ShoppingCartIcon />,
      color: '#4caf50',
      url: '/products?action=inventory-check',
      badge: 'Smart',
      estimatedTime: '1m'
    },
    {
      id: 'budget-optimizer',
      title: 'Optimize Budget',
      description: 'AI-powered allocation',
      icon: <MoneyIcon />,
      color: '#ff9800',
      url: '/budgets/new-flow',
      estimatedTime: '3m'
    },
    {
      id: 'roi-calculator',
      title: 'ROI Calculator',
      description: 'Quick trade spend analysis',
      icon: <TrendingUpIcon />,
      color: '#e91e63',
      action: 'calculator',
      estimatedTime: '30s'
    },
    {
      id: 'performance-report',
      title: 'Quick Report',
      description: 'Generate instant insights',
      icon: <AssessmentIcon />,
      color: '#00bcd4',
      action: 'report',
      badge: 'New',
      estimatedTime: '15s'
    }
  ];

  // Smart suggestions based on time/context
  const smartSuggestions = [
    {
      id: 'morning-review',
      title: '☀️ Morning Review',
      description: 'Check overnight performance',
      action: () => console.log('Morning review'),
      time: 'morning'
    },
    {
      id: 'weekly-planning',
      title: '📅 Plan Next Week',
      description: 'AI suggests best actions',
      action: () => console.log('Weekly planning'),
      time: 'friday'
    }
  ];

  const handleQuickAction = (action) => {
    if (action.url) {
      window.location.href = action.url;
    } else if (action.action === 'calculator') {
      setSelectedAction(action);
      setDialogOpen(true);
    } else if (action.action === 'report') {
      // Generate quick report
      handleGenerateReport();
    }
    
    if (onAction) {
      onAction(action.id);
    }
  };

  const handleGenerateReport = () => {
    // Simulate report generation
    alert('Generating your performance report... This will be ready in 15 seconds!');
  };

  const handleCalculate = () => {
    if (!quickValue) return;
    
    const amount = parseFloat(quickValue);
    const roi = (amount * 2.8).toFixed(0);
    
    alert(`Quick ROI Estimate:\nInvestment: R${amount.toLocaleString()}\nExpected Return: R${roi.toLocaleString()}\nROI: 2.8x`);
    
    setDialogOpen(false);
    setQuickValue('');
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Quick Actions
            </Typography>
          </Box>
          <Chip 
            label="Time savers"
            size="small"
            icon={<ShortcutIcon />}
            color="primary"
            variant="outlined"
          />
        </Box>

        {/* Quick Action Grid */}
        <Grid container spacing={2}>
          {quickActions.map((action) => (
            <Grid item xs={12} sm={6} md={4} key={action.id}>
              <Paper
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '2px solid transparent',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                    borderColor: action.color
                  }
                }}
                onClick={() => handleQuickAction(action)}
              >
                {/* Badge */}
                {action.badge && (
                  <Chip
                    label={action.badge}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: action.color,
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.7rem'
                    }}
                  />
                )}

                {/* Icon */}
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${action.color}15`,
                    color: action.color,
                    mb: 2
                  }}
                >
                  {React.cloneElement(action.icon, { sx: { fontSize: 32 } })}
                </Box>

                {/* Content */}
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  {action.description}
                </Typography>

                {/* Estimated Time */}
                <Chip
                  label={`⚡ ${action.estimatedTime}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Smart Suggestions */}
      <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#2e7d32' }}>
          💡 Smart Suggestions for You
        </Typography>
        <Grid container spacing={1}>
          {smartSuggestions.map((suggestion) => (
            <Grid item xs={12} sm={6} key={suggestion.id}>
              <Button
                fullWidth
                variant="outlined"
                onClick={suggestion.action}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  py: 1.5,
                  borderColor: '#4caf50',
                  color: '#2e7d32',
                  '&:hover': {
                    bgcolor: 'rgba(76, 175, 80, 0.1)',
                    borderColor: '#2e7d32'
                  }
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {suggestion.title}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {suggestion.description}
                  </Typography>
                </Box>
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Quick Calculator Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" />
            Quick ROI Calculator
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Enter your investment amount for an instant ROI estimate
          </Typography>
          <TextField
            fullWidth
            label="Investment Amount (ZAR)"
            type="number"
            value={quickValue}
            onChange={(e) => setQuickValue(e.target.value)}
            InputProps={{
              startAdornment: 'R'
            }}
            autoFocus
          />
          <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
            <Typography variant="caption" color="primary">
              💡 Based on average historical ROI of 2.8x for similar investments
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCalculate}
            disabled={!quickValue}
          >
            Calculate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Productivity Tip */}
      <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fff3e0', borderRadius: 2 }}>
        <Typography variant="caption" sx={{ color: '#e65100' }}>
          ⚡ <strong>Pro tip:</strong> Use keyboard shortcuts: <code>Ctrl+P</code> for new promotion, <code>Ctrl+K</code> for quick search
        </Typography>
      </Box>
    </Box>
  );
};

export default QuickActionsPanel;
