import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  IconButton, 
  Tooltip, 
  Tabs, 
  Tab,
  CircularProgress,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon, 
  FilterList as FilterIcon,
  ViewDay as DayViewIcon,
  ViewWeek as WeekViewIcon,
  ViewModule as MonthViewIcon,
  List as ListViewIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, addMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { enZA } from 'date-fns/locale';

import activityGridService from '../../services/api/activityGridService';
import ActivityGridCalendar from './ActivityGridCalendar';
import ActivityGridList from './ActivityGridList';
import ActivityGridHeatMap from './ActivityGridHeatMap';
import ActivityForm from './ActivityForm';
import { useSnackbar } from 'notistack';

const ActivityGrid = () => {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [viewType, setViewType] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [openForm, setOpenForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [openConflicts, setOpenConflicts] = useState(false);
  
  const { enqueueSnackbar } = useSnackbar();

  // Fetch activity grid data
  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await activityGridService.getActivityGrid({
        view: viewType,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      });
      
      setActivities(response.data.data.activities);
      
      // Check for conflicts
      const conflictsResponse = await activityGridService.getConflicts({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      });
      
      setConflicts(conflictsResponse.data.data);
    } catch (error) {
      console.error('Error fetching activity grid:', error);
      enqueueSnackbar('Failed to load activity grid data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchActivities();
  }, [viewType, startDate, endDate]);

  // Handle date change
  const handleDateChange = (date) => {
    setCurrentDate(date);
    setStartDate(startOfMonth(date));
    setEndDate(endOfMonth(date));
  };

  // Handle view type change
  const handleViewTypeChange = (event, newValue) => {
    setViewType(newValue);
  };

  // Handle previous month
  const handlePrevMonth = () => {
    const newDate = addMonths(currentDate, -1);
    handleDateChange(newDate);
  };

  // Handle next month
  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    handleDateChange(newDate);
  };

  // Handle activity click
  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
    setOpenForm(true);
  };

  // Handle add activity
  const handleAddActivity = () => {
    setSelectedActivity(null);
    setOpenForm(true);
  };

  // Handle form close
  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedActivity(null);
  };

  // Handle form submit
  const handleFormSubmit = async (activityData) => {
    try {
      if (selectedActivity) {
        await activityGridService.updateActivity(selectedActivity.id, activityData);
        enqueueSnackbar('Activity updated successfully', { variant: 'success' });
      } else {
        await activityGridService.createActivity(activityData);
        enqueueSnackbar('Activity created successfully', { variant: 'success' });
      }
      
      fetchActivities();
      handleFormClose();
    } catch (error) {
      console.error('Error saving activity:', error);
      enqueueSnackbar('Failed to save activity', { variant: 'error' });
    }
  };

  // Handle filter menu
  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle filter menu close
  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  // Handle sync activities
  const handleSyncActivities = async (source) => {
    try {
      setLoading(true);
      await activityGridService.syncActivities({
        source,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      });
      
      enqueueSnackbar(`Activities synced from ${source}`, { variant: 'success' });
      fetchActivities();
    } catch (error) {
      console.error('Error syncing activities:', error);
      enqueueSnackbar('Failed to sync activities', { variant: 'error' });
    } finally {
      setLoading(false);
      handleFilterClose();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h5" component="h1">
              Activity Grid
              {conflicts.length > 0 && (
                <Tooltip title={`${conflicts.length} conflicts detected`}>
                  <IconButton color="warning" onClick={() => setOpenConflicts(true)}>
                    <WarningIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enZA}>
              <DatePicker
                views={['month', 'year']}
                label="Month and Year"
                value={currentDate}
                onChange={handleDateChange}
                renderInput={(params) => <Box sx={{ mr: 2 }} {...params} />}
              />
            </LocalizationProvider>
            
            <Button 
              variant="outlined" 
              onClick={handlePrevMonth}
              sx={{ minWidth: 'auto', mr: 1 }}
            >
              &lt;
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={handleNextMonth}
              sx={{ minWidth: 'auto', mr: 2 }}
            >
              &gt;
            </Button>
            
            <IconButton onClick={fetchActivities} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
            
            <IconButton onClick={handleFilterClick} sx={{ mr: 1 }}>
              <FilterIcon />
            </IconButton>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddActivity}
            >
              Add Activity
            </Button>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleFilterClose}
            >
              <MenuItem onClick={() => handleSyncActivities('promotions')}>
                Sync Promotions
              </MenuItem>
              <MenuItem onClick={() => handleSyncActivities('tradespends')}>
                Sync Trade Spends
              </MenuItem>
              <MenuItem onClick={() => handleSyncActivities('campaigns')}>
                Sync Campaigns
              </MenuItem>
              <MenuItem onClick={() => handleSyncActivities('all')}>
                Sync All
              </MenuItem>
            </Menu>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <Tabs
          value={viewType}
          onChange={handleViewTypeChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 2 }}
        >
          <Tab value="month" icon={<MonthViewIcon />} label="Month" />
          <Tab value="week" icon={<WeekViewIcon />} label="Week" />
          <Tab value="day" icon={<DayViewIcon />} label="Day" />
          <Tab value="list" icon={<ListViewIcon />} label="List" />
          <Tab value="heatmap" icon={<FilterIcon />} label="Heat Map" />
        </Tabs>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {viewType === 'list' && (
              <ActivityGridList 
                activities={activities} 
                onActivityClick={handleActivityClick} 
              />
            )}
            
            {(viewType === 'month' || viewType === 'week' || viewType === 'day') && (
              <ActivityGridCalendar 
                activities={activities}
                viewType={viewType}
                startDate={startDate}
                endDate={endDate}
                onActivityClick={handleActivityClick}
                conflicts={conflicts}
              />
            )}
            
            {viewType === 'heatmap' && (
              <ActivityGridHeatMap 
                year={currentDate.getFullYear()}
                month={currentDate.getMonth() + 1}
              />
            )}
          </>
        )}
      </Paper>
      
      {/* Activity Form Dialog */}
      <Dialog open={openForm} onClose={handleFormClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedActivity ? 'Edit Activity' : 'Add Activity'}
        </DialogTitle>
        <DialogContent>
          <ActivityForm 
            activity={selectedActivity} 
            onSubmit={handleFormSubmit}
            startDate={startDate}
            endDate={endDate}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFormClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
      {/* Conflicts Dialog */}
      <Dialog open={openConflicts} onClose={() => setOpenConflicts(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Activity Conflicts
        </DialogTitle>
        <DialogContent>
          {conflicts.map((conflict, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1">
                {conflict.activity.type}: {conflict.activity.customer}
              </Typography>
              <Typography variant="body2">
                Date: {format(parseISO(conflict.activity.date), 'dd MMM yyyy')}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Conflicts with:</Typography>
                {conflict.conflicts.map((c, i) => (
                  <Chip 
                    key={i}
                    label={`${c.conflictingActivity.type} - ${c.severity}`}
                    color={c.severity === 'high' ? 'error' : c.severity === 'medium' ? 'warning' : 'default'}
                    sx={{ mr: 1, mt: 1 }}
                  />
                ))}
              </Box>
            </Paper>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConflicts(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActivityGrid;