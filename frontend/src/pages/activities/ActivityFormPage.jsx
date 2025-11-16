import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Paper, Typography, Button } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import ActivityForm from '../../components/activityGrid/ActivityForm';
import api from '../../services/api';
import { useToast } from '../../components/common/ToastNotification';

/**
 * Page wrapper for ActivityForm component
 * ActivityForm was originally designed as a modal, this wrapper makes it work as a full page
 */
const ActivityFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activity, setActivity] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (id) {
      fetchActivity();
    }
  }, [id]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/activity-grid/${id}`);
      setActivity(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching activity:', error);
      showToast('Failed to load activity', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (id) {
        await api.put(`/activity-grid/${id}`, formData);
        showToast('Activity updated successfully', 'success');
      } else {
        await api.post('/activity-grid', formData);
        showToast('Activity created successfully', 'success');
      }
      navigate('/activities');
    } catch (error) {
      console.error('Error saving activity:', error);
      showToast(error.message || 'Failed to save activity', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/activities')}
          sx={{ mr: 2 }}
        >
          Back to Activities
        </Button>
        <Typography variant="h4" component="h1">
          {id ? 'Edit Activity' : 'Create New Activity'}
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <ActivityForm
          activity={activity}
          onSubmit={handleSubmit}
        />
      </Paper>
    </Box>
  );
};

export default ActivityFormPage;
