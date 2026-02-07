import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid, Alert, CircularProgress,
  FormControlLabel, Switch, Tabs, Tab
} from '@mui/material';
import { Add, Edit, Delete, Campaign, Publish, PushPin, Visibility } from '@mui/icons-material';
import enterpriseApi from '../../services/enterpriseApi';
import { formatLabel } from '../../utils/formatters';

const announcementTypes = [
  { value: 'info', label: 'Information', color: 'info' },
  { value: 'warning', label: 'Warning', color: 'warning' },
  { value: 'success', label: 'Success', color: 'success' },
  { value: 'urgent', label: 'Urgent', color: 'error' },
  { value: 'celebration', label: 'Celebration', color: 'secondary' }
];

const categories = [
  { value: 'general', label: 'General' },
  { value: 'policy', label: 'Policy Update' },
  { value: 'event', label: 'Event' },
  { value: 'achievement', label: 'Achievement' },
  { value: 'system', label: 'System' },
  { value: 'hr', label: 'HR' },
  { value: 'sales', label: 'Sales' }
];

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

const audiences = [
  { value: 'all', label: 'All Employees' },
  { value: 'department', label: 'Specific Departments' },
  { value: 'role', label: 'Specific Roles' },
  { value: 'specific', label: 'Specific Users' }
];

const statuses = [
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'scheduled', label: 'Scheduled', color: 'info' },
  { value: 'published', label: 'Published', color: 'success' },
  { value: 'expired', label: 'Expired', color: 'warning' },
  { value: 'archived', label: 'Archived', color: 'error' }
];

const initialFormData = {
  title: '',
  message: '',
  type: 'info',
  category: 'general',
  priority: 'medium',
  audience: 'all',
  targetDepartments: [],
  targetRoles: [],
  channels: ['in_app'],
  isPinned: false,
  requiresAcknowledgment: false,
  status: 'draft'
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadAnnouncements();
  }, [page, rowsPerPage, filterStatus]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, limit: rowsPerPage };
      if (filterStatus !== 'all') params.status = filterStatus;
      const response = await enterpriseApi.companyAdmin.getAnnouncements(params);
      setAnnouncements(response.data.announcements);
      setTotal(response.data.pagination.total);
    } catch (err) {
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (announcement = null) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        message: announcement.message,
        type: announcement.type,
        category: announcement.category,
        priority: announcement.priority,
        audience: announcement.audience,
        targetDepartments: announcement.targetDepartments || [],
        targetRoles: announcement.targetRoles || [],
        channels: announcement.channels || ['in_app'],
        isPinned: announcement.isPinned,
        requiresAcknowledgment: announcement.requiresAcknowledgment,
        status: announcement.status
      });
    } else {
      setEditingAnnouncement(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAnnouncement(null);
    setFormData(initialFormData);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingAnnouncement) {
        await enterpriseApi.companyAdmin.updateAnnouncement((editingAnnouncement.id || editingAnnouncement._id), formData);
      } else {
        await enterpriseApi.companyAdmin.createAnnouncement(formData);
      }
      handleCloseDialog();
      loadAnnouncements();
    } catch (err) {
      setError(err.message || 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await enterpriseApi.companyAdmin.publishAnnouncement(id);
      loadAnnouncements();
    } catch (err) {
      setError(err.message || 'Failed to publish announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await enterpriseApi.companyAdmin.deleteAnnouncement(id);
      loadAnnouncements();
    } catch (err) {
      setError(err.message || 'Failed to delete announcement');
    }
  };

  const getStatusColor = (status) => {
    const s = statuses.find(st => st.value === status);
    return s ? s.color : 'default';
  };

  const getTypeColor = (type) => {
    const t = announcementTypes.find(at => at.value === type);
    return t ? t.color : 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Announcements</Typography>
          <Typography variant="body1" color="text.secondary">
            Share important updates with your team
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Create Announcement
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={filterStatus} onChange={(e, v) => { setFilterStatus(v); setPage(0); }}>
          <Tab label="All" value="all" />
          <Tab label="Published" value="published" />
          <Tab label="Draft" value="draft" />
          <Tab label="Scheduled" value="scheduled" />
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
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Audience</TableCell>
                  <TableCell>Views</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {announcements.map((announcement) => (
                  <TableRow key={announcement.id || announcement._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {announcement.isPinned && <PushPin sx={{ mr: 1, color: 'warning.main', fontSize: 18 }} />}
                        <Campaign sx={{ mr: 1, color: 'info.main' }} />
                        <Box>
                          <Typography variant="subtitle2">{announcement.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {announcement.message?.substring(0, 40)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={formatLabel(announcement.type)} size="small" color={getTypeColor(announcement.type)} />
                    </TableCell>
                    <TableCell>{categories.find(c => c.value === announcement.category)?.label || announcement.category}</TableCell>
                    <TableCell>
                      <Chip 
                        label={announcement.priority} 
                        size="small" 
                        color={announcement.priority === 'critical' ? 'error' : announcement.priority === 'high' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{audiences.find(a => a.value === announcement.audience)?.label || announcement.audience}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Visibility sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        {announcement.views?.length || 0}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={formatLabel(announcement.status)} size="small" color={getStatusColor(announcement.status)} />
                    </TableCell>
                    <TableCell align="right">
                      {announcement.status === 'draft' && (
                        <IconButton size="small" color="success" onClick={() => handlePublish(announcement._id)} title="Publish">
                          <Publish fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton size="small" onClick={() => handleOpenDialog(announcement)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(announcement._id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {announcements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No announcements found</Typography>
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
        <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {announcementTypes.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((c) => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {priorities.map((p) => (
                  <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Audience"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
              >
                {audiences.map((a) => (
                  <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
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
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  />
                }
                label="Pin to top"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requiresAcknowledgment}
                    onChange={(e) => setFormData({ ...formData, requiresAcknowledgment: e.target.checked })}
                  />
                }
                label="Require acknowledgment"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !formData.title || !formData.message}>
            {saving ? 'Saving...' : 'Save Announcement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
