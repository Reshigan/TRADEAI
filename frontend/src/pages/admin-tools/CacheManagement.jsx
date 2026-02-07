import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../../services/api';


const CacheManagement = () => {
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0, keys: 0, memory: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCacheStats();
  }, []);

  const fetchCacheStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/admin/cache/stats').catch(() => ({ data: { data: { hits: 0, misses: 0, keys: 0, memory: 0 } } }));

      setCacheStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch cache stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async (pattern = '*') => {
    try {
      const token = localStorage.getItem('token');
      await api.post('/admin/cache/clear', { pattern });
      
      setMessage('Cache cleared successfully');
      setTimeout(() => setMessage(''), 3000);
      fetchCacheStats();
    } catch (err) {
      setMessage('Failed to clear cache');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const hitRate = cacheStats.hits + cacheStats.misses > 0 
    ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1) 
    : 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        🗄️ Cache Management
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Monitor and manage application caching
      </Typography>

      {message && (
        <Alert 
          severity={message.includes('Failed') ? 'error' : 'success'} 
          onClose={() => setMessage('')}
          sx={{ mb: 3 }}
        >
          {message}
        </Alert>
      )}

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Cache Hits
            </Typography>
            <Typography variant="h4" fontWeight={700} color="success.main">
              {cacheStats.hits.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Cache Misses
            </Typography>
            <Typography variant="h4" fontWeight={700} color="error.main">
              {cacheStats.misses.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Hit Rate
            </Typography>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {hitRate}%
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Cached Keys
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {cacheStats.keys.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          Cache Operations
        </Typography>
        
        <Box display="flex" flexDirection="column" gap={2}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Clear All Cache
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Remove all cached data
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => clearCache('*')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Clear All
            </Button>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Clear Analytics Cache
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Remove analytics-related cached data
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="warning"
              startIcon={<DeleteIcon />}
              onClick={() => clearCache('analytics:*')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Clear
            </Button>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Clear User Cache
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Remove user session cached data
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="warning"
              startIcon={<DeleteIcon />}
              onClick={() => clearCache('user:*')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Clear
            </Button>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Refresh Stats
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reload cache statistics
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchCacheStats}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
          </Paper>
        </Box>
      </Paper>
    </Box>
  );
};

export default CacheManagement;
