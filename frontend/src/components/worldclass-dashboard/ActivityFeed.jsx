import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Chip 
} from '@mui/material';
import { 
  AccountBalance, 
  Campaign, 
  ShoppingCart, 
  CheckCircle, 
  Schedule, 
  Warning 
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';

// Map activity types to icons and colors (Zero-Slop Law 24)
const getActivityIcon = (type) => {
  switch (type) {
    case 'budget':
      return { icon: <AccountBalance />, color: 'primary' };
    case 'promotion':
      return { icon: <Campaign />, color: 'secondary' };
    case 'spend':
      return { icon: <ShoppingCart />, color: 'success' };
    case 'approval':
      return { icon: <CheckCircle />, color: 'info' };
    default:
      return { icon: <Schedule />, color: 'default' };
  }
};

// Activity Feed Component (Zero-Slop Law 3, 11)
const ActivityFeed = ({ activities = [], maxItems = 10 }) => {
  // Handle empty state (Zero-Slop Law 3)
  if (!activities || activities.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 200,
          textAlign: 'center'
        }}
      >
        <Box>
          <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No recent activity
          </Typography>
        </Box>
      </Box>
    );
  }

  // Process activities for display
  const sortedActivities = [...activities]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, maxItems);

  return (
    <List sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
      {sortedActivities.map((activity) => {
        const { icon, color } = getActivityIcon(activity.type);
        const timeAgo = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });
        const formattedTime = format(new Date(activity.timestamp), 'MMM d, h:mm a');
        
        return (
          <ListItem 
            key={activity.id || `${activity.type}-${activity.timestamp}`}
            sx={{ 
              py: 1.5, 
              px: 0,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': {
                borderBottom: 'none'
              }
            }}
          >
            <ListItemAvatar>
              <Avatar 
                sx={{ 
                  bgcolor: `${color}.main`,
                  color: 'white'
                }}
              >
                {icon}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {activity.description}
                  </Typography>
                  {activity.status && (
                    <Chip 
                      label={activity.status} 
                      size="small" 
                      color={
                        activity.status === 'completed' ? 'success' :
                        activity.status === 'pending' ? 'warning' :
                        activity.status === 'cancelled' ? 'error' : 'default'
                      }
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              }
              secondary={
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  title={formattedTime}
                >
                  {timeAgo}
                </Typography>
              }
            />
          </ListItem>
        );
      })}
    </List>
  );
};

export default ActivityFeed;