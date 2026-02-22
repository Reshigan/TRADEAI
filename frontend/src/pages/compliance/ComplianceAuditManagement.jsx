import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select,
  FormControl, InputLabel, Tooltip, CircularProgress, Alert,
  LinearProgress, Card, CardContent,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as ResolvedIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PlayArrow as RunIcon,
  Assessment as ReportIcon,
  GppGood as ShieldIcon,
  ArrowUpward as EscalateIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';
import { complianceAuditService } from '../../services/api';

const severityColors = { critical: '#DC2626', high: '#EA580C', medium: '#D97706', low: '#059669' };
const statusColors = { open: '#DC2626', in_review: '#D97706', escalated: '#EA580C', resolved: '#059669', waived: '#6B7280', active: '#059669', inactive: '#9CA3AF', draft: '#6B7280', generated: '#2563EB' };

export default function ComplianceAuditManagement() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState(null);
  const [rules, setRules] = useState([]);
  const [violations, setViolations] = useState([]);
  const [auditTrails, setAuditTrails] = useState([]);
  const [reports, setReports] = useState([]);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ruleDialog, setRuleDialog] = useState({ open: false, mode: 'create', data: {} });
  const [checkDialog, setCheckDialog] = useState({ open: false, entityType: '', running: false, result: null });
  const [resolveDialog, setResolveDialog] = useState({ open: false, id: null, notes: '', action: 'acknowledged' });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, optionsRes] = await Promise.all([
        complianceAuditService.getSummary(),
        complianceAuditService.getOptions(),
      ]);
      setSummary(summaryRes.data);
      setOptions(optionsRes.data || {});

      if (tab === 0) {
        const res = await complianceAuditService.getViolations();
        setViolations(res.data || []);
      } else if (tab === 1) {
        const res = await complianceAuditService.getRules();
        setRules(res.data || []);
      } else if (tab === 2) {
        const res = await complianceAuditService.getAuditTrails();
        setAuditTrails(res.data || []);
      } else if (tab === 3) {
        const res = await complianceAuditService.getReports();
        setReports(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveRule = async () => {
    try {
      if (ruleDialog.mode === 'edit' && ruleDialog.data.id) {
        await complianceAuditService.updateRule(ruleDialog.data.id, ruleDialog.data);
      } else {
        await complianceAuditService.createRule(ruleDialog.data);
      }
      setRuleDialog({ open: false, mode: 'create', data: {} });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Delete this compliance rule?')) return;
    try {
      await complianceAuditService.deleteRule(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRunCheck = async () => {
    setCheckDialog(prev => ({ ...prev, running: true, result: null }));
    try {
      const res = await complianceAuditService.runCheck({ entityType: checkDialog.entityType });
      setCheckDialog(prev => ({ ...prev, running: false, result: res.data }));
      loadData();
    } catch (err) {
      setCheckDialog(prev => ({ ...prev, running: false, result: { error: err.message } }));
    }
  };

  const handleResolveViolation = async () => {
    try {
      await complianceAuditService.resolveViolation(resolveDialog.id, {
        resolutionNotes: resolveDialog.notes,
        resolutionAction: resolveDialog.action,
      });
      setResolveDialog({ open: false, id: null, notes: '', action: 'acknowledged' });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEscalateViolation = async (id) => {
    try {
      await complianceAuditService.escalateViolation(id, { escalatedTo: 'compliance_officer' });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReviewAudit = async (id) => {
    try {
      await complianceAuditService.reviewAuditTrail(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGenerateReport = async () => {
    try {
      await complianceAuditService.generateReport({});
      setTab(3);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const SummaryCards = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ borderLeft: '4px solid #7C3AED' }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">Compliance Score</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: (summary?.complianceScore || 0) >= 80 ? '#059669' : (summary?.complianceScore || 0) >= 50 ? '#D97706' : '#DC2626' }}>
                {summary?.complianceScore ?? 100}%
              </Typography>
              <ShieldIcon sx={{ color: '#7C3AED', fontSize: 28 }} />
            </Box>
            <LinearProgress
              variant="determinate"
              value={summary?.complianceScore ?? 100}
              sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: '#F3F4F6', '& .MuiLinearProgress-bar': { bgcolor: (summary?.complianceScore || 0) >= 80 ? '#059669' : (summary?.complianceScore || 0) >= 50 ? '#D97706' : '#DC2626' } }}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ borderLeft: '4px solid #DC2626' }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">Open Violations</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>{summary?.violations?.open || 0}</Typography>
            <Typography variant="caption" color="text.secondary">
              {summary?.violations?.critical || 0} critical, {summary?.violations?.high || 0} high
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ borderLeft: '4px solid #2563EB' }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">Active Rules</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>{summary?.rules?.active || 0}</Typography>
            <Typography variant="caption" color="text.secondary">of {summary?.rules?.total || 0} total</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ borderLeft: '4px solid #D97706' }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">Pending Reviews</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>{summary?.audits?.pendingReview || 0}</Typography>
            <Typography variant="caption" color="text.secondary">{summary?.audits?.flagged || 0} flagged audits</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const ViolationsTab = () => (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#F9FAFB' }}>
            <TableCell sx={{ fontWeight: 600 }}>Rule</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Entity</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Risk Score</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Impact</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Detected</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {violations.length === 0 ? (
            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No violations found</TableCell></TableRow>
          ) : violations.map((v) => (
            <TableRow key={v.id || v._id} hover>
              <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{v.ruleName || v.rule_name || '-'}</Typography></TableCell>
              <TableCell>
                <Typography variant="body2">{v.entityName || v.entity_name || '-'}</Typography>
                <Typography variant="caption" color="text.secondary">{v.entityType || v.entity_type}</Typography>
              </TableCell>
              <TableCell>
                <Chip label={v.severity} size="small" sx={{ bgcolor: severityColors[v.severity] || '#6B7280', color: '#fff', fontWeight: 600, fontSize: '0.7rem' }} />
              </TableCell>
              <TableCell><Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.description || '-'}</Typography></TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: (v.riskScore || v.risk_score || 0) >= 70 ? '#DC2626' : (v.riskScore || v.risk_score || 0) >= 40 ? '#D97706' : '#059669' }}>
                    {v.riskScore || v.risk_score || 0}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell><Typography variant="body2">R {(v.financialImpact || v.financial_impact || 0).toLocaleString()}</Typography></TableCell>
              <TableCell><Chip label={v.status} size="small" sx={{ bgcolor: statusColors[v.status] || '#6B7280', color: '#fff', fontSize: '0.7rem' }} /></TableCell>
              <TableCell><Typography variant="caption">{v.detectedAt || v.detected_at ? new Date(v.detectedAt || v.detected_at).toLocaleDateString() : '-'}</Typography></TableCell>
              <TableCell align="right">
                {v.status === 'open' && (
                  <>
                    <Tooltip title="Resolve"><IconButton size="small" onClick={() => setResolveDialog({ open: true, id: v.id || v._id, notes: '', action: 'acknowledged' })}><ResolvedIcon sx={{ fontSize: 18, color: '#059669' }} /></IconButton></Tooltip>
                    <Tooltip title="Escalate"><IconButton size="small" onClick={() => handleEscalateViolation(v.id || v._id)}><EscalateIcon sx={{ fontSize: 18, color: '#EA580C' }} /></IconButton></Tooltip>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const RulesTab = () => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setRuleDialog({ open: true, mode: 'create', data: { ruleType: 'threshold', category: 'general', severity: 'medium', entityType: 'promotion', operator: 'greater_than', actionOnViolation: 'flag', escalationHours: 24 } })} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
          Add Rule
        </Button>
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F9FAFB' }}>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Entity</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Field</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Operator</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Threshold</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Violations</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No rules configured</TableCell></TableRow>
            ) : rules.map((r) => (
              <TableRow key={r.id || r._id} hover>
                <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{r.name}</Typography></TableCell>
                <TableCell><Typography variant="body2">{r.ruleType || r.rule_type || '-'}</Typography></TableCell>
                <TableCell><Typography variant="body2">{r.entityType || r.entity_type || '-'}</Typography></TableCell>
                <TableCell><Typography variant="body2">{r.fieldName || r.field_name || '-'}</Typography></TableCell>
                <TableCell><Typography variant="body2">{r.operator || '-'}</Typography></TableCell>
                <TableCell><Typography variant="body2">{r.thresholdValue || r.threshold_value || '-'}</Typography></TableCell>
                <TableCell><Chip label={r.severity} size="small" sx={{ bgcolor: severityColors[r.severity] || '#6B7280', color: '#fff', fontSize: '0.7rem' }} /></TableCell>
                <TableCell><Typography variant="body2">{r.violationCount || r.violation_count || 0}</Typography></TableCell>
                <TableCell><Chip label={r.status} size="small" sx={{ bgcolor: statusColors[r.status] || '#6B7280', color: '#fff', fontSize: '0.7rem' }} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => setRuleDialog({ open: true, mode: 'edit', data: { ...r } })}><EditIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDeleteRule(r.id || r._id)}><DeleteIcon sx={{ fontSize: 18, color: '#DC2626' }} /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );

  const AuditTrailsTab = () => (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#F9FAFB' }}>
            <TableCell sx={{ fontWeight: 600 }}>Entity</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Field</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Old Value</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>New Value</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Risk</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Flagged</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {auditTrails.length === 0 ? (
            <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No audit trails found</TableCell></TableRow>
          ) : auditTrails.map((a) => (
            <TableRow key={a.id || a._id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{a.entityName || a.entity_name || '-'}</Typography>
                <Typography variant="caption" color="text.secondary">{a.entityType || a.entity_type}</Typography>
              </TableCell>
              <TableCell><Chip label={a.action} size="small" variant="outlined" /></TableCell>
              <TableCell><Typography variant="body2">{a.fieldName || a.field_name || '-'}</Typography></TableCell>
              <TableCell><Typography variant="body2" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.oldValue || a.old_value || '-'}</Typography></TableCell>
              <TableCell><Typography variant="body2" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.newValue || a.new_value || '-'}</Typography></TableCell>
              <TableCell><Typography variant="body2">{a.userName || a.user_name || a.userId || a.user_id || '-'}</Typography></TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600, color: (a.riskScore || a.risk_score || 0) >= 70 ? '#DC2626' : (a.riskScore || a.risk_score || 0) >= 40 ? '#D97706' : '#059669' }}>
                  {a.riskScore || a.risk_score || 0}
                </Typography>
              </TableCell>
              <TableCell>{(a.flagged) ? <WarningIcon sx={{ fontSize: 18, color: '#DC2626' }} /> : <Typography variant="body2" color="text.secondary">-</Typography>}</TableCell>
              <TableCell><Typography variant="caption">{a.createdAt || a.created_at ? new Date(a.createdAt || a.created_at).toLocaleString() : '-'}</Typography></TableCell>
              <TableCell align="right">
                {a.flagged && !a.reviewed && (
                  <Tooltip title="Mark Reviewed"><IconButton size="small" onClick={() => handleReviewAudit(a.id || a._id)}><ReviewIcon sx={{ fontSize: 18, color: '#2563EB' }} /></IconButton></Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const ReportsTab = () => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<ReportIcon />} onClick={handleGenerateReport} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
          Generate Report
        </Button>
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F9FAFB' }}>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Rules</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Violations</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Financial Impact</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Generated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No reports generated yet</TableCell></TableRow>
            ) : reports.map((r) => (
              <TableRow key={r.id || r._id} hover>
                <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{r.name}</Typography></TableCell>
                <TableCell><Typography variant="body2">{r.reportType || r.report_type || '-'}</Typography></TableCell>
                <TableCell><Typography variant="caption">{r.periodStart || r.period_start || '-'} to {r.periodEnd || r.period_end || '-'}</Typography></TableCell>
                <TableCell><Typography variant="body2">{r.activeRules || r.active_rules || 0}/{r.totalRules || r.total_rules || 0}</Typography></TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {r.openViolations || r.open_violations || 0} open / {r.totalViolations || r.total_violations || 0} total
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: (r.complianceScore || r.compliance_score || 0) >= 80 ? '#059669' : '#DC2626' }}>
                    {r.complianceScore || r.compliance_score || 0}%
                  </Typography>
                </TableCell>
                <TableCell><Typography variant="body2">R {(r.totalFinancialImpact || r.total_financial_impact || 0).toLocaleString()}</Typography></TableCell>
                <TableCell><Chip label={r.status} size="small" sx={{ bgcolor: statusColors[r.status] || '#6B7280', color: '#fff', fontSize: '0.7rem' }} /></TableCell>
                <TableCell><Typography variant="caption">{r.generatedAt || r.generated_at ? new Date(r.generatedAt || r.generated_at).toLocaleDateString() : '-'}</Typography></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SecurityIcon sx={{ fontSize: 28, color: '#7C3AED' }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Compliance & Audit Engine</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RunIcon />} onClick={() => setCheckDialog({ open: true, entityType: 'promotion', running: false, result: null })} sx={{ borderColor: '#7C3AED', color: '#7C3AED' }}>
            Run Check
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} sx={{ borderColor: '#7C3AED', color: '#7C3AED' }}>
            Refresh
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <SummaryCards />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }, '& .Mui-selected': { color: '#7C3AED' }, '& .MuiTabs-indicator': { bgcolor: '#7C3AED' } }}>
        <Tab label={`Violations (${summary?.violations?.open || 0})`} icon={<WarningIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label={`Rules (${summary?.rules?.active || 0})`} icon={<SecurityIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label={`Audit Trail (${summary?.audits?.total || 0})`} icon={<ViewIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Reports" icon={<ReportIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#7C3AED' }} /></Box>
      ) : (
        <>
          {tab === 0 && <ViolationsTab />}
          {tab === 1 && <RulesTab />}
          {tab === 2 && <AuditTrailsTab />}
          {tab === 3 && <ReportsTab />}
        </>
      )}

      <Dialog open={ruleDialog.open} onClose={() => setRuleDialog({ open: false, mode: 'create', data: {} })} maxWidth="sm" fullWidth>
        <DialogTitle>{ruleDialog.mode === 'edit' ? 'Edit Rule' : 'Add Compliance Rule'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Name" value={ruleDialog.data.name || ''} onChange={(e) => setRuleDialog(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))} fullWidth required />
          <TextField label="Description" value={ruleDialog.data.description || ''} onChange={(e) => setRuleDialog(prev => ({ ...prev, data: { ...prev.data, description: e.target.value } }))} fullWidth multiline rows={2} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Entity Type</InputLabel>
                <Select label="Entity Type" value={ruleDialog.data.entityType || ruleDialog.data.entity_type || ''} onChange={(e) => setRuleDialog(prev => ({ ...prev, data: { ...prev.data, entityType: e.target.value } }))}>
                  {(options.entityTypes || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select label="Severity" value={ruleDialog.data.severity || 'medium'} onChange={(e) => setRuleDialog(prev => ({ ...prev, data: { ...prev.data, severity: e.target.value } }))}>
                  {(options.severities || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select label="Category" value={ruleDialog.data.category || 'general'} onChange={(e) => setRuleDialog(prev => ({ ...prev, data: { ...prev.data, category: e.target.value } }))}>
                  {(options.categories || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Rule Type</InputLabel>
                <Select label="Rule Type" value={ruleDialog.data.ruleType || ruleDialog.data.rule_type || 'threshold'} onChange={(e) => setRuleDialog(prev => ({ ...prev, data: { ...prev.data, ruleType: e.target.value } }))}>
                  {(options.ruleTypes || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <TextField label="Field Name" value={ruleDialog.data.fieldName || ruleDialog.data.field_name || ''} onChange={(e) => setRuleDialog(prev => ({ ...prev, data: { ...prev.data, fieldName: e.target.value } }))} fullWidth placeholder="e.g., amount, claimed_amount" />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Operator</InputLabel>
                <Select label="Operator" value={ruleDialog.data.operator || 'greater_than'} onChange={(e) => setRuleDialog(prev => ({ ...prev, data: { ...prev.data, operator: e.target.value } }))}>
                  {(options.operators || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Threshold Value" value={ruleDialog.data.thresholdValue || ruleDialog.data.threshold_value || ''} onChange={(e) => setRuleDialog(prev => ({ ...prev, data: { ...prev.data, thresholdValue: e.target.value } }))} fullWidth />
            </Grid>
          </Grid>
          <FormControl fullWidth>
            <InputLabel>Action on Violation</InputLabel>
            <Select label="Action on Violation" value={ruleDialog.data.actionOnViolation || ruleDialog.data.action_on_violation || 'flag'} onChange={(e) => setRuleDialog(prev => ({ ...prev, data: { ...prev.data, actionOnViolation: e.target.value } }))}>
              {(options.actions || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Notes" value={ruleDialog.data.notes || ''} onChange={(e) => setRuleDialog(prev => ({ ...prev, data: { ...prev.data, notes: e.target.value } }))} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialog({ open: false, mode: 'create', data: {} })}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRule} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>{ruleDialog.mode === 'edit' ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={checkDialog.open} onClose={() => setCheckDialog({ open: false, entityType: '', running: false, result: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Run Compliance Check</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <FormControl fullWidth>
            <InputLabel>Entity Type</InputLabel>
            <Select label="Entity Type" value={checkDialog.entityType} onChange={(e) => setCheckDialog(prev => ({ ...prev, entityType: e.target.value }))}>
              {(options.entityTypes || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>
          {checkDialog.running && <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: '#7C3AED' } }} />}
          {checkDialog.result && !checkDialog.result.error && (
            <Alert severity={checkDialog.result.violationsFound > 0 ? 'warning' : 'success'}>
              Checked {checkDialog.result.entitiesChecked} entities against {checkDialog.result.rulesEvaluated} rules. Found {checkDialog.result.violationsFound} violations.
            </Alert>
          )}
          {checkDialog.result?.error && <Alert severity="error">{checkDialog.result.error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckDialog({ open: false, entityType: '', running: false, result: null })}>Close</Button>
          <Button variant="contained" onClick={handleRunCheck} disabled={!checkDialog.entityType || checkDialog.running} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>Run Check</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={resolveDialog.open} onClose={() => setResolveDialog({ open: false, id: null, notes: '', action: 'acknowledged' })} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Violation</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <FormControl fullWidth>
            <InputLabel>Resolution Action</InputLabel>
            <Select label="Resolution Action" value={resolveDialog.action} onChange={(e) => setResolveDialog(prev => ({ ...prev, action: e.target.value }))}>
              <MenuItem value="acknowledged">Acknowledged</MenuItem>
              <MenuItem value="corrected">Corrected</MenuItem>
              <MenuItem value="waived">Waived</MenuItem>
              <MenuItem value="false_positive">False Positive</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Resolution Notes" value={resolveDialog.notes} onChange={(e) => setResolveDialog(prev => ({ ...prev, notes: e.target.value }))} fullWidth multiline rows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialog({ open: false, id: null, notes: '', action: 'acknowledged' })}>Cancel</Button>
          <Button variant="contained" onClick={handleResolveViolation} sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}>Resolve</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
