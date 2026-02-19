import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import {
  Add,
  Refresh,
  ChevronLeft,
  ChevronRight,
  CalendarMonth,
  ViewWeek,
  ViewDay,
  Warning,
  TrendingUp,
  AttachMoney
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import activityGridService from '../../services/activitygrid/activityGridService';
import { formatLabel } from '../../utils/formatters';

const ActivityGridCalendar = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [setHeatMap] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadActivityGrid();
    loadHeatMap();
    loadConflicts();
  }, [view, currentDate]);

  const loadActivityGrid = async () => {
    setLoading(true);
    try {
      const startDate = getStartDate();
      const endDate = getEndDate();
      
      const response = await activityGridService.getActivityGrid({
        view,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      setActivities(response.activities || []);
      setSummary(response.summary || null);
    } catch (error) {
      console.error('Failed to load activity grid:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHeatMap = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const response = await activityGridService.getHeatMap(year, month);
      setHeatMap(response.heatmap || []);
    } catch (error) {
      console.error('Failed to load heat map:', error);
    }
  };

  const loadConflicts = async () => {
    try {
      const startDate = getStartDate();
      const endDate = getEndDate();
      
      const response = await activityGridService.getConflicts({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      setConflicts(response.conflicts || []);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  };

  const getStartDate = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setDate(1);
    } else if (view === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() - day);
    }
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getEndDate = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
    } else if (view === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() + (6 - day));
    }
    date.setHours(23, 59, 59, 999);
    return date;
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreateActivity = () => {
    navigate('/activities/new');
  };

  const handleSyncActivities = async () => {
    try {
      const startDate = getStartDate();
      const endDate = getEndDate();
      
      await activityGridService.syncActivities('all', startDate.toISOString(), endDate.toISOString());
      loadActivityGrid();
    } catch (error) {
      console.error('Failed to sync activities:', error);
    }
  };

  const getActivityTypeColor = (type) => {
    const colors = {
      promotion: 'primary',
      campaign: 'secondary',
      trade_spend: 'success',
      event: 'info',
      training: 'warning',
      other: 'default'
    };
    return colors[type] || 'default';
  };

  const getConflictSeverityColor = (severity) => {
    const colors = {
      low: 'info',
      medium: 'warning',
      high: 'error'
    };
    return colors[severity] || 'default';
  };

  const formatDateRange = () => {
    const start = getStartDate();
    const end = getEndDate();
    
    if (view === 'month') {
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (view === 'week') {
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    } else {
      return start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <div>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Activity Grid
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Calendar view of promotions, campaigns, trade spends, and events
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadActivityGrid}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            onClick={handleSyncActivities}
          >
            Sync Activities
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateActivity}
          >
            New Activity
          </Button>
        </Box>
      </Box>

      {summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarMonth color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Activities
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {summary.totalActivities || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {summary.byType?.promotions || 0} promotions, {summary.byType?.campaigns || 0} campaigns
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachMoney color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Planned Spend
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  R{(summary.spend?.total?.planned / 1000 || 0).toFixed(1)}K
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Actual: R{(summary.spend?.total?.actual / 1000 || 0).toFixed(1)}K
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUp color="info" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Coverage
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {summary.coverage?.customers || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Customers, {summary.coverage?.products || 0} products
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Warning color="warning" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Conflicts
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {conflicts.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Require attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={view === 'month' ? 'contained' : 'outlined'}
                size="small"
                startIcon={<CalendarMonth />}
                onClick={() => setView('month')}
              >
                Month
              </Button>
              <Button
                variant={view === 'week' ? 'contained' : 'outlined'}
                size="small"
                startIcon={<ViewWeek />}
                onClick={() => setView('week')}
              >
                Week
              </Button>
              <Button
                variant={view === 'day' ? 'contained' : 'outlined'}
                size="small"
                startIcon={<ViewDay />}
                onClick={() => setView('day')}
              >
                Day
              </Button>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={handlePrevious}>
                <ChevronLeft />
              </IconButton>
              <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
                {formatDateRange()}
              </Typography>
              <IconButton onClick={handleNext}>
                <ChevronRight />
              </IconButton>
              <Button variant="outlined" size="small" onClick={handleToday}>
                Today
              </Button>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : activities.length === 0 ? (
            <Alert severity="info">
              No activities found for this period. Create a new activity or sync from promotions and campaigns.
            </Alert>
          ) : (
            <Box>
              <Grid container spacing={2}>
                {activities.map((activity, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        borderLeft: 4, 
                        borderColor: `${getActivityTypeColor(activity.activityType)}.main`,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip 
                          label={formatLabel(activity.activityType)} 
                          color={getActivityTypeColor(activity.activityType)}
                          size="small"
                        />
                        <Chip 
                          label={formatLabel(activity.status)} 
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {activity.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {new Date(activity.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Typography>
                      {activity.spend?.total?.planned > 0 && (
                        <Typography variant="body2" color="success.main">
                          Planned: R{activity.spend.total.planned.toLocaleString()}
                        </Typography>
                      )}
                      {activity.indicators?.conflicts && activity.indicators.conflicts.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {activity.indicators.conflicts.map((conflict, idx) => (
                            <Chip 
                              key={idx}
                              label={formatLabel(conflict.type)}
                              color={getConflictSeverityColor(conflict.severity)}
                              size="small"
                              icon={<Warning />}
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {conflicts.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Warning color="warning" sx={{ mr: 1 }} />
              Conflicts Detected
            </Typography>
            <Grid container spacing={2}>
              {conflicts.map((conflict, index) => (
                <Grid item xs={12} key={index}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      borderLeft: 4, 
                      borderColor: `${getConflictSeverityColor(conflict.severity)}.main`
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip 
                        label={formatLabel(conflict.conflictType)} 
                        color={getConflictSeverityColor(conflict.severity)}
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(conflict.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {conflict.description}
                    </Typography>
                    {conflict.resolution && (
                      <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                        Resolution: {conflict.resolution}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ActivityGridCalendar;
