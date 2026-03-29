/**
 * Admin Assignment Page
 * Super Admin UI for assigning admin users to companies
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import {
  PersonAdd, Business, People,
  CheckCircle, AdminPanelSettings, Email
} from '@mui/icons-material';
import api from '../../services/api';
import { useToast } from '../../components/common/ToastNotification';

const AdminAssignment = () => {
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [form, setForm] = useState({
    email: '', firstName: '', lastName: '', password: ''
  });

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/companies');
      const data = response.data?.data || response.data || [];
      const companiesArr = Array.isArray(data) ? data : [];

      // Fetch users for each company to find admins
      const enriched = await Promise.all(companiesArr.map(async (company) => {
        const companyId = company.id || company._id;
        try {
          const usersRes = await api.get(`/companies/${companyId}/users`);
          const users = usersRes.data?.data || [];
          const admins = users.filter(u => u.role === 'admin' || u.role === 'super_admin');
          return { ...company, admins, userCount: users.length };
        } catch (e) {
          return { ...company, admins: [], userCount: 0 };
        }
      }));

      setCompanies(enriched);
    } catch (error) {
      console.error('Error fetching companies:', error); toast.error('Error fetching companies'); setFetchError(error.message || 'Failed to load data'); } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const handleOpenDialog = (company) => {
    setSelectedCompany(company);
    setForm({ email: '', firstName: '', lastName: '', password: '' });
    setDialogOpen(true);
  };

  const handleAssignAdmin = async () => {
    if (!selectedCompany || !form.email || !form.firstName || !form.lastName || !form.password) {
      setSnackbar({ open: true, message: 'All fields are required', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      const companyId = selectedCompany.id || selectedCompany._id;
      await api.post(`/companies/${companyId}/assign-admin`, form);
      setDialogOpen(false);
      setSnackbar({ open: true, message: `Admin ${form.email} assigned to ${selectedCompany.name}`, severity: 'success' });
      fetchCompanies();
    } catch (error) {
      console.error('Error assigning admin:', error);
      toast.error('Error assigning admin');
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to assign admin', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => { setFetchError(null); fetchCompanies(); }}>Retry</Button>}>
          {fetchError}
        </Alert>
      )}
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AdminPanelSettings sx={{ mr: 1, fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={700}>Admin User Assignment</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Assign admin users to companies. Each company should have at least one admin who can manage users, roles, and system configuration within their company.
      </Typography>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business color="primary" />
                <Typography variant="h4" fontWeight={700}>{companies.length}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">Total Companies</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <People color="success" />
                <Typography variant="h4" fontWeight={700}>
                  {companies.reduce((sum, c) => sum + (c.admins?.length || 0), 0)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">Total Admins</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle color="warning" />
                <Typography variant="h4" fontWeight={700}>
                  {companies.filter(c => !c.admins?.length).length}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">Companies Without Admin</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Companies Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Users</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Admin(s)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.map(company => {
                  const id = company.id || company._id;
                  return (
                    <TableRow key={id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Business fontSize="small" color="primary" />
                          <Box>
                            <Typography fontWeight={600}>{company.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{company.industry || 'FMCG'}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={company.status || 'active'} size="small" color={company.status === 'active' ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell>{company.userCount || 0}</TableCell>
                      <TableCell>
                        {company.admins?.length > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {company.admins.map((admin, idx) => (
                              <Chip
                                key={idx}
                                label={`${admin.firstName || admin.first_name || ''} ${admin.lastName || admin.last_name || ''} (${admin.email})`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                icon={<Email fontSize="small" />}
                              />
                            ))}
                          </Box>
                        ) : (
                          <Chip label="No admin assigned" size="small" color="warning" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PersonAdd />}
                          onClick={() => handleOpenDialog(company)}
                        >
                          Assign Admin
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {companies.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center">No companies found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Assign Admin Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Admin to {selectedCompany?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create or assign an admin user for this company. If the email already exists, the user will be promoted to admin for this company.
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name" required value={form.firstName}
                onChange={(e) => setForm(prev => ({ ...prev, firstName: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name" required value={form.lastName}
                onChange={(e) => setForm(prev => ({ ...prev, lastName: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" required type="email" value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Password" required type="password" value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                helperText="Minimum 8 characters. The admin should change this on first login." />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <PersonAdd />}
            onClick={handleAssignAdmin}
            disabled={saving || !form.email || !form.firstName || !form.lastName || !form.password}
          >
            {saving ? 'Assigning...' : 'Assign Admin'}
          </Button>
        </DialogActions>
      </Dialog>

      {snackbar.open && (
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
        >
          {snackbar.message}
        </Alert>
      )}
    </Box>
  );
};

export default AdminAssignment;
