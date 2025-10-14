import React from 'react';
import {
  Box,
  Typography,
  Paper
} from '@mui/material';

const ReportList = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Reports
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Reports functionality is under development.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ReportList;