import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  TextField,
  MenuItem,
  Chip,
  Paper,
  Tooltip,
  Alert,
  CircularProgress,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Add,
  ChevronLeft,
  ChevronRight,
  CalendarMonth,
  ViewWeek,
  ViewDay,
  Warning,
  CheckCircle,
  Edit,
  Delete,
  DragIndicator,
  AutoFixHigh,
  FilterList
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import activityGridService from '../../services/activitygrid/activityGridService';
import simulationService from '../../services/simulation/simulationService';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const PromotionsTimeline = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [promotions, setPromotions] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('customer');
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draggedPromotion, setDraggedPromotion] = useState(null);

  useEffect(() => {
    loadPromotions();
    loadConflicts();
  }, [view, currentDate, groupBy]);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const startDate = getStartDate();
      const endDate = getEndDate();
      
      const response = await activityGridService.getActivityGrid({
        view,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        activityType: 'promotion'
      });

      setPromotions(response.activities || []);
    } catch (error) {
      console.error('Failed to load promotions:', error);
    } finally {
      setLoading(false);
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
    } else if (view === 'quarter') {
      const quarter = Math.floor(date.getMonth() / 3);
      date.setMonth((quarter + 1) * 3);
      date.setDate(0);
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
    } else if (view === 'quarter') {
      newDate.setMonth(newDate.getMonth() - 3);
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
    } else if (view === 'quarter') {
      newDate.setMonth(newDate.getMonth() + 3);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handlePromotionClick = (promotion) => {
    setSelectedPromotion(promotion);
    setDrawerOpen(true);
  };

  const handleDragStart = (e, promotion) => {
    setDraggedPromotion(promotion);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newDate) => {
    e.preventDefault();
    if (!draggedPromotion) return;

    try {
      const oldDate = new Date(draggedPromotion.startDate);
      const dateDiff = newDate.getTime() - oldDate.getTime();
      const newEndDate = new Date(new Date(draggedPromotion.endDate).getTime() + dateDiff);

      await activityGridService.updateActivity(draggedPromotion.id, {
        startDate: newDate.toISOString(),
        endDate: newEndDate.toISOString()
      });

      await loadPromotions();
      await loadConflicts();

      setDraggedPromotion(null);
    } catch (error) {
      console.error('Failed to reschedule promotion:', error);
    }
  };

  const handleAutoFix = async (conflict) => {
    try {
      const response = await simulationService.getConflictPreview({
        promotionIds: conflict.activities.map(a => a.id)
      });

      if (response.suggestions && response.suggestions.length > 0) {
        const suggestion = response.suggestions[0];
        if (window.confirm(`AI suggests: ${suggestion.description}\n\nApply this fix?`)) {
          for (const change of suggestion.changes) {
            await activityGridService.updateActivity(change.activityId, change.updates);
          }
          await loadPromotions();
          await loadConflicts();
        }
      }
    } catch (error) {
      console.error('Failed to get auto-fix suggestions:', error);
    }
  };

  const formatDateRange = () => {
    const start = getStartDate();
    const end = getEndDate();
    
    if (view === 'month') {
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (view === 'week') {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (view === 'quarter') {
      const quarter = Math.floor(start.getMonth() / 3) + 1;
      return `Q${quarter} ${start.getFullYear()}`;
    } else {
      return start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  const getConflictSeverityColor = (severity) => {
    const colors = {
      low: 'info',
      medium: 'warning',
      high: 'error'
    };
    return colors[severity] || 'default';
  };

  const getPromotionColor = (promotion) => {
    const hasConflict = conflicts.some(c => 
      c.activities.some(a => a.id === promotion.id)
    );
    
    if (hasConflict) return 'error.light';
    if (promotion.status === 'active') return 'success.light';
    if (promotion.status === 'approved') return 'primary.light';
    if (promotion.status === 'draft') return 'grey.300';
    return 'grey.200';
  };

  const groupPromotions = () => {
    const grouped = {};
    
    promotions.forEach(promo => {
      let key;
      if (groupBy === 'customer') {
        key = promo.customer?.name || 'Unassigned';
      } else if (groupBy === 'product') {
        key = promo.product?.name || 'Unassigned';
      } else {
        key = promo.status || 'Unknown';
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(promo);
    });
    
    return grouped;
  };

  const renderCalendarGrid = () => {
    const startDate = getStartDate();
    const endDate = getEndDate();
    const days = [];
    
    let currentDay = new Date(startDate);
    while (currentDay <= endDate) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    const groupedPromotions = groupPromotions();

    return (
      <Box>
        {/* Header with dates */}
        <Grid container sx={{ borderBottom: 2, borderColor: 'divider', mb: 2 }}>
          <Grid item xs={2}>
            <Typography variant="subtitle2" sx={{ p: 1, fontWeight: 600 }}>
              {groupBy === 'customer' ? 'Customer' : groupBy === 'product' ? 'Product' : 'Status'}
            </Typography>
          </Grid>
          <Grid item xs={10}>
            <Box sx={{ display: 'flex' }}>
              {days.slice(0, Math.min(days.length, 31)).map((day, idx) => (
                <Box 
                  key={idx} 
                  sx={{ 
                    flex: 1, 
                    p: 1, 
                    textAlign: 'center',
                    borderLeft: idx > 0 ? 1 : 0,
                    borderColor: 'divider',
                    bgcolor: day.getDay() === 0 || day.getDay() === 6 ? 'action.hover' : 'transparent'
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {day.getDate()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>

        {/* Rows for each group */}
        {Object.entries(groupedPromotions).map(([groupName, promos]) => (
          <Grid container key={groupName} sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 80 }}>
            <Grid item xs={2} sx={{ borderRight: 1, borderColor: 'divider', p: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {groupName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {promos.length} promotion{promos.length !== 1 ? 's' : ''}
              </Typography>
            </Grid>
            <Grid item xs={10}>
              <Box sx={{ position: 'relative', height: '100%', minHeight: 80 }}>
                {promos.map((promo, idx) => {
                  const promoStart = new Date(promo.startDate);
                  const promoEnd = new Date(promo.endDate);
                  const startOffset = Math.max(0, (promoStart - startDate) / (1000 * 60 * 60 * 24));
                  const duration = (promoEnd - promoStart) / (1000 * 60 * 60 * 24) + 1;
                  const width = (duration / days.length) * 100;
                  const left = (startOffset / days.length) * 100;

                  return (
                    <Paper
                      key={promo.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, promo)}
                      onClick={() => handlePromotionClick(promo)}
                      sx={{
                        position: 'absolute',
                        left: `${left}%`,
                        width: `${width}%`,
                        top: idx * 30 + 5,
                        p: 0.5,
                        bgcolor: getPromotionColor(promo),
                        cursor: 'grab',
                        '&:hover': {
                          boxShadow: 3,
                          zIndex: 10
                        },
                        '&:active': {
                          cursor: 'grabbing'
                        },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DragIndicator fontSize="small" sx={{ fontSize: 12 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {promo.name}
                        </Typography>
                      </Box>
                    </Paper>
                  );
                })}
                {/* Drop zones for each day */}
                {days.slice(0, Math.min(days.length, 31)).map((day, idx) => (
                  <Box
                    key={idx}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day)}
                    sx={{
                      position: 'absolute',
                      left: `${(idx / days.length) * 100}%`,
                      width: `${(1 / days.length) * 100}%`,
                      height: '100%',
                      borderLeft: idx > 0 ? 1 : 0,
                      borderColor: 'divider'
                    }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <div>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Promotions Timeline
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Drag-and-drop calendar with conflict detection and AI auto-fix
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/promotions/new-flow')}
          >
            New Promotion
          </Button>
        </Box>
      </Box>

      {conflicts.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              startIcon={<AutoFixHigh />}
              onClick={() => handleAutoFix(conflicts[0])}
            >
              Auto-Fix
            </Button>
          }
        >
          {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} detected. Click Auto-Fix for AI suggestions.
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ToggleButtonGroup
                value={view}
                exclusive
                onChange={(e, newView) => newView && setView(newView)}
                size="small"
              >
                <ToggleButton value="week">
                  <ViewWeek sx={{ mr: 1 }} />
                  Week
                </ToggleButton>
                <ToggleButton value="month">
                  <CalendarMonth sx={{ mr: 1 }} />
                  Month
                </ToggleButton>
                <ToggleButton value="quarter">
                  <ViewDay sx={{ mr: 1 }} />
                  Quarter
                </ToggleButton>
              </ToggleButtonGroup>

              <TextField
                select
                size="small"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                sx={{ minWidth: 150, ml: 2 }}
                label="Group By"
              >
                <MenuItem value="customer">Customer</MenuItem>
                <MenuItem value="product">Product</MenuItem>
                <MenuItem value="status">Status</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={handlePrevious}>
                <ChevronLeft />
              </IconButton>
              <Typography variant="h6" sx={{ minWidth: 250, textAlign: 'center' }}>
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
          ) : promotions.length === 0 ? (
            <Alert severity="info">
              No promotions scheduled for this period. Create a new promotion to get started.
            </Alert>
          ) : (
            renderCalendarGrid()
          )}
        </CardContent>
      </Card>

      {/* Right-side drawer for promotion details */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 400, p: 3 } }}
      >
        {selectedPromotion && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Promotion Details
              </Typography>
              <Box>
                <IconButton size="small" onClick={() => navigate(`/promotions/${selectedPromotion.id}/edit`)}>
                  <Edit />
                </IconButton>
                <IconButton size="small" color="error">
                  <Delete />
                </IconButton>
              </Box>
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              {selectedPromotion.name}
            </Typography>

            <List>
              <ListItem>
                <ListItemText
                  primary="Status"
                  secondary={
                    <Chip 
                      label={selectedPromotion.status} 
                      size="small"
                      color={selectedPromotion.status === 'active' ? 'success' : 'default'}
                    />
                  }
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Duration"
                  secondary={`${new Date(selectedPromotion.startDate).toLocaleDateString()} - ${new Date(selectedPromotion.endDate).toLocaleDateString()}`}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Customer"
                  secondary={selectedPromotion.customer?.name || 'N/A'}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Product"
                  secondary={selectedPromotion.product?.name || 'N/A'}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Budget"
                  secondary={`$${(selectedPromotion.budget || 0).toLocaleString()}`}
                />
              </ListItem>
            </List>

            {/* Show conflicts if any */}
            {conflicts.some(c => c.activities.some(a => a.id === selectedPromotion.id)) && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Conflicts Detected
                </Typography>
                {conflicts
                  .filter(c => c.activities.some(a => a.id === selectedPromotion.id))
                  .map((conflict, idx) => (
                    <Typography key={idx} variant="caption" display="block">
                      • {conflict.description}
                    </Typography>
                  ))}
                <Button 
                  size="small" 
                  startIcon={<AutoFixHigh />}
                  onClick={() => handleAutoFix(conflicts.find(c => c.activities.some(a => a.id === selectedPromotion.id)))}
                  sx={{ mt: 1 }}
                >
                  Get AI Suggestions
                </Button>
              </Alert>
            )}
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default PromotionsTimeline;
