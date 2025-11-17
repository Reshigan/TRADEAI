import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Chip,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TableChart as TableChartIcon,
  Timeline as TimelineIcon,
  BubbleChart as BubbleChartIcon
} from '@mui/icons-material';

import { PageHeader } from '../common';

// Mock data for available fields
const availableFields = {
  budget: [
    { id: 'budget_id', name: 'Budget ID', type: 'string' },
    { id: 'budget_name', name: 'Budget Name', type: 'string' },
    { id: 'budget_amount', name: 'Budget Amount', type: 'number' },
    { id: 'budget_start_date', name: 'Start Date', type: 'date' },
    { id: 'budget_end_date', name: 'End Date', type: 'date' },
    { id: 'budget_status', name: 'Status', type: 'string' },
    { id: 'budget_owner', name: 'Owner', type: 'string' },
    { id: 'budget_department', name: 'Department', type: 'string' },
    { id: 'budget_used', name: 'Amount Used', type: 'number' },
    { id: 'budget_remaining', name: 'Amount Remaining', type: 'number' },
    { id: 'budget_percent_used', name: 'Percent Used', type: 'number' }
  ],
  trade_spend: [
    { id: 'trade_spend_id', name: 'Trade Spend ID', type: 'string' },
    { id: 'trade_spend_name', name: 'Trade Spend Name', type: 'string' },
    { id: 'trade_spend_amount', name: 'Amount', type: 'number' },
    { id: 'trade_spend_start_date', name: 'Start Date', type: 'date' },
    { id: 'trade_spend_end_date', name: 'End Date', type: 'date' },
    { id: 'trade_spend_status', name: 'Status', type: 'string' },
    { id: 'trade_spend_customer', name: 'Customer', type: 'string' },
    { id: 'trade_spend_product', name: 'Product', type: 'string' },
    { id: 'trade_spend_roi', name: 'ROI', type: 'number' },
    { id: 'trade_spend_sales', name: 'Sales', type: 'number' },
    { id: 'trade_spend_type', name: 'Type', type: 'string' }
  ],
  promotion: [
    { id: 'promotion_id', name: 'Promotion ID', type: 'string' },
    { id: 'promotion_name', name: 'Promotion Name', type: 'string' },
    { id: 'promotion_amount', name: 'Amount', type: 'number' },
    { id: 'promotion_start_date', name: 'Start Date', type: 'date' },
    { id: 'promotion_end_date', name: 'End Date', type: 'date' },
    { id: 'promotion_status', name: 'Status', type: 'string' },
    { id: 'promotion_customer', name: 'Customer', type: 'string' },
    { id: 'promotion_product', name: 'Product', type: 'string' },
    { id: 'promotion_roi', name: 'ROI', type: 'number' },
    { id: 'promotion_sales', name: 'Sales', type: 'number' },
    { id: 'promotion_type', name: 'Type', type: 'string' }
  ],
  customer: [
    { id: 'customer_id', name: 'Customer ID', type: 'string' },
    { id: 'customer_name', name: 'Customer Name', type: 'string' },
    { id: 'customer_type', name: 'Type', type: 'string' },
    { id: 'customer_region', name: 'Region', type: 'string' },
    { id: 'customer_sales', name: 'Sales', type: 'number' },
    { id: 'customer_trade_spend', name: 'Trade Spend', type: 'number' },
    { id: 'customer_roi', name: 'ROI', type: 'number' },
    { id: 'customer_status', name: 'Status', type: 'string' }
  ],
  product: [
    { id: 'product_id', name: 'Product ID', type: 'string' },
    { id: 'product_name', name: 'Product Name', type: 'string' },
    { id: 'product_category', name: 'Category', type: 'string' },
    { id: 'product_subcategory', name: 'Subcategory', type: 'string' },
    { id: 'product_sales', name: 'Sales', type: 'number' },
    { id: 'product_trade_spend', name: 'Trade Spend', type: 'number' },
    { id: 'product_roi', name: 'ROI', type: 'number' },
    { id: 'product_status', name: 'Status', type: 'string' }
  ]
};

// Chart type options
const chartTypes = [
  { id: 'bar', name: 'Bar Chart', icon: <BarChartIcon /> },
  { id: 'pie', name: 'Pie Chart', icon: <PieChartIcon /> },
  { id: 'line', name: 'Line Chart', icon: <TimelineIcon /> },
  { id: 'scatter', name: 'Scatter Plot', icon: <BubbleChartIcon /> },
  { id: 'table', name: 'Table', icon: <TableChartIcon /> }
];

const ReportBuilder = () => {
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [reportData, setReportData] = useState({
    name: '',
    description: '',
    type: '',
    format: 'dashboard',
    fields: [],
    filters: [],
    sortBy: '',
    sortDirection: 'asc',
    chartType: 'bar',
    schedule: {
      enabled: false,
      frequency: 'weekly',
      day: 'monday',
      time: '08:00'
    }
  });
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Steps for the stepper
  const steps = ['Basic Information', 'Data Selection', 'Visualization', 'Schedule & Save'];
  
  // Handle form input change
  const handleChange = (event) => {
    const { name, value } = event.target;
    setReportData((prevData) => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };
  
  // Handle schedule change
  const handleScheduleChange = (event) => {
    const { name, value, checked } = event.target;
    setReportData((prevData) => ({
      ...prevData,
      schedule: {
        ...prevData.schedule,
        [name]: name === 'enabled' ? checked : value
      }
    }));
  };
  
  // Handle field selection
  const handleFieldToggle = (field) => {
    const currentFields = [...reportData.fields];
    const fieldIndex = currentFields.findIndex(f => f.id === field.id);
    
    if (fieldIndex === -1) {
      // Add field
      currentFields.push(field);
    } else {
      // Remove field
      currentFields.splice(fieldIndex, 1);
    }
    
    setReportData((prevData) => ({
      ...prevData,
      fields: currentFields
    }));
  };
  
  // Handle chart type selection
  const handleChartTypeSelect = (chartType) => {
    setReportData((prevData) => ({
      ...prevData,
      chartType
    }));
  };
  
  // Add filter
  const handleAddFilter = () => {
    const newFilter = {
      id: `filter_${reportData.filters.length + 1}`,
      field: '',
      operator: 'equals',
      value: ''
    };
    
    setReportData((prevData) => ({
      ...prevData,
      filters: [...prevData.filters, newFilter]
    }));
  };
  
  // Remove filter
  const handleRemoveFilter = (filterId) => {
    setReportData((prevData) => ({
      ...prevData,
      filters: prevData.filters.filter(filter => filter.id !== filterId)
    }));
  };
  
  // Update filter
  const handleFilterChange = (filterId, field, value) => {
    setReportData((prevData) => ({
      ...prevData,
      filters: prevData.filters.map(filter =>
        filter.id === filterId ? { ...filter, [field]: value } : filter
      )
    }));
  };
  
  // Validate current step
  const validateStep = () => {
    const newErrors = {};
    
    if (activeStep === 0) {
      if (!reportData.name.trim()) {
        newErrors.name = 'Report name is required';
      }
      
      if (!reportData.type) {
        newErrors.type = 'Report type is required';
      }
      
      if (!reportData.format) {
        newErrors.format = 'Report format is required';
      }
    } else if (activeStep === 1) {
      if (reportData.fields.length === 0) {
        newErrors.fields = 'At least one field must be selected';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Handle save report
  const handleSaveReport = () => {
    if (!validateStep()) {
      return;
    }
    
    setSaving(true);
    
    // In a real app, we would call the API to save the report
    setTimeout(() => {
      setSaving(false);
      
      setSnackbar({
        open: true,
        message: `Report "${reportData.name}" has been created`,
        severity: 'success'
      });
      
      // Navigate back to reports list after successful save
      setTimeout(() => {
        navigate('/reports');
      }, 1500);
    }, 1500);
  };
  
  // Handle cancel
  const handleCancel = () => {
    navigate('/reports');
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar((prevSnackbar) => ({
      ...prevSnackbar,
      open: false
    }));
  };
  
  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Report Name"
                name="name"
                value={reportData.name}
                onChange={handleChange}
                error={Boolean(errors.name)}
                helperText={errors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={reportData.description}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={Boolean(errors.type)} required>
                <InputLabel id="type-label">Report Type</InputLabel>
                <Select
                  labelId="type-label"
                  name="type"
                  value={reportData.type}
                  onChange={handleChange}
                  label="Report Type"
                >
                  <MenuItem value="budget">Budget</MenuItem>
                  <MenuItem value="trade_spend">Trade Spend</MenuItem>
                  <MenuItem value="promotion">Promotion</MenuItem>
                  <MenuItem value="customer">Customer</MenuItem>
                  <MenuItem value="product">Product</MenuItem>
                </Select>
                {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={Boolean(errors.format)} required>
                <InputLabel id="format-label">Report Format</InputLabel>
                <Select
                  labelId="format-label"
                  name="format"
                  value={reportData.format}
                  onChange={handleChange}
                  label="Report Format"
                >
                  <MenuItem value="dashboard">Dashboard</MenuItem>
                  <MenuItem value="chart">Chart</MenuItem>
                  <MenuItem value="table">Table</MenuItem>
                </Select>
                {errors.format && <FormHelperText>{errors.format}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        );
      
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {errors.fields && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.fields}
                </Alert>
              )}
              
              <Typography variant="subtitle1" gutterBottom>
                Select fields to include in the report:
              </Typography>
              
              {reportData.type ? (
                <List>
                  {availableFields[reportData.type].map((field) => (
                    <ListItem
                      key={field.id}
                      disablePadding
                      secondaryAction={
                        <Chip
                          label={field.type}
                          size="small"
                          color={
                            field.type === 'number' ? 'primary' :
                            field.type === 'date' ? 'secondary' : 'default'
                          }
                        />
                      }
                    >
                      <ListItemButton onClick={() => handleFieldToggle(field)}>
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={reportData.fields.some(f => f.id === field.id)}
                            tabIndex={-1}
                            disableRipple
                          />
                        </ListItemIcon>
                        <ListItemText primary={field.name} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  Please select a report type first.
                </Alert>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Filters:
              </Typography>
              
              {reportData.filters.map((filter, index) => (
                <Box key={filter.id} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <FormControl sx={{ mr: 1, flexGrow: 1 }}>
                    <InputLabel>Field</InputLabel>
                    <Select
                      value={filter.field}
                      onChange={(e) => handleFilterChange(filter.id, 'field', e.target.value)}
                      label="Field"
                    >
                      {reportData.type && availableFields[reportData.type].map((field) => (
                        <MenuItem key={field.id} value={field.id}>
                          {field.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl sx={{ mr: 1, width: 150 }}>
                    <InputLabel>Operator</InputLabel>
                    <Select
                      value={filter.operator}
                      onChange={(e) => handleFilterChange(filter.id, 'operator', e.target.value)}
                      label="Operator"
                    >
                      <MenuItem value="equals">Equals</MenuItem>
                      <MenuItem value="not_equals">Not Equals</MenuItem>
                      <MenuItem value="greater_than">Greater Than</MenuItem>
                      <MenuItem value="less_than">Less Than</MenuItem>
                      <MenuItem value="contains">Contains</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Value"
                    value={filter.value}
                    onChange={(e) => handleFilterChange(filter.id, 'value', e.target.value)}
                    sx={{ mr: 1, flexGrow: 1 }}
                  />
                  
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveFilter(filter.id)}
                  >
                    <RemoveIcon />
                  </IconButton>
                </Box>
              ))}
              
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddFilter}
                variant="outlined"
                size="small"
              >
                Add Filter
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Sorting:
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      name="sortBy"
                      value={reportData.sortBy}
                      onChange={handleChange}
                      label="Sort By"
                    >
                      <MenuItem value="">None</MenuItem>
                      {reportData.fields.map((field) => (
                        <MenuItem key={field.id} value={field.id}>
                          {field.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Direction</InputLabel>
                    <Select
                      name="sortDirection"
                      value={reportData.sortDirection}
                      onChange={handleChange}
                      label="Direction"
                      disabled={!reportData.sortBy}
                    >
                      <MenuItem value="asc">Ascending</MenuItem>
                      <MenuItem value="desc">Descending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        );
      
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Select chart type:
              </Typography>
              
              <Grid container spacing={2}>
                {chartTypes.map((chartType) => (
                  <Grid item xs={6} sm={4} md={3} key={chartType.id}>
                    <Card
                      variant={reportData.chartType === chartType.id ? 'elevation' : 'outlined'}
                      elevation={3}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: reportData.chartType === chartType.id ? 'primary.light' : 'background.paper',
                        '&:hover': {
                          bgcolor: reportData.chartType === chartType.id ? 'primary.light' : 'action.hover'
                        }
                      }}
                      onClick={() => handleChartTypeSelect(chartType.id)}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Box sx={{ fontSize: 40, mb: 1 }}>
                          {chartType.icon}
                        </Box>
                        <Typography variant="subtitle1">
                          {chartType.name}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Chart configuration:
              </Typography>
              
              {reportData.chartType === 'bar' || reportData.chartType === 'line' ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>X-Axis</InputLabel>
                      <Select
                        name="xAxis"
                        value={reportData.xAxis || ''}
                        onChange={handleChange}
                        label="X-Axis"
                      >
                        {reportData.fields.map((field) => (
                          <MenuItem key={field.id} value={field.id}>
                            {field.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Y-Axis</InputLabel>
                      <Select
                        name="yAxis"
                        value={reportData.yAxis || ''}
                        onChange={handleChange}
                        label="Y-Axis"
                      >
                        {reportData.fields.filter(field => field.type === 'number').map((field) => (
                          <MenuItem key={field.id} value={field.id}>
                            {field.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              ) : reportData.chartType === 'pie' ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Labels</InputLabel>
                      <Select
                        name="pieLabels"
                        value={reportData.pieLabels || ''}
                        onChange={handleChange}
                        label="Labels"
                      >
                        {reportData.fields.map((field) => (
                          <MenuItem key={field.id} value={field.id}>
                            {field.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Values</InputLabel>
                      <Select
                        name="pieValues"
                        value={reportData.pieValues || ''}
                        onChange={handleChange}
                        label="Values"
                      >
                        {reportData.fields.filter(field => field.type === 'number').map((field) => (
                          <MenuItem key={field.id} value={field.id}>
                            {field.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              ) : reportData.chartType === 'scatter' ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>X-Axis</InputLabel>
                      <Select
                        name="scatterX"
                        value={reportData.scatterX || ''}
                        onChange={handleChange}
                        label="X-Axis"
                      >
                        {reportData.fields.filter(field => field.type === 'number').map((field) => (
                          <MenuItem key={field.id} value={field.id}>
                            {field.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Y-Axis</InputLabel>
                      <Select
                        name="scatterY"
                        value={reportData.scatterY || ''}
                        onChange={handleChange}
                        label="Y-Axis"
                      >
                        {reportData.fields.filter(field => field.type === 'number').map((field) => (
                          <MenuItem key={field.id} value={field.id}>
                            {field.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Size</InputLabel>
                      <Select
                        name="scatterSize"
                        value={reportData.scatterSize || ''}
                        onChange={handleChange}
                        label="Size"
                      >
                        <MenuItem value="">None</MenuItem>
                        {reportData.fields.filter(field => field.type === 'number').map((field) => (
                          <MenuItem key={field.id} value={field.id}>
                            {field.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No additional configuration needed for this chart type.
                </Typography>
              )}
            </Grid>
          </Grid>
        );
      
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Schedule Report:
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reportData.schedule.enabled}
                    onChange={handleScheduleChange}
                    name="enabled"
                  />
                }
                label="Schedule this report to run automatically"
              />
              
              {reportData.schedule.enabled && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Frequency</InputLabel>
                        <Select
                          name="frequency"
                          value={reportData.schedule.frequency}
                          onChange={handleScheduleChange}
                          label="Frequency"
                        >
                          <MenuItem value="daily">Daily</MenuItem>
                          <MenuItem value="weekly">Weekly</MenuItem>
                          <MenuItem value="monthly">Monthly</MenuItem>
                          <MenuItem value="quarterly">Quarterly</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {reportData.schedule.frequency === 'weekly' && (
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel>Day</InputLabel>
                          <Select
                            name="day"
                            value={reportData.schedule.day}
                            onChange={handleScheduleChange}
                            label="Day"
                          >
                            <MenuItem value="monday">Monday</MenuItem>
                            <MenuItem value="tuesday">Tuesday</MenuItem>
                            <MenuItem value="wednesday">Wednesday</MenuItem>
                            <MenuItem value="thursday">Thursday</MenuItem>
                            <MenuItem value="friday">Friday</MenuItem>
                            <MenuItem value="saturday">Saturday</MenuItem>
                            <MenuItem value="sunday">Sunday</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                    
                    {reportData.schedule.frequency === 'monthly' && (
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Day of Month"
                          name="day"
                          type="number"
                          value={reportData.schedule.day}
                          onChange={handleScheduleChange}
                          InputProps={{ inputProps: { min: 1, max: 31 } }}
                        />
                      </Grid>
                    )}
                    
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Time"
                        name="time"
                        type="time"
                        value={reportData.schedule.time}
                        onChange={handleScheduleChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Report Summary:
              </Typography>
              
              <Card variant="outlined">
                <CardHeader
                  title={reportData.name || 'Untitled Report'}
                  subheader={reportData.description || 'No description'}
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2">Report Type:</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reportData.type ? reportData.type.replace('_', ' ') : 'Not selected'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2">Format:</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reportData.format}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Fields ({reportData.fields.length}):</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {reportData.fields.map((field) => (
                          <Chip key={field.id} label={field.name} size="small" />
                        ))}
                      </Box>
                    </Grid>
                    
                    {reportData.filters.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2">Filters ({reportData.filters.length}):</Typography>
                        <Box sx={{ mt: 1 }}>
                          {reportData.filters.map((filter) => {
                            const fieldName = reportData.type && 
                              availableFields[reportData.type].find(f => f.id === filter.field)?.name;
                            
                            return (
                              <Typography key={filter.id} variant="body2" color="text.secondary">
                                {fieldName || 'Field'} {filter.operator.replace('_', ' ')} {filter.value}
                              </Typography>
                            );
                          })}
                        </Box>
                      </Grid>
                    )}
                    
                    {reportData.sortBy && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2">Sorting:</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {reportData.fields.find(f => f.id === reportData.sortBy)?.name || 'Field'} ({reportData.sortDirection === 'asc' ? 'Ascending' : 'Descending'})
                        </Typography>
                      </Grid>
                    )}
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Visualization:</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {chartTypes.find(c => c.id === reportData.chartType)?.name || 'Not selected'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Schedule:</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reportData.schedule.enabled
                          ? `${reportData.schedule.frequency} at ${reportData.schedule.time}`
                          : 'Not scheduled'
                        }
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Box>
      <PageHeader
        title="Report Builder"
        subtitle="Create a custom report"
      />
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {getStepContent(activeStep)}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={activeStep === 0 ? handleCancel : handleBack}
            startIcon={<ArrowBackIcon />}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={activeStep === steps.length - 1 ? handleSaveReport : handleNext}
            endIcon={activeStep === steps.length - 1 ? <SaveIcon /> : <ArrowForwardIcon />}
            disabled={saving}
          >
            {saving ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Saving...
              </>
            ) : activeStep === steps.length - 1 ? (
              'Save Report'
            ) : (
              'Next'
            )}
          </Button>
        </Box>
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportBuilder;