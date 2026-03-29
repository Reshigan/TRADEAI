import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, LinearProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Alert} from '@mui/material';
import { Search, Check, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { approvalService } from '../../services/api';
import { useToast } from '../../components/common/ToastNotification';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function ApprovalQueue() {
  const toast = useToast();
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const [actionDialog, setActionDialog] = useState(null);
  const [comment, setComment] = useState('');

  const load = useCallback(async () => {
    try {
      const status = tab === 0 ? 'pending' : tab === 1 ? 'approved' : 'rejected';
      const res = await approvalService.getAll({ status });
      setApprovals(res.data || res || []);
    } catch (e) { console.error(e); toast.error('An error occurred'); setFetchError(e.message || 'Failed to load data'); }
    setLoading(false);
  }, [tab]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const filtered = approvals.filter(a => (a.promotion_name || a.entity_type || '').toLowerCase().includes(search.toLowerCase()));

  const handleAction = async (action) => {
    if (!actionDialog) return;
    try {
      await approvalService.update(actionDialog.id, { status: action, comments: comment });
      setActionDialog(null); setComment(''); load();
    } catch (e) { console.error(e); toast.error('An error occurred'); }
  };

  return (
    <Box>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => { setFetchError(null); load(); }}>Retry</Button>}>
          {fetchError}
        </Alert>
      )}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1">Approvals</Typography>
        <Typography variant="body2" color="text.secondary">Review and approve trade promotion requests</Typography>
      </Box>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Pending" /><Tab label="Approved" /><Tab label="Rejected" />
        </Tabs>
        <CardContent>
          <TextField placeholder="Search approvals..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} /> }} sx={{ mb: 2, maxWidth: 360, width: '100%' }} />
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Item</TableCell><TableCell>Type</TableCell><TableCell>Requester</TableCell><TableCell align="right">Amount</TableCell><TableCell>Submitted</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No approvals found</Typography></TableCell></TableRow>
                  ) : filtered.map(a => (
                    <TableRow key={a.id}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{a.promotion_name || a.entity_type || 'Approval'}</Typography></TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{(a.entity_type || 'promotion').replace(/_/g, ' ')}</TableCell>
                      <TableCell>{a.requester_name || a.created_by || '-'}</TableCell>
                      <TableCell align="right">{fmt(a.amount)}</TableCell>
                      <TableCell>{a.created_at ? new Date(a.created_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell><Chip label={a.status || 'pending'} size="small" sx={{ textTransform: 'capitalize', fontWeight: 600 }} color={a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'error' : 'warning'} /></TableCell>
                      <TableCell align="right">
                        {tab === 0 && (<>
                          <IconButton size="small" color="success" onClick={() => setActionDialog(a)}><Check size={16} /></IconButton>
                          <IconButton size="small" color="error" onClick={() => setActionDialog({ ...a, _reject: true })}><X size={16} /></IconButton>
                        </>)}
                        {a.promotion_id && <IconButton size="small" onClick={() => navigate(`/execute/promotions/${a.promotion_id}`)}><Eye size={16} /></IconButton>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(actionDialog)} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{actionDialog?._reject ? 'Reject' : 'Approve'} Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {actionDialog?._reject ? 'Reject' : 'Approve'} {actionDialog?.promotion_name || 'this request'} for {fmt(actionDialog?.amount)}?
          </Typography>
          <TextField fullWidth label="Comments (optional)" multiline rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(null)}>Cancel</Button>
          <Button variant="contained" color={actionDialog?._reject ? 'error' : 'success'}
            onClick={() => handleAction(actionDialog?._reject ? 'rejected' : 'approved')}>
            {actionDialog?._reject ? 'Reject' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
