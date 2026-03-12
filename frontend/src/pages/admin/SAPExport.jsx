import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, TextField, Alert, Chip } from '@mui/material';
import { FileSpreadsheet, Download } from 'lucide-react';
import api from '../../services/api';

const templates = [
  { id: 'vendor_master', name: 'Vendor Master (LFB1)', description: 'SAP vendor master data upload format' },
  { id: 'customer_master', name: 'Customer Master (KNA1)', description: 'SAP customer master data upload format' },
  { id: 'condition_record', name: 'Condition Records (KONH)', description: 'SAP pricing condition records' },
  { id: 'sales_order', name: 'Sales Orders (VBAK)', description: 'SAP sales order flat file format' },
  { id: 'billing_document', name: 'Billing Documents (VBRK)', description: 'SAP billing document upload' },
  { id: 'fund_management', name: 'Fund Management (FMTT)', description: 'SAP fund center/commitment items' },
  { id: 'journal_entry', name: 'Journal Entries (BKPF)', description: 'SAP FI journal entry posting' },
  { id: 'settlement_doc', name: 'Settlement Documents', description: 'Trade promotion settlement exports' },
];

export default function SAPExport() {
  const [generating, setGenerating] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const generate = async (templateId) => {
    setGenerating(templateId); setError(''); setSuccess('');
    try {
      const res = await api.post('/sap-export/generate', { template_id: templateId, ...dateRange });
      setSuccess(`${templateId} export generated successfully`);
    } catch (e) {
      setError(e.response?.data?.message || 'Export generation failed');
    }
    setGenerating('');
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1">SAP Export</Typography>
        <Typography variant="body2" color="text.secondary">Generate SAP-compatible flat file exports</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Date Range</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Start Date" type="date" size="small" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="End Date" type="date" size="small" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} InputLabelProps={{ shrink: true }} />
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {templates.map(t => (
          <Grid item xs={12} sm={6} md={4} key={t.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <FileSpreadsheet size={20} color="#059669" />
                  <Chip label="SAP" size="small" variant="outlined" sx={{ fontSize: 10 }} />
                </Box>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>{t.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>{t.description}</Typography>
                <Button fullWidth variant="outlined" size="small"
                  startIcon={generating === t.id ? null : <Download size={14} />}
                  onClick={() => generate(t.id)} disabled={generating === t.id}>
                  {generating === t.id ? 'Generating...' : 'Generate & Download'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
