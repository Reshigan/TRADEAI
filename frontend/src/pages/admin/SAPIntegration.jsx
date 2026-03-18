import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Chip, Table, TableHead, TableBody,
  TableRow, TableCell, Alert, CircularProgress, Tabs, Tab, Dialog, DialogTitle,
  DialogContent, DialogActions, Stepper, Step, StepLabel, LinearProgress, TextField,
  TableContainer, Paper, IconButton, Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Storage as StorageIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Visibility as PreviewIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import api from '../../services/api';

// ============================================
// SAP IMPORT TEMPLATES (SAP -> TradeAI)
// ============================================
const IMPORT_TEMPLATES = [
  {
    id: 'customer-master',
    name: 'Customer Master',
    sapTransaction: 'XD01/XD02',
    sapTable: 'KNA1/KNVV',
    description: 'Import customer master data from SAP',
    icon: '👥',
    fields: ['KUNNR', 'NAME1', 'STRAS', 'ORT01', 'PSTLZ', 'LAND1', 'REGIO', 'KTOKD', 'VKORG', 'VTWEG', 'KATR1', 'KATR2', 'KUKLA'],
    requiredFields: ['KUNNR', 'NAME1'],
    targetTable: 'customers',
  },
  {
    id: 'material-master',
    name: 'Material Master',
    sapTransaction: 'MM01/MM02',
    sapTable: 'MARA/MARC',
    description: 'Import material/product data from SAP',
    icon: '📦',
    fields: ['MATNR', 'MAKTX', 'MATKL', 'MEINS', 'EAN11', 'BRAND_ID', 'VERPR', 'STPRS'],
    requiredFields: ['MATNR', 'MAKTX'],
    targetTable: 'products',
  },
  {
    id: 'vendor-master',
    name: 'Vendor Master',
    sapTransaction: 'FK01/FK02',
    sapTable: 'LFA1/LFB1',
    description: 'Import vendor master data from SAP',
    icon: '🏭',
    fields: ['LIFNR', 'NAME1', 'STRAS', 'ORT01', 'PSTLZ', 'LAND1', 'KTOKK', 'BUKRS', 'ZTERM'],
    requiredFields: ['LIFNR', 'NAME1'],
    targetTable: 'vendors',
  },
  {
    id: 'condition-records',
    name: 'Condition Records',
    sapTransaction: 'VK11/VK12',
    sapTable: 'KONH/KONP',
    description: 'Import pricing conditions from SAP SD',
    icon: '💲',
    fields: ['KSCHL', 'VKORG', 'VTWEG', 'KUNNR', 'MATNR', 'KBETR', 'KONWA', 'DATAB', 'DATBI'],
    requiredFields: ['KSCHL', 'KBETR'],
    targetTable: 'trading_terms',
  },
  {
    id: 'billing-documents',
    name: 'Billing Documents',
    sapTransaction: 'VF03/VBRK',
    sapTable: 'VBRK/VBRP',
    description: 'Import billing/invoice data from SAP SD',
    icon: '🧾',
    fields: ['VBELN', 'FKDAT', 'KUNAG', 'MATNR', 'FKIMG', 'NETWR', 'MWSBP', 'WAERK', 'AUBEL'],
    requiredFields: ['VBELN', 'FKDAT', 'NETWR'],
    targetTable: 'trade_spends',
  },
  {
    id: 'deductions',
    name: 'AR Deductions',
    sapTransaction: 'FBL5N/F-28',
    sapTable: 'BSID/BSAD',
    description: 'Import AR deductions/open items from SAP FI',
    icon: '📉',
    fields: ['BELNR', 'BUKRS', 'GJAHR', 'BLDAT', 'BUDAT', 'KUNNR', 'DMBTR', 'WAERS', 'SGTXT', 'RSTGR', 'REBZG'],
    requiredFields: ['BELNR', 'DMBTR'],
    targetTable: 'deductions',
  },
  {
    id: 'gl-postings',
    name: 'GL Accrual Postings',
    sapTransaction: 'FBS1/F-02',
    sapTable: 'BKPF/BSEG',
    description: 'Import GL journal entries / accruals from SAP FI',
    icon: '📊',
    fields: ['BELNR', 'BUKRS', 'BLART', 'BLDAT', 'BUDAT', 'HKONT', 'KOSTL', 'DMBTR', 'WAERS', 'SGTXT'],
    requiredFields: ['BUKRS', 'HKONT', 'DMBTR'],
    targetTable: 'accruals',
  },
  {
    id: 'fund-management',
    name: 'Fund Management',
    sapTransaction: 'FMBB/FM5I',
    sapTable: 'FMIT/FMTT',
    description: 'Import fund/budget allocations from SAP FM',
    icon: '💰',
    fields: ['FINCODE', 'FICTR', 'FIPEX', 'BUDGET', 'OBLIGO', 'ACTUAL', 'AVAILABLE', 'GJAHR', 'BEZEICH'],
    requiredFields: ['FINCODE', 'BUDGET'],
    targetTable: 'budgets',
  },
  {
    id: 'rebate-agreements',
    name: 'Rebate Agreements',
    sapTransaction: 'VBO1/VBO2',
    sapTable: 'KONA/KONP',
    description: 'Import rebate agreements from SAP SD',
    icon: '🔄',
    fields: ['KNUMA', 'KUNNR', 'BOTEFM', 'BODO1', 'BODO2', 'BOSTA', 'KSCHL', 'KBETR'],
    requiredFields: ['KNUMA', 'KUNNR'],
    targetTable: 'rebates',
  },
  {
    id: 'promotions',
    name: 'Trade Promotions',
    sapTransaction: 'TPM/CRM',
    sapTable: 'TPM',
    description: 'Import trade promotions from SAP TPM or CRM',
    icon: '🎯',
    fields: ['PROMO_ID', 'NAME', 'DESCRIPTION', 'PROMO_TYPE', 'STATUS', 'KUNNR', 'START_DATE', 'END_DATE', 'PLANNED_SPEND'],
    requiredFields: ['PROMO_ID', 'NAME'],
    targetTable: 'promotions',
  },
  {
    id: 'claims',
    name: 'Credit Memos / Claims',
    sapTransaction: 'MIRO/FB60',
    sapTable: 'BKPF/BSEG',
    description: 'Import credit memos and claims from SAP FI',
    icon: '📋',
    fields: ['BELNR', 'BUKRS', 'LIFNR', 'BLDAT', 'BUDAT', 'DMBTR', 'WAERS', 'SGTXT', 'XBLNR'],
    requiredFields: ['BELNR', 'DMBTR'],
    targetTable: 'claims',
  },
];

// ============================================
// SAP EXPORT TEMPLATES (TradeAI -> SAP)
// ============================================
const EXPORT_TEMPLATES = [
  { id: 'material-master', name: 'Material Master', sapTransaction: 'MM01/MM02', description: 'Export products as SAP Material Master (MARA)', sapTable: 'MARA/MARC' },
  { id: 'customer-master', name: 'Customer Master', sapTransaction: 'XD01/XD02', description: 'Export customers as SAP Customer Master (KNA1)', sapTable: 'KNA1/KNVV' },
  { id: 'vendor-master', name: 'Vendor Master', sapTransaction: 'FK01/FK02', description: 'Export vendors as SAP Vendor Master (LFA1)', sapTable: 'LFA1/LFB1' },
  { id: 'condition-records', name: 'Condition Records', sapTransaction: 'VK11/VK12', description: 'Export trading terms as SAP pricing conditions', sapTable: 'KONH/KONP' },
  { id: 'sales-orders', name: 'Sales Orders', sapTransaction: 'VA01', description: 'Export sales data as SAP Sales Orders', sapTable: 'VBAK/VBAP' },
  { id: 'vendor-invoices', name: 'Vendor Invoices', sapTransaction: 'MIRO/FB60', description: 'Export settlements as SAP vendor invoices', sapTable: 'BKPF/BSEG' },
  { id: 'accruals', name: 'Accrual Postings', sapTransaction: 'FBS1', description: 'Export accruals as SAP GL journal entries', sapTable: 'BKPF/BSEG' },
  { id: 'copa', name: 'CO-PA Line Items', sapTransaction: 'KE24', description: 'Export profitability data for SAP CO-PA', sapTable: 'CE1xxxx' },
  { id: 'deductions', name: 'AR Deductions', sapTransaction: 'FBL5N', description: 'Export deductions for SAP FI-AR', sapTable: 'BSID/BSAD' },
  { id: 'claims', name: 'Credit Memos', sapTransaction: 'FB65/MIRO', description: 'Export claims as SAP credit memos', sapTable: 'BKPF/BSEG' },
  { id: 'rebates', name: 'Rebate Settlements', sapTransaction: 'VBO3/VBOF', description: 'Export rebates for SAP rebate settlements', sapTable: 'KONA/KONP' },
  { id: 'trade-spends', name: 'Trade Spend Postings', sapTransaction: 'F-02/FB50', description: 'Export trade spends as SAP GL postings', sapTable: 'BKPF/BSEG' },
  { id: 'budgets', name: 'Fund Management', sapTransaction: 'FMBB/FM5I', description: 'Export budgets for SAP Funds Management', sapTable: 'FMIT/FMTT' },
  { id: 'promotions', name: 'Trade Promotions', sapTransaction: 'TPM', description: 'Export promotions for SAP TPM', sapTable: 'TPM' },
];

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function SAPIntegration() {
  const [tab, setTab] = useState(0);
  const [importing, setImporting] = useState(null);
  const [exporting, setExporting] = useState(null);
  const [importDialog, setImportDialog] = useState(null);
  const [importStep, setImportStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importHistory, setImportHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/sap-import/history');
      setImportHistory(res.data?.data || []);
    } catch (e) {
      setImportHistory([]);
    }
    setHistoryLoading(false);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ============================================
  // EXPORT HANDLERS
  // ============================================
  const handleExport = async (templateId) => {
    setExporting(templateId);
    setError('');
    setSuccess('');
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      const res = await api.get(`/sap-export/${templateId}?${params.toString()}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SAP_${templateId.replace(/-/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess(`${templateId} exported successfully`);
    } catch (e) {
      setError(e.response?.data?.message || 'Export failed');
    }
    setExporting(null);
  };

  // ============================================
  // IMPORT HANDLERS
  // ============================================
  const openImportDialog = (template) => {
    setImportDialog(template);
    setImportStep(0);
    setUploadedFile(null);
    setValidationResult(null);
    setImportResult(null);
    setError('');
  };

  const handleDownloadTemplate = async (templateId) => {
    try {
      const res = await api.get(`/sap-import/template/${templateId}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SAP_${templateId.replace(/-/g, '_')}_template.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError('Failed to download template');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    setImporting(importDialog.id);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/sap-import/${importDialog.id}/validate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setValidationResult(res.data?.data || {});
      setImportStep(1);
    } catch (e) {
      // Client-side validation fallback
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0] ? lines[0].split(',').map(h => h.trim().replace(/"/g, '')) : [];
      const missing = (importDialog.requiredFields || []).filter(f => !headers.includes(f));
      setValidationResult({
        totalRows: Math.max(0, lines.length - 1),
        headers,
        requiredFields: importDialog.requiredFields || [],
        missingRequired: missing,
        mappedFields: headers.filter(h => importDialog.fields.includes(h)),
        extraFields: headers.filter(h => !importDialog.fields.includes(h)),
        isValid: missing.length === 0 && lines.length > 1,
        preview: lines.slice(1, 6).map(l => {
          const vals = l.split(',');
          const row = {};
          headers.forEach((h, i) => { row[h] = (vals[i] || '').replace(/"/g, ''); });
          return row;
        }),
      });
      setImportStep(1);
    }
    setImporting(null);
  };

  const handleImport = async () => {
    if (!uploadedFile || !importDialog) return;
    setImporting(importDialog.id);
    setImportStep(2);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      const res = await api.post(`/sap-import/${importDialog.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data?.data || { created: 0, failed: 0 });
      setImportStep(3);
      loadHistory();
    } catch (e) {
      setImportResult({ success: false, message: e.response?.data?.message || 'Import failed' });
      setImportStep(3);
    }
    setImporting(null);
  };

  const importSteps = ['Upload File', 'Validate', 'Import', 'Complete'];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>SAP Integration</Typography>
        <Typography variant="body2" color="text.secondary">
          Import data from SAP and export TradeAI data in SAP-compatible formats (CSV flat files for LSMW/BDC/BAPI)
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* KPI Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UploadIcon sx={{ color: '#2563EB' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Import Templates</Typography>
                  <Typography variant="h6" fontWeight={700}>{IMPORT_TEMPLATES.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DownloadIcon sx={{ color: '#059669' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Export Templates</Typography>
                  <Typography variant="h6" fontWeight={700}>{EXPORT_TEMPLATES.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorageIcon sx={{ color: '#7C3AED' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Format</Typography>
                  <Typography variant="h6" fontWeight={700}>CSV / Flat File</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon sx={{ color: '#D97706' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Recent Imports</Typography>
                  <Typography variant="h6" fontWeight={700}>{importHistory.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab icon={<UploadIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Import from SAP" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab icon={<DownloadIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Export to SAP" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Import History" sx={{ textTransform: 'none', fontWeight: 600 }} />
          </Tabs>
        </Box>

        {/* ====== IMPORT TAB ====== */}
        <TabPanel value={tab} index={0}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Upload SAP-formatted CSV files to import data into TradeAI. Each template maps SAP field names (e.g. KUNNR, MATNR) to TradeAI fields. Download a template to see the expected format.
              </Typography>
            </Alert>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Template</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>SAP Transaction</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>SAP Table</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Target</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {IMPORT_TEMPLATES.map(t => (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: 18 }}>{t.icon}</Typography>
                        <Typography variant="body2" fontWeight={600}>{t.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={t.sapTransaction} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={t.sapTable} size="small" sx={{ fontFamily: 'monospace', fontSize: 11, bgcolor: 'action.hover' }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={t.targetTable} size="small" color="primary" variant="outlined" sx={{ fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{t.description}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="Download CSV Template">
                          <IconButton size="small" onClick={() => handleDownloadTemplate(t.id)}>
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Button size="small" variant="contained" startIcon={<UploadIcon />}
                          onClick={() => openImportDialog(t)} sx={{ textTransform: 'none', fontSize: 12 }}>
                          Import
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </TabPanel>

        {/* ====== EXPORT TAB ====== */}
        <TabPanel value={tab} index={1}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Export TradeAI data as SAP-compatible CSV flat files. Files are formatted for upload via SAP LSMW, BDC, or BAPI interfaces.
              </Typography>
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField label="Start Date" type="date" size="small" value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
              <TextField label="End Date" type="date" size="small" value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Template</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>SAP Transaction</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>SAP Table</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {EXPORT_TEMPLATES.map(t => (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        <Typography variant="body2" fontWeight={600}>{t.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={t.sapTransaction} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={t.sapTable} size="small" sx={{ fontFamily: 'monospace', fontSize: 11, bgcolor: 'action.hover' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{t.description}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined"
                        startIcon={exporting === t.id ? <CircularProgress size={14} /> : <DownloadIcon />}
                        onClick={() => handleExport(t.id)} disabled={exporting === t.id}
                        sx={{ textTransform: 'none', fontSize: 12 }}>
                        {exporting === t.id ? 'Generating...' : 'Export CSV'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </TabPanel>

        {/* ====== HISTORY TAB ====== */}
        <TabPanel value={tab} index={2}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>Recent SAP Imports</Typography>
              <Button size="small" startIcon={<RefreshIcon />} onClick={loadHistory} disabled={historyLoading}>
                Refresh
              </Button>
            </Box>
            {historyLoading ? <CircularProgress size={24} /> : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>File</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Success</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Errors</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No import history found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : importHistory.map((h, i) => (
                    <TableRow key={h.id || i} hover>
                      <TableCell>
                        <Chip label={h.import_type || 'unknown'} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                      </TableCell>
                      <TableCell><Typography variant="body2">{h.file_name || '-'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{h.total_rows || 0}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="success.main">{h.success_rows || 0}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="error.main">{h.error_rows || 0}</Typography></TableCell>
                      <TableCell>
                        <Chip label={h.status || 'completed'} size="small"
                          color={h.status === 'completed' ? 'success' : h.status === 'failed' ? 'error' : 'default'} sx={{ fontSize: 11 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {h.created_at ? new Date(h.created_at).toLocaleString() : '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </TabPanel>
      </Card>

      {/* ====== IMPORT DIALOG ====== */}
      <Dialog open={Boolean(importDialog)} onClose={() => setImportDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UploadIcon />
            <Typography variant="h6" fontWeight={700}>
              Import: {importDialog?.name} ({importDialog?.sapTransaction})
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={importStep} sx={{ mb: 3, mt: 1 }}>
            {importSteps.map(label => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>

          {/* Step 0: Upload */}
          {importStep === 0 && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Upload a CSV file with SAP field names as headers. Required fields: <strong>{importDialog?.requiredFields?.join(', ')}</strong>
                </Typography>
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                All fields: {importDialog?.fields?.join(', ')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button variant="contained" component="label" startIcon={<UploadIcon />} size="large">
                  Choose CSV File
                  <input type="file" hidden accept=".csv,.txt" onChange={handleFileUpload} />
                </Button>
                <Button variant="outlined" size="small" startIcon={<DownloadIcon />}
                  onClick={() => handleDownloadTemplate(importDialog?.id)}>
                  Download Template
                </Button>
              </Box>
              {uploadedFile && <Typography variant="body2" sx={{ mt: 1 }}>Selected: {uploadedFile.name}</Typography>}
              {importing && <LinearProgress sx={{ mt: 2 }} />}
            </Box>
          )}

          {/* Step 1: Validate */}
          {importStep === 1 && validationResult && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Card sx={{ bgcolor: 'background.default' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h5" color="primary">{validationResult.totalRows}</Typography>
                      <Typography variant="caption" color="text.secondary">Total Rows</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card sx={{ bgcolor: '#F0FDF4' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h5" color="success.main">{validationResult.mappedFields?.length || 0}</Typography>
                      <Typography variant="caption" color="text.secondary">Mapped Fields</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card sx={{ bgcolor: validationResult.missingRequired?.length > 0 ? '#FEF2F2' : '#F0FDF4' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h5" color={validationResult.missingRequired?.length > 0 ? 'error.main' : 'success.main'}>
                        {validationResult.missingRequired?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Missing Required</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {validationResult.missingRequired?.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Missing required SAP fields: <strong>{validationResult.missingRequired.join(', ')}</strong>
                </Alert>
              )}

              {validationResult.extraFields?.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Extra fields (will be stored in metadata): {validationResult.extraFields.join(', ')}
                </Alert>
              )}

              {validationResult.isValid && (
                <Alert severity="success" sx={{ mb: 2 }} icon={<CheckIcon />}>
                  File is valid and ready for import. {validationResult.totalRows} rows will be imported into <strong>{importDialog?.targetTable}</strong>.
                </Alert>
              )}

              {validationResult.preview?.length > 0 && (
                <Box>
                  <Button startIcon={<PreviewIcon />} onClick={() => setPreviewOpen(true)} size="small" sx={{ mb: 1 }}>
                    Preview Data ({validationResult.preview.length} rows)
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Step 2: Importing */}
          {importStep === 2 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={48} />
              <Typography variant="body1" sx={{ mt: 2 }}>Importing {validationResult?.totalRows || 0} rows into {importDialog?.targetTable}...</Typography>
              <LinearProgress sx={{ mt: 2, maxWidth: 400, mx: 'auto' }} />
            </Box>
          )}

          {/* Step 3: Complete */}
          {importStep === 3 && importResult && (
            <Box>
              {importResult.created !== undefined ? (
                <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>Import Complete</Typography>
                  <Typography variant="body2">
                    Created: {importResult.created} | Failed: {importResult.failed}
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>Import Failed</Typography>
                  <Typography variant="body2">{importResult.message || 'Unknown error'}</Typography>
                </Alert>
              )}
              {importResult.errors?.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={600}>Errors ({importResult.errors.length}):</Typography>
                  {importResult.errors.slice(0, 10).map((err, i) => (
                    <Typography key={i} variant="body2">- {err}</Typography>
                  ))}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {importStep === 1 && (
            <Button onClick={() => setImportStep(0)} startIcon={<ArrowBackIcon />}>Back</Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setImportDialog(null)}>
            {importStep === 3 ? 'Close' : 'Cancel'}
          </Button>
          {importStep === 1 && validationResult?.isValid && (
            <Button variant="contained" onClick={handleImport} startIcon={<ArrowIcon />}
              disabled={Boolean(importing)}>
              Import {validationResult?.totalRows || 0} Rows
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Data Preview (First 5 Rows)</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {validationResult?.preview?.[0] && Object.keys(validationResult.preview[0]).map(k => (
                    <TableCell key={k} sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{k}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(validationResult?.preview || []).map((row, i) => (
                  <TableRow key={i}>
                    {Object.values(row).map((v, j) => (
                      <TableCell key={j} sx={{ fontSize: 12 }}>{v}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
