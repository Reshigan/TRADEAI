import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid, Alert, CircularProgress,
  FormControlLabel, Switch, Tabs, Tab
} from '@mui/material';
import { Add, Edit, Delete, Policy, Publish, Gavel, CheckCircle } from '@mui/icons-material';
import enterpriseApi from '../../services/enterpriseApi';

const policyCategories = [
  { value: 'hr', label: 'Human Resources' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'security', label: 'Security' },
  { value: 'operations', label: 'Operations' },
  { value: 'sales', label: 'Sales' },
  { value: 'finance', label: 'Finance' },
  { value: 'it', label: 'IT' },
  { value: 'general', label: 'General' }
];

const statuses = [
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'pending_approval', label: 'Pending Approval', color: 'warning' },
  { value: 'published', label: 'Published', color: 'success' },
  { value: 'archived', label: 'Archived', color: 'error' }
];

const applicabilities = [
  { value: 'all', label: 'All Employees' },
  { value: 'department', label: 'Specific Departments' },
  { value: 'role', label: 'Specific Roles' },
  { value: 'specific', label: 'Specific Users' }
];

const reviewFrequencies = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi-annually', label: 'Semi-Annually' },
  { value: 'annually', label: 'Annually' },
  { value: 'custom', label: 'Custom' }
];

const initialFormData = {
  title: '',
  description: '',
  content: '',
  category: 'general',
  status: 'draft',
  applicability: 'all',
  targetDepartments: [],
  targetRoles: [],
  requiresAcknowledgment: true,
  effectiveDate: '',
  reviewSchedule: {
    frequency: 'annually',
    nextReviewDate: ''
  }
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadPolicies();
  }, [page, rowsPerPage, filterStatus]);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, limit: rowsPerPage };
      if (filterStatus !== 'all') params.status = filterStatus;
      const response = await enterpriseApi.companyAdmin.getPolicies(params);
      setPolicies(response.data.policies);
      setTotal(response.data.pagination.total);
    } catch (err) {
      setError(err.message || 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (policy = null) => {
    if (policy) {
      setEditingPolicy(policy);
      setFormData({
        title: policy.title,
        description: policy.description || '',
        content: policy.content || '',
        category: policy.category,
        status: policy.status,
        applicability: policy.applicability,
        targetDepartments: policy.targetDepartments || [],
        targetRoles: policy.targetRoles || [],
        requiresAcknowledgment: policy.requiresAcknowledgment,
        effectiveDate: policy.effectiveDate ? policy.effectiveDate.split('T')[0] : '',
        reviewSchedule: policy.reviewSchedule || initialFormData.reviewSchedule
      });
    } else {
      setEditingPolicy(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPolicy(null);
    setFormData(initialFormData);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingPolicy) {
        await enterpriseApi.companyAdmin.updatePolicy(editingPolicy._id, formData);
      } else {
        await enterpriseApi.companyAdmin.createPolicy(formData);
      }
      handleCloseDialog();
      loadPolicies();
    } catch (err) {
      setError(err.message || 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await enterpriseApi.companyAdmin.publishPolicy(id);
      loadPolicies();
    } catch (err) {
      setError(err.message || 'Failed to publish policy');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;
    try {
      await enterpriseApi.companyAdmin.deletePolicy(id);
      loadPolicies();
    } catch (err) {
      setError(err.message || 'Failed to delete policy');
    }
  };

  const getStatusColor = (status) => {
    const s = statuses.find(st => st.value === status);
    return s ? s.color : 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Policies</Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage company policies
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Create Policy
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={filterStatus} onChange={(e, v) => { setFilterStatus(v); setPage(0); }}>
          <Tab label="All Policies" value="all" />
          <Tab label="Published" value="published" />
          <Tab label="Draft" value="draft" />
          <Tab label="Pending Approval" value="pending_approval" />
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Applicability</TableCell>
                  <TableCell>Acknowledgments</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Gavel sx={{ mr: 1, color: 'warning.main' }} />
                        <Box>
                          <Typography variant="subtitle2">{policy.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {policy.description?.substring(0, 40)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={policyCategories.find(c => c.value === policy.category)?.label || policy.category} size="small" />
                    </TableCell>
                    <TableCell>v{policy.version || '1.0'}</TableCell>
                    <TableCell>{applicabilities.find(a => a.value === policy.applicability)?.label || policy.applicability}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircle sx={{ fontSize: 16, mr: 0.5, color: 'success.main' }} />
                        {policy.acknowledgments?.length || 0}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={policy.status} size="small" color={getStatusColor(policy.status)} />
                    </TableCell>
                    <TableCell align="right">
                      {policy.status === 'draft' && (
                        <IconButton size="small" color="success" onClick={() => handlePublish(policy._id)} title="Publish">
                          <Publish fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton size="small" onClick={() => handleOpenDialog(policy)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(policy._id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {policies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No policies found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />
          </>
        )}
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingPolicy ? 'Edit Policy' : 'Create New Policy'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Policy Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Policy Content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter the full policy content here..."
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {policyCategories.map((c) => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Applicability"
                value={formData.applicability}
                onChange={(e) => setFormData({ ...formData, applicability: e.target.value })}
              >
                {applicabilities.map((a) => (
                  <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {statuses.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Effective Date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Review Frequency"
                value={formData.reviewSchedule.frequency}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  reviewSchedule: { ...formData.reviewSchedule, frequency: e.target.value }
                })}
              >
                {reviewFrequencies.map((f) => (
                  <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requiresAcknowledgment}
                    onChange={(e) => setFormData({ ...formData, requiresAcknowledgment: e.target.checked })}
                  />
                }
                label="Require employee acknowledgment"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !formData.title || !formData.content}>
            {saving ? 'Saving...' : 'Save Policy'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
