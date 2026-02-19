import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Skeleton } from '@mui/material';
import ActivityDetail from '../../components/activityGrid/ActivityDetail';
import apiClient from '../../services/api/apiClient';

/**
 * Page wrapper for ActivityDetail component with ProcessShell integration
 * ActivityDetail was originally designed as a modal, this wrapper makes it work as a full page
 */
const ActivityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, [id]);

  const loadActivity = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/activities/${id}`);
      setActivity(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/activities');
  };

  const handleUpdate = (updatedActivity) => {
    console.log('Activity updated:', updatedActivity);
    setActivity(updatedActivity);
  };

  const handleDelete = (deletedId) => {
    console.log('Activity deleted:', deletedId);
    navigate('/activities');
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={400} />
        </Box>
      </Container>
    );
  }

  return (
      <ActivityDetail
        open={true}
        onClose={handleClose}
        activityId={id}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
  );
};

export default ActivityDetailPage;
