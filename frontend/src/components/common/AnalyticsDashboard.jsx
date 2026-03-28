import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Advanced Analytics Dashboard for Process Metrics
 * World-class analytics with predictive insights, bottleneck analysis, and performance tracking
 */

interface ProcessMetrics {
  totalProcesses: number;
  activeProcesses: number;
  completedToday: number;
  averageCompletionTime: number; // minutes
  onTimeCompletionRate: number; // percentage
  bottleneckCount: number;
  teamUtilization: number; // percentage
  qualityScore: number; // 0-100
}

interface StepMetrics {
  stepId: string;
  stepName: string;
  averageDuration: number; // minutes
  medianDuration: number;
  completionRate: number; // percentage
  errorRate: number; // percentage
  reworkRate: number; // percentage
  averageWaitTime: number; // minutes
}

interface TeamMetrics {
  assignee: string;
  tasksCompleted: number;
  averageCompletionTime: number;
  onTimeRate: number;
  qualityScore: number;
  currentLoad: number;
}

interface TrendData {
  period: string;
  completionRate: number;
  averageTime: number;
  errorRate: number;
}

interface AnalyticsDashboardProps {
  processMetrics: ProcessMetrics;
  stepMetrics?: StepMetrics[];
  teamMetrics?: TeamMetrics[];
  trendData?: TrendData[];
  topBottlenecks?: Array<{ stepId: string; stepName: string; impact: number }>;
  predictions?: {
    completionRateNextWeek: number;
    estimatedBottlenecks: string[];
    recommendedActions: string[];
  };
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange?: (range: string) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  processMetrics,
  stepMetrics = [],
  teamMetrics = [],
  trendData = [],
  topBottlenecks = [],
  predictions,
  timeRange = '30d',
  onTimeRangeChange,
}) => {
  const theme = useTheme();

  // Calculate trend direction
  const getTrendIcon = (current: number, previous: number, higherIsBetter = true) => {
    const change = current - previous;
    const isPositive = higherIsBetter ? change > 0 : change < 0;
    
    if (Math.abs(change) < 1) return null;
    
    return isPositive ? (
      <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
    ) : (
      <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
    );
  };

  // Get color for metric value
  const getValueColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'success.main';
    if (value >= thresholds.warning) return 'warning.main';
    return 'error.main';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
              }}
            >
              <AssessmentIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Process Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Performance insights and predictive analytics
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {['7d', '30d', '90d', '1y'].map((range) => (
              <Chip
                key={range}
                label={range}
                size="small"
                onClick={() => onTimeRangeChange?.(range)}
                sx={{
                  bgcolor: timeRange === range ? 'primary.main' : 'transparent',
                  color: timeRange === range ? 'white' : 'text.secondary',
                  border: `1px solid ${timeRange === range ? 'primary.main' : theme.palette.divider}`,
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* KPI Cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Completion Rate */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={itemVariants}>
              <Card
                sx={{
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.success.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                      <Typography variant="body2" color="text.secondary">
                        On-Time Rate
                      </Typography>
                    </Box>
                    {getTrendIcon(processMetrics.onTimeCompletionRate, 85)}
                  </Box>
                  <Typography variant="h3" fontWeight={700} color="success.main">
                    {processMetrics.onTimeCompletionRate.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={processMetrics.onTimeCompletionRate}
                    sx={{
                      mt: 2,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.success.main, 0.2),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: 'success.main',
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Average Completion Time */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={itemVariants}>
              <Card
                sx={{
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SpeedIcon sx={{ color: 'info.main', fontSize: 20 }} />
                      <Typography variant="body2" color="text.secondary">
                        Avg. Time
                      </Typography>
                    </Box>
                    {getTrendIcon(processMetrics.averageCompletionTime, 120, false)}
                  </Box>
                  <Typography variant="h3" fontWeight={700} color="info.main">
                    {(processMetrics.averageCompletionTime / 60).toFixed(1)}h
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {processMetrics.averageCompletionTime.toFixed(0)} minutes
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Team Utilization */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={itemVariants}>
              <Card
                sx={{
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.warning.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                      <Typography variant="body2" color="text.secondary">
                        Team Utilization
                      </Typography>
                    </Box>
                    {getTrendIcon(processMetrics.teamUtilization, 75)}
                  </Box>
                  <Typography variant="h3" fontWeight={700} color="warning.main">
                    {processMetrics.teamUtilization.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={processMetrics.teamUtilization}
                    sx={{
                      mt: 2,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.warning.main, 0.2),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: 'warning.main',
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Quality Score */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={itemVariants}>
              <Card
                sx={{
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssessmentIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="body2" color="text.secondary">
                        Quality Score
                      </Typography>
                    </Box>
                    {getTrendIcon(processMetrics.qualityScore, 80)}
                  </Box>
                  <Typography variant="h3" fontWeight={700} color="primary.main">
                    {processMetrics.qualityScore.toFixed(0)}/100
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {processMetrics.qualityScore >= 90 ? 'Excellent' : processMetrics.qualityScore >= 70 ? 'Good' : 'Needs Improvement'}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>

      {/* Bottlenecks & Predictions */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Top Bottlenecks */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} />
              <Typography variant="h6" fontWeight={700}>
                Top Bottlenecks
              </Typography>
            </Box>

            {topBottlenecks.length > 0 ? (
              <Box>
                {topBottlenecks.map((bottleneck, index) => (
                  <Box
                    key={bottleneck.stepId}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      mb: index < topBottlenecks.length - 1 ? 1 : 0,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.warning.main, 0.04),
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: 'warning.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        mr: 2,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {bottleneck.stepName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Impact: {bottleneck.impact.toFixed(1)} hours delay
                      </Typography>
                    </Box>
                    <Chip
                      label="High Impact"
                      size="small"
                      color="warning"
                      sx={{ height: 24 }}
                    />
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" py={4}>
                No bottlenecks detected 🎉
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* AI Predictions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AssessmentIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="h6" fontWeight={700}>
                Predictive Insights
              </Typography>
            </Box>

            {predictions ? (
              <Box>
                <Box
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Predicted Completion Rate (Next Week)
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {predictions.completionRateNextWeek.toFixed(1)}%
                  </Typography>
                </Box>

                {predictions.estimatedBottlenecks.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Potential Bottlenecks
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {predictions.estimatedBottlenecks.map((bottleneck, idx) => (
                        <Chip
                          key={idx}
                          label={bottleneck}
                          size="small"
                          color="warning"
                          sx={{ height: 24 }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {predictions.recommendedActions.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Recommended Actions
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {predictions.recommendedActions.map((action, idx) => (
                        <Typography
                          key={idx}
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          • {action}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" py={4}>
                No predictions available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Step Performance Table */}
      {stepMetrics.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Step Performance Analysis
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Step</TableCell>
                  <TableCell align="right">Avg Duration</TableCell>
                  <TableCell align="right">Completion Rate</TableCell>
                  <TableCell align="right">Error Rate</TableCell>
                  <TableCell align="right">Wait Time</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stepMetrics.map((step) => {
                  const statusColor = getValueColor(step.completionRate, { good: 90, warning: 75 });
                  
                  return (
                    <TableRow key={step.stepId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {step.stepName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {(step.averageDuration / 60).toFixed(1)}h
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} color={statusColor}>
                          {step.completionRate.toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color={step.errorRate > 5 ? 'error.main' : 'text.secondary'}>
                          {step.errorRate.toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {(step.averageWaitTime / 60).toFixed(1)}h
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={step.completionRate >= 90 ? 'Excellent' : step.completionRate >= 75 ? 'Good' : 'Needs Work'}
                          size="small"
                          color={step.completionRate >= 90 ? 'success' : step.completionRate >= 75 ? 'warning' : 'error'}
                          sx={{ height: 24 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Team Performance */}
      {teamMetrics.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Team Performance
          </Typography>

          <Grid container spacing={2}>
            {teamMetrics.map((member) => (
              <Grid key={member.assignee} item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          mr: 2,
                        }}
                      >
                        {member.assignee.charAt(0).toUpperCase()}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {member.assignee}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.tasksCompleted} tasks completed
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        On-Time Rate
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {member.onTimeRate.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={member.onTimeRate}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        mb: 1,
                        bgcolor: alpha(theme.palette.success.main, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'success.main',
                        },
                      }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        Quality Score
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {member.qualityScore}/100
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default AnalyticsDashboard;
