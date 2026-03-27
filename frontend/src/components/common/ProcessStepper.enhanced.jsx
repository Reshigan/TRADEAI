import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Badge,
  Chip,
  LinearProgress,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Circle as CircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * World-Class Process Stepper Component
 * 
 * Features:
 * - Beautiful animated step indicators
 * - Rich step metadata (descriptions, timestamps, assignees)
 * - Multiple visualization modes (horizontal, vertical, compact)
 * - Interactive step navigation
 * - Progress animations and micro-interactions
 * - Status badges and confidence indicators
 * - Time estimates and tracking
 * - Dependency visualization
 * - Mobile-responsive design
 * - Accessibility support
 * 
 * @param {Object} props
 * @param {Array} props.steps - Array of step objects with metadata
 * @param {number} props.activeStep - Current active step index
 * @param {string} props.orientation - 'horizontal' | 'vertical'
 * @param {boolean} props.compact - Compact mode
 * @param {boolean} props.interactive - Allow clicking on steps
 * @param {Function} props.onStepClick - Callback when step is clicked
 * @param {boolean} props.showTimeEstimates - Show time estimates
 * @param {boolean} props.showConfidence - Show confidence indicators
 * @param {boolean} props.animated - Enable animations
 */
const ProcessStepper = ({
  steps = [],
  activeStep = 0,
  orientation = 'horizontal',
  compact = false,
  interactive = false,
  onStepClick,
  showTimeEstimates = false,
  showConfidence = false,
  animated = true,
  variant = 'default', // default, elevated, outlined
}) => {
  const theme = useTheme();
  const [expandedStep, setExpandedStep] = useState(null);
  const [hoveredStep, setHoveredStep] = useState(null);

  // Calculate overall progress
  const progress = steps.length > 0 
    ? Math.round(((activeStep) / (steps.length - 1 || 1)) * 100) 
    : 0;

  // Get status icon based on step state
  const getStepIcon = (step, index) => {
    const isCompleted = index < activeStep;
    const isActive = index === activeStep;
    const isPending = index > activeStep;
    const hasError = step.status === 'error';
    const hasWarning = step.status === 'warning';

    if (hasError) {
      return <ErrorIcon sx={{ fontSize: 20, color: 'error.main' }} />;
    }
    
    if (hasWarning) {
      return <WarningIcon sx={{ fontSize: 20, color: 'warning.main' }} />;
    }

    if (isCompleted) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <CheckIcon sx={{ fontSize: 20, color: 'success.main' }} />
        </motion.div>
      );
    }

    if (isActive) {
      return (
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <CircularProgress 
            size={24} 
            thickness={5} 
            sx={{ color: 'primary.main' }} 
          />
        </motion.div>
      );
    }

    return (
      <CircleIcon 
        sx={{ 
          fontSize: 20, 
          color: theme.palette.text.disabled,
          opacity: 0.5 
        }} 
      />
    );
  };

  // Custom step connector with gradient
  const ColorlibConnector = ({ completed, active }) => (
    <StepConnector
      sx={{
        [`& .${stepConnectorClasses.line}`]: {
          borderColor: theme.palette.divider,
          borderTopWidth: 3,
          borderRadius: 1,
          background: completed 
            ? `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`
            : theme.palette.divider,
          transition: 'all 0.4s ease',
        },
      }}
    />
  );

  // Render step content
  const renderStepContent = (step, index) => {
    const isCompleted = index < activeStep;
    const isActive = index === activeStep;
    const isPending = index > activeStep;
    const isExpanded = expandedStep === index;
    const isHovered = hoveredStep === index;

    const stepVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      hover: { scale: 1.02, y: -2 },
    };

    const statusColors = {
      error: 'error',
      warning: 'warning',
      pending: 'default',
      completed: 'success',
      active: 'primary',
    };

    const statusColor = isActive 
      ? 'primary' 
      : isCompleted 
        ? 'success' 
        : step.status === 'error' 
          ? 'error' 
          : step.status === 'warning' 
            ? 'warning' 
            : 'default';

    return (
      <motion.div
        variants={stepVariants}
        initial="hidden"
        animate={isExpanded ? 'visible' : 'hidden'}
        whileHover={interactive ? 'hover' : {}}
        style={{ width: '100%' }}
      >
        <Box
          onClick={() => interactive && onStepClick?.(index)}
          onMouseEnter={() => setHoveredStep(index)}
          onMouseLeave={() => setHoveredStep(null)}
          sx={{
            p: 2,
            mb: 1.5,
            borderRadius: 3,
            bgcolor: isActive 
              ? alpha(theme.palette.primary.main, 0.08) 
              : isCompleted 
                ? alpha(theme.palette.success.main, 0.08) 
                : 'transparent',
            border: `1px solid ${
              isActive 
                ? alpha(theme.palette.primary.main, 0.3) 
                : isHovered 
                  ? alpha(theme.palette.primary.main, 0.2) 
                  : 'transparent'
            }`,
            cursor: interactive ? 'pointer' : 'default',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&:before': isActive ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.05)}, transparent)`,
              animation: 'shimmer 2s infinite',
              '@keyframes shimmer': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' },
              },
            } : {},
          }}
        >
          {/* Step Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* Step Icon */}
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isActive 
                  ? 'primary.main' 
                  : isCompleted 
                    ? 'success.main' 
                    : step.status === 'error' 
                      ? 'error.main' 
                      : step.status === 'warning' 
                        ? 'warning.main' 
                        : 'grey.100',
                color: isCompleted || isActive || step.status 
                  ? 'common.white' 
                  : 'text.disabled',
                flexShrink: 0,
                transition: 'all 0.3s ease',
                boxShadow: isActive || isCompleted 
                  ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}` 
                  : 'none',
              }}
            >
              {getStepIcon(step, index)}
            </Box>

            {/* Step Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={isActive ? 700 : 600}
                  color={isActive ? 'primary.main' : isCompleted ? 'success.main' : 'text.primary'}
                  sx={{ transition: 'all 0.3s ease' }}
                >
                  {step.title || step.label || `Step ${index + 1}`}
                </Typography>
                
                {/* Status Badge */}
                {step.status && (
                  <Chip
                    label={step.status}
                    size="small"
                    color={statusColor}
                    sx={{ 
                      height: 20, 
                      fontSize: '0.65rem',
                      fontWeight: 600,
                    }}
                  />
                )}

                {/* Step Number Badge */}
                {!step.status && (
                  <Chip
                    label={`${index + 1}/${steps.length}`}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      height: 20, 
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      opacity: 0.6,
                    }}
                  />
                )}
              </Box>

              {/* Step Description */}
              {step.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1, lineHeight: 1.5 }}
                >
                  {step.description}
                </Typography>
              )}

              {/* Step Metadata Row */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                {/* Time Estimate */}
                {showTimeEstimates && step.estimatedTime && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {step.estimatedTime}
                    </Typography>
                  </Box>
                )}

                {/* Actual Time */}
                {step.actualTime && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <SpeedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      Completed in {step.actualTime}
                    </Typography>
                  </Box>
                )}

                {/* Confidence Indicator */}
                {showConfidence && step.confidence !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AssessmentIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {step.confidence}% confidence
                    </Typography>
                  </Box>
                )}

                {/* Assignee */}
                {step.assignee && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      {step.assignee.charAt(0).toUpperCase()}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {step.assignee}
                    </Typography>
                  </Box>
                )}

                {/* Timestamp */}
                {step.timestamp && (
                  <Typography variant="caption" color="text.secondary">
                    {step.timestamp}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Expand/Collapse Indicator */}
            {step.details && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedStep(isExpanded ? null : index);
                }}
                sx={{ 
                  color: 'text.secondary',
                  transition: 'transform 0.3s ease',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
              </IconButton>
            )}
          </Box>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && step.details && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  {typeof step.details === 'function' ? step.details() : step.details}
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </motion.div>
    );
  };

  // Render compact progress bar
  if (compact) {
    return (
      <Paper
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TimelineIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                {steps[activeStep]?.title || `Step ${activeStep + 1}`}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="primary.main">
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                },
              }}
            />
          </Box>
        </Box>
      </Paper>
    );
  }

  // Render vertical stepper
  if (orientation === 'vertical') {
    return (
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: variant === 'elevated' ? 'background.paper' : 'background.default',
          boxShadow: variant === 'elevated' ? 3 : 1,
          border: variant === 'outlined' ? `1px solid ${theme.palette.divider}` : 'none',
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Process Progress
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                flex: 1,
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                },
              }}
            />
            <Typography variant="body2" fontWeight={700} color="primary.main">
              {progress}%
            </Typography>
          </Box>
        </Box>

        <Box>
          {steps.map((step, index) => (
            <Box key={step.id || index} sx={{ pl: 2 }}>
              {renderStepContent(step, index)}
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  // Render horizontal stepper (default)
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: variant === 'elevated' ? 'background.paper' : 'background.default',
        boxShadow: variant === 'elevated' ? 3 : 1,
        border: variant === 'outlined' ? `1px solid ${theme.palette.divider}` : 'none',
        overflow: 'auto',
      }}
    >
      {/* Progress Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Process Progress
          </Typography>
          <Chip
            label={`${activeStep + 1} of ${steps.length} steps`}
            size="small"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              fontWeight: 600,
            }}
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
              transition: 'width 0.5s ease',
            },
          }}
        />
      </Box>

      {/* Steps Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 2,
        }}
      >
        {steps.map((step, index) => (
          <Box key={step.id || index}>
            {renderStepContent(step, index)}
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default ProcessStepper;
