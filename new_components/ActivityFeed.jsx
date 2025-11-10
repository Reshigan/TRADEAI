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
  Box
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CampaignIcon from '@mui/icons-material/Campaign';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = ({ activities = [], limit = 10 }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'budget':
        return <AccountBalanceIcon />;
      case 'promotion':
        return <CampaignIcon />;
      case 'spend':
        return <ShoppingCartIcon />;
      default:
        return <AccountBalanceIcon />;
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
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {activities.slice(0, limit).map((activity, index) => (
            <ListItem key={index} alignItems="flex-start">
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: `${getColor(activity.type)}.main` }}>
                  {getIcon(activity.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      {activity.description}
                    </Typography>
                    <Chip 
                      label={activity.status} 
                      size="small" 
                      color={activity.status === 'completed' ? 'success' : 'warning'}
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
