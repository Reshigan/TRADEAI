import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Tooltip,
  LinearProgress, Stepper, Step, StepLabel, CircularProgress, Alert
} from '@mui/material';
import {
  Add as AddIcon, PlayArrow as TriggerIcon, CheckCircle as ApproveIcon,
  Cancel as RejectIcon, Delete as DeleteIcon, Edit as EditIcon,
  Refresh as RefreshIcon, AccountTree as WorkflowIcon,
  AutoFixHigh as AutomationIcon, Visibility as ViewIcon
} from '@mui/icons-material';
import { workflowAutomationService } from '../../services/api';

const statusColors = {
  active: 'success', completed: 'info', pending: 'warning', rejected: 'error',
  cancelled: 'default', draft: 'default', paused: 'warning'
};

const priorityColors = {
  urgent: 'error', high: 'warning', normal: 'info', low: 'default'
};

const WorkflowAutomationManagement = () => {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [instances, setInstances] = useState([]);
  const [rules, setRules] = useState([]);
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [ruleDialog, setRuleDialog] = useState(false);
  const [triggerDialog, setTriggerDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '', description: '', workflowType: 'approval', category: 'general',
    triggerEntity: 'promotion', triggerEvent: 'created', slaHours: 24,
    escalationEnabled: false, escalationAfterHours: 48, notificationEnabled: true,
    autoApproveBelow: '', requireAllApprovers: false, steps: []
  });
  const [ruleForm, setRuleForm] = useState({
    name: '', description: '', ruleType: 'trigger', triggerEntity: 'promotion',
    triggerEvent: 'created', triggerField: '', triggerOperator: 'equals',
    triggerValue: '', actionType: 'notify', actionTarget: '', priority: 100
  });
  const [triggerForm, setTriggerForm] = useState({
    templateId: '', entityType: '', entityId: '', entityName: '', entityAmount: 0, priority: 'normal'
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, optionsRes] = await Promise.all([
        workflowAutomationService.getSummary(),
        workflowAutomationService.getOptions()
      ]);
      setSummary(summaryRes.data);
      setOptions(optionsRes.data);

      if (tab === 0) {
        const res = await workflowAutomationService.getInstances();
        setInstances(res.data || []);
      } else if (tab === 1) {
        const res = await workflowAutomationService.getTemplates();
        setTemplates(res.data || []);
      } else if (tab === 2) {
        const res = await workflowAutomationService.getRules();
        setRules(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load workflow data:', err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateTemplate = async () => {
    try {
      if (editingTemplate) {
        await workflowAutomationService.updateTemplate(editingTemplate.id, templateForm);
      } else {
        await workflowAutomationService.createTemplate(templateForm);
      }
      setTemplateDialog(false);
      setEditingTemplate(null);
      setTemplateForm({
        name: '', description: '', workflowType: 'approval', category: 'general',
        triggerEntity: 'promotion', triggerEvent: 'created', slaHours: 24,
        escalationEnabled: false, escalationAfterHours: 48, notificationEnabled: true,
        autoApproveBelow: '', requireAllApprovers: false, steps: []
      });
      loadData();
    } catch (err) {
      console.error('Failed to save template:', err);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Delete this workflow template?')) return;
    try {
      await workflowAutomationService.deleteTemplate(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const handleTriggerWorkflow = async () => {
    try {
      await workflowAutomationService.triggerWorkflow(triggerForm);
      setTriggerDialog(false);
      setTriggerForm({ templateId: '', entityType: '', entityId: '', entityName: '', entityAmount: 0, priority: 'normal' });
      loadData();
    } catch (err) {
      console.error('Failed to trigger workflow:', err);
    }
  };

  const handleApproveStep = async (stepId) => {
    try {
      await workflowAutomationService.approveStep(stepId, { notes: 'Approved' });
      loadData();
      if (selectedInstance) {
        const res = await workflowAutomationService.getInstanceById(selectedInstance.id);
        setSelectedInstance(res.data);
      }
    } catch (err) {
      console.error('Failed to approve step:', err);
    }
  };

  const handleRejectStep = async (stepId) => {
    try {
      await workflowAutomationService.rejectStep(stepId, { notes: 'Rejected' });
      loadData();
      if (selectedInstance) {
        const res = await workflowAutomationService.getInstanceById(selectedInstance.id);
        setSelectedInstance(res.data);
      }
    } catch (err) {
      console.error('Failed to reject step:', err);
    }
  };

  const handleCancelInstance = async (id) => {
    if (!window.confirm('Cancel this workflow?')) return;
    try {
      await workflowAutomationService.cancelInstance(id, { reason: 'Cancelled by user' });
      loadData();
    } catch (err) {
      console.error('Failed to cancel workflow:', err);
    }
  };

  const handleViewInstance = async (instance) => {
    try {
      const res = await workflowAutomationService.getInstanceById(instance.id);
      setSelectedInstance(res.data);
      setDetailDialog(true);
    } catch (err) {
      console.error('Failed to load instance details:', err);
    }
  };

  const handleCreateRule = async () => {
    try {
      if (editingRule) {
        await workflowAutomationService.updateRule(editingRule.id, ruleForm);
      } else {
        await workflowAutomationService.createRule(ruleForm);
      }
      setRuleDialog(false);
      setEditingRule(null);
      setRuleForm({
        name: '', description: '', ruleType: 'trigger', triggerEntity: 'promotion',
        triggerEvent: 'created', triggerField: '', triggerOperator: 'equals',
        triggerValue: '', actionType: 'notify', actionTarget: '', priority: 100
      });
      loadData();
    } catch (err) {
      console.error('Failed to save rule:', err);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Delete this automation rule?')) return;
    try {
      await workflowAutomationService.deleteRule(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const openEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name || '', description: template.description || '',
      workflowType: template.workflowType || 'approval', category: template.category || 'general',
      triggerEntity: template.triggerEntity || 'promotion', triggerEvent: template.triggerEvent || 'created',
      slaHours: template.slaHours || 24, escalationEnabled: !!template.escalationEnabled,
      escalationAfterHours: template.escalationAfterHours || 48,
      notificationEnabled: template.notificationEnabled !== false,
      autoApproveBelow: template.autoApproveBelow || '', requireAllApprovers: !!template.requireAllApprovers,
      steps: template.steps || []
    });
    setTemplateDialog(true);
  };

  const openEditRule = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name || '', description: rule.description || '',
      ruleType: rule.ruleType || 'trigger', triggerEntity: rule.triggerEntity || 'promotion',
      triggerEvent: rule.triggerEvent || 'created', triggerField: rule.triggerField || '',
      triggerOperator: rule.triggerOperator || 'equals', triggerValue: rule.triggerValue || '',
      actionType: rule.actionType || 'notify', actionTarget: rule.actionTarget || '',
      priority: rule.priority || 100
    });
    setRuleDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Workflow Automation</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage approval workflows, automation rules, and process orchestration
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Refresh</Button>
          <Button variant="outlined" startIcon={<TriggerIcon />} onClick={() => setTriggerDialog(true)} size="small">
            Trigger Workflow
          </Button>
          {tab === 1 && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingTemplate(null); setTemplateDialog(true); }} size="small">
              New Template
            </Button>
          )}
          {tab === 2 && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingRule(null); setRuleDialog(true); }} size="small">
              New Rule
            </Button>
          )}
        </Box>
      </Box>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" fontWeight={700} color="primary">{summary.templates?.active || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Active Templates</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" fontWeight={700} color="warning.main">{summary.instances?.pending || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Pending Workflows</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" fontWeight={700} color="success.main">{summary.instances?.completed || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Completed</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" fontWeight={700} color="info.main">{summary.pendingActions || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Pending Actions</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
          <Tab icon={<WorkflowIcon />} iconPosition="start" label="Workflow Instances" />
          <Tab icon={<WorkflowIcon />} iconPosition="start" label="Templates" />
          <Tab icon={<AutomationIcon />} iconPosition="start" label="Automation Rules" />
        </Tabs>

        {loading ? <LinearProgress /> : null}

        {tab === 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Template</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>SLA</TableCell>
                  <TableCell>Initiated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {instances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No workflow instances found</Typography>
                    </TableCell>
                  </TableRow>
                ) : instances.map((inst) => (
                  <TableRow key={inst.id} hover>
                    <TableCell>{inst.templateName || 'N/A'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{inst.entityName || inst.entityId || 'N/A'}</Typography>
                      <Typography variant="caption" color="text.secondary">{inst.entityType}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={inst.status} size="small" color={statusColors[inst.status] || 'default'} />
                    </TableCell>
                    <TableCell>
                      <Chip label={inst.priority} size="small" color={priorityColors[inst.priority] || 'default'} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={inst.totalSteps > 0 ? (inst.currentStep / inst.totalSteps) * 100 : 0}
                          sx={{ flex: 1, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption">{inst.currentStep}/{inst.totalSteps}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {inst.slaBreached ? (
                        <Chip label="Breached" size="small" color="error" />
                      ) : (
                        <Chip label="On Track" size="small" color="success" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{inst.initiatedAt ? new Date(inst.initiatedAt).toLocaleDateString() : 'N/A'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewInstance(inst)}><ViewIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      {inst.status === 'pending' && (
                        <Tooltip title="Cancel">
                          <IconButton size="small" color="error" onClick={() => handleCancelInstance(inst.id)}>
                            <RejectIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 1 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Trigger</TableCell>
                  <TableCell>SLA</TableCell>
                  <TableCell>Usage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No workflow templates found</Typography>
                    </TableCell>
                  </TableRow>
                ) : templates.map((tmpl) => (
                  <TableRow key={tmpl.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{tmpl.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{tmpl.description}</Typography>
                    </TableCell>
                    <TableCell><Chip label={tmpl.workflowType} size="small" variant="outlined" /></TableCell>
                    <TableCell>{tmpl.category}</TableCell>
                    <TableCell>
                      <Typography variant="caption">{tmpl.triggerEntity} / {tmpl.triggerEvent}</Typography>
                    </TableCell>
                    <TableCell>{tmpl.slaHours}h</TableCell>
                    <TableCell>{tmpl.usageCount || 0}</TableCell>
                    <TableCell>
                      <Chip label={tmpl.isActive ? 'Active' : 'Inactive'} size="small" color={tmpl.isActive ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEditTemplate(tmpl)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDeleteTemplate(tmpl.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 2 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Trigger</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Executions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No automation rules found</Typography>
                    </TableCell>
                  </TableRow>
                ) : rules.map((rule) => (
                  <TableRow key={rule.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{rule.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{rule.description}</Typography>
                    </TableCell>
                    <TableCell><Chip label={rule.ruleType} size="small" variant="outlined" /></TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {rule.triggerEntity} / {rule.triggerEvent}
                        {rule.triggerField && ` (${rule.triggerField} ${rule.triggerOperator} ${rule.triggerValue})`}
                      </Typography>
                    </TableCell>
                    <TableCell><Chip label={rule.actionType} size="small" /></TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell>{rule.executionCount || 0}</TableCell>
                    <TableCell>
                      <Chip label={rule.isActive ? 'Active' : 'Inactive'} size="small" color={rule.isActive ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEditRule(rule)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDeleteRule(rule.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={templateDialog} onClose={() => setTemplateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingTemplate ? 'Edit Workflow Template' : 'Create Workflow Template'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Name" value={templateForm.name} onChange={(e) => setTemplateForm(f => ({ ...f, name: e.target.value }))} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Workflow Type" value={templateForm.workflowType}
                onChange={(e) => setTemplateForm(f => ({ ...f, workflowType: e.target.value }))}>
                {(options?.workflowTypes || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={templateForm.description} onChange={(e) => setTemplateForm(f => ({ ...f, description: e.target.value }))} multiline rows={2} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Category" value={templateForm.category}
                onChange={(e) => setTemplateForm(f => ({ ...f, category: e.target.value }))}>
                {(options?.categories || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Trigger Entity" value={templateForm.triggerEntity}
                onChange={(e) => setTemplateForm(f => ({ ...f, triggerEntity: e.target.value }))}>
                {(options?.triggerEntities || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Trigger Event" value={templateForm.triggerEvent}
                onChange={(e) => setTemplateForm(f => ({ ...f, triggerEvent: e.target.value }))}>
                {(options?.triggerEvents || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="SLA (hours)" value={templateForm.slaHours}
                onChange={(e) => setTemplateForm(f => ({ ...f, slaHours: parseInt(e.target.value) || 24 }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Auto-Approve Below (amount)"
                value={templateForm.autoApproveBelow}
                onChange={(e) => setTemplateForm(f => ({ ...f, autoApproveBelow: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Escalation After (hours)"
                value={templateForm.escalationAfterHours}
                onChange={(e) => setTemplateForm(f => ({ ...f, escalationAfterHours: parseInt(e.target.value) || 48 }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTemplate} disabled={!templateForm.name}>
            {editingTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={ruleDialog} onClose={() => setRuleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Name" value={ruleForm.name} onChange={(e) => setRuleForm(f => ({ ...f, name: e.target.value }))} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Rule Type" value={ruleForm.ruleType}
                onChange={(e) => setRuleForm(f => ({ ...f, ruleType: e.target.value }))}>
                <MenuItem value="trigger">Trigger</MenuItem>
                <MenuItem value="condition">Condition</MenuItem>
                <MenuItem value="action">Action</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={ruleForm.description} onChange={(e) => setRuleForm(f => ({ ...f, description: e.target.value }))} multiline rows={2} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Trigger Entity" value={ruleForm.triggerEntity}
                onChange={(e) => setRuleForm(f => ({ ...f, triggerEntity: e.target.value }))}>
                {(options?.triggerEntities || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Trigger Event" value={ruleForm.triggerEvent}
                onChange={(e) => setRuleForm(f => ({ ...f, triggerEvent: e.target.value }))}>
                {(options?.triggerEvents || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Trigger Field" value={ruleForm.triggerField}
                onChange={(e) => setRuleForm(f => ({ ...f, triggerField: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth select label="Operator" value={ruleForm.triggerOperator}
                onChange={(e) => setRuleForm(f => ({ ...f, triggerOperator: e.target.value }))}>
                <MenuItem value="equals">Equals</MenuItem>
                <MenuItem value="not_equals">Not Equals</MenuItem>
                <MenuItem value="greater_than">Greater Than</MenuItem>
                <MenuItem value="less_than">Less Than</MenuItem>
                <MenuItem value="contains">Contains</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Trigger Value" value={ruleForm.triggerValue}
                onChange={(e) => setRuleForm(f => ({ ...f, triggerValue: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Action Type" value={ruleForm.actionType}
                onChange={(e) => setRuleForm(f => ({ ...f, actionType: e.target.value }))}>
                {(options?.actionTypes || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Action Target" value={ruleForm.actionTarget}
                onChange={(e) => setRuleForm(f => ({ ...f, actionTarget: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateRule} disabled={!ruleForm.name || !ruleForm.triggerEntity}>
            {editingRule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={triggerDialog} onClose={() => setTriggerDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Trigger Workflow</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth select label="Template" value={triggerForm.templateId}
                onChange={(e) => setTriggerForm(f => ({ ...f, templateId: e.target.value }))}>
                {templates.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Entity Type" value={triggerForm.entityType}
                onChange={(e) => setTriggerForm(f => ({ ...f, entityType: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Entity ID" value={triggerForm.entityId}
                onChange={(e) => setTriggerForm(f => ({ ...f, entityId: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Entity Name" value={triggerForm.entityName}
                onChange={(e) => setTriggerForm(f => ({ ...f, entityName: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Priority" value={triggerForm.priority}
                onChange={(e) => setTriggerForm(f => ({ ...f, priority: e.target.value }))}>
                {(options?.priorities || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTriggerDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTriggerWorkflow} disabled={!triggerForm.templateId}>
            Trigger
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Workflow: {selectedInstance?.templateName || 'Details'}
          <Chip label={selectedInstance?.status} size="small" color={statusColors[selectedInstance?.status] || 'default'} sx={{ ml: 1 }} />
        </DialogTitle>
        <DialogContent>
          {selectedInstance && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Entity</Typography>
                  <Typography variant="body2">{selectedInstance.entityName || selectedInstance.entityId}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body2">{selectedInstance.entityType}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Priority</Typography>
                  <Chip label={selectedInstance.priority} size="small" color={priorityColors[selectedInstance.priority] || 'default'} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">SLA</Typography>
                  <Typography variant="body2">{selectedInstance.slaBreached ? 'Breached' : 'On Track'}</Typography>
                </Grid>
              </Grid>

              {selectedInstance.steps && selectedInstance.steps.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Workflow Steps</Typography>
                  <Stepper activeStep={selectedInstance.currentStep || 0} alternativeLabel sx={{ mb: 2 }}>
                    {selectedInstance.steps.map((step) => (
                      <Step key={step.id} completed={step.status === 'approved' || step.status === 'completed'}>
                        <StepLabel error={step.status === 'rejected'}>
                          {step.stepName || `Step ${step.stepNumber}`}
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  <TableContainer sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Step</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Assigned</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInstance.steps.map((step) => (
                          <TableRow key={step.id}>
                            <TableCell>{step.stepNumber}</TableCell>
                            <TableCell>{step.stepName || `Step ${step.stepNumber}`}</TableCell>
                            <TableCell><Chip label={step.stepType} size="small" variant="outlined" /></TableCell>
                            <TableCell>{step.assignedTo || step.assignedRole || 'Unassigned'}</TableCell>
                            <TableCell>
                              <Chip label={step.status} size="small" color={statusColors[step.status] || 'default'} />
                            </TableCell>
                            <TableCell align="right">
                              {step.status === 'active' && (
                                <>
                                  <Tooltip title="Approve">
                                    <IconButton size="small" color="success" onClick={() => handleApproveStep(step.id)}>
                                      <ApproveIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reject">
                                    <IconButton size="small" color="error" onClick={() => handleRejectStep(step.id)}>
                                      <RejectIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {(!selectedInstance.steps || selectedInstance.steps.length === 0) && (
                <Alert severity="info">No steps found for this workflow instance.</Alert>
              )}
            </Box>
          )}
          {!selectedInstance && <CircularProgress />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowAutomationManagement;
