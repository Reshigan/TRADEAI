import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Tabs, Tab, LinearProgress, Alert, Tooltip, CircularProgress, Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as RunIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Refresh as RefreshIcon,
  AutoFixHigh as AIIcon,
  History as HistoryIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { deductionResolutionService } from '../../services/api';

const formatCurrency = (v) => {
  if (v == null) return 'R 0';
  return `R ${Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const MATCH_FIELDS = [
  { value: 'customer_amount', label: 'Customer + Amount' },
  { value: 'customer_date', label: 'Customer + Date' },
  { value: 'invoice_number', label: 'Invoice Number' },
  { value: 'amount_only', label: 'Amount Only' },
  { value: 'reference_match', label: 'Reference Match' },
  { value: 'full_match', label: 'Full Match (All Fields)' },
];

const MATCH_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'within_range', label: 'Within Range' },
  { value: 'fuzzy', label: 'Fuzzy Match' },
];

const RULE_TYPES = [
  { value: 'match', label: 'Match Rule' },
  { value: 'threshold', label: 'Threshold Rule' },
  { value: 'pattern', label: 'Pattern Rule' },
  { value: 'composite', label: 'Composite Rule' },
];

const ACTION_TYPES = [
  { value: 'propose', label: 'Propose Match' },
  { value: 'auto_approve', label: 'Auto-Approve' },
  { value: 'escalate', label: 'Escalate' },
  { value: 'write_off', label: 'Write Off' },
];

const statusColor = (s) => {
  const map = { active: 'success', inactive: 'default', completed: 'success', running: 'info', failed: 'error', proposed: 'warning', approved: 'success', auto_approved: 'success', rejected: 'error' };
  return map[s] || 'default';
};

const confidenceColor = (score) => {
  if (score >= 90) return '#16A34A';
  if (score >= 70) return '#D97706';
  if (score >= 50) return '#EA580C';
  return '#DC2626';
};

const EMPTY_RULE = {
  name: '', description: '', ruleType: 'match', priority: 100,
  matchField: 'customer_amount', matchOperator: 'equals', matchValue: '',
  matchTolerancePct: 5, minConfidence: 70, autoApproveThreshold: 90,
  maxAmount: '', deductionTypes: '', customerScope: '', actionOnMatch: 'propose',
  glAccount: '', costCenter: '', effectiveDate: '', expiryDate: '', notes: '',
};

export default function DeductionResolutionManagement() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState(null);
  const [rules, setRules] = useState([]);
  const [runs, setRuns] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ruleDialog, setRuleDialog] = useState(false);
  const [ruleForm, setRuleForm] = useState({ ...EMPTY_RULE });
  const [editingRule, setEditingRule] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [rejectDialog, setRejectDialog] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, rulesRes, runsRes, matchRes] = await Promise.all([
        deductionResolutionService.getSummary().catch(() => ({ data: null })),
        deductionResolutionService.getRules().catch(() => ({ data: [] })),
        deductionResolutionService.getRuns().catch(() => ({ data: [] })),
        deductionResolutionService.getMatches({ status: 'proposed' }).catch(() => ({ data: [] })),
      ]);
      setSummary(sumRes.data || null);
      setRules(rulesRes.data || []);
      setRuns(runsRes.data || []);
      setMatches(matchRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaveRule = async () => {
    try {
      if (editingRule) {
        await deductionResolutionService.updateRule(editingRule, ruleForm);
      } else {
        await deductionResolutionService.createRule(ruleForm);
      }
      setRuleDialog(false);
      setEditingRule(null);
      setRuleForm({ ...EMPTY_RULE });
      load();
    } catch (e) { console.error(e); }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await deductionResolutionService.deleteRule(id);
      load();
    } catch (e) { console.error(e); }
  };

  const handleRunResolution = async () => {
    setResolving(true);
    try {
      await deductionResolutionService.resolve({ runType: 'manual' });
      load();
    } catch (e) { console.error(e); }
    setResolving(false);
  };

  const handleApproveMatch = async (id) => {
    try {
      await deductionResolutionService.approveMatch(id);
      load();
    } catch (e) { console.error(e); }
  };

  const handleRejectMatch = async () => {
    if (!rejectDialog) return;
    try {
      await deductionResolutionService.rejectMatch(rejectDialog, { reason: rejectReason });
      setRejectDialog(null);
      setRejectReason('');
      load();
    } catch (e) { console.error(e); }
  };

  const handleViewRun = async (id) => {
    try {
      const res = await deductionResolutionService.getRunById(id);
      setSelectedRun(res.data || null);
    } catch (e) { console.error(e); }
  };

  const openEditRule = (rule) => {
    setRuleForm({
      name: rule.name || '', description: rule.description || '',
      ruleType: rule.ruleType || rule.rule_type || 'match',
      priority: rule.priority || 100,
      matchField: rule.matchField || rule.match_field || 'customer_amount',
      matchOperator: rule.matchOperator || rule.match_operator || 'equals',
      matchValue: rule.matchValue || rule.match_value || '',
      matchTolerancePct: rule.matchTolerancePct ?? rule.match_tolerance_pct ?? 5,
      minConfidence: rule.minConfidence ?? rule.min_confidence ?? 70,
      autoApproveThreshold: rule.autoApproveThreshold ?? rule.auto_approve_threshold ?? 90,
      maxAmount: rule.maxAmount || rule.max_amount || '',
      deductionTypes: rule.deductionTypes || rule.deduction_types || '',
      customerScope: rule.customerScope || rule.customer_scope || '',
      actionOnMatch: rule.actionOnMatch || rule.action_on_match || 'propose',
      glAccount: rule.glAccount || rule.gl_account || '',
      costCenter: rule.costCenter || rule.cost_center || '',
      effectiveDate: rule.effectiveDate || rule.effective_date || '',
      expiryDate: rule.expiryDate || rule.expiry_date || '',
      notes: rule.notes || '',
    });
    setEditingRule(rule.id || rule._id);
    setRuleDialog(true);
  };

  const rs = summary?.runStats || {};
  const pendingReview = summary?.pendingReview || {};
  const resolved = summary?.resolved || {};
  const openDeds = summary?.openDeductions || {};

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Deduction Auto-Resolution</Typography>
          <Typography variant="body2" color="text.secondary">AI-powered matching engine for automatic deduction resolution</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>Refresh</Button>
          <Button variant="contained" startIcon={resolving ? <CircularProgress size={18} color="inherit" /> : <RunIcon />} onClick={handleRunResolution} disabled={resolving}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {resolving ? 'Resolving...' : 'Run Auto-Resolution'}
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Open Deductions', value: openDeds.count || 0, sub: formatCurrency(openDeds.amount), icon: <AIIcon />, color: '#DC2626' },
          { label: 'Pending Review', value: pendingReview.count || 0, sub: formatCurrency(pendingReview.amount), icon: <SpeedIcon />, color: '#D97706' },
          { label: 'Auto-Resolved', value: rs.totalAutoResolved || 0, sub: formatCurrency(resolved.amount), icon: <ApproveIcon />, color: '#16A34A' },
          { label: 'Avg Confidence', value: `${rs.avgConfidence || 0}%`, sub: `${summary?.activeRules || 0} active rules`, icon: <TrendIcon />, color: '#7C3AED' },
        ].map((c) => (
          <Grid item xs={6} md={3} key={c.label}>
            <Card sx={{ borderRadius: 3, border: '1px solid #F3F4F6' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                  <Box sx={{ color: c.color, opacity: 0.7 }}>{c.icon}</Box>
                </Box>
                <Typography variant="h5" fontWeight={700}>{c.value}</Typography>
                <Typography variant="caption" color="text.secondary">{c.sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #F3F4F6' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #F3F4F6', px: 2 }}>
          <Tab label="Pending Matches" />
          <Tab label="Resolution Rules" />
          <Tab label="Run History" />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ p: 2 }}>
            {matches.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>No pending matches. Run auto-resolution to find matches for open deductions.</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Deduction</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Matched To</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Confidence</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Reasons</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {matches.map((m) => {
                      let reasons = [];
                      try { reasons = JSON.parse(m.matchReasons || m.match_reasons || '[]'); } catch (e) {}
                      return (
                        <TableRow key={m.id || m._id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{m.deductionNumber || m.deduction_number || '—'}</Typography>
                            <Typography variant="caption" color="text.secondary">{m.customerName || m.customer_name || ''}</Typography>
                          </TableCell>
                          <TableCell>{formatCurrency(m.deductionAmount || m.deduction_amount)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>{m.matchedEntityName || m.matched_entity_name || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={m.matchedEntityType || m.matched_entity_type || 'unknown'} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 60, height: 6, borderRadius: 3, bgcolor: '#F3F4F6', overflow: 'hidden' }}>
                                <Box sx={{ width: `${m.confidenceScore || m.confidence_score || 0}%`, height: '100%', bgcolor: confidenceColor(m.confidenceScore || m.confidence_score || 0), borderRadius: 3 }} />
                              </Box>
                              <Typography variant="caption" fontWeight={600} sx={{ color: confidenceColor(m.confidenceScore || m.confidence_score || 0) }}>
                                {m.confidenceScore || m.confidence_score || 0}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {reasons.slice(0, 2).map((r, i) => (
                                <Chip key={i} label={r} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleApproveMatch(m.id || m._id)}><ApproveIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Reject"><IconButton size="small" color="error" onClick={() => { setRejectDialog(m.id || m._id); setRejectReason(''); }}><RejectIcon fontSize="small" /></IconButton></Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setRuleForm({ ...EMPTY_RULE }); setEditingRule(null); setRuleDialog(true); }}
                sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
                Add Rule
              </Button>
            </Box>
            {rules.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>No resolution rules configured. Add rules to enable automatic deduction matching.</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Rule</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Match Field</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Tolerance</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Confidence</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Auto-Approve</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Matches</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rules.map((r) => (
                      <TableRow key={r.id || r._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{r.description || '—'}</Typography>
                        </TableCell>
                        <TableCell><Chip label={r.ruleType || r.rule_type || 'match'} size="small" variant="outlined" /></TableCell>
                        <TableCell>{MATCH_FIELDS.find(f => f.value === (r.matchField || r.match_field))?.label || r.matchField || r.match_field}</TableCell>
                        <TableCell>{r.matchTolerancePct ?? r.match_tolerance_pct ?? 0}%</TableCell>
                        <TableCell>{r.minConfidence ?? r.min_confidence ?? 70}%</TableCell>
                        <TableCell>{r.autoApproveThreshold ?? r.auto_approve_threshold ?? 90}%</TableCell>
                        <TableCell><Chip label={r.actionOnMatch || r.action_on_match || 'propose'} size="small" color={r.actionOnMatch === 'auto_approve' || r.action_on_match === 'auto_approve' ? 'success' : 'default'} /></TableCell>
                        <TableCell>{r.matchCount || r.match_count || 0}</TableCell>
                        <TableCell><Chip label={r.status || 'active'} size="small" color={statusColor(r.status)} /></TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => openEditRule(r)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteRule(r.id || r._id)}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {tab === 2 && (
          <Box sx={{ p: 2 }}>
            {runs.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>No resolution runs yet. Click &quot;Run Auto-Resolution&quot; to start.</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Run #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Deductions</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Matched</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Auto-Resolved</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Needs Review</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Avg Confidence</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {runs.map((r) => (
                      <TableRow key={r.id || r._id} hover>
                        <TableCell><Typography variant="body2" fontWeight={600}>{r.runNumber || r.run_number || '—'}</Typography></TableCell>
                        <TableCell><Chip label={r.status} size="small" color={statusColor(r.status)} /></TableCell>
                        <TableCell>{r.runType || r.run_type || 'manual'}</TableCell>
                        <TableCell>{r.totalDeductions || r.total_deductions || 0}</TableCell>
                        <TableCell>{r.matchedCount || r.matched_count || 0}</TableCell>
                        <TableCell>{r.autoResolvedCount || r.auto_resolved_count || 0}</TableCell>
                        <TableCell>{r.needsReviewCount || r.needs_review_count || 0}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: confidenceColor(r.avgConfidence || r.avg_confidence || 0), fontWeight: 600 }}>
                            {r.avgConfidence || r.avg_confidence || 0}%
                          </Typography>
                        </TableCell>
                        <TableCell>{formatCurrency(r.totalAmount || r.total_amount)}</TableCell>
                        <TableCell>{r.processingTimeMs || r.processing_time_ms || 0}ms</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleViewRun(r.id || r._id)}><HistoryIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>

      {/* Rule Create/Edit Dialog */}
      <Dialog open={ruleDialog} onClose={() => setRuleDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingRule ? 'Edit Resolution Rule' : 'Create Resolution Rule'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={8}>
              <TextField fullWidth label="Rule Name" value={ruleForm.name} onChange={(e) => setRuleForm(p => ({ ...p, name: e.target.value }))} size="small" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Rule Type" value={ruleForm.ruleType} onChange={(e) => setRuleForm(p => ({ ...p, ruleType: e.target.value }))} size="small">
                {RULE_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={ruleForm.description} onChange={(e) => setRuleForm(p => ({ ...p, description: e.target.value }))} size="small" multiline rows={2} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Match Field" value={ruleForm.matchField} onChange={(e) => setRuleForm(p => ({ ...p, matchField: e.target.value }))} size="small">
                {MATCH_FIELDS.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Match Operator" value={ruleForm.matchOperator} onChange={(e) => setRuleForm(p => ({ ...p, matchOperator: e.target.value }))} size="small">
                {MATCH_OPERATORS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Match Tolerance %" type="number" value={ruleForm.matchTolerancePct} onChange={(e) => setRuleForm(p => ({ ...p, matchTolerancePct: Number(e.target.value) }))} size="small" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Min Confidence %" type="number" value={ruleForm.minConfidence} onChange={(e) => setRuleForm(p => ({ ...p, minConfidence: Number(e.target.value) }))} size="small" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Auto-Approve Threshold %" type="number" value={ruleForm.autoApproveThreshold} onChange={(e) => setRuleForm(p => ({ ...p, autoApproveThreshold: Number(e.target.value) }))} size="small" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Max Amount" type="number" value={ruleForm.maxAmount} onChange={(e) => setRuleForm(p => ({ ...p, maxAmount: e.target.value }))} size="small" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Priority" type="number" value={ruleForm.priority} onChange={(e) => setRuleForm(p => ({ ...p, priority: Number(e.target.value) }))} size="small" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Action on Match" value={ruleForm.actionOnMatch} onChange={(e) => setRuleForm(p => ({ ...p, actionOnMatch: e.target.value }))} size="small">
                {ACTION_TYPES.map(a => <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="GL Account" value={ruleForm.glAccount} onChange={(e) => setRuleForm(p => ({ ...p, glAccount: e.target.value }))} size="small" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Effective Date" type="date" value={ruleForm.effectiveDate} onChange={(e) => setRuleForm(p => ({ ...p, effectiveDate: e.target.value }))} size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Expiry Date" type="date" value={ruleForm.expiryDate} onChange={(e) => setRuleForm(p => ({ ...p, expiryDate: e.target.value }))} size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" value={ruleForm.notes} onChange={(e) => setRuleForm(p => ({ ...p, notes: e.target.value }))} size="small" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRuleDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRule} disabled={!ruleForm.name} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {editingRule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Match Dialog */}
      <Dialog open={!!rejectDialog} onClose={() => setRejectDialog(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Match</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Rejection Reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} size="small" multiline rows={3} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleRejectMatch}>Reject</Button>
        </DialogActions>
      </Dialog>

      {/* Run Detail Dialog */}
      <Dialog open={!!selectedRun} onClose={() => setSelectedRun(null)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Run Details — {selectedRun?.runNumber || selectedRun?.run_number || ''}
        </DialogTitle>
        <DialogContent>
          {selectedRun && (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {[
                  { label: 'Status', value: selectedRun.status },
                  { label: 'Total Deductions', value: selectedRun.totalDeductions || selectedRun.total_deductions || 0 },
                  { label: 'Matched', value: selectedRun.matchedCount || selectedRun.matched_count || 0 },
                  { label: 'Auto-Resolved', value: selectedRun.autoResolvedCount || selectedRun.auto_resolved_count || 0 },
                  { label: 'Needs Review', value: selectedRun.needsReviewCount || selectedRun.needs_review_count || 0 },
                  { label: 'Processing Time', value: `${selectedRun.processingTimeMs || selectedRun.processing_time_ms || 0}ms` },
                ].map((s) => (
                  <Grid item xs={6} md={2} key={s.label}>
                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    <Typography variant="body1" fontWeight={600}>{s.value}</Typography>
                  </Grid>
                ))}
              </Grid>
              {selectedRun.matches && selectedRun.matches.length > 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Deduction</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Matched To</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Confidence</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedRun.matches.map((m) => (
                        <TableRow key={m.id || m._id}>
                          <TableCell>{m.deductionNumber || m.deduction_number || '—'}</TableCell>
                          <TableCell>{formatCurrency(m.deductionAmount || m.deduction_amount)}</TableCell>
                          <TableCell>{m.matchedEntityName || m.matched_entity_name || '—'} ({m.matchedEntityType || m.matched_entity_type})</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: confidenceColor(m.confidenceScore || m.confidence_score || 0), fontWeight: 600 }}>
                              {m.confidenceScore || m.confidence_score || 0}%
                            </Typography>
                          </TableCell>
                          <TableCell><Chip label={m.status} size="small" color={statusColor(m.status)} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSelectedRun(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
