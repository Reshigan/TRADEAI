import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ActivityDetail from '../../components/activityGrid/ActivityDetail';

/**
 * Page wrapper for ActivityDetail component
 * ActivityDetail was originally designed as a modal, this wrapper makes it work as a full page
 */
const ActivityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/activities');
  };

  const handleUpdate = (updatedActivity) => {
    console.log('Activity updated:', updatedActivity);
  };

  const handleDelete = (deletedId) => {
    console.log('Activity deleted:', deletedId);
    navigate('/activities');
  };

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
