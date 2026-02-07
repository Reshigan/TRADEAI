import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Slider,
  Breadcrumbs,
  Link,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Calculate as CalculateIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dataLineageService from '../../services/dataLineage/dataLineageService';

const METHODOLOGIES = [
  { value: 'pre_period_average', label: 'Pre-Period Average', description: 'Simple average of pre-promotion period sales' },
  { value: 'pre_period_median', label: 'Pre-Period Median', description: 'Median of pre-promotion period sales (robust to outliers)' },
  { value: 'moving_average', label: 'Moving Average', description: 'Rolling average of recent periods' },
  { value: 'weighted_average', label: 'Weighted Average', description: 'Recent periods weighted more heavily' },
  { value: 'linear_regression', label: 'Linear Regression', description: 'Trend-based projection using regression' },
  { value: 'seasonal_adjusted', label: 'Seasonal Adjusted', description: 'Accounts for seasonal patterns' },
  { value: 'year_over_year', label: 'Year-over-Year', description: 'Compares to same period last year' },
  { value: 'custom', label: 'Custom', description: 'Custom calculation logic' }
];

const BaselineConfigPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState([]);
  const [defaultConfig, setDefaultConfig] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    methodology: 'pre_period_average',
    prePeriod: {
      weeks: 4,
      excludePromotions: true,
      excludeOutliers: true,
      outlierThreshold: 2.0
    },
    postPeriod: {
      weeks: 2,
      includeInAnalysis: true
    },
    aggregation: {
      grain: 'weekly',
      level: 'customer_sku'
    },
    minimumDataPoints: 4,
    confidenceLevel: 0.95
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const [configsResponse, defaultResponse] = await Promise.all([
        dataLineageService.getBaselineConfigs(),
        dataLineageService.getDefaultBaselineConfig()
      ]);
      setConfigs(configsResponse.data || []);
      setDefaultConfig(defaultResponse.data);
    } catch (error) {
      console.error('Error loading configs:', error);
      enqueueSnackbar('Failed to load baseline configurations', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (config = null) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        name: config.name,
        methodology: config.methodology,
        prePeriod: config.prePeriod || formData.prePeriod,
        postPeriod: config.postPeriod || formData.postPeriod,
        aggregation: config.aggregation || formData.aggregation,
        minimumDataPoints: config.minimumDataPoints || 4,
        confidenceLevel: config.confidenceLevel || 0.95
      });
    } else {
      setEditingConfig(null);
      setFormData({
        name: '',
        methodology: 'pre_period_average',
        prePeriod: {
          weeks: 4,
          excludePromotions: true,
          excludeOutliers: true,
          outlierThreshold: 2.0
        },
        postPeriod: {
          weeks: 2,
          includeInAnalysis: true
        },
        aggregation: {
          grain: 'weekly',
          level: 'customer_sku'
        },
        minimumDataPoints: 4,
        confidenceLevel: 0.95
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      enqueueSnackbar('Please provide a configuration name', { variant: 'warning' });
      return;
    }

    try {
      if (editingConfig) {
        await dataLineageService.updateBaselineConfig((editingConfig.id || editingConfig._id), formData);
        enqueueSnackbar('Configuration updated successfully', { variant: 'success' });
      } else {
        await dataLineageService.createBaselineConfig(formData);
        enqueueSnackbar('Configuration created successfully', { variant: 'success' });
      }
      setDialogOpen(false);
      loadConfigs();
    } catch (error) {
      console.error('Error saving config:', error);
      enqueueSnackbar('Failed to save configuration', { variant: 'error' });
    }
  };

  const handleSetDefault = async (configId) => {
    try {
      await dataLineageService.setDefaultBaselineConfig(configId);
      enqueueSnackbar('Default configuration updated', { variant: 'success' });
      loadConfigs();
    } catch (error) {
      console.error('Error setting default:', error);
      enqueueSnackbar('Failed to set default configuration', { variant: 'error' });
    }
  };

  const getMethodologyInfo = (methodology) => {
    return METHODOLOGIES.find(m => m.value === methodology) || {};
  };

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="/dashboard">Home</Link>
        <Link color="inherit" href="/admin">Admin</Link>
        <Typography color="text.primary">Baseline Configuration</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Baseline Methodology Configuration
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Configure how baseline sales are calculated for promotions to ensure defensible ROI metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadConfigs}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Configuration
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Why Baseline Methodology Matters:</strong> The baseline represents what sales would have been without the promotion.
          A defensible baseline methodology is critical for calculating accurate incremental lift and ROI.
          Finance teams need to trust these numbers for accruals and post-event analysis.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <StarIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'warning.main' }} />
                Default Configuration
              </Typography>
              {defaultConfig ? (
                <Box>
                  <Typography variant="h5" sx={{ mb: 1 }}>{defaultConfig.name}</Typography>
                  <Chip
                    label={getMethodologyInfo(defaultConfig.methodology).label}
                    color="primary"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {getMethodologyInfo(defaultConfig.methodology).description}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2">
                    <strong>Pre-Period:</strong> {defaultConfig.prePeriod?.weeks} weeks
                  </Typography>
                  <Typography variant="body2">
                    <strong>Aggregation:</strong> {defaultConfig.aggregation?.grain} / {defaultConfig.aggregation?.level}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Min Data Points:</strong> {defaultConfig.minimumDataPoints}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Confidence Level:</strong> {(defaultConfig.confidenceLevel * 100).toFixed(0)}%
                  </Typography>
                </Box>
              ) : (
                <Typography color="textSecondary">No default configuration set</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>All Configurations</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Methodology</TableCell>
                      <TableCell>Pre-Period</TableCell>
                      <TableCell>Aggregation</TableCell>
                      <TableCell>Default</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {configs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="textSecondary">No configurations found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      configs.map((config) => (
                        <TableRow key={config.id || config._id}>
                          <TableCell>
                            <Typography fontWeight="medium">{config.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getMethodologyInfo(config.methodology).label}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{config.prePeriod?.weeks} weeks</TableCell>
                          <TableCell>
                            {config.aggregation?.grain} / {config.aggregation?.level}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleSetDefault(config._id)}
                              color={config.isDefault ? 'warning' : 'default'}
                            >
                              {config.isDefault ? <StarIcon /> : <StarBorderIcon />}
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleOpenDialog(config)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingConfig ? 'Edit Baseline Configuration' : 'New Baseline Configuration'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Configuration Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard 4-Week Average"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Baseline Methodology"
                value={formData.methodology}
                onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
              >
                {METHODOLOGIES.map((method) => (
                  <MenuItem key={method.value} value={method.value}>
                    <Box>
                      <Typography>{method.label}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {method.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" gutterBottom>Pre-Period Settings</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>Pre-Period Weeks: {formData.prePeriod.weeks}</Typography>
              <Slider
                value={formData.prePeriod.weeks}
                onChange={(e, v) => setFormData({
                  ...formData,
                  prePeriod: { ...formData.prePeriod, weeks: v }
                })}
                min={1}
                max={12}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>Outlier Threshold (Std Dev): {formData.prePeriod.outlierThreshold}</Typography>
              <Slider
                value={formData.prePeriod.outlierThreshold}
                onChange={(e, v) => setFormData({
                  ...formData,
                  prePeriod: { ...formData.prePeriod, outlierThreshold: v }
                })}
                min={1}
                max={4}
                step={0.5}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.prePeriod.excludePromotions}
                    onChange={(e) => setFormData({
                      ...formData,
                      prePeriod: { ...formData.prePeriod, excludePromotions: e.target.checked }
                    })}
                  />
                }
                label="Exclude Promotional Periods"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.prePeriod.excludeOutliers}
                    onChange={(e) => setFormData({
                      ...formData,
                      prePeriod: { ...formData.prePeriod, excludeOutliers: e.target.checked }
                    })}
                  />
                }
                label="Exclude Outliers"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" gutterBottom>Aggregation Settings</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Time Grain"
                value={formData.aggregation.grain}
                onChange={(e) => setFormData({
                  ...formData,
                  aggregation: { ...formData.aggregation, grain: e.target.value }
                })}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Aggregation Level"
                value={formData.aggregation.level}
                onChange={(e) => setFormData({
                  ...formData,
                  aggregation: { ...formData.aggregation, level: e.target.value }
                })}
              >
                <MenuItem value="customer_sku">Customer + SKU</MenuItem>
                <MenuItem value="customer_category">Customer + Category</MenuItem>
                <MenuItem value="customer">Customer Only</MenuItem>
                <MenuItem value="sku">SKU Only</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" gutterBottom>Validation Settings</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Minimum Data Points"
                value={formData.minimumDataPoints}
                onChange={(e) => setFormData({ ...formData, minimumDataPoints: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 52 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>Confidence Level: {(formData.confidenceLevel * 100).toFixed(0)}%</Typography>
              <Slider
                value={formData.confidenceLevel}
                onChange={(e, v) => setFormData({ ...formData, confidenceLevel: v })}
                min={0.8}
                max={0.99}
                step={0.01}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} startIcon={<CalculateIcon />}>
            {editingConfig ? 'Update Configuration' : 'Create Configuration'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BaselineConfigPage;
