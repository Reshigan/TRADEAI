import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Card,
  CardContent,
  useTheme,
  alpha,
  Skeleton,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * ProcessTracker - World-class process monitoring and tracking component
 * 
 * Features:
 * - Real-time process monitoring
 * - Visual progress tracking with animations
 * - Bottleneck detection
 * - Time tracking and estimates
 * - Status aggregation
 * - Interactive controls
 * 
 * @param {Object} props
 * @param {Object} props.process - Process metadata
 * @param {Array} props.steps - Process steps
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onRefresh - Refresh callback
 * @param {Function} props.onPause - Pause callback
 * @param {Function} props.onResume - Resume callback
 */
const ProcessTracker = ({
  process,
  steps = [],
  loading = false,
  onRefresh,
  onPause,
  onResume,
}) => {
  const theme = useTheme();
  const [isPaused, setIsPaused] = useState(false);

  // Calculate metrics
  const completedSteps = steps.filter((s, i) => i < process.activeStep || s.status === 'completed').length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  
  const activeStep = steps[process.activeStep];
  const nextStep = steps[process.activeStep + 1];
  
  // Calculate estimated time remaining
  const estimatedTimeRemaining = steps
    .slice(process.activeStep)
    .reduce((acc, step) => acc + (step.estimatedMinutes || 0), 0);
  
  // Detect bottlenecks (steps taking longer than estimated)
  const bottlenecks = steps.filter(step => 
    step.actualMinutes > (step.estimatedMinutes * 1.5)
  );

  // Status summary
  const statusSummary = {
    completed: steps.filter(s => s.status === 'completed' || s.completed).length,
    inProgress: steps.filter(s => s.status === 'in_progress' || s.active).length,
    pending: steps.filter(s => !s.status || s.status === 'pending').length,
    blocked: steps.filter(s => s.status === 'blocked' || s.blocked).length,
    error: steps.filter(s => s.status === 'error' || s.error).length,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={8} sx={{ mb: 3, borderRadius: 4 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} xs={12} sm={6} md={3}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: 3,
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                  }}
                >
                  <TimelineIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {process.name || 'Process Tracker'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {process.description || 'Tracking process progress'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={isPaused ? 'Resume' : 'Pause'}>
                <IconButton
                  onClick={() => {
                    setIsPaused(!isPaused);
                    if (isPaused) onResume?.();
                    else onPause?.();
                  }}
                  sx={{
                    bgcolor: isPaused ? 'warning.light' : 'primary.light',
                    color: isPaused ? 'warning.contrastText' : 'primary.contrastText',
                    '&:hover': {
                      bgcolor: isPaused ? 'warning.main' : 'primary.main',
                    },
                  }}
                >
                  {isPaused ? <PlayIcon /> : <PauseIcon />}
                </IconButton>
              </Tooltip>
              
              {onRefresh && (
                <Tooltip title="Refresh">
                  <IconButton onClick={onRefresh}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Progress Bar */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                Overall Progress
              </Typography>
              <Typography variant="body2" fontWeight={700} color="primary.main">
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                  transition: 'width 0.5s ease',
                },
              }}
            />
          </Box>

          {/* Time Estimates */}
          <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              <Typography variant="body2" color="text.secondary">
                Est. remaining: <strong>{estimatedTimeRemaining} min</strong>
              </Typography>
            </Box>
            {bottlenecks.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon sx={{ color: 'warning.main', fontSize: 18 }} />
                <Typography variant="body2" color="warning.main">
                  {bottlenecks.length} bottleneck{bottlenecks.length > 1 ? 's' : ''} detected
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Status Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <motion.div variants={itemVariants}>
              <Card
                sx={{
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {statusSummary.completed}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={6} sm={3}>
            <motion.div variants={itemVariants}>
              <Card
                sx={{
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TimelineIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      In Progress
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {statusSummary.inProgress}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={6} sm={3}>
            <motion.div variants={itemVariants}>
              <Card
                sx={{
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.warning.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ScheduleIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      Pending
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {statusSummary.pending}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={6} sm={3}>
            <motion.div variants={itemVariants}>
              <Card
                sx={{
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <WarningIcon sx={{ color: 'error.main', fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      Issues
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="error.main">
                    {statusSummary.error + statusSummary.blocked}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Current & Next Step */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <FlagIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                    Current Step
                  </Typography>
                </Box>
                {activeStep ? (
                  <>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {activeStep.title}
                    </Typography>
                    {activeStep.description && (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {activeStep.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      {activeStep.assignee && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {activeStep.assignee.charAt(0).toUpperCase()}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {activeStep.assignee}
                          </Typography>
                        </Box>
                      )}
                      {activeStep.estimatedTime && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {activeStep.estimatedTime}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No active step
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: 2,
                bgcolor: alpha(theme.palette.success.main, 0.04),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="subtitle1" fontWeight={700} color="success.main">
                    Next Step
                  </Typography>
                </Box>
                {nextStep ? (
                  <>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {nextStep.title}
                    </Typography>
                    {nextStep.description && (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {nextStep.description}
                      </Typography>
                    )}
                    {nextStep.prerequisites && nextStep.prerequisites.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Prerequisites:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {nextStep.prerequisites.map((prereq, idx) => (
                            <Chip
                              key={idx}
                              label={prereq}
                              size="small"
                              sx={{ height: 24, fontSize: '0.7rem' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Process complete!
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </motion.div>
  );
};

export default ProcessTracker;
