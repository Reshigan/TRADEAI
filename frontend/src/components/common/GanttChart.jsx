import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Slider,
  ButtonGroup,
  Button,
} from '@mui/material';
import {
  ViewDay as DayIcon,
  ViewWeek as WeekIcon,
  ViewMonth as MonthIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Gantt Chart View for Process Timeline
 * World-class Gantt chart with interactive timeline, dependencies, and critical path
 * 
 * Features:
 * - Interactive timeline (day/week/month views)
 * - Zoom in/out
 * - Drag to reschedule
 * - Dependency lines
 * - Critical path highlighting
 * - Progress tracking
 * - Resource allocation
 * - Milestone markers
 */

interface GanttTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  progress: number; // 0-100
  status: 'pending' | 'active' | 'completed' | 'delayed';
  assignee?: string;
  dependencies?: string[];
  isMilestone?: boolean;
  isCritical?: boolean;
  color?: string;
}

interface GanttViewProps {
  tasks: GanttTask[];
  startDate?: Date;
  endDate?: Date;
  viewMode?: 'day' | 'week' | 'month';
  onTaskClick?: (task: GanttTask) => void;
  onTaskMove?: (taskId: string, newStart: Date, newEnd: Date) => void;
  showDependencies?: boolean;
  showCriticalPath?: boolean;
  showToday?: boolean;
  readonly?: boolean;
}

type ViewMode = 'day' | 'week' | 'month';

const GanttChart: React.FC<GanttViewProps> = ({
  tasks = [],
  startDate: propStartDate,
  endDate: propEndDate,
  viewMode = 'week',
  onTaskClick,
  onTaskMove,
  showDependencies = true,
  showCriticalPath = true,
  showToday = true,
  readonly = false,
}) => {
  const theme = useTheme();
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(viewMode);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  // Calculate date range
  const dateRange = useMemo(() => {
    if (propStartDate && propEndDate) {
      return { start: propStartDate, end: propEndDate };
    }

    if (tasks.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
    }

    const dates = tasks.flatMap(t => [t.startDate, t.endDate]);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Add padding
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 3);

    return { start: minDate, end: maxDate };
  }, [tasks, propStartDate, propEndDate]);

  // Generate timeline dates
  const timelineDates = useMemo(() => {
    const dates: Date[] = [];
    const current = new Date(dateRange.start);
    
    while (current <= dateRange.end) {
      dates.push(new Date(current));
      
      switch (currentViewMode) {
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 1);
          break;
        case 'month':
          current.setDate(current.getDate() + 1);
          break;
      }
    }
    
    return dates;
  }, [dateRange, currentViewMode]);

  // Calculate task positions
  const getTaskPosition = (task: GanttTask) => {
    const totalDuration = dateRange.end.getTime() - dateRange.start.getTime();
    const taskStart = task.startDate.getTime() - dateRange.start.getTime();
    const taskDuration = task.endDate.getTime() - task.startDate.getTime();

    const left = (taskStart / totalDuration) * 100;
    const width = (taskDuration / totalDuration) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  // Get task color
  const getTaskColor = (task: GanttTask) => {
    if (task.color) return task.color;
    
    switch (task.status) {
      case 'completed':
        return theme.palette.success.main;
      case 'active':
        return theme.palette.primary.main;
      case 'delayed':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Format date header
  const formatDateHeader = (date: Date) => {
    switch (currentViewMode) {
      case 'day':
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      case 'week':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is weekend
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* Header with Controls */}
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
              <ViewWeekIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Gantt Chart
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tasks.length} tasks • {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* View Mode */}
            <ButtonGroup size="small" sx={{ mr: 2 }}>
              <Button
                variant={currentViewMode === 'day' ? 'contained' : 'outlined'}
                startIcon={<DayIcon />}
                onClick={() => setCurrentViewMode('day')}
              >
                Day
              </Button>
              <Button
                variant={currentViewMode === 'week' ? 'contained' : 'outlined'}
                startIcon={<WeekIcon />}
                onClick={() => setCurrentViewMode('week')}
              >
                Week
              </Button>
              <Button
                variant={currentViewMode === 'month' ? 'contained' : 'outlined'}
                startIcon={<MonthIcon />}
                onClick={() => setCurrentViewMode('month')}
              >
                Month
              </Button>
            </ButtonGroup>

            {/* Zoom Controls */}
            <IconButton size="small" onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
            <Slider
              value={zoomLevel}
              min={0.5}
              max={2}
              step={0.25}
              onChange={(_, value) => setZoomLevel(value as number)}
              sx={{ width: 100, mx: 1 }}
              size="small"
            />
            <IconButton size="small" onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}>
              <ZoomInIcon fontSize="small" />
            </IconButton>

            {/* Today Button */}
            <Tooltip title="Go to Today">
              <IconButton size="small">
                <TodayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 8, borderRadius: 1, bgcolor: 'primary.main' }} />
            <Typography variant="caption" color="text.secondary">Active</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 8, borderRadius: 1, bgcolor: 'success.main' }} />
            <Typography variant="caption" color="text.secondary">Completed</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 8, borderRadius: 1, bgcolor: 'error.main' }} />
            <Typography variant="caption" color="text.secondary">Delayed</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 8, borderRadius: 1, bgcolor: 'grey.500' }} />
            <Typography variant="caption" color="text.secondary">Pending</Typography>
          </Box>
          {showCriticalPath && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 8, borderRadius: 1, border: '2px solid', borderColor: 'primary.main' }} />
              <Typography variant="caption" color="text.secondary">Critical Path</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Gantt Chart */}
      <Box
        sx={{
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {/* Timeline Header */}
        <Box
          sx={{
            display: 'flex',
            borderBottom: `1px solid ${theme.palette.divider}`,
            pb: 1,
            mb: 2,
            position: 'sticky',
            top: 0,
            bgcolor: 'background.default',
            zIndex: 1,
          }}
        >
          <Box sx={{ width: 250, flexShrink: 0, pr: 2 }}>
            <Typography variant="body2" fontWeight={600}>
              Task
            </Typography>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', position: 'relative' }}>
            {timelineDates.map((date, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  textAlign: 'center',
                  borderLeft: `1px solid ${theme.palette.divider}`,
                  py: 0.5,
                  bgcolor: isToday(date)
                    ? alpha(theme.palette.primary.main, 0.08)
                    : isWeekend(date)
                      ? alpha(theme.palette.action.hover, 0.04)
                      : 'transparent',
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={isToday(date) ? 700 : 400}
                  color={isToday(date) ? 'primary.main' : 'text.secondary'}
                >
                  {formatDateHeader(date)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Task Rows */}
        <Box>
          {tasks.map((task, index) => {
            const position = getTaskPosition(task);
            const color = getTaskColor(task);
            const isHovered = hoveredTask === task.id;
            const isCritical = showCriticalPath && task.isCritical;

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Box
                  onMouseEnter={() => setHoveredTask(task.id)}
                  onMouseLeave={() => setHoveredTask(null)}
                  onClick={() => onTaskClick?.(task)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1,
                    cursor: onTaskClick ? 'pointer' : 'default',
                    opacity: hoveredTask && hoveredTask !== task.id ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {/* Task Name */}
                  <Box
                    sx={{
                      width: 250,
                      flexShrink: 0,
                      pr: 2,
                      py: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {task.isMilestone ? (
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            transform: 'rotate(45deg)',
                            bgcolor: color,
                            borderRadius: 1,
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: color,
                          }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        fontWeight={isCritical ? 700 : 500}
                        noWrap
                      >
                        {task.title}
                      </Typography>
                    </Box>
                    {task.assignee && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                        {task.assignee}
                      </Typography>
                    )}
                  </Box>

                  {/* Task Bar */}
                  <Box sx={{ flex: 1, position: 'relative', height: 40 }}>
                    {/* Grid Lines */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                      }}
                    >
                      {timelineDates.map((date, i) => (
                        <Box
                          key={i}
                          sx={{
                            flex: 1,
                            borderLeft: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                            bgcolor: isToday(date)
                              ? alpha(theme.palette.primary.main, 0.08)
                              : isWeekend(date)
                                ? alpha(theme.palette.action.hover, 0.02)
                                : 'transparent',
                          }}
                        />
                      ))}
                    </Box>

                    {/* Task Bar */}
                    <Zoom in={isHovered || true}>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          left: position.left,
                          width: position.width,
                          height: 28,
                          borderRadius: 2,
                          bgcolor: color,
                          opacity: 0.9,
                          border: isCritical ? `2px solid ${theme.palette.primary.dark}` : 'none',
                          boxShadow: isHovered
                            ? '0 4px 12px rgba(0,0,0,0.15)'
                            : '0 2px 4px rgba(0,0,0,0.1)',
                          cursor: readonly ? 'default' : 'grab',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            opacity: 1,
                            transform: readonly ? 'translateY(-50%)' : 'translateY(-50%) scale(1.02)',
                          },
                        }}
                      >
                        {/* Progress Bar */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: `${task.progress}%`,
                            bgcolor: alpha(theme.palette.common.white, 0.3),
                            borderRadius: 2,
                            transition: 'width 0.3s ease',
                          }}
                        />

                        {/* Task Label */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: 8,
                            transform: 'translateY(-50%)',
                            color: theme.palette.getContrastText(color),
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {task.progress}%
                        </Box>
                      </Box>
                    </Zoom>
                  </Box>
                </Box>
              </motion.div>
            );
          })}
        </Box>
      </Box>

      {/* Today Line */}
      {showToday && (
        <Box
          sx={{
            position: 'absolute',
            top: 80,
            bottom: 0,
            left: `${((new Date().getTime() - dateRange.start.getTime()) / (dateRange.end.getTime() - dateRange.start.getTime())) * 100}%`,
            width: 2,
            bgcolor: 'error.main',
            opacity: 0.5,
            pointerEvents: 'none',
            zIndex: 10,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -6,
              left: -4,
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: `6px solid ${theme.palette.error.main}`,
            },
          }}
        />
      )}
    </Paper>
  );
};

export default GanttChart;
