import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Divider,
  Zoom,
} from '@mui/material';
import {
  Link as LinkIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Block as BlockIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Step Dependencies Visualization
 * Shows relationships and dependencies between process steps
 * 
 * Features:
 * - Visual dependency graph
 * - Critical path highlighting
 * - Dependency status indicators
 * - Circular dependency detection
 * - Impact analysis
 */
interface Dependency {
  /** Source step ID */
  from: string;
  /** Target step ID */
  to: string;
  /** Dependency type */
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  /** Whether dependency is mandatory */
  mandatory: boolean;
  /** Lag time in minutes */
  lag?: number;
  /** Condition for conditional dependencies */
  condition?: string;
}

interface StepNode {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'blocked';
  duration: number; // minutes
  earliestStart?: number;
  earliestFinish?: number;
  latestStart?: number;
  latestFinish?: number;
  slack?: number;
}

interface DependencyGraphProps {
  steps: StepNode[];
  dependencies: Dependency[];
  activeStepId?: string;
  showCriticalPath?: boolean;
  onStepClick?: (stepId: string) => void;
}

const DependencyGraph: React.FC<DependencyGraphProps> = ({
  steps,
  dependencies,
  activeStepId,
  showCriticalPath = true,
  onStepClick,
}) => {
  const theme = useTheme();
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  // Calculate critical path
  const criticalPath = useMemo(() => {
    if (!showCriticalPath) return new Set<string>();

    const criticalSteps = new Set<string>();
    
    // Find steps with zero slack (critical path)
    steps.forEach(step => {
      if (step.slack === 0 || step.slack === undefined) {
        criticalSteps.add(step.id);
      }
    });

    return criticalSteps;
  }, [steps, showCriticalPath]);

  // Detect circular dependencies
  const circularDependencies = useMemo(() => {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const circular: string[] = [];

    const detectCycle = (stepId: string, path: string[]): boolean => {
      visited.add(stepId);
      recStack.add(stepId);

      const outgoing = dependencies.filter(d => d.from === stepId);
      
      for (const dep of outgoing) {
        const nextStep = dep.to;
        
        if (!visited.has(nextStep)) {
          if (detectCycle(nextStep, [...path, stepId])) {
            return true;
          }
        } else if (recStack.has(nextStep)) {
          circular.push([...path, stepId, nextStep].join(' → '));
          return true;
        }
      }

      recStack.delete(stepId);
      return false;
    };

    steps.forEach(step => {
      if (!visited.has(step.id)) {
        detectCycle(step.id, []);
      }
    });

    return circular;
  }, [steps, dependencies]);

  // Calculate impact of step delay
  const calculateImpact = (stepId: string): string[] => {
    const impacted: string[] = [];
    
    const findDependents = (currentStepId: string, visited: Set<string>) => {
      if (visited.has(currentStepId)) return;
      visited.add(currentStepId);
      
      const dependents = dependencies.filter(d => d.from === currentStepId);
      
      dependents.forEach(dep => {
        impacted.push(dep.to);
        findDependents(dep.to, visited);
      });
    };

    findDependents(stepId, new Set<string>());
    return impacted;
  };

  // Get step dependencies
  const getStepDependencies = (stepId: string) => {
    const incoming = dependencies.filter(d => d.to === stepId);
    const outgoing = dependencies.filter(d => d.from === stepId);
    return { incoming, outgoing };
  };

  // Status colors
  const getStatusColors = (status: StepNode['status']) => {
    switch (status) {
      case 'completed':
        return { bg: alpha(theme.palette.success.main, 0.1), border: 'success.main', text: 'success.main' };
      case 'active':
        return { bg: alpha(theme.palette.primary.main, 0.1), border: 'primary.main', text: 'primary.main' };
      case 'blocked':
        return { bg: alpha(theme.palette.error.main, 0.1), border: 'error.main', text: 'error.main' };
      default:
        return { bg: 'background.paper', border: 'divider', text: 'text.primary' };
    }
  };

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: 'background.default',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: 'info.main',
              }}
            >
              <LinkIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Step Dependencies
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dependencies.length} dependencies • {criticalPath.size} critical steps
              </Typography>
            </Box>
          </Box>

          {circularDependencies.length > 0 && (
            <Tooltip title="Circular dependencies detected!">
              <Chip
                icon={<WarningIcon />}
                label={`${circularDependencies.length} circular`}
                color="error"
                size="small"
              />
            </Tooltip>
          )}
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: 'primary.main' }} />
            <Typography variant="caption" color="text.secondary">Critical Path</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: 'error.main' }} />
            <Typography variant="caption" color="text.secondary">Blocked</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: 'success.main' }} />
            <Typography variant="caption" color="text.secondary">Completed</Typography>
          </Box>
        </Box>
      </Box>

      {/* Dependency Graph */}
      <Box
        sx={{
          display: 'flex',
          gap: 4,
          py: 2,
          px: 4,
          minWidth: 'max-content',
        }}
      >
        {steps.map((step, index) => {
          const colors = getStatusColors(step.status);
          const isCritical = criticalPath.has(step.id);
          const isHovered = hoveredStep === step.id;
          const impacted = calculateImpact(step.id);
          const { incoming, outgoing } = getStepDependencies(step.id);
          const isBlocked = step.status === 'blocked';

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Zoom in={isHovered || isCritical}>
                <Box
                  onMouseEnter={() => setHoveredStep(step.id)}
                  onMouseLeave={() => setHoveredStep(null)}
                  onClick={() => onStepClick?.(step.id)}
                  sx={{
                    position: 'relative',
                    p: 2.5,
                    width: 220,
                    borderRadius: 3,
                    bgcolor: colors.bg,
                    border: `2px solid ${theme.palette[colors.border as keyof typeof theme.palette]}`,
                    cursor: onStepClick ? 'pointer' : 'default',
                    boxShadow: isCritical
                      ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`
                      : isHovered
                        ? '0 8px 24px rgba(0,0,0,0.12)'
                        : '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: hoveredStep && !impacted.includes(step.id) && 
                      incoming.some(d => d.from === hoveredStep) ? 1 : 1,
                  }}
                >
                  {/* Step Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      color={colors.text}
                      sx={{ flex: 1 }}
                    >
                      {step.title}
                    </Typography>
                    
                    {isCritical && (
                      <Chip
                        label="Critical"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          bgcolor: 'primary.main',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>

                  {/* Step Metrics */}
                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {step.duration} min
                      </Typography>
                    </Box>
                    
                    {step.slack !== undefined && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Slack
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color={step.slack === 0 ? 'error.main' : 'success.main'}
                        >
                          {step.slack} min
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Dependency Indicators */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {incoming.length > 0 && (
                      <Chip
                        icon={<TimelineIcon />}
                        label={`${incoming.length} before`}
                        size="small"
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                    )}
                    {outgoing.length > 0 && (
                      <Chip
                        icon={<TimelineIcon />}
                        label={`${outgoing.length} after`}
                        size="small"
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                    )}
                    {impacted.length > 0 && (
                      <Chip
                        icon={<WarningIcon />}
                        label={`${impacted.length} impacted`}
                        size="small"
                        color="warning"
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>

                  {/* Blocked Indicator */}
                  {isBlocked && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'error.main',
                      }}
                    >
                      <BlockIcon sx={{ fontSize: 20 }} />
                    </Box>
                  )}

                  {/* Dependency Lines (simplified visualization) */}
                  {outgoing.length > 0 && index < steps.length - 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        right: -32,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 32,
                        height: 2,
                        bgcolor: alpha(theme.palette.divider, 0.5),
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          right: 0,
                          top: -4,
                          width: 0,
                          height: 0,
                          borderTop: '5px solid transparent',
                          borderBottom: '5px solid transparent',
                          borderLeft: `8px solid ${alpha(theme.palette.divider, 0.5)}`,
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Zoom>
            </motion.div>
          );
        })}
      </Box>

      {/* Circular Dependencies Warning */}
      {circularDependencies.length > 0 && (
        <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.error.main, 0.08), borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <WarningIcon sx={{ color: 'error.main', fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight={700} color="error.main">
              Circular Dependencies Detected
            </Typography>
          </Box>
          <Box sx={{ pl: 3 }}>
            {circularDependencies.map((cycle, idx) => (
              <Typography key={idx} variant="caption" color="error.main" sx={{ display: 'block' }}>
                {cycle}
              </Typography>
            ))}
          </Box>
        </Box>
      )}

      {/* Impact Analysis */}
      {hoveredStep && (
        <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.info.main, 0.08), borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} color="info.main" gutterBottom>
            Impact Analysis: {steps.find(s => s.id === hoveredStep)?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {calculateImpact(hoveredStep).length} steps would be affected by delays
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DependencyGraph;
