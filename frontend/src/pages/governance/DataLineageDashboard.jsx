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
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  AccountTree as LineageIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dataLineageService from '../../services/dataLineage/dataLineageService';

const DataLineageDashboard = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [entityType, setEntityType] = useState('promotion');
  const [entityId, setEntityId] = useState('');
  const [lineageData, setLineageData] = useState([]);
  const [calculationSummary, setCalculationSummary] = useState([]);
  const [overriddenCalculations, setOverriddenCalculations] = useState([]);
  const [importBatches, setImportBatches] = useState([]);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [selectedLineage, setSelectedLineage] = useState(null);
  const [overrideValue, setOverrideValue] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    loadOverriddenCalculations();
    loadImportBatches();
  }, []);

  const loadOverriddenCalculations = async () => {
    try {
      const response = await dataLineageService.getOverriddenCalculations();
      setOverriddenCalculations(response.data || []);
    } catch (error) {
      console.error('Error loading overridden calculations:', error);
    }
  };

  const loadImportBatches = async () => {
    try {
      const response = await dataLineageService.getImportBatches();
      setImportBatches(response.data || []);
    } catch (error) {
      console.error('Error loading import batches:', error);
    }
  };

  const handleSearch = async () => {
    if (!entityId) {
      enqueueSnackbar('Please enter an entity ID', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const [lineageResponse, summaryResponse] = await Promise.all([
        dataLineageService.getLineageForEntity(entityType, entityId),
        dataLineageService.getCalculationSummary(entityType, entityId)
      ]);

      setLineageData(lineageResponse.data || []);
      setCalculationSummary(summaryResponse.data || []);
      enqueueSnackbar('Lineage data loaded successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error loading lineage:', error);
      enqueueSnackbar('Failed to load lineage data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideClick = (lineage) => {
    setSelectedLineage(lineage);
    setOverrideValue(lineage.calculatedValue?.toString() || '');
    setOverrideReason('');
    setOverrideDialogOpen(true);
  };

  const handleOverrideSubmit = async () => {
    if (!overrideValue || !overrideReason) {
      enqueueSnackbar('Please provide both value and reason', { variant: 'warning' });
      return;
    }

    try {
      await dataLineageService.overrideCalculation({
        entityType: selectedLineage.entityType,
        entityId: selectedLineage.entityId,
        metricType: selectedLineage.metricType,
        newValue: parseFloat(overrideValue),
        reason: overrideReason
      });

      enqueueSnackbar('Calculation overridden successfully', { variant: 'success' });
      setOverrideDialogOpen(false);
      handleSearch();
      loadOverriddenCalculations();
    } catch (error) {
      console.error('Error overriding calculation:', error);
      enqueueSnackbar('Failed to override calculation', { variant: 'error' });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (value) => {
    if (typeof value !== 'number') return value;
    return new Intl.NumberFormat('en-ZA', {
      maximumFractionDigits: 2
    }).format(value);
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const renderLineageTree = (lineage) => (
    <Accordion key={lineage._id}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Chip
            label={lineage.metricType?.replace(/_/g, ' ').toUpperCase()}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            {formatNumber(lineage.calculatedValue)}
          </Typography>
          {lineage.manualOverride?.isOverridden && (
            <Chip label="Overridden" size="small" color="warning" />
          )}
          {lineage.confidence?.score && (
            <Chip
              label={`${Math.round(lineage.confidence.score * 100)}% confidence`}
              size="small"
              color={getConfidenceColor(lineage.confidence.score)}
            />
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" color="textSecondary">
            {formatDate(lineage.calculatedAt)}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Calculation Method</Typography>
            <Typography variant="body2" color="textSecondary">
              {lineage.calculationMethod}
            </Typography>

            {lineage.formula && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Formula</Typography>
                <Paper sx={{ p: 1, bgcolor: 'grey.100' }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {lineage.formula.expression}
                  </Typography>
                </Paper>
                {lineage.formula.description && (
                  <Typography variant="caption" color="textSecondary">
                    {lineage.formula.description}
                  </Typography>
                )}
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Data Inputs</Typography>
            {lineage.inputs?.map((input, idx) => (
              <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Source:</strong> {input.sourceType}
                </Typography>
                {input.field && (
                  <Typography variant="body2">
                    <strong>Field:</strong> {input.field}
                  </Typography>
                )}
                {input.recordCount && (
                  <Typography variant="body2">
                    <strong>Records:</strong> {input.recordCount}
                  </Typography>
                )}
                {input.dateRange && (
                  <Typography variant="caption" color="textSecondary">
                    {formatDate(input.dateRange.start)} - {formatDate(input.dateRange.end)}
                  </Typography>
                )}
              </Box>
            ))}
          </Grid>

          {lineage.auditTrail?.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Audit Trail</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Action</TableCell>
                      <TableCell>Previous Value</TableCell>
                      <TableCell>New Value</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lineage.auditTrail.map((entry, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Chip label={entry.action} size="small" />
                        </TableCell>
                        <TableCell>{formatNumber(entry.previousValue)}</TableCell>
                        <TableCell>{formatNumber(entry.newValue)}</TableCell>
                        <TableCell>{entry.reason}</TableCell>
                        <TableCell>{formatDate(entry.performedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleOverrideClick(lineage)}
              >
                Override Value
              </Button>
            </Box>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="/dashboard">Home</Link>
        <Link color="inherit" href="/admin">Admin</Link>
        <Typography color="text.primary">Data Lineage</Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Data Lineage & Audit Trail
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Trace calculations back to source data, view audit history, and manage overrides
        </Typography>
      </Box>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<LineageIcon />} label="Lineage Explorer" />
        <Tab icon={<HistoryIcon />} label="Overridden Values" />
        <Tab icon={<DownloadIcon />} label="Import History" />
      </Tabs>

      {activeTab === 0 && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Entity Type"
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                  >
                    <MenuItem value="promotion">Promotion</MenuItem>
                    <MenuItem value="trade_spend">Trade Spend</MenuItem>
                    <MenuItem value="budget">Budget</MenuItem>
                    <MenuItem value="claim">Claim</MenuItem>
                    <MenuItem value="deduction">Deduction</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Entity ID"
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                    placeholder="Enter the ID of the entity to trace"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<LineageIcon />}
                    onClick={handleSearch}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Trace Lineage'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {calculationSummary.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Calculation Summary</Typography>
                <Grid container spacing={2}>
                  {calculationSummary.map((metric) => (
                    <Grid item xs={12} sm={6} md={3} key={metric._id}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="textSecondary">
                          {metric._id?.replace(/_/g, ' ').toUpperCase()}
                        </Typography>
                        <Typography variant="h5">
                          {formatNumber(metric.currentValue)}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                          {metric.isOverridden ? (
                            <Chip label="Overridden" size="small" color="warning" />
                          ) : (
                            <Chip label="Calculated" size="small" color="success" />
                          )}
                          {metric.confidence && (
                            <Chip
                              label={`${Math.round(metric.confidence * 100)}%`}
                              size="small"
                              color={getConfidenceColor(metric.confidence)}
                            />
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {lineageData.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Detailed Lineage</Typography>
                {lineageData.map(renderLineageTree)}
              </CardContent>
            </Card>
          )}

          {!loading && lineageData.length === 0 && entityId && (
            <Alert severity="info">
              No lineage data found for this entity. The entity may not have any calculated metrics yet.
            </Alert>
          )}
        </>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Overridden Calculations</Typography>
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadOverriddenCalculations}
              >
                Refresh
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Entity</TableCell>
                    <TableCell>Metric</TableCell>
                    <TableCell>Original Value</TableCell>
                    <TableCell>Current Value</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Overridden By</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overriddenCalculations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="textSecondary">No overridden calculations</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    overriddenCalculations.map((calc) => (
                      <TableRow key={calc._id}>
                        <TableCell>
                          <Chip label={calc.entityType} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{calc.metricType?.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{formatNumber(calc.manualOverride?.originalValue)}</TableCell>
                        <TableCell>{formatNumber(calc.calculatedValue)}</TableCell>
                        <TableCell>{calc.manualOverride?.reason}</TableCell>
                        <TableCell>
                          {calc.manualOverride?.overriddenBy?.firstName} {calc.manualOverride?.overriddenBy?.lastName}
                        </TableCell>
                        <TableCell>{formatDate(calc.manualOverride?.overriddenAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Import History</Typography>
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadImportBatches}
              >
                Refresh
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Batch ID</TableCell>
                    <TableCell>Entity Type</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Rows</TableCell>
                    <TableCell>Errors</TableCell>
                    <TableCell>Uploaded By</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importBatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="textSecondary">No import batches found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    importBatches.map((batch) => (
                      <TableRow key={batch._id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {batch.batchId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={batch.entityType} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{batch.source}</TableCell>
                        <TableCell>
                          <Chip
                            label={batch.status}
                            size="small"
                            color={batch.status === 'completed' ? 'success' : batch.status === 'failed' ? 'error' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>
                          {batch.rowCounts?.total || 0} total / {batch.rowCounts?.successful || 0} success
                        </TableCell>
                        <TableCell>
                          {(batch.validationErrors?.length || 0) + (batch.processingErrors?.length || 0)}
                        </TableCell>
                        <TableCell>
                          {batch.uploadedBy?.firstName} {batch.uploadedBy?.lastName}
                        </TableCell>
                        <TableCell>{formatDate(batch.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Dialog open={overrideDialogOpen} onClose={() => setOverrideDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Override Calculation Value</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Overriding a calculated value will be recorded in the audit trail. Please provide a reason.
          </Alert>
          <TextField
            fullWidth
            label="New Value"
            type="number"
            value={overrideValue}
            onChange={(e) => setOverrideValue(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Reason for Override"
            multiline
            rows={3}
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Explain why this value is being overridden..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleOverrideSubmit}>
            Override Value
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataLineageDashboard;
