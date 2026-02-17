import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import activityGridService from '../../services/api/activityGridService';
import { useSnackbar } from 'notistack';
import {format} from 'date-fns';
import { enZA } from 'date-fns/locale';

const ActivityGridHeatMap = ({ year, month }) => {
  const [loading, setLoading] = useState(true);
  const [heatMapData, setHeatMapData] = useState([]);
  const [groupBy, setGroupBy] = useState('customer');
  
  const { enqueueSnackbar } = useSnackbar();
  
  // Fetch heat map data
  useEffect(() => {
    const fetchHeatMap = async () => {
      setLoading(true);
      try {
        const response = await activityGridService.getHeatMap({
          year,
          month,
          groupBy
        });
        
        setHeatMapData(response.data.data.heatMap);
      } catch (error) {
        console.error('Error fetching heat map:', error);
        enqueueSnackbar('Failed to load heat map data', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchHeatMap();
  }, [year, month, groupBy, enqueueSnackbar]);
  
  // Handle group by change
  const handleGroupByChange = (event) => {
    setGroupBy(event.target.value);
  };
  
  // Get color based on intensity
  const getIntensityColor = (intensity) => {
    if (intensity === 0) return '#f5f5f5';
    
    if (intensity < 25) return '#F5F3FF';
    if (intensity < 50) return '#90caf9';
    if (intensity < 75) return '#42a5f5';
    return '#7C3AED';
  };
  
  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };
  
  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Heat Map - {format(new Date(year, month - 1), 'MMMM yyyy', { locale: enZA })}
        </Typography>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Group By</InputLabel>
          <Select
            value={groupBy}
            label="Group By"
            onChange={handleGroupByChange}
          >
            <MenuItem value="customer">Customer</MenuItem>
            <MenuItem value="product">Product</MenuItem>
            <MenuItem value="vendor">Vendor</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 2, overflowX: 'auto' }}>
          <Box sx={{ minWidth: days.length * 40 }}>
            {/* Header - Days */}
            <Grid container>
              <Grid item xs={3}>
                <Typography variant="subtitle2" sx={{ p: 1, fontWeight: 'bold' }}>
                  {groupBy === 'customer' ? 'Customer' : 
                   groupBy === 'product' ? 'Product' : 'Vendor'}
                </Typography>
              </Grid>
              <Grid item xs={9}>
                <Grid container>
                  {days.map(day => (
                    <Grid item key={day} sx={{ width: 40 }}>
                      <Typography 
                        variant="body2" 
                        align="center"
                        sx={{ 
                          p: 1, 
                          fontWeight: 'bold',
                          color: (day % 7 === 0 || day % 7 === 1) ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {day}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
            
            {/* Heat Map Rows */}
            {heatMapData.map((item, index) => (
              <Grid container key={index} sx={{ borderTop: '1px solid #eee' }}>
                <Grid item xs={3}>
                  <Typography variant="body2" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.entity.name}
                  </Typography>
                </Grid>
                <Grid item xs={9}>
                  <Grid container>
                    {days.map(day => {
                      const dayStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                      const dayData = item.days.find(d => d.date === dayStr);
                      
                      return (
                        <Grid item key={day} sx={{ width: 40 }}>
                          <Box 
                            sx={{ 
                              height: 40, 
                              bgcolor: dayData ? getIntensityColor(dayData.intensity) : '#f5f5f5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #fff'
                            }}
                            title={dayData ? `${dayData.count} activities, Value: ${dayData.value}` : 'No activities'}
                          >
                            {dayData && dayData.count > 0 && (
                              <Typography variant="caption" sx={{ color: dayData.intensity > 50 ? '#fff' : '#000' }}>
                                {dayData.count}
                              </Typography>
                            )}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Grid>
              </Grid>
            ))}
            
            {heatMapData.length === 0 && (
              <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
                No data available for the selected period
              </Typography>
            )}
          </Box>
        </Paper>
      )}
      
      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" sx={{ mr: 1 }}>Intensity:</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 20, height: 20, bgcolor: '#f5f5f5', mr: 0.5 }} />
          <Typography variant="caption" sx={{ mr: 1 }}>None</Typography>
          
          <Box sx={{ width: 20, height: 20, bgcolor: '#F5F3FF', mr: 0.5 }} />
          <Typography variant="caption" sx={{ mr: 1 }}>Low</Typography>
          
          <Box sx={{ width: 20, height: 20, bgcolor: '#90caf9', mr: 0.5 }} />
          <Typography variant="caption" sx={{ mr: 1 }}>Medium</Typography>
          
          <Box sx={{ width: 20, height: 20, bgcolor: '#42a5f5', mr: 0.5 }} />
          <Typography variant="caption" sx={{ mr: 1 }}>High</Typography>
          
          <Box sx={{ width: 20, height: 20, bgcolor: '#7C3AED', mr: 0.5 }} />
          <Typography variant="caption">Very High</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ActivityGridHeatMap;