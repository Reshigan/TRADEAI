import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

const WorkflowAutomation = () => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Workflow Automation
      </Typography>
      <Alert severity="info">
        Workflow automation configuration will be available in the next release.
        Features include: Approval chains, Email notifications, Escalation policies, SLA management.
      </Alert>
    </Box>
  );
};

export default WorkflowAutomation;
