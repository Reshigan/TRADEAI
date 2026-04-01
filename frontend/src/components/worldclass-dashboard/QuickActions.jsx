import React from 'react';
import { 
  Box, 
  Button, 
  Grid, 
  Typography,
  Paper
} from '@mui/material';
import { 
  Add as AddIcon,
  AccountBalance,
  Campaign,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Analytics,
  Receipt as ClaimIcon,
  Assignment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const QuickActions = ({ user }) => {
  const navigate = useNavigate();
  
  // Define quick actions based on user role (Zero-Slop Law 24)
  const actions = [
    {
      title: 'Create Budget',
      icon: <AccountBalance />,
      path: '/budgets/new',
      color: '#1E3A8A',
      roles: ['admin', 'manager', 'director', 'super_admin']
    },
    {
      title: 'New Promotion',
      icon: <Campaign />,
      path: '/promotions/new',
      color: '#1E40AF',
      roles: ['admin', 'manager', 'director', 'super_admin', 'jam']
    },
    {
      title: 'Log Trade Spend',
      icon: <ShoppingCart />,
      path: '/tradespends/new',
      color: '#2D7D9A',
      roles: ['admin', 'manager', 'director', 'super_admin', 'jam']
    },
    {
      title: 'Process Claim',
      icon: <Receipt />,
      path: '/claims/new',
      color: '#ed6c02',
      roles: ['admin', 'manager', 'director', 'super_admin', 'jam']
    },
    {
      title: 'Run Analysis',
      icon: <Analytics />,
      path: '/analytics',
      color: '#2e7d32',
      roles: ['admin', 'manager', 'director', 'super_admin', 'analyst']
    },
    {
      title: 'View Reports',
      icon: <TrendingUp />,
      path: '/reports',
      color: '#7b1fa2',
      roles: ['admin', 'manager', 'director', 'super_admin']
    }
  ];

  // Filter actions based on user role (Zero-Slop Law 24)
  const userActions = user?.role ? 
    actions.filter(action => action.roles.includes(user.role)) : 
    actions;

  return (
    <Box>
      <Grid container spacing={2}>
        {userActions.map((action, index) => (
          <Grid item xs={6} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                  borderColor: action.color
                }
              }}
              onClick={() => navigate(action.path)}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: `${action.color}15`,
                  color: action.color,
                  mx: 'auto',
                  mb: 1.5
                }}
              >
                {action.icon}
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary'
                }}
              >
                {action.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
        
        {/* Add custom action button */}
        <Grid item xs={12}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ 
              mt: 1,
              py: 1.5,
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.main05'
              }
            }}
            onClick={() => navigate('/actions')}
          >
            More Actions
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuickActions;