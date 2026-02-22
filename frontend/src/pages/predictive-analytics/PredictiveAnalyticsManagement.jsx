import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Button, TextField, IconButton, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Tabs, Tab,
  LinearProgress, Tooltip, Alert, CircularProgress
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, ModelTraining as TrainIcon,
  TrendingUp as PredictIcon, Assessment as ReportIcon,
  Warning as AnomalyIcon, Search as SearchIcon,
  Psychology as ModelIcon, Timeline as TimelineIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { predictiveAnalyticsService } from '../../services/api';

const statusColors = {
  draft: 'default', training: 'warning', trained: 'info', active: 'success', archived: 'default',
  pending: 'warning', completed: 'success', validated: 'info'
};

const PredictiveAnalyticsManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [summary, setSummary] = useState(null);
  const [models, setModels] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [total, setTotal] = useState(0);
  const [predTotal, setPredTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({});
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [predPage, setPredPage] = useState(0);
  const [predRowsPerPage, setPredRowsPerPage] = useState(25);
  const [selectedModel, setSelectedModel] = useState(null);
  const [detailView, setDetailView] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [formData, setFormData] = useState({});
  const [accuracyReport, setAccuracyReport] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [predictDialogOpen, setPredictDialogOpen] = useState(false);
  const [predictForm, setPredictForm] = useState({ periods: 12, baseValue: 100000 });

  const loadSummary = useCallback(async () => {
    try {
      const res = await predictiveAnalyticsService.getSummary();
      if (res.success) setSummary(res.data);
    } catch (e) { console.error('Error loading summary:', e); }
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      const res = await predictiveAnalyticsService.getOptions();
      if (res.success) setOptions(res.data);
    } catch (e) { console.error('Error loading options:', e); }
  }, []);

  const loadModels = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit: rowsPerPage, offset: page * rowsPerPage };
      if (search) params.search = search;
      if (typeFilter) params.model_type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await predictiveAnalyticsService.getModels(params);
      if (res.success) { setModels(res.data || []); setTotal(res.total || 0); }
    } catch (e) { console.error('Error loading models:', e); }
    finally { setLoading(false); }
  }, [page, rowsPerPage, search, typeFilter, statusFilter]);

  const loadPredictions = useCallback(async () => {
    try {
      const params = { limit: predRowsPerPage, offset: predPage * predRowsPerPage };
      if (selectedModel) params.model_id = selectedModel.id || selectedModel._id;
      const res = await predictiveAnalyticsService.getPredictions(params);
      if (res.success) { setPredictions(res.data || []); setPredTotal(res.total || 0); }
    } catch (e) { console.error('Error loading predictions:', e); }
  }, [predPage, predRowsPerPage, selectedModel]);

  const loadAccuracyReport = useCallback(async () => {
    try {
      const res = await predictiveAnalyticsService.getAccuracyReport();
      if (res.success) setAccuracyReport(res.data);
    } catch (e) { console.error('Error loading accuracy report:', e); }
  }, []);

  const loadAnomalies = useCallback(async () => {
    try {
      const res = await predictiveAnalyticsService.getAnomalies();
      if (res.success) setAnomalies(res.data || []);
    } catch (e) { console.error('Error loading anomalies:', e); }
  }, []);

  useEffect(() => { loadSummary(); loadOptions(); }, [loadSummary, loadOptions]);
  useEffect(() => { loadModels(); }, [loadModels]);
  useEffect(() => { if (activeTab === 1) loadPredictions(); }, [activeTab, loadPredictions]);
  useEffect(() => { if (activeTab === 2) loadAccuracyReport(); }, [activeTab, loadAccuracyReport]);
  useEffect(() => { if (activeTab === 3) loadAnomalies(); }, [activeTab, loadAnomalies]);

  const handleCreate = () => {
    setFormData({ name: '', description: '', modelType: 'revenue_forecast', targetMetric: 'revenue', algorithm: 'gradient_boosting', confidenceLevel: 0.95 });
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEdit = (model) => {
    setFormData({
      name: model.name || '', description: model.description || '',
      modelType: model.modelType || model.model_type || 'revenue_forecast',
      targetMetric: model.targetMetric || model.target_metric || 'revenue',
      algorithm: model.algorithm || 'gradient_boosting',
      confidenceLevel: model.confidenceLevel || model.confidence_level || 0.95,
      status: model.status || 'draft', notes: model.notes || ''
    });
    setSelectedModel(model);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setActionLoading(true);
      if (dialogMode === 'create') {
        await predictiveAnalyticsService.createModel(formData);
      } else {
        await predictiveAnalyticsService.updateModel(selectedModel.id || selectedModel._id, formData);
      }
      setDialogOpen(false);
      loadModels();
      loadSummary();
    } catch (e) { console.error('Error saving model:', e); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (model) => {
    if (!window.confirm(`Delete model "${model.name}"? This will also delete all associated predictions.`)) return;
    try {
      await predictiveAnalyticsService.deleteModel(model.id || model._id);
      loadModels();
      loadSummary();
    } catch (e) { console.error('Error deleting model:', e); }
  };

  const handleTrain = async (model) => {
    try {
      setActionLoading(true);
      await predictiveAnalyticsService.trainModel(model.id || model._id);
      loadModels();
      loadSummary();
    } catch (e) { console.error('Error training model:', e); }
    finally { setActionLoading(false); }
  };

  const handlePredict = async () => {
    try {
      setActionLoading(true);
      await predictiveAnalyticsService.generatePredictions(
        selectedModel.id || selectedModel._id, predictForm
      );
      setPredictDialogOpen(false);
      loadPredictions();
      loadSummary();
    } catch (e) { console.error('Error generating predictions:', e); }
    finally { setActionLoading(false); }
  };

  const handleViewDetail = async (model) => {
    try {
      const res = await predictiveAnalyticsService.getModelById(model.id || model._id);
      if (res.success) { setSelectedModel(res.data); setDetailView(true); }
    } catch (e) { console.error('Error loading model detail:', e); }
  };

  const fmt = (v) => v != null ? Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—';
  const fmtPct = (v) => v != null ? `${(Number(v) * 100).toFixed(1)}%` : '—';
  const fmtDec = (v) => v != null ? Number(v).toFixed(2) : '—';

  const summaryCards = summary ? [
    { label: 'Total Models', value: summary.models?.total || 0, color: '#7C3AED' },
    { label: 'Active Models', value: summary.models?.active || 0, color: '#10B981' },
    { label: 'Avg Accuracy', value: fmtPct(summary.models?.avgAccuracy), color: '#3B82F6' },
    { label: 'Total Predictions', value: fmt(summary.predictions?.total), color: '#F59E0B' },
    { label: 'Anomalies', value: summary.predictions?.anomalies || 0, color: '#EF4444' },
    { label: 'Avg R²', value: fmtDec(summary.models?.avgRSquared), color: '#8B5CF6' },
  ] : [];

  if (detailView && selectedModel) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => { setDetailView(false); setSelectedModel(null); }}><BackIcon /></IconButton>
          <Typography variant="h5" fontWeight={700}>{selectedModel.name}</Typography>
          <Chip label={selectedModel.status} color={statusColors[selectedModel.status] || 'default'} size="small" />
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" startIcon={<TrainIcon />} onClick={() => handleTrain(selectedModel)} disabled={actionLoading}>
            Train
          </Button>
          <Button variant="contained" startIcon={<PredictIcon />}
            onClick={() => { setPredictForm({ periods: 12, baseValue: 100000 }); setPredictDialogOpen(true); }}
            disabled={selectedModel.status !== 'trained' && selectedModel.status !== 'active'}
          >
            Generate Predictions
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[
            { label: 'Type', value: (options.modelTypes || []).find(t => t.value === (selectedModel.modelType || selectedModel.model_type))?.label || selectedModel.modelType || selectedModel.model_type },
            { label: 'Target', value: (options.targetMetrics || []).find(t => t.value === (selectedModel.targetMetric || selectedModel.target_metric))?.label || selectedModel.targetMetric || selectedModel.target_metric },
            { label: 'Algorithm', value: (options.algorithms || []).find(t => t.value === selectedModel.algorithm)?.label || selectedModel.algorithm },
            { label: 'Accuracy', value: fmtPct(selectedModel.accuracy) },
            { label: 'R²', value: fmtDec(selectedModel.rSquared || selectedModel.r_squared) },
            { label: 'MAPE', value: `${fmtDec(selectedModel.mape)}%` },
            { label: 'MAE', value: fmt(selectedModel.mae) },
            { label: 'RMSE', value: fmt(selectedModel.rmse) },
            { label: 'Training Records', value: fmt(selectedModel.trainingRecords || selectedModel.training_records) },
            { label: 'Version', value: selectedModel.version || 1 },
            { label: 'Confidence', value: fmtPct(selectedModel.confidenceLevel || selectedModel.confidence_level) },
            { label: 'Last Trained', value: selectedModel.lastTrainedAt || selectedModel.last_trained_at || '—' },
          ].map((item, i) => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Typography variant="h6" fontWeight={600}>{item.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {selectedModel.predictions && selectedModel.predictions.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Recent Predictions</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell align="right">Predicted</TableCell>
                    <TableCell align="right">Actual</TableCell>
                    <TableCell align="right">Variance %</TableCell>
                    <TableCell align="right">Confidence Range</TableCell>
                    <TableCell>Trend</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedModel.predictions.map((pred) => (
                    <TableRow key={pred.id || pred._id}>
                      <TableCell>{pred.period}</TableCell>
                      <TableCell align="right">R {fmt(pred.predictedValue || pred.predicted_value)}</TableCell>
                      <TableCell align="right">{pred.actualValue || pred.actual_value ? `R ${fmt(pred.actualValue || pred.actual_value)}` : '—'}</TableCell>
                      <TableCell align="right">{pred.variancePct || pred.variance_pct ? `${fmtDec(pred.variancePct || pred.variance_pct)}%` : '—'}</TableCell>
                      <TableCell align="right">
                        R {fmt(pred.confidenceLow || pred.confidence_low)} – R {fmt(pred.confidenceHigh || pred.confidence_high)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={pred.trendDirection || pred.trend_direction || 'stable'}
                          size="small"
                          color={(pred.trendDirection || pred.trend_direction) === 'up' ? 'success' : (pred.trendDirection || pred.trend_direction) === 'down' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell><Chip label={pred.status} size="small" color={statusColors[pred.status] || 'default'} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        <Dialog open={predictDialogOpen} onClose={() => setPredictDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Generate Predictions</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Number of Periods" type="number" value={predictForm.periods}
                onChange={(e) => setPredictForm({ ...predictForm, periods: parseInt(e.target.value) || 12 })}
                inputProps={{ min: 1, max: 36 }}
              />
              <TextField label="Base Value (R)" type="number" value={predictForm.baseValue}
                onChange={(e) => setPredictForm({ ...predictForm, baseValue: parseFloat(e.target.value) || 100000 })}
              />
              <TextField label="Start Date" type="date" value={predictForm.startDate || new Date().toISOString().slice(0, 10)}
                onChange={(e) => setPredictForm({ ...predictForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPredictDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handlePredict} disabled={actionLoading}>
              {actionLoading ? <CircularProgress size={20} /> : 'Generate'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Predictive Analytics</Typography>
          <Typography variant="body2" color="text.secondary">ML-driven predictions for revenue, demand, and customer behavior</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { loadSummary(); loadModels(); }}>Refresh</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>New Model</Button>
        </Box>
      </Box>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {summaryCards.map((card, i) => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: `3px solid ${card.color}` }}>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                <Typography variant="h5" fontWeight={700} sx={{ color: card.color }}>{card.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<ModelIcon />} label="Models" iconPosition="start" />
        <Tab icon={<TimelineIcon />} label="Predictions" iconPosition="start" />
        <Tab icon={<ReportIcon />} label="Accuracy Report" iconPosition="start" />
        <Tab icon={<AnomalyIcon />} label="Anomalies" iconPosition="start" />
      </Tabs>

      {activeTab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField size="small" placeholder="Search models..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              sx={{ flex: 1 }}
            />
            <TextField select size="small" label="Type" value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All Types</MenuItem>
              {(options.modelTypes || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Status" value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">All</MenuItem>
              {(options.statuses || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Box>
          {loading ? <LinearProgress /> : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Target</TableCell>
                      <TableCell>Algorithm</TableCell>
                      <TableCell align="right">Accuracy</TableCell>
                      <TableCell align="right">R²</TableCell>
                      <TableCell align="right">MAPE</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {models.map((m) => (
                      <TableRow key={m.id || m._id} hover sx={{ cursor: 'pointer' }} onClick={() => handleViewDetail(m)}>
                        <TableCell><Typography fontWeight={600}>{m.name}</Typography></TableCell>
                        <TableCell>{(options.modelTypes || []).find(t => t.value === (m.modelType || m.model_type))?.label || m.modelType || m.model_type}</TableCell>
                        <TableCell>{(options.targetMetrics || []).find(t => t.value === (m.targetMetric || m.target_metric))?.label || m.targetMetric || m.target_metric}</TableCell>
                        <TableCell>{(options.algorithms || []).find(t => t.value === m.algorithm)?.label || m.algorithm}</TableCell>
                        <TableCell align="right">{fmtPct(m.accuracy)}</TableCell>
                        <TableCell align="right">{fmtDec(m.rSquared || m.r_squared)}</TableCell>
                        <TableCell align="right">{m.mape ? `${fmtDec(m.mape)}%` : '—'}</TableCell>
                        <TableCell><Chip label={m.status} size="small" color={statusColors[m.status] || 'default'} /></TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Train"><IconButton size="small" onClick={() => handleTrain(m)}><TrainIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(m)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(m)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {models.length === 0 && (
                      <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No models found. Create your first predictive model.</Typography></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination component="div" count={total} page={page} rowsPerPage={rowsPerPage}
                onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
              />
            </>
          )}
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell align="right">Predicted</TableCell>
                  <TableCell align="right">Actual</TableCell>
                  <TableCell align="right">Variance %</TableCell>
                  <TableCell>Trend</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {predictions.map((p) => (
                  <TableRow key={p.id || p._id} hover>
                    <TableCell>{p.period}</TableCell>
                    <TableCell>{p.predictionType || p.prediction_type}</TableCell>
                    <TableCell>{p.entityName || p.entity_name || '—'}</TableCell>
                    <TableCell align="right">R {fmt(p.predictedValue || p.predicted_value)}</TableCell>
                    <TableCell align="right">{(p.actualValue || p.actual_value) ? `R ${fmt(p.actualValue || p.actual_value)}` : '—'}</TableCell>
                    <TableCell align="right">{(p.variancePct || p.variance_pct) ? `${fmtDec(p.variancePct || p.variance_pct)}%` : '—'}</TableCell>
                    <TableCell>
                      <Chip label={p.trendDirection || p.trend_direction || 'stable'} size="small"
                        color={(p.trendDirection || p.trend_direction) === 'up' ? 'success' : (p.trendDirection || p.trend_direction) === 'down' ? 'error' : 'default'}
                      />
                    </TableCell>
                    <TableCell><Chip label={p.status} size="small" color={statusColors[p.status] || 'default'} /></TableCell>
                  </TableRow>
                ))}
                {predictions.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No predictions yet. Train a model and generate predictions.</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={predTotal} page={predPage} rowsPerPage={predRowsPerPage}
            onPageChange={(_, p) => setPredPage(p)} onRowsPerPageChange={(e) => { setPredRowsPerPage(parseInt(e.target.value)); setPredPage(0); }}
          />
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>Model Accuracy Report</Typography>
          {accuracyReport ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>By Model</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Model</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Training Accuracy</TableCell>
                        <TableCell align="right">R²</TableCell>
                        <TableCell align="right">MAPE</TableCell>
                        <TableCell align="right">Predictions</TableCell>
                        <TableCell align="right">Avg Pred Accuracy</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(accuracyReport.byModel || []).map((m) => (
                        <TableRow key={m.id || m._id}>
                          <TableCell><Typography fontWeight={600}>{m.name}</Typography></TableCell>
                          <TableCell>{m.modelType || m.model_type}</TableCell>
                          <TableCell align="right">{fmtPct(m.accuracy)}</TableCell>
                          <TableCell align="right">{fmtDec(m.rSquared || m.r_squared)}</TableCell>
                          <TableCell align="right">{m.mape ? `${fmtDec(m.mape)}%` : '—'}</TableCell>
                          <TableCell align="right">{m.predictionCount || m.prediction_count || 0}</TableCell>
                          <TableCell align="right">{m.avgPredictionAccuracy || m.avg_prediction_accuracy ? fmtPct(m.avgPredictionAccuracy || m.avg_prediction_accuracy) : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              {accuracyReport.byPeriod && accuracyReport.byPeriod.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>By Period</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Period</TableCell>
                          <TableCell align="right">Predictions</TableCell>
                          <TableCell align="right">Avg Accuracy</TableCell>
                          <TableCell align="right">Avg |Variance|%</TableCell>
                          <TableCell align="right">Total Predicted</TableCell>
                          <TableCell align="right">Total Actual</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {accuracyReport.byPeriod.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell>{p.period}</TableCell>
                            <TableCell align="right">{p.predictionCount}</TableCell>
                            <TableCell align="right">{fmtPct(p.avgAccuracy / 100)}</TableCell>
                            <TableCell align="right">{fmtDec(p.avgAbsVariance)}%</TableCell>
                            <TableCell align="right">R {fmt(p.totalPredicted)}</TableCell>
                            <TableCell align="right">R {fmt(p.totalActual)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          ) : (
            <Alert severity="info">No accuracy data available yet. Train models and generate predictions to see accuracy reports.</Alert>
          )}
        </Paper>
      )}

      {activeTab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>Detected Anomalies</Typography>
          {anomalies.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Predicted</TableCell>
                    <TableCell align="right">Actual</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {anomalies.map((a) => (
                    <TableRow key={a.id || a._id}>
                      <TableCell>{a.period}</TableCell>
                      <TableCell>{a.modelName || a.model_name}</TableCell>
                      <TableCell>{a.modelType || a.model_type}</TableCell>
                      <TableCell align="right">R {fmt(a.predictedValue || a.predicted_value)}</TableCell>
                      <TableCell align="right">{(a.actualValue || a.actual_value) ? `R ${fmt(a.actualValue || a.actual_value)}` : '—'}</TableCell>
                      <TableCell>{a.anomalyReason || a.anomaly_reason || 'Statistical outlier'}</TableCell>
                      <TableCell><Chip label={a.status} size="small" color={statusColors[a.status] || 'default'} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="success">No anomalies detected. All predictions are within expected ranges.</Alert>
          )}
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'create' ? 'Create Predictive Model' : 'Edit Model'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Model Name" required value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField label="Description" multiline rows={2} value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField select label="Model Type" value={formData.modelType || 'revenue_forecast'}
              onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
            >
              {(options.modelTypes || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField select label="Target Metric" value={formData.targetMetric || 'revenue'}
              onChange={(e) => setFormData({ ...formData, targetMetric: e.target.value })}
            >
              {(options.targetMetrics || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField select label="Algorithm" value={formData.algorithm || 'gradient_boosting'}
              onChange={(e) => setFormData({ ...formData, algorithm: e.target.value })}
            >
              {(options.algorithms || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField label="Confidence Level" type="number" value={formData.confidenceLevel || 0.95}
              onChange={(e) => setFormData({ ...formData, confidenceLevel: parseFloat(e.target.value) })}
              inputProps={{ min: 0.5, max: 0.99, step: 0.01 }}
            />
            {dialogMode === 'edit' && (
              <TextField select label="Status" value={formData.status || 'draft'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {(options.statuses || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            )}
            <TextField label="Notes" multiline rows={2} value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.name || actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : (dialogMode === 'create' ? 'Create' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PredictiveAnalyticsManagement;
