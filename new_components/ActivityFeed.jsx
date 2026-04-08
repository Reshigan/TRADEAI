import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar,
  Avatar,
  Chip,
  Box,
  Divider,
  Skeleton,
  alpha,
  useTheme
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CampaignIcon from '@mui/icons-material/Campaign';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = ({ 
  activities = [], 
  limit = 10, 
  title = "Recent Activity",
  loading = false,
  onViewAll,
  maxHeight = 400,
  compact = false
}) => {
  const theme = useTheme();

  const getIcon = (type) => {
    switch (type) {
      case 'budget':
        return <AccountBalanceIcon />;
      case 'promotion':
        return <CampaignIcon />;
      case 'spend':
        return <ShoppingCartIcon />;
      case 'completed':
        return <CheckCircleIcon />;
      case 'scheduled':
        return <ScheduleIcon />;
      case 'warning':
        return <WarningIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'budget':
        return 'primary';
      case 'promotion':
        return 'secondary';
      case 'spend':
        return 'success';
      case 'completed':
        return 'success';
      case 'scheduled':
        return 'info';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      completed: { label: 'Completed', color: 'success' },
      pending: { label: 'Pending', color: 'warning' },
      failed: { label: 'Failed', color: 'error' },
      scheduled: { label: 'Scheduled', color: 'info' },
      approved: { label: 'Approved', color: 'success' },
      draft: { label: 'Draft', color: 'default' }
    };
    
    const statusInfo = statusMap[status] || { label: status, color: 'default' };
    return (
      <Chip 
        label={statusInfo.label} 
        size="small" 
        color={statusInfo.color} 
        variant="outlined"
        sx={{ 
          height: 20, 
          fontSize: '0.7rem',
          fontWeight: 600
        }} 
      />
    );
  };

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
            <Skeleton variant="text" width={60} height={24} />
          </Box>
          {[1, 2, 3].map(i => (
            <Box key={i} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Skeleton variant="circular" width={36} height={36} sx={{ mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="60%" height={16} />
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
            </Box>
          ))}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: compact ? 1.5 : 3 }}>
          <Typography variant={compact ? "body1" : "h6"} sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {onViewAll && (
            <Typography 
              variant="caption" 
              color="primary" 
              sx={{ cursor: 'pointer', fontWeight: 600 }}
              onClick={onViewAll}
            >
              View All
            </Typography>
          )}
        </Box>

        <Box sx={{ maxHeight, overflowY: 'auto' }}>
          {activities.slice(0, limit).length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                No recent activities
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {activities.slice(0, limit).map((activity, index, array) => (
                <React.Fragment key={activity.id || index}>
                  <ListItem 
                    alignItems="flex-start" 
                    sx={{ 
                      py: 1.5,
                      px: compact ? 1 : 2,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                        borderRadius: 2
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: `${getColor(activity.type || activity.status)}.main`,
                          width: 36,
                          height: 36
                        }}
                      >
                        {getIcon(activity.type || activity.status)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 500, 
                              flex: 1,
                              pr: 1
                            }}
                          >
                            {activity.description || activity.title}
                          </Typography>
                          {activity.status && getStatusChip(activity.status)}
                        </Box>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography 
                            component="span" 
                            variant="caption" 
                            color="text.secondary"
                            display="block"
                          >
                            {activity.details || activity.subtitle}
                          </Typography>
                          <Typography 
                            component="span" 
                            variant="caption" 
                            color="text.secondary"
                            display="block"
                            sx={{ mt: 0.5 }}
                          >
                            {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : activity.time}
                          </Typography>
                        </React.Fragment>
                      }
                      sx={{ mt: 0, mb: 0 }}
                    />
                  </ListItem>
                  
                  {index < array.length - 1 && (
                    <Divider 
                      variant="middle" 
                      sx={{ 
                        mx: compact ? 1 : 2,
                        borderColor: alpha(theme.palette.divider, 0.3)
                      }} 
                    />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
