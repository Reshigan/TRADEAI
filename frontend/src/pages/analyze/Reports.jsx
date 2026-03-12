import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, Chip } from '@mui/material';
import { FileSpreadsheet, Download, Play, Clock } from 'lucide-react';
import { reportService } from '../../services/api';

const reportTemplates = [
  { id: 'promotion_summary', name: 'Promotion Summary', description: 'Overview of all promotions with status and spend', category: 'Promotions' },
  { id: 'budget_utilization', name: 'Budget Utilization', description: 'Budget allocation and spend tracking', category: 'Budgets' },
  { id: 'roi_analysis', name: 'ROI Analysis', description: 'Return on investment by promotion and customer', category: 'Analytics' },
  { id: 'trade_spend_by_customer', name: 'Trade Spend by Customer', description: 'Customer-level trade spend breakdown', category: 'Spend' },
  { id: 'deduction_aging', name: 'Deduction Aging', description: 'Outstanding deductions by age bucket', category: 'Settlement' },
  { id: 'claim_status', name: 'Claim Status', description: 'Claims pipeline and resolution status', category: 'Settlement' },
  { id: 'pnl_by_promotion', name: 'P&L by Promotion', description: 'Profit and loss analysis per promotion', category: 'Analytics' },
  { id: 'accrual_report', name: 'Accrual Report', description: 'Monthly accrual calculations and variances', category: 'Finance' },
];

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState('');

  useEffect(() => {
    const load = async () => {
      try { const res = await reportService.getAll(); setReports(res.data || res || []); } catch (e) { console.error(e); }
    };
    load();
  }, []);

  const generate = async (templateId) => {
    setGenerating(templateId);
    try {
      await reportService.generate({ template_id: templateId });
      const res = await reportService.getAll();
      setReports(res.data || res || []);
    } catch (e) { console.error(e); }
    setGenerating('');
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1">Reports</Typography>
        <Typography variant="body2" color="text.secondary">Generate and download trade promotion reports</Typography>
      </Box>

      <Typography variant="h3" sx={{ mb: 2 }}>Report Templates</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {reportTemplates.map(t => (
          <Grid item xs={12} sm={6} md={4} key={t.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <FileSpreadsheet size={20} color="#2563EB" />
                  <Chip label={t.category} size="small" variant="outlined" />
                </Box>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>{t.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>{t.description}</Typography>
                <Button fullWidth variant="outlined" size="small" startIcon={generating === t.id ? <Clock size={14} /> : <Play size={14} />}
                  onClick={() => generate(t.id)} disabled={generating === t.id}>
                  {generating === t.id ? 'Generating...' : 'Generate'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {reports.length > 0 && (
        <>
          <Typography variant="h3" sx={{ mb: 2 }}>Generated Reports</Typography>
          {reports.map((r, i) => (
            <Card key={i} sx={{ mb: 1 }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: '12px !important' }}>
                <Box>
                  <Typography variant="body2" fontWeight={500}>{r.name || r.template_id}</Typography>
                  <Typography variant="caption" color="text.secondary">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</Typography>
                </Box>
                <Button size="small" startIcon={<Download size={14} />}>Download</Button>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </Box>
  );
}
