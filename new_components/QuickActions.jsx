import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack, 
  Box,
  Paper,
  Grid,
  Skeleton,
  alpha,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

const QuickActions = ({ 
  actions = [], 
  title = "Quick Actions",
  loading = false,
  compact = false,
  columns = 2
}) => {
  const theme = useNavigate();
  const navigate = useNavigate();

  const defaultActions = [
    {
      label: 'Create Budget',
      path: '/budgets/new',
      color: 'primary',
      icon: <AddIcon />,
      description: 'Create a new budget allocation'
    },
    {
      label: 'New Promotion',
      path: '/promotions/new',
      color: 'secondary',
      icon: <AddIcon />,
      description: 'Launch a new promotional campaign'
    },
    {
      label: 'Log Trade Spend',
      path: '/trade-spends/new',
      color: 'success',
      icon: <AddIcon />,
      description: 'Record marketing and promotional expenses'
    },
    {
      label: 'Process Rebate',
      path: '/rebates/new',
      color: 'info',
      icon: <AddIcon />,
      description: 'Create and approve rebate programs'
    }
  ];

  const actionsToShow = actions.length > 0 ? actions : defaultActions;

  if (loading) {
    return (
      <Card 
        elevation={2} 
        sx={{ 
          height: '100%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 100%)',
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          borderRadius: theme.spacing.borderRadius.lg
        }}
      >
        <CardContent sx={{ p: compact ? 2 : 3, pb: compact ? '16px !important' : '24px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: compact ? 1.5 : 3 }}>
            <Skeleton variant="text" width={120} height={24} />
          </Box>
          <Grid container spacing={compact ? 1 : 2}>
            {[1, 2, 3, 4].map(i => (
              <Grid item xs={6} key={i}>
                <Skeleton variant="rounded" height={compact ? 60 : 80} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      elevation={2} 
      sx={{ 
        height: '100%',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 100%)',
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        borderRadius: theme.spacing.borderRadius.lg,
        '&:hover': {
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent sx={{ p: compact ? 2 : 3, pb: compact ? '16px !important' : '24px !important' }}>
        <Typography variant={compact ? "body1" : "h6"} sx={{ fontWeight: 600, mb: compact ? 1.5 : 3 }}>
          {title}
        </Typography>
        
        <Grid container spacing={compact ? 1 : 2}>
          {actionsToShow.map((action, index) => (
            <Grid item xs={12 / columns} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: compact ? 1.5 : 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[2],
                    borderColor: alpha(theme.palette[action.color]?.main || theme.palette.primary.main, 0.3),
                    bgcolor: alpha(theme.palette[action.color]?.main || theme.palette.primary.main, 0.05)
                  }
                }}
                onClick={() => navigate(action.path)}
              >
                <Box
                  sx={{
                    width: compact ? 36 : 48,
                    height: compact ? 36 : 48,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette[action.color]?.main || theme.palette.primary.main, 0.1),
                    color: theme.palette[action.color]?.main || theme.palette.primary.main,
                    mb: 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: `0 4px 8px ${alpha(theme.palette[action.color]?.main || theme.palette.primary.main, 0.2)}`
                    }
                  }}
                >
                  {action.icon || <AddIcon />}
                </Box>
                <Typography 
                  variant={compact ? "caption" : "body2"} 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                    mb: 0.5
                  }}
                >
                  {action.label}
                </Typography>
                {action.description && !compact && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      display: 'block',
                      lineHeight: 1.3,
                      px: 0.5
                    }}
                  >
                    {action.description}
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
