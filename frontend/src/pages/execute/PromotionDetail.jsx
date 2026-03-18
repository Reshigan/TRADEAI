import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Chip, Button, LinearProgress, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress } from '@mui/material';
import { ArrowLeft, Edit2, Send, CheckCircle, XCircle, Copy } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { promotionService } from '../../services/api';
import { useTerminology } from '../../contexts/TerminologyContext';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };
const statusColor = (s) => ({ draft: '#94A3B8', pending_approval: '#F59E0B', approved: '#2563EB', active: '#059669', completed: '#6B7280', cancelled: '#DC2626', rejected: '#DC2626' }[s] || '#94A3B8');

export default function PromotionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTerminology();
  const [promo, setPromo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '' });
  const [actionNote, setActionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const reload = async () => {
    try { const res = await promotionService.getById(id); setPromo(res.data || res); } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const load = async () => {
      try { const res = await promotionService.getById(id); setPromo(res.data || res); } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleAction = async (type) => {
    setActionLoading(true); setActionError('');
    try {
      if (type === 'submit') await promotionService.submit(id);
      else if (type === 'approve') await promotionService.approve(id, { notes: actionNote });
      else if (type === 'reject') await promotionService.reject(id, { reason: actionNote });
      else if (type === 'clone') await promotionService.clone(id);
      await reload();
      setActionDialog({ open: false, type: '' }); setActionNote('');
    } catch (e) { setActionError(e.response?.data?.message || e.message || 'Action failed'); }
    setActionLoading(false);
  };

  if (loading) return <Box sx={{ py: 4 }}><LinearProgress /></Box>;
  if (!promo) return <Box sx={{ py: 4 }}><Typography>Promotion not found</Typography><Button onClick={() => navigate('/execute/promotions')}>Back</Button></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate('/execute/promotions')} sx={{ color: 'text.secondary' }}>Back</Button>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h1">{promo.name || promo.promotion_name}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip label={(promo.status || 'draft').replace(/_/g, ' ')} size="small" sx={{ bgcolor: `${statusColor(promo.status)}15`, color: statusColor(promo.status), fontWeight: 600, textTransform: 'capitalize' }} />
            <Chip label={(promo.type || promo.promotion_type || '').replace(/_/g, ' ')} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {promo.status === 'draft' && <Button variant="contained" startIcon={<Send size={16} />} onClick={() => setActionDialog({ open: true, type: 'submit' })}>Submit</Button>}
          {promo.status === 'pending_approval' && <Button variant="contained" color="success" startIcon={<CheckCircle size={16} />} onClick={() => setActionDialog({ open: true, type: 'approve' })}>Approve</Button>}
          {promo.status === 'pending_approval' && <Button variant="outlined" color="error" startIcon={<XCircle size={16} />} onClick={() => setActionDialog({ open: true, type: 'reject' })}>Reject</Button>}
          <Button variant="outlined" startIcon={<Copy size={16} />} onClick={() => handleAction('clone')}>Clone</Button>
          <Button variant="outlined" startIcon={<Edit2 size={16} />} onClick={() => navigate(`/execute/promotions/${id}/edit`)}>Edit</Button>
        </Box>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Planned Spend</Typography><Typography variant="h2">{fmt(promo.planned_spend || promo.budget)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Actual Spend</Typography><Typography variant="h2">{fmt(promo.actual_spend)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">ROI</Typography><Typography variant="h2">{promo.roi ? `${Number(promo.roi).toFixed(1)}x` : '-'}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Lift</Typography><Typography variant="h2">{promo.incremental_lift ? `${Number(promo.incremental_lift).toFixed(1)}%` : '-'}</Typography></CardContent></Card></Grid>
      </Grid>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
          <Tab label="Details" /><Tab label="Financials" /><Tab label="Performance" /><Tab label="Approvals" />
        </Tabs>
        <CardContent>
          {tab === 0 && (
            <Grid container spacing={2}>
              {[['Description', promo.description || '-'], ['Mechanic', (promo.mechanic || '').replace(/_/g, ' ')], ['Customer', promo.customer_name || '-'], ['Start Date', promo.start_date ? new Date(promo.start_date).toLocaleDateString() : '-'], ['End Date', promo.end_date ? new Date(promo.end_date).toLocaleDateString() : '-'], ['Created', promo.created_at ? new Date(promo.created_at).toLocaleDateString() : '-']].map(([label, val]) => (
                <Grid item xs={12} sm={6} key={label}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{val}</Typography>
                </Grid>
              ))}
            </Grid>
          )}
          {tab === 1 && (
            <Grid container spacing={2}>
              {[['Planned Spend', fmt(promo.planned_spend || promo.budget)], ['Actual Spend', fmt(promo.actual_spend)], ['Variance', fmt((promo.planned_spend || 0) - (promo.actual_spend || 0))], ['Budget Source', promo.budget_name || promo.budget_id || '-']].map(([label, val]) => (
                <Grid item xs={12} sm={6} key={label}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="body1" fontWeight={500}>{val}</Typography>
                </Grid>
              ))}
            </Grid>
          )}
          {tab === 2 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">{promo.status === 'completed' ? 'Post-event analysis available after settlement' : 'Performance data available after promotion completes'}</Typography>
            </Box>
          )}
          {tab === 3 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">{promo.status === 'pending_approval' ? 'Awaiting approval' : promo.status === 'approved' || promo.status === 'active' ? 'Approved' : 'No approval required yet'}</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
      {/* W-09: Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onClose={() => { setActionDialog({ open: false, type: '' }); setActionError(''); }}>
        <DialogTitle sx={{ textTransform: 'capitalize' }}>{actionDialog.type} {t('promotion')}</DialogTitle>
        <DialogContent>
          {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
          <Typography variant="body2" sx={{ mb: 2 }}>
            {actionDialog.type === 'submit' && `Submit this ${t('promotion').toLowerCase()} for approval?`}
            {actionDialog.type === 'approve' && `Approve this ${t('promotion').toLowerCase()}? Budget will be committed.`}
            {actionDialog.type === 'reject' && `Reject this ${t('promotion').toLowerCase()}?`}
          </Typography>
          {(actionDialog.type === 'approve' || actionDialog.type === 'reject') && (
            <TextField fullWidth multiline rows={2} label={actionDialog.type === 'reject' ? 'Reason' : 'Notes'}
              value={actionNote} onChange={(e) => setActionNote(e.target.value)} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setActionDialog({ open: false, type: '' }); setActionError(''); }}>Cancel</Button>
          <Button variant="contained" onClick={() => handleAction(actionDialog.type)} disabled={actionLoading}
            color={actionDialog.type === 'reject' ? 'error' : 'primary'}
            startIcon={actionLoading ? <CircularProgress size={16} /> : null}>
            {actionLoading ? 'Processing...' : actionDialog.type}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
