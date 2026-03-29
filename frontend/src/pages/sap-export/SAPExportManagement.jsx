import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, Chip, Table, TableHead, TableBody, TableRow, TableCell, CircularProgress } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import StorageIcon from '@mui/icons-material/Storage';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/common/ToastNotification';

const SAPExportManagement = () => {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await apiClient.get('/sap-export/templates');
        setTemplates(res.data?.data || []);
      } catch (e) {
        setTemplates([
          { id: 'material-master', name: 'Material Master', sapTransaction: 'MM01/MM02', description: 'Product data for SAP Material Master' },
          { id: 'customer-master', name: 'Customer Master', sapTransaction: 'XD01/XD02', description: 'Customer data for SAP Customer Master' },
          { id: 'vendor-master', name: 'Vendor Master', sapTransaction: 'FK01/FK02', description: 'Vendor data for SAP Vendor Master' },
          { id: 'condition-records', name: 'Condition Records', sapTransaction: 'VK11/VK12', description: 'Pricing conditions for SAP SD' },
          { id: 'sales-orders', name: 'Sales Orders', sapTransaction: 'VA01', description: 'Sales transaction data' },
          { id: 'vendor-invoices', name: 'Vendor Invoices', sapTransaction: 'MIRO/FB60', description: 'Settlement invoices for SAP FI' },
          { id: 'accruals', name: 'Accrual Postings', sapTransaction: 'FBS1', description: 'Accrual journal entries for SAP FI' },
          { id: 'copa', name: 'CO-PA Line Items', sapTransaction: 'KE24', description: 'Profitability analysis data' },
        ]);
      } finally { setLoading(false); }
    };
    fetchTemplates();
  }, []);

  const handleDownload = async (templateId) => {
    try {
      setDownloading(templateId);
      const res = await apiClient.get(`/sap-export/${templateId}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SAP_${templateId.replace(/-/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { console.error('Download failed:', e); toast.error('Download failed'); }
    finally { setDownloading(null); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>SAP Export Templates</Typography>
          <Typography variant="body2" color="text.secondary">Generate SAP-formatted flat files for upload via LSMW/BDC</Typography>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorageIcon sx={{ color: 'primary.dark' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Templates</Typography>
                  <Typography variant="h6" fontWeight={700}>{templates.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon sx={{ color: '#059669' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Format</Typography>
                  <Typography variant="h6" fontWeight={700}>CSV</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading ? <CircularProgress /> : (
        <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Template</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>SAP Transaction</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map(t => (
                <TableRow key={t.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={600}>{t.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Chip label={t.sapTransaction} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontWeight: 600 }} /></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{t.description}</Typography></TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" startIcon={downloading === t.id ? <CircularProgress size={14} /> : <DownloadIcon />}
                      onClick={() => handleDownload(t.id)} disabled={downloading === t.id}>
                      {downloading === t.id ? 'Generating...' : 'Export'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
};

export default SAPExportManagement;
