/**
 * Module Configuration Page
 * Super Admin UI for enabling/disabling modules per company
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Button, Switch, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Divider, Alert
} from '@mui/material';
import {
  Settings, Business, Save, Refresh,
  Analytics, CloudSync, Assessment, AccountTree,
  Description, WorkspacePremium
} from '@mui/icons-material';
import api from '../../services/api';

const MODULE_DEFINITIONS = [
  { key: 'budgets', label: 'Budgets & Planning', icon: Assessment, description: 'Budget creation, allocation, and tracking', category: 'Core' },
  { key: 'promotions', label: 'Promotions', icon: WorkspacePremium, description: 'Promotion planning, execution, and tracking', category: 'Core' },
  { key: 'tradeSpends', label: 'Trade Spends', icon: Assessment, description: 'Trade spend entry and management', category: 'Core' },
  { key: 'claims', label: 'Claims Management', icon: Description, description: 'Claim submission, review, and settlement', category: 'Finance' },
  { key: 'deductions', label: 'Deductions', icon: Description, description: 'Deduction tracking and reconciliation', category: 'Finance' },
  { key: 'rebates', label: 'Rebates', icon: Description, description: 'Rebate program management', category: 'Finance' },
  { key: 'forecasting', label: 'Forecasting', icon: Analytics, description: 'Demand forecasting and trend analysis', category: 'Analytics' },
  { key: 'aiPredictions', label: 'AI/ML Predictions', icon: Analytics, description: 'AI-powered predictions and recommendations', category: 'Analytics' },
  { key: 'advancedAnalytics', label: 'Advanced Analytics', icon: Analytics, description: 'Advanced reporting and data visualization', category: 'Analytics' },
  { key: 'sapIntegration', label: 'SAP Integration', icon: CloudSync, description: 'SAP import/export data integration', category: 'Integration' },
  { key: 'workflowApprovals', label: 'Workflow Approvals', icon: AccountTree, description: 'Multi-level approval workflows', category: 'Workflow' },
  { key: 'documentManagement', label: 'Document Management', icon: Description, description: 'Document storage and versioning', category: 'Workflow' },
];

const CATEGORIES = ['Core', 'Finance', 'Analytics', 'Integration', 'Workflow'];

const ModuleConfiguration = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [modules, setModules] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/companies');
      const data = response.data?.data || response.data || [];
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const fetchModules = useCallback(async (companyId) => {
    try {
      const response = await api.get(`/companies/${companyId}/modules`);
      setModules(response.data?.data || {});
      setDirty(false);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setModules({});
    }
  }, []);

  const handleSelectCompany = (company) => {
    const companyId = company.id || company._id;
    setSelectedCompany(company);
    fetchModules(companyId);
  };

  const handleToggleModule = (moduleKey) => {
    setModules(prev => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
    setDirty(true);
  };

  const handleSaveModules = async () => {
    if (!selectedCompany) return;
    setSaving(true);
    try {
      const companyId = selectedCompany.id || selectedCompany._id;
      await api.put(`/companies/${companyId}/modules`, { modules });
      setDirty(false);
      setSnackbar({ open: true, message: 'Modules updated successfully', severity: 'success' });
    } catch (error) {
      console.error('Error saving modules:', error);
      setSnackbar({ open: true, message: 'Failed to save modules', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = Object.values(modules).filter(Boolean).length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Settings sx={{ mr: 1, fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={700}>Module Configuration</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enable or disable modules for each company. Only enabled modules will be accessible to company users.
      </Typography>

      <Grid container spacing={3}>
        {/* Company List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Companies</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Company</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companies.map((company) => {
                    const id = company.id || company._id;
                    const isSelected = selectedCompany && (selectedCompany.id || selectedCompany._id) === id;
                    return (
                      <TableRow
                        key={id}
                        hover
                        selected={isSelected}
                        onClick={() => handleSelectCompany(company)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Business fontSize="small" />
                            <Typography variant="body2" fontWeight={isSelected ? 700 : 400}>
                              {company.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={company.status || 'active'}
                            size="small"
                            color={company.status === 'active' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {companies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center">No companies found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Module Config */}
        <Grid item xs={12} md={8}>
          {selectedCompany ? (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6">{selectedCompany.name} - Modules</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {enabledCount} of {MODULE_DEFINITIONS.length} modules enabled
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => fetchModules(selectedCompany.id || selectedCompany._id)}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                    onClick={handleSaveModules}
                    disabled={!dirty || saving}
                  >
                    Save Changes
                  </Button>
                </Box>
              </Box>

              {dirty && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  You have unsaved changes. Click "Save Changes" to apply.
                </Alert>
              )}

              {CATEGORIES.map(category => {
                const categoryModules = MODULE_DEFINITIONS.filter(m => m.category === category);
                return (
                  <Box key={category} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>{category}</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      {categoryModules.map(mod => {
                        const Icon = mod.icon;
                        const enabled = !!modules[mod.key];
                        return (
                          <Grid item xs={12} sm={6} key={mod.key}>
                            <Card
                              variant="outlined"
                              sx={{
                                borderColor: enabled ? 'primary.main' : 'divider',
                                bgcolor: enabled ? 'action.selected' : 'background.paper',
                                transition: 'all 0.2s'
                              }}
                            >
                              <CardContent sx={{ pb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Icon color={enabled ? 'primary' : 'disabled'} />
                                    <Typography variant="subtitle2" fontWeight={600}>{mod.label}</Typography>
                                  </Box>
                                  <Switch
                                    checked={enabled}
                                    onChange={() => handleToggleModule(mod.key)}
                                    color="primary"
                                    size="small"
                                  />
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                  {mod.description}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                );
              })}
            </Paper>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Business sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Select a company</Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a company from the list to configure its modules.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModuleConfiguration;
