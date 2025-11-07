/**
 * AI Customer Segmentation Widget
 * Shows customer segments with AI-powered insights
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material';
import {
  PeopleAlt,
  Refresh,
  Star,
  Warning,
  TrendingUp,
  InfoOutlined
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as ChartTooltip } from 'recharts';
import axios from 'axios';

const COLORS = {
  highValue: '#4caf50',
  medium: '#2196f3',
  lowValue: '#ff9800',
  atRisk: '#f44336'
};

const AICustomerSegmentationWidget = ({ companyId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [segmentation, setSegmentation] = useState(null);

  useEffect(() => {
    fetchSegmentation();
  }, [companyId]);

  const fetchSegmentation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/ai/segment/customers`,
        {
          companyId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setSegmentation(response.data);
    } catch (err) {
      console.error('Segmentation error:', err);
      setError(err.response?.data?.message || 'Failed to load segmentation');
    } finally {
      setLoading(false);
    }
  };

  const getSegmentIcon = (segment) => {
    switch (segment.toLowerCase()) {
      case 'high-value':
        return <Star sx={{ color: COLORS.highValue }} />;
      case 'at-risk':
        return <Warning sx={{ color: COLORS.atRisk }} />;
      case 'growing':
        return <TrendingUp sx={{ color: COLORS.medium }} />;
      default:
        return <PeopleAlt sx={{ color: COLORS.lowValue }} />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        avatar={<PeopleAlt color="primary" />}
        title="AI Customer Segmentation"
        subheader="ML-powered customer insights"
        action={
          <Tooltip title="Refresh segmentation">
            <IconButton onClick={fetchSegmentation} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        {segmentation && (
          <>
            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              <Chip
                label={`${segmentation.totalCustomers} Customers`}
                color="primary"
                size="small"
              />
              <Chip
                label={`Confidence: ${segmentation.confidence}%`}
                color={segmentation.confidence >= 80 ? 'success' : 'primary'}
                size="small"
              />
              {segmentation.status === 'degraded' && (
                <Chip
                  icon={<InfoOutlined />}
                  label="Simulated Data"
                  color="warning"
                  size="small"
                />
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={segmentation.segments?.map(seg => ({
                        name: seg.name,
                        value: seg.count
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {segmentation.segments?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.colorKey] || COLORS.medium} />
                      ))}
                    </Pie>
                    <ChartTooltip formatter={(value) => [value, 'Customers']} />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>

              <Grid item xs={12} md={6}>
                <List dense>
                  {segmentation.segments?.map((segment, idx) => (
                    <ListItem key={idx}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: COLORS[segment.colorKey] || COLORS.medium }}>
                          {getSegmentIcon(segment.name)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" fontWeight="bold">
                              {segment.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {segment.count} ({segment.percentage}%)
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="textSecondary">
                            Avg Value: ${segment.avgValue?.toLocaleString()}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>

            <Box mt={2}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>Key Insights:</strong>
              </Typography>
              {segmentation.insights?.map((insight, idx) => (
                <Alert key={idx} severity="info" sx={{ mt: 1 }}>
                  <Typography variant="caption">{insight}</Typography>
                </Alert>
              ))}
            </Box>

            <Box mt={2}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>Recommended Actions:</strong>
              </Typography>
              {segmentation.recommendations?.map((rec, idx) => (
                <Typography key={idx} variant="caption" display="block" sx={{ ml: 2, mb: 0.5 }}>
                  • {rec}
                </Typography>
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AICustomerSegmentationWidget;
