import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem,
  Skeleton,
  alpha,
  useTheme
} from '@mui/material';
import { 
  MoreVert,
  Download,
  Refresh,
  Fullscreen,
  AspectRatio
} from '@mui/icons-material';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement,
  LineElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChartWidget = ({ 
  title, 
  type = 'bar', 
  data, 
  height = 300,
  options = {},
  loading = false,
  error = null,
  onRefresh,
  showControls = true,
  compact = false
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: alpha(theme.palette.common.black, 0.8),
        titleColor: theme.palette.common.white,
        bodyColor: theme.palette.common.white,
        borderColor: alpha(theme.palette.common.white, 0.1),
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        }
      },
      y: {
        grid: {
          color: alpha(theme.palette.divider, 0.5),
          drawBorder: false
        },
        ticks: {
          callback: function(value) {
            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
            return value;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    ...options
  };

  const timeRanges = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return <Pie data={data} options={defaultOptions} />;
      case 'doughnut':
        return <Doughnut data={data} options={{
          ...defaultOptions,
          cutout: '70%',
          plugins: {
            ...defaultOptions.plugins,
            legend: {
              ...defaultOptions.plugins.legend,
              position: 'right'
            }
          }
        }} />;
      case 'line':
        return <Line data={data} options={defaultOptions} />;
      case 'area':
        return <Line 
          data={data} 
          options={{
            ...defaultOptions,
            plugins: {
              ...defaultOptions.plugins,
              filler: {
                propagate: true
              }
            },
            elements: {
              line: {
                fill: true,
                tension: 0.4
              }
            }
          }}
        />;
      case 'bar':
      default:
        return <Bar data={data} options={defaultOptions} />;
    }
  };

  if (loading) {
    return (
      <Card elevation={2} sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="text" width={120} height={24} />
            {showControls && <Skeleton variant="circular" width={32} height={32} />}
          </Box>
          <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Skeleton variant="rectangular" width="90%" height={200} sx={{ borderRadius: 2 }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card elevation={2} sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{title}</Typography>
            {showControls && (
              <IconButton size="small" onClick={onRefresh}>
                <Refresh />
              </IconButton>
            )}
          </Box>
          <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="error" align="center">
              {error}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      elevation={2} 
      sx={{ 
        height: '100%',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 100%)',
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        borderRadius: theme.spacing.borderRadius.lg,
        '&:hover': {
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent sx={{ p: compact ? 2 : 3, pb: compact ? '16px !important' : '24px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: compact ? 1.5 : 3 }}>
          <Typography variant={compact ? "body1" : "h6"} sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          
          {showControls && (
            <>
              <IconButton 
                size="small" 
                onClick={(e) => setAnchorEl(e.currentTarget)}
                aria-label="Chart options"
              >
                <MoreVert />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={() => setAnchorEl(null)}>
                  <Download sx={{ mr: 1 }} /> Export
                </MenuItem>
                <MenuItem onClick={() => setAnchorEl(null)}>
                  <Fullscreen sx={{ mr: 1 }} /> Full Screen
                </MenuItem>
                {onRefresh && (
                  <MenuItem onClick={() => { onRefresh(); setAnchorEl(null); }}>
                    <Refresh sx={{ mr: 1 }} /> Refresh
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
        </Box>
        
        <Box sx={{ height, position: 'relative' }}>
          {renderChart()}
        </Box>
        
        {showControls && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1, flexWrap: 'wrap' }}>
            {timeRanges.map(range => (
              <Box
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: timeRange === range.value ? 600 : 400,
                  color: timeRange === range.value ? theme.palette.primary.main : theme.palette.text.secondary,
                  bgcolor: timeRange === range.value ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                {range.label}
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartWidget;
