import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Snackbar
} from '@mui/material';
import {
  Add,
  Edit,
  Refresh,
  Business,
  People,
  Assessment,
  CheckCircle
} from '@mui/icons-material';
import enterpriseApi from '../../services/enterpriseApi';

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTenants, setTotalTenants] = useState(0);
  const [createDialog, setCreateDialog] = useState(false);
  const [, setLicenseDialog] = useState(false);
  const [, setSelectedTenant] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    loadStatistics();
    loadTenants();
  }, [page, rowsPerPage]);

  const loadStatistics = async () => {
    try {
      const response = await enterpriseApi.superAdmin.getSystemStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await enterpriseApi.superAdmin.getAllTenants(
        {},
        { page: page + 1, limit: rowsPerPage }
      );
      setTenants(response.data.tenants);
      setTotalTenants(response.data.pagination.total);
    } catch (error) {
      console.error('Failed to load tenants:', error);
      showSnackbar('Failed to load tenants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (formData) => {
    try {
      await enterpriseApi.superAdmin.createTenant(
        {
          companyName: formData.companyName,
          domain: formData.domain,
          subdomain: formData.subdomain,
          industry: formData.industry,
          country: formData.country
        },
        {
          email: formData.adminEmail,
          name: formData.adminName,
          password: formData.adminPassword
        },
        formData.licenseType || 'trial'
      );
      showSnackbar('Tenant created successfully', 'success');
      setCreateDialog(false);
      loadTenants();
      loadStatistics();
    } catch (error) {
      console.error('Failed to create tenant:', error);
      showSnackbar('Failed to create tenant', 'error');
    }
  };

  const handleUpdateStatus = async (tenantId, status) => {
    try {
      await enterpriseApi.superAdmin.updateTenantStatus(tenantId, status, 'Manual update by super admin');
      showSnackbar('Tenant status updated', 'success');
      loadTenants();
    } catch (error) {
      console.error('Failed to update status:', error);
      showSnackbar('Failed to update status', 'error');
    }
  };

  const handleManageLicense = async (tenantId, action, data) => {
    try {
      await enterpriseApi.superAdmin.manageLicense(tenantId, action, data);
      showSnackbar('License updated successfully', 'success');
      setLicenseDialog(false);
      loadTenants();
    } catch (error) {
      console.error('Failed to manage license:', error);
      showSnackbar('Failed to manage license', 'error');
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Super Admin Dashboard</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialog(true)}
            sx={{ mr: 1 }}
          >
            Create Tenant
          </Button>
          <Button startIcon={<Refresh />} onClick={() => { loadStatistics(); loadTenants(); }}>
            Refresh
          </Button>
        </Box>
      </Box>

      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Business sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Total Tenants</Typography>
                </Box>
                <Typography variant="h3">{statistics.tenants.total}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Active: {statistics.tenants.active}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <People sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">Total Users</Typography>
                </Box>
                <Typography variant="h3">{statistics.users.total}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Active: {statistics.users.active}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Assessment sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="h6">Budgets</Typography>
                </Box>
                <Typography variant="h3">{statistics.data.budgets}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="h6">Promotions</Typography>
                </Box>
                <Typography variant="h3">{statistics.data.promotions}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Tenant Management</Typography>
        </Box>
        
        {loading ? <LinearProgress /> : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Company Name</TableCell>
                    <TableCell>Domain</TableCell>
                    <TableCell>License</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Users</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant._id}>
                      <TableCell>{tenant.name}</TableCell>
                      <TableCell>{tenant.domain}</TableCell>
                      <TableCell>
                        <Chip label={tenant.licenseId?.licenseType || 'N/A'} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tenant.status}
                          size="small"
                          color={tenant.status === 'active' ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>{tenant.statistics?.users || 0}</TableCell>
                      <TableCell>{new Date(tenant.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => {
                          setSelectedTenant(tenant);
                          setLicenseDialog(true);
                        }}>
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalTenants}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Paper>

      <CreateTenantDialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        onSubmit={handleCreateTenant}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

function CreateTenantDialog({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    companyName: '',
    domain: '',
    subdomain: '',
    industry: '',
    country: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    licenseType: 'trial'
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Tenant</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Company Name"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Domain"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Admin Name"
              value={formData.adminName}
              onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Admin Email"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              type="password"
              label="Admin Password"
              value={formData.adminPassword}
              onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSubmit(formData)} variant="contained">Create</Button>
      </DialogActions>
    </Dialog>
  );
}
