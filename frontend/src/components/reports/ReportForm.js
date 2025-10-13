import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Chip,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../contexts/AuthContext';
import { reportService } from '../../services/reportService';

const REPORT_TYPES = [
  { value: 'promotion_effectiveness', label: 'Promotion Effectiveness' },
  { value: 'budget_utilization', label: 'Budget Utilization' },
  { value: 'customer_performance', label: 'Customer Performance' },
  { value: 'product_performance', label: 'Product Performance' },
  { value: 'trade_spend_analysis', label: 'Trade Spend Analysis' },
  { value: 'roi_analysis', label: 'ROI Analysis' },
  { value: 'custom', label: 'Custom Report' }
];

const SCHEDULE_FREQUENCIES = [
  { value: 'none', label: 'No Schedule' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' }
];

const OUTPUT_FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' }
];

const ReportForm = ({ open, onClose, report, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    reportType: 'custom',
    status: 'draft',
    configuration: {
      dateRange: {
        startDate: null,
        endDate: null
      },
      filters: {},
      groupBy: [],
      metrics: [],
      outputFormat: 'pdf'
    },
    schedule: {
      enabled: false,
      frequency: 'none',
      dayOfWeek: 1,
      dayOfMonth: 1,
      time: '09:00',
      recipients: []
    },
    isPublic: false,
    tags: []
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (report) {
      setFormData({
        name: report.name || '',
        description: report.description || '',
        reportType: report.reportType || 'custom',
        status: report.status || 'draft',
        configuration: {
          dateRange: {
            startDate: report.configuration?.dateRange?.startDate ? new Date(report.configuration.dateRange.startDate) : null,
            endDate: report.configuration?.dateRange?.endDate ? new Date(report.configuration.dateRange.endDate) : null
          },
          filters: report.configuration?.filters || {},
          groupBy: report.configuration?.groupBy || [],
          metrics: report.configuration?.metrics || [],
          outputFormat: report.configuration?.outputFormat || 'pdf'
        },
        schedule: {
          enabled: report.schedule?.enabled || false,
          frequency: report.schedule?.frequency || 'none',
          dayOfWeek: report.schedule?.dayOfWeek || 1,
          dayOfMonth: report.schedule?.dayOfMonth || 1,
          time: report.schedule?.time || '09:00',
          recipients: report.schedule?.recipients || []
        },
        isPublic: report.isPublic || false,
        tags: report.tags || []
      });
    }
  }, [report]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleConfigurationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [field]: value
      }
    }));
  };

  const handleDateRangeChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        dateRange: {
          ...prev.configuration.dateRange,
          [field]: value
        }
      }
    }));
  };

  const handleScheduleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [field]: value
      }
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddRecipient = () => {
    if (newRecipient.trim() && !formData.schedule.recipients.includes(newRecipient.trim())) {
      handleScheduleChange('recipients', [...formData.schedule.recipients, newRecipient.trim()]);
      setNewRecipient('');
    }
  };

  const handleRemoveRecipient = (recipientToRemove) => {
    handleScheduleChange('recipients', formData.schedule.recipients.filter(r => r !== recipientToRemove));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Report name is required';
    }

    if (!formData.reportType) {
      newErrors.reportType = 'Report type is required';
    }

    if (formData.schedule.enabled && formData.schedule.frequency === 'none') {
      newErrors.scheduleFrequency = 'Please select a schedule frequency or disable scheduling';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const reportData = {
        ...formData,
        configuration: {
          ...formData.configuration,
          dateRange: {
            startDate: formData.configuration.dateRange.startDate?.toISOString(),
            endDate: formData.configuration.dateRange.endDate?.toISOString()
          }
        }
      };

      let savedReport;
      if (report?._id) {
        savedReport = await reportService.updateReport(report._id, reportData);
      } else {
        savedReport = await reportService.createReport(reportData);
      }

      onSave(savedReport.data);
      onClose();
    } catch (error) {
      console.error('Error saving report:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to save report' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {report ? 'Edit Report' : 'Create New Report'}
            </Typography>
            <Button onClick={onClose} size="small">
              <CloseIcon />
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Report Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.reportType}>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={formData.reportType}
                  onChange={(e) => handleInputChange('reportType', e.target.value)}
                  label="Report Type"
                >
                  {REPORT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Configuration */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Configuration</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Start Date"
                        value={formData.configuration.dateRange.startDate}
                        onChange={(value) => handleDateRangeChange('startDate', value)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="End Date"
                        value={formData.configuration.dateRange.endDate}
                        onChange={(value) => handleDateRangeChange('endDate', value)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Output Format</InputLabel>
                        <Select
                          value={formData.configuration.outputFormat}
                          onChange={(e) => handleConfigurationChange('outputFormat', e.target.value)}
                          label="Output Format"
                        >
                          {OUTPUT_FORMATS.map((format) => (
                            <MenuItem key={format.value} value={format.value}>
                              {format.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Scheduling */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Scheduling</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.schedule.enabled}
                            onChange={(e) => handleScheduleChange('enabled', e.target.checked)}
                          />
                        }
                        label="Enable Scheduling"
                      />
                    </Grid>
                    
                    {formData.schedule.enabled && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth error={!!errors.scheduleFrequency}>
                            <InputLabel>Frequency</InputLabel>
                            <Select
                              value={formData.schedule.frequency}
                              onChange={(e) => handleScheduleChange('frequency', e.target.value)}
                              label="Frequency"
                            >
                              {SCHEDULE_FREQUENCIES.filter(f => f.value !== 'none').map((freq) => (
                                <MenuItem key={freq.value} value={freq.value}>
                                  {freq.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Time"
                            type="time"
                            value={formData.schedule.time}
                            onChange={(e) => handleScheduleChange('time', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Box display="flex" gap={1} alignItems="center" mb={1}>
                            <TextField
                              label="Add Recipient Email"
                              value={newRecipient}
                              onChange={(e) => setNewRecipient(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
                              size="small"
                            />
                            <Button onClick={handleAddRecipient} variant="outlined" size="small">
                              Add
                            </Button>
                          </Box>
                          <Box display="flex" flexWrap="wrap" gap={1}>
                            {formData.schedule.recipients.map((recipient, index) => (
                              <Chip
                                key={index}
                                label={recipient}
                                onDelete={() => handleRemoveRecipient(recipient)}
                                size="small"
                              />
                            ))}
                          </Box>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Tags */}
            <Grid item xs={12}>
              <Box display="flex" gap={1} alignItems="center" mb={1}>
                <TextField
                  label="Add Tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  size="small"
                />
                <Button onClick={handleAddTag} variant="outlined" size="small">
                  Add
                </Button>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
            </Grid>

            {/* Public Report */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublic}
                    onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                  />
                }
                label="Make this report public to all users in the company"
              />
            </Grid>

            {errors.submit && (
              <Grid item xs={12}>
                <Typography color="error" variant="body2">
                  {errors.submit}
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : (report ? 'Update Report' : 'Create Report')}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ReportForm;