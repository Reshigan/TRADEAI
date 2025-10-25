import React, { useState } from 'react';
import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Receipt as TradeSpendIcon,
  LocalOffer as PromotionIcon,
  Assignment as TradingTermIcon,
  Event as ActivityIcon,
  Description as ReportIcon
} from '@mui/icons-material';

/**
 * QUICK ACTIONS SPEED DIAL
 * Floating action button for quick access to common actions
 * Maintains theme consistency with custom colors
 */
const QuickActions = ({ onActionSelect }) => {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const actions = [
    { 
      icon: <TradeSpendIcon />, 
      name: 'New Trade Spend', 
      action: 'trade-spend',
      color: '#00ffff'
    },
    { 
      icon: <PromotionIcon />, 
      name: 'New Promotion', 
      action: 'promotion',
      color: '#8b5cf6'
    },
    { 
      icon: <TradingTermIcon />, 
      name: 'New Trading Term', 
      action: 'trading-term',
      color: '#10b981'
    },
    { 
      icon: <ActivityIcon />, 
      name: 'New Activity', 
      action: 'activity',
      color: '#f59e0b'
    },
    { 
      icon: <ReportIcon />, 
      name: 'Generate Report', 
      action: 'report',
      color: '#ef4444'
    }
  ];

  const handleActionClick = (action) => {
    setSelectedAction(action);
    setOpen(false);
    
    if (onActionSelect) {
      onActionSelect(action.action);
    } else {
      setDialogOpen(true);
    }
  };

  return (
    <>
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ 
          position: 'fixed', 
          bottom: 24, 
          right: 24,
          '& .MuiFab-primary': {
            background: 'linear-gradient(45deg, #00ffff, #8b5cf6)',
            '&:hover': {
              background: 'linear-gradient(45deg, #00e6e6, #7c3aed)',
            }
          }
        }}
        icon={<SpeedDialIcon openIcon={<AddIcon />} />}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            tooltipOpen
            onClick={() => handleActionClick(action)}
            sx={{
              '& .MuiSpeedDialAction-fab': {
                bgcolor: action.color,
                '&:hover': {
                  bgcolor: action.color,
                  filter: 'brightness(0.9)',
                }
              }
            }}
          />
        ))}
      </SpeedDial>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Quick Action</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            Navigate to {selectedAction?.name} page to create a new item.
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuickActions;
