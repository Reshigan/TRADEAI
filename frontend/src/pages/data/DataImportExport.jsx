/**
 * Data Import/Export Page
 * CSV/Excel import and export functionality
 * Priority 2.3: CSV Import/Export Functionality
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  Divider
} from '@mui/material';
import {
  CloudUpload,
  CloudDownload,
  Description,
  CheckCircle,
  Error,
  Warning,
  Refresh,
  Download,
  Upload,
  People,
  Inventory,
  LocalOffer,
  AccountBalance,
  Receipt,
  Business,
  FilePresent,
  TableChart
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useDropzone } from 'react-dropzone';
import api from '../../services/api';

// Module configurations
const MODULES = {
  customers: {
    label: 'Customers',
    icon: People,
    description: 'Import/export customer data including contact information and business details',
    fields: ['name', 'code', 'customerType', 'status', 'email', 'phone', 'address'],
    color: 'primary'
  },
  products: {
    label: 'Products',
    icon: Inventory,
    description: 'Import/export product catalog with SKUs, pricing, and categories',
    fields: ['name', 'code', 'sku', 'category', 'brand', 'unitPrice', 'status'],
    color: 'secondary'
  },
  promotions: {
    label: 'Promotions',
    icon: LocalOffer,
    description: 'Import/export promotion data including dates, mechanics, and targets',
    fields: ['name', 'code', 'promotionType', 'status', 'startDate', 'endDate', 'mechanics'],
    color: 'success'
  },
  budgets: {
    label: 'Budgets',
    icon: AccountBalance,
    description: 'Import/export budget allocations and spending data',
    fields: ['name', 'code', 'year', 'budgetType', 'allocated', 'spent', 'status'],
    color: 'warning'
  },
  transactions: {
    label: 'Transactions',
    icon: Receipt,
    description: 'Export transaction history and sales data',
    fields: ['transactionId', 'date', 'customer', 'product', 'amount', 'status'],
    color: 'info',
    exportOnly: true
  }
};

// Import steps
const IMPORT_STEPS = ['Select File', 'Map Fields', 'Review', 'Import'];

const DataImportExport = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [selectedModule, setSelectedModule] = useState('customers');
  const [loading, setLoading] = useState(false);
  
  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importStep, setImportStep] = useState(0);
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState([]);
  const [importMapping, setImportMapping] = useState({});
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  
  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    search: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  // File drop handler
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setImportFile(file);
      parseFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  // Parse uploaded file
  const parseFile = async (file) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        enqueueSnackbar('File must contain headers and at least one data row', { variant: 'error' });
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
      
      setImportData(data);
      
      // Auto-map fields
      const moduleConfig = MODULES[selectedModule];
      const mapping = {};
      moduleConfig.fields.forEach(field => {
        const matchingHeader = headers.find(h => 
          h.toLowerCase() === field.toLowerCase() ||
          h.toLowerCase().includes(field.toLowerCase())
        );
        if (matchingHeader) {
          mapping[field] = matchingHeader;
        }
      });
      setImportMapping(mapping);
      
      setImportStep(1);
    } catch (error) {
      console.error('Error parsing file:', error);
      enqueueSnackbar('Error parsing file', { variant: 'error' });
    }
  };

  // Handle import
  const handleImport = async () => {
    try {
      setImporting(true);
      
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('mapping', JSON.stringify(importMapping));
      formData.append('format', 'csv');
      
      const response = await api.post(`/import/${selectedModule}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setImportResult(response.data.data);
      setImportStep(3);
      enqueueSnackbar(`Successfully imported ${response.data.data.successCount} records`, { variant: 'success' });
    } catch (error) {
      console.error('Import error:', error);
      enqueueSnackbar(error.response?.data?.message || 'Import failed', { variant: 'error' });
    } finally {
      setImporting(false);
    }
  };

  // Handle export
  const handleExport = async (module, format = 'xlsx') => {
    try {
      setExporting(true);
      
      const params = new URLSearchParams();
      if (exportFilters.search) params.append('search', exportFilters.search);
      if (exportFilters.status) params.append('status', exportFilters.status);
      if (exportFilters.startDate) params.append('startDate', exportFilters.startDate);
      if (exportFilters.endDate) params.append('endDate', exportFilters.endDate);
      
      const response = await api.get(`/export/${module}?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${module}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      enqueueSnackbar(`${MODULES[module].label} exported successfully`, { variant: 'success' });
    } catch (error) {
      console.error('Export error:', error);
      enqueueSnackbar('Export failed', { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  // Download template
  const handleDownloadTemplate = async (module) => {
    try {
      setLoading(true);
      
      const response = await api.get(`/export/template/${module}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${module}_import_template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      enqueueSnackbar('Template downloaded', { variant: 'success' });
    } catch (error) {
      console.error('Template download error:', error);
      enqueueSnackbar('Failed to download template', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Reset import dialog
  const resetImport = () => {
    setImportStep(0);
    setImportFile(null);
    setImportData([]);
    setImportMapping({});
    setImportResult(null);
  };

  // Open import dialog
  const openImportDialog = (module) => {
    setSelectedModule(module);
    resetImport();
    setImportDialogOpen(true);
  };

  // Render import step content
  const renderImportStepContent = () => {
    switch (importStep) {
      case 0:
        return (
          <Box>
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                transition: 'all 0.2s'
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                or click to select a file
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Supported formats: CSV, XLS, XLSX
              </Typography>
            </Box>
            
            <Box mt={3}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => handleDownloadTemplate(selectedModule)}
                disabled={loading}
              >
                Download Template
              </Button>
            </Box>
          </Box>
        );
      
      case 1:
        const moduleConfig = MODULES[selectedModule];
        const fileHeaders = importData.length > 0 ? Object.keys(importData[0]) : [];
        
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Map your file columns to the system fields. Required fields are marked with *.
            </Alert>
            
            <Grid container spacing={2}>
              {moduleConfig.fields.map((field, index) => (
                <Grid item xs={12} sm={6} key={field}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{field}{index < 2 ? ' *' : ''}</InputLabel>
                    <Select
                      value={importMapping[field] || ''}
                      onChange={(e) => setImportMapping(prev => ({
                        ...prev,
                        [field]: e.target.value
                      }))}
                      label={`${field}${index < 2 ? ' *' : ''}`}
                    >
                      <MenuItem value="">-- Not Mapped --</MenuItem>
                      {fileHeaders.map(header => (
                        <MenuItem key={header} value={header}>{header}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Review the data before importing. Showing first 5 rows.
            </Alert>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {Object.keys(importMapping).filter(k => importMapping[k]).map(field => (
                      <TableCell key={field}>{field}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importData.slice(0, 5).map((row, index) => (
                    <TableRow key={index}>
                      {Object.entries(importMapping).filter(([_, v]) => v).map(([field, header]) => (
                        <TableCell key={field}>{row[header]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary">
                Total rows to import: {importData.length}
              </Typography>
            </Box>
          </Box>
        );
      
      case 3:
        return (
          <Box>
            {importResult && (
              <>
                <Alert 
                  severity={importResult.errorCount > 0 ? 'warning' : 'success'} 
                  sx={{ mb: 2 }}
                >
                  Import completed: {importResult.successCount} successful, {importResult.errorCount} failed
                </Alert>
                
                {importResult.errors && importResult.errors.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Errors:</Typography>
                    <List dense>
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Error color="error" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={`Row ${error.row}: ${error.error}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                    {importResult.errors.length > 10 && (
                      <Typography variant="caption" color="textSecondary">
                        ...and {importResult.errors.length - 10} more errors
                      </Typography>
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="/dashboard">Home</Link>
        <Link color="inherit" href="/data">Data</Link>
        <Typography color="text.primary">Import / Export</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Data Import / Export
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Import data from CSV/Excel files or export your data
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab icon={<Upload />} label="Import" />
          <Tab icon={<Download />} label="Export" />
        </Tabs>
      </Paper>

      {/* Import Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {Object.entries(MODULES).filter(([_, config]) => !config.exportOnly).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Icon color={config.color} />
                      <Typography variant="h6">{config.label}</Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ minHeight: 40 }}>
                      {config.description}
                    </Typography>
                    <Box mt={2}>
                      <Typography variant="caption" color="textSecondary">
                        Fields: {config.fields.slice(0, 4).join(', ')}
                        {config.fields.length > 4 && '...'}
                      </Typography>
                    </Box>
                  </CardContent>
                  <Divider />
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<Upload />}
                      onClick={() => openImportDialog(key)}
                    >
                      Import
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Download />}
                      onClick={() => handleDownloadTemplate(key)}
                      disabled={loading}
                    >
                      Template
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Export Tab */}
      {activeTab === 1 && (
        <>
          {/* Export Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Export Filters</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  value={exportFilters.search}
                  onChange={(e) => setExportFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={exportFilters.status}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, status: e.target.value }))}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Start Date"
                  value={exportFilters.startDate}
                  onChange={(e) => setExportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="End Date"
                  value={exportFilters.endDate}
                  onChange={(e) => setExportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Export Cards */}
          <Grid container spacing={3}>
            {Object.entries(MODULES).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Icon color={config.color} />
                        <Typography variant="h6">{config.label}</Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary" sx={{ minHeight: 40 }}>
                        {config.description}
                      </Typography>
                    </CardContent>
                    <Divider />
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={exporting ? <CircularProgress size={16} /> : <CloudDownload />}
                        onClick={() => handleExport(key)}
                        disabled={exporting}
                      >
                        Export Excel
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}

      {/* Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Import {MODULES[selectedModule]?.label}
        </DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={importStep} sx={{ mb: 3 }}>
            {IMPORT_STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {importing && <LinearProgress sx={{ mb: 2 }} />}
          
          {renderImportStepContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>
            {importStep === 3 ? 'Close' : 'Cancel'}
          </Button>
          
          {importStep > 0 && importStep < 3 && (
            <Button onClick={() => setImportStep(prev => prev - 1)}>
              Back
            </Button>
          )}
          
          {importStep === 1 && (
            <Button
              variant="contained"
              onClick={() => setImportStep(2)}
              disabled={Object.values(importMapping).filter(v => v).length < 2}
            >
              Next
            </Button>
          )}
          
          {importStep === 2 && (
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? 'Importing...' : 'Import'}
            </Button>
          )}
          
          {importStep === 3 && (
            <Button
              variant="contained"
              onClick={() => {
                resetImport();
                setImportDialogOpen(false);
              }}
            >
              Done
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DataImportExport;
