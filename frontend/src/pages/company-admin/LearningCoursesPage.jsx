import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid, Alert, CircularProgress,
  FormControlLabel, Switch, Tabs, Tab
} from '@mui/material';
import {
  Add, Edit, Delete, School, CheckCircle
} from '@mui/icons-material';
import enterpriseApi from '../../services/enterpriseApi';

const categories = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'product', label: 'Product Training' },
  { value: 'sales', label: 'Sales Skills' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'skills', label: 'Skills Development' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'other', label: 'Other' }
];

const levels = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

const statuses = [
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'published', label: 'Published', color: 'success' },
  { value: 'archived', label: 'Archived', color: 'warning' }
];

const initialFormData = {
  title: '',
  description: '',
  category: 'other',
  level: 'beginner',
  status: 'draft',
  isRequired: false,
  dueWithinDays: 30,
  modules: []
};

export default function LearningCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState({ title: '', description: '', content: '', duration: 15 });

  useEffect(() => {
    loadCourses();
  }, [page, rowsPerPage, filterStatus]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, limit: rowsPerPage };
      if (filterStatus !== 'all') params.status = filterStatus;
      const response = await enterpriseApi.companyAdmin.getCourses(params);
      setCourses(response.data.courses);
      setTotal(response.data.pagination.total);
    } catch (err) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        status: course.status,
        isRequired: course.isRequired,
        dueWithinDays: course.dueWithinDays || 30,
        modules: course.modules || []
      });
    } else {
      setEditingCourse(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCourse(null);
    setFormData(initialFormData);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingCourse) {
        await enterpriseApi.companyAdmin.updateCourse(editingCourse._id, formData);
      } else {
        await enterpriseApi.companyAdmin.createCourse(formData);
      }
      handleCloseDialog();
      loadCourses();
    } catch (err) {
      setError(err.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await enterpriseApi.companyAdmin.deleteCourse(id);
      loadCourses();
    } catch (err) {
      setError(err.message || 'Failed to delete course');
    }
  };

  const handleAddModule = () => {
    setFormData({
      ...formData,
      modules: [...formData.modules, { ...currentModule, order: formData.modules.length }]
    });
    setCurrentModule({ title: '', description: '', content: '', duration: 15 });
    setModuleDialogOpen(false);
  };

  const handleRemoveModule = (index) => {
    const newModules = formData.modules.filter((_, i) => i !== index);
    setFormData({ ...formData, modules: newModules });
  };

  const getStatusColor = (status) => {
    const s = statuses.find(st => st.value === status);
    return s ? s.color : 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Learning Courses</Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage training content for your employees
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Create Course
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={filterStatus} onChange={(e, v) => { setFilterStatus(v); setPage(0); }}>
          <Tab label="All Courses" value="all" />
          <Tab label="Published" value="published" />
          <Tab label="Draft" value="draft" />
          <Tab label="Archived" value="archived" />
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
                  <TableCell>Level</TableCell>
                  <TableCell>Modules</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Required</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <School sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="subtitle2">{course.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {course.description?.substring(0, 50)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={categories.find(c => c.value === course.category)?.label || course.category} size="small" />
                    </TableCell>
                    <TableCell>{levels.find(l => l.value === course.level)?.label || course.level}</TableCell>
                    <TableCell>{course.modules?.length || 0}</TableCell>
                    <TableCell>{course.duration || 0} min</TableCell>
                    <TableCell>
                      <Chip label={course.status} size="small" color={getStatusColor(course.status)} />
                    </TableCell>
                    <TableCell>
                      {course.isRequired && <CheckCircle color="success" fontSize="small" />}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenDialog(course)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(course._id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {courses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No courses found</Typography>
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

      {/* Course Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Course Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                {categories.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Level"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                {levels.map((lvl) => (
                  <MenuItem key={lvl.value} value={lvl.value}>{lvl.label}</MenuItem>
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
                {statuses.map((st) => (
                  <MenuItem key={st.value} value={st.value}>{st.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isRequired}
                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                  />
                }
                label="Required Course"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Due Within (Days)"
                value={formData.dueWithinDays}
                onChange={(e) => setFormData({ ...formData, dueWithinDays: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">Modules ({formData.modules.length})</Typography>
                <Button size="small" startIcon={<Add />} onClick={() => setModuleDialogOpen(true)}>
                  Add Module
                </Button>
              </Box>
              {formData.modules.map((mod, index) => (
                <Paper key={index} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2">{mod.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {mod.duration} min - {mod.description?.substring(0, 50)}
                      </Typography>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => handleRemoveModule(index)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !formData.title}>
            {saving ? 'Saving...' : 'Save Course'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onClose={() => setModuleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Module</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Module Title"
                value={currentModule.title}
                onChange={(e) => setCurrentModule({ ...currentModule, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={currentModule.description}
                onChange={(e) => setCurrentModule({ ...currentModule, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Content (HTML/Markdown)"
                value={currentModule.content}
                onChange={(e) => setCurrentModule({ ...currentModule, content: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Duration (minutes)"
                value={currentModule.duration}
                onChange={(e) => setCurrentModule({ ...currentModule, duration: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModuleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddModule} disabled={!currentModule.title}>
            Add Module
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
