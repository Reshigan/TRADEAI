import React, { useState, useCallback } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Alert,
  LinearProgress, Stepper, Step, StepLabel, Chip, Grid, CircularProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon, CheckCircle as CheckIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import api from '../../services/api';

const POSImport = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [preview, setPreview] = useState([]);
  const [columns, setColumns] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [validation, setValidation] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  const steps = ['Upload File', 'Preview Data', 'Validate', 'Import'];

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setFile(file);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/pos-import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { jobId, preview, columns, totalRows } = response.data.data;
      setJobId(jobId);
      setPreview(preview);
      setColumns(columns);
      setTotalRows(totalRows);
      setActiveStep(1);
    } catch (err) {
      setError(err.response?.data?.error || 'File upload failed');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.xls'],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024
  });

  const handleValidate = async () => {
    setError(null);
    setImporting(true);
    try {
      const response = await api.post('/pos-import/validate', { jobId });
      setValidation(response.data.data);
      setActiveStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Validation failed');
    } finally {
      setImporting(false);
    }
  };

  const handleImport = async () => {
    setError(null);
    setImporting(true);
    setActiveStep(3);

    try {
      await api.post('/pos-import/confirm', { jobId });
      const pollStatus = setInterval(async () => {
        try {
          const response = await api.get(`/pos-import/status/${jobId}`);
          const { status, result } = response.data.data;
          if (status === 'completed') {
            clearInterval(pollStatus);
            setImportResult(result);
            setImporting(false);
          } else if (status === 'failed') {
            clearInterval(pollStatus);
            setError('Import failed');
            setImporting(false);
          }
        } catch (err) {
          clearInterval(pollStatus);
          setError('Failed to check import status');
          setImporting(false);
        }
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Import failed');
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/pos-import/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'pos_import_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download template');
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setFile(null);
    setJobId(null);
    setPreview([]);
    setColumns([]);
    setTotalRows(0);
    setValidation(null);
    setImporting(false);
    setImportResult(null);
    setError(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>POS Data Import</Typography>
        <Button startIcon={<DownloadIcon />} onClick={handleDownloadTemplate} variant="outlined">
          Download Template
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Card>
          <CardContent>
            <Box {...getRootProps()} sx={{
              border: '2px dashed', borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2, p: 4, textAlign: 'center', cursor: 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'transparent', '&:hover': { bgcolor: 'action.hover' }
            }}>
              <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop file here' : 'Drag & drop file here, or click to select'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Supported formats: CSV, Excel (.xls, .xlsx)<br/>Maximum file size: 50MB
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep === 1 && preview.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Preview Data</Typography>
              <Chip label={`${totalRows} rows`} color="primary" />
            </Box>
            <Alert severity="info" sx={{ mb: 2 }}>Showing first 10 rows. Click "Validate" to check all data.</Alert>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {columns.map((col) => (
                      <TableCell key={col}><Typography variant="subtitle2" fontWeight="bold">{col}</Typography></TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.map((row, idx) => (
                    <TableRow key={idx}>
                      {columns.map((col) => (<TableCell key={col}>{row[col]}</TableCell>))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button onClick={handleReset}>Cancel</Button>
              <Button variant="contained" onClick={handleValidate} disabled={importing}>
                {importing ? <CircularProgress size={24} /> : 'Validate Data'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep === 2 && validation && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Validation Results</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>Total Rows</Typography>
                    <Typography variant="h4">{validation.totalRows}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined" sx={{ borderColor: 'success.main' }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>Valid Rows</Typography>
                    <Typography variant="h4" color="success.main">{validation.validCount}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined" sx={{ borderColor: validation.errorCount > 0 ? 'error.main' : 'grey.300' }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>Errors</Typography>
                    <Typography variant="h4" color={validation.errorCount > 0 ? 'error.main' : 'textSecondary'}>
                      {validation.errorCount}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            {validation.errors.length > 0 && (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {validation.errors.length} errors found. Rows with errors will be skipped.
                </Alert>
                <TableContainer component={Paper} sx={{ maxHeight: 300, mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Row</TableCell>
                        <TableCell>Field</TableCell>
                        <TableCell>Error</TableCell>
                        <TableCell>Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validation.errors.slice(0, 50).map((err, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{err.row}</TableCell>
                          <TableCell>{err.field}</TableCell>
                          <TableCell>{err.error}</TableCell>
                          <TableCell>{err.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {validation.errors.length > 50 && (
                  <Typography variant="caption" color="textSecondary">
                    Showing first 50 of {validation.errors.length} errors
                  </Typography>
                )}
              </>
            )}
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button onClick={handleReset}>Cancel</Button>
              <Button variant="contained" onClick={handleImport} disabled={validation.validCount === 0 || importing}
                startIcon={<CheckIcon />}>
                Import {validation.validCount} Valid Rows
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{importing ? 'Importing Data...' : 'Import Complete'}</Typography>
            {importing && (
              <Box sx={{ my: 3 }}>
                <LinearProgress />
                <Typography align="center" sx={{ mt: 2 }}>Please wait while we import your data...</Typography>
              </Box>
            )}
            {importResult && (
              <>
                <Alert severity="success" sx={{ mb: 3 }}>Import completed successfully!</Alert>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>Total Rows</Typography>
                        <Typography variant="h4">{importResult.total}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card variant="outlined" sx={{ borderColor: 'success.main' }}>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>Imported</Typography>
                        <Typography variant="h4" color="success.main">{importResult.imported}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card variant="outlined" sx={{ borderColor: importResult.failed > 0 ? 'error.main' : 'grey.300' }}>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>Failed</Typography>
                        <Typography variant="h4" color={importResult.failed > 0 ? 'error.main' : 'textSecondary'}>
                          {importResult.failed}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                <Button variant="contained" onClick={handleReset} fullWidth>Import Another File</Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default POSImport;
