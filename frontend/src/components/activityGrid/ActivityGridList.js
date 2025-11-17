import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Edit as EditIcon,
  Warning as WarningIcon,
  Event as EventIcon,
  LocalOffer as PromotionIcon,
  AttachMoney as TradeSpendIcon,
  Campaign as CampaignIcon,
  School as TrainingIcon,
  MoreHoriz as OtherIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { enZA } from 'date-fns/locale';

const ActivityGridList = ({ activities, onActivityClick }) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('date');
  
  // Flatten activities object to array if needed
  const activityList = Array.isArray(activities) 
    ? activities 
    : Object.entries(activities).flatMap(([date, acts]) => 
        acts.map(act => ({ ...act, date: parseISO(date) }))
      );
  
  // Handle sort request
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Sort function
  const sortedActivities = activityList.sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    
    if (orderBy === 'date') {
      return order === 'asc' 
        ? new Date(aValue) - new Date(bValue)
        : new Date(bValue) - new Date(aValue);
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return order === 'asc' ? aValue - bValue : bValue - aValue;
  });
  
  // Get activity icon based on type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'promotion':
        return <PromotionIcon fontSize="small" />;
      case 'trade_spend':
        return <TradeSpendIcon fontSize="small" />;
      case 'campaign':
        return <CampaignIcon fontSize="small" />;
      case 'event':
        return <EventIcon fontSize="small" />;
      case 'training':
        return <TrainingIcon fontSize="small" />;
      default:
        return <OtherIcon fontSize="small" />;
    }
  };
  
  // Get activity color based on type
  const getActivityColor = (type) => {
    switch (type) {
      case 'promotion':
        return 'primary';
      case 'trade_spend':
        return 'success';
      case 'campaign':
        return 'secondary';
      case 'event':
        return 'info';
      case 'training':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'date'}
                direction={orderBy === 'date' ? order : 'asc'}
                onClick={() => handleRequestSort('date')}
              >
                Date
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'type'}
                direction={orderBy === 'type' ? order : 'asc'}
                onClick={() => handleRequestSort('type')}
              >
                Type
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'title'}
                direction={orderBy === 'title' ? order : 'asc'}
                onClick={() => handleRequestSort('title')}
              >
                Title
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'customer'}
                direction={orderBy === 'customer' ? order : 'asc'}
                onClick={() => handleRequestSort('customer')}
              >
                Customer
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'value'}
                direction={orderBy === 'value' ? order : 'asc'}
                onClick={() => handleRequestSort('value')}
              >
                Value
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'status'}
                direction={orderBy === 'status' ? order : 'asc'}
                onClick={() => handleRequestSort('status')}
              >
                Status
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'priority'}
                direction={orderBy === 'priority' ? order : 'asc'}
                onClick={() => handleRequestSort('priority')}
              >
                Priority
              </TableSortLabel>
            </TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedActivities.length > 0 ? (
            sortedActivities.map((activity, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  {format(
                    typeof activity.date === 'string' 
                      ? parseISO(activity.date) 
                      : activity.date,
                    'dd MMM yyyy',
                    { locale: enZA }
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getActivityIcon(activity.type)}
                    label={activity.type.replace('_', ' ')}
                    size="small"
                    color={getActivityColor(activity.type)}
                  />
                </TableCell>
                <TableCell>{activity.title}</TableCell>
                <TableCell>{activity.customer}</TableCell>
                <TableCell>
                  {activity.value ? formatCurrency(activity.value) : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={activity.status}
                    size="small"
                    color={
                      activity.status === 'completed' ? 'success' :
                      activity.status === 'active' ? 'primary' :
                      activity.status === 'scheduled' ? 'info' :
                      'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={activity.priority}
                    size="small"
                    color={
                      activity.priority === 'high' ? 'error' :
                      activity.priority === 'medium' ? 'warning' :
                      'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small"
                        onClick={() => onActivityClick(activity)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    {activity.conflicts > 0 && (
                      <Tooltip title={`${activity.conflicts} conflicts`}>
                        <IconButton size="small" color="warning">
                          <WarningIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <Typography variant="body1" sx={{ py: 2 }}>
                  No activities found for the selected period
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ActivityGridList;