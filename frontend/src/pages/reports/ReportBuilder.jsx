import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Download as DownloadIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const ReportBuilder = () => {
  const [reportConfig, setReportConfig] = useState({
    reportType: 'sales',
    dateRange: { start: '', end: '' },
    filters: {},
    format: 'pdf'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reportTypes = [
    { value: 'sales', label: 'Sales Report' },
    { value: 'promotion', label: 'Promotion Performance' },
    { value: 'customer', label: 'Customer Analysis' },
    { value: 'product', label: 'Product Performance' },
    { value: 'budget', label: 'Budget Analysis' },
    { value: 'roi', label: 'ROI Analysis' }
  ];

  const generateReport = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/reports/generate`, reportConfig, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: reportConfig.format === 'pdf' ? 'blob' : 'json'
      });

      if (reportConfig.format === 'pdf') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `report_${Date.now()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        console.log('Report data:', response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        📊 Report Builder
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Create custom reports with flexible filters and export options
      </Typography>

      <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 4 }}>
        <Box mb={3}>
          <TextField
            select
            fullWidth
            label="Report Type"
            value={reportConfig.reportType}
            onChange={(e) => setReportConfig(prev => ({ ...prev, reportType: e.target.value }))}
          >
            {reportTypes.map(type => (
              <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
            ))}
          </TextField>
        </Box>

        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2} mb={3}>
          <TextField
            type="date"
            label="Start Date"
            value={reportConfig.dateRange.start}
            onChange={(e) => setReportConfig(prev => ({
              ...prev,
              dateRange: { ...prev.dateRange, start: e.target.value }
            }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            label="End Date"
            value={reportConfig.dateRange.end}
            onChange={(e) => setReportConfig(prev => ({
              ...prev,
              dateRange: { ...prev.dateRange, end: e.target.value }
            }))}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend">Export Format</FormLabel>
          <RadioGroup
            row
            value={reportConfig.format}
            onChange={(e) => setReportConfig(prev => ({ ...prev, format: e.target.value }))}
          >
            {['pdf', 'excel', 'csv'].map(format => (
              <FormControlLabel 
                key={format} 
                value={format} 
                control={<Radio />} 
                label={format.toUpperCase()} 
              />
            ))}
          </RadioGroup>
        </FormControl>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
          onClick={generateReport}
          disabled={loading || !reportConfig.dateRange.start || !reportConfig.dateRange.end}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, py: 1.5 }}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100', borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>
          📝 Report Features
        </Typography>
        <Box component="ul" sx={{ color: 'text.secondary', lineHeight: 1.8, pl: 3 }}>
          <li>Export to PDF, Excel, or CSV formats</li>
          <li>Flexible date range selection</li>
          <li>Multiple report types available</li>
          <li>Real-time data analysis</li>
          <li>Customizable filters and metrics</li>
        </Box>
      </Paper>
    </Box>
  );
};

export default ReportBuilder;
