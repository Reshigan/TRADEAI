import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Box,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import activityGridService from '../../services/api/activityGridService';
import ActivityForm from './ActivityForm';
import { formatLabel } from '../../utils/formatters';

const ActivityDetail = ({ open, onClose, activityId, onUpdate, onDelete }) => {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);


  useEffect(() => {
    if (open && activityId) {
      fetchActivity();
    }
  }, [open, activityId]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const response = await activityGridService.getActivity(activityId);
      setActivity(response.data);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleEditClose = () => {
    setEditMode(false);
  };

  const handleEditSave = (updatedActivity) => {
    setActivity(updatedActivity);
    setEditMode(false);
    if (onUpdate) {
      onUpdate(updatedActivity);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await activityGridService.deleteActivity(activityId);
        if (onDelete) {
          onDelete(activityId);
        }
        onClose();
      } catch (error) {
        console.error('Error deleting activity:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'planned':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  if (editMode) {
    return (
      <ActivityForm
        open={editMode}
        onClose={handleEditClose}
        activity={activity}
        onSave={handleEditSave}
      />
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div">
            Activity Details
          </Typography>
          <Box>
            <Tooltip title="Edit Activity">
              <IconButton onClick={handleEdit} size="small">
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Activity">
              <IconButton onClick={handleDelete} size="small" color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : activity ? (
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {activity.title || 'Untitled Activity'}
              </Typography>
              {activity.description && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  {activity.description}
                </Typography>
              )}
            </Grid>

            {/* Status and Priority */}
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Typography variant="subtitle2">Status:</Typography>
                <Chip
                  label={formatLabel(activity.status || 'unknown')}
                  color={getStatusColor(activity.status)}
                  size="small"
                />
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle2">Priority:</Typography>
                <Chip
                  label={formatLabel(activity.priority || 'medium')}
                  color={getPriorityColor(activity.priority)}
                  size="small"
                />
              </Box>
            </Grid>

            {/* Activity Type */}
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CategoryIcon fontSize="small" />
                <Typography variant="subtitle2">Type:</Typography>
                <Typography variant="body2">
                  {formatLabel(activity.activityType || 'general')}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Date and Time */}
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <EventIcon fontSize="small" />
                <Typography variant="subtitle2">Date:</Typography>
                <Typography variant="body2">
                  {activity.date ? format(new Date(activity.date), 'PPP') : 'Not set'}
                </Typography>
              </Box>
              {activity.startTime && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle2">Start Time:</Typography>
                  <Typography variant="body2">{activity.startTime}</Typography>
                </Box>
              )}
            </Grid>

            {activity.endTime && (
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle2">End Time:</Typography>
                  <Typography variant="body2">{activity.endTime}</Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Related Entities */}
            {activity.customer && (
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <BusinessIcon fontSize="small" />
                  <Typography variant="subtitle2">Customer:</Typography>
                  <Typography variant="body2">
                    {activity.customer.name || activity.customer}
                  </Typography>
                </Box>
              </Grid>
            )}

            {activity.product && (
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <CategoryIcon fontSize="small" />
                  <Typography variant="subtitle2">Product:</Typography>
                  <Typography variant="body2">
                    {activity.product.name || activity.product}
                  </Typography>
                </Box>
              </Grid>
            )}

            {activity.vendor && (
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <BusinessIcon fontSize="small" />
                  <Typography variant="subtitle2">Vendor:</Typography>
                  <Typography variant="body2">
                    {activity.vendor.name || activity.vendor}
                  </Typography>
                </Box>
              </Grid>
            )}

            {activity.assignedTo && (
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <PersonIcon fontSize="small" />
                  <Typography variant="subtitle2">Assigned To:</Typography>
                  <Typography variant="body2">
                    {activity.assignedTo.firstName} {activity.assignedTo.lastName}
                  </Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Additional Information */}
            {activity.notes && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Notes:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activity.notes}
                </Typography>
              </Grid>
            )}

            {/* Metadata */}
            <Grid item xs={12}>
              <Box mt={2} pt={2} borderTop={1} borderColor="divider">
                <Typography variant="caption" color="text.secondary">
                  Created: {activity.createdAt ? format(new Date(activity.createdAt), 'PPpp') : 'Unknown'}
                  {activity.createdBy && (
                    <> by {activity.createdBy.firstName} {activity.createdBy.lastName}</>
                  )}
                </Typography>
                {activity.updatedAt && activity.updatedAt !== activity.createdAt && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Last updated: {format(new Date(activity.updatedAt), 'PPpp')}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Typography>Activity not found</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityDetail;
