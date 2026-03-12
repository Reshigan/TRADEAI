import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Alert } from '@mui/material';
import { Plus, Search } from 'lucide-react';
import { claimService, customerService } from '../../services/api';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function ClaimList() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ claim_type: 'promotion', amount: '', customer_id: '', description: '', promotion_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [res, cust] = await Promise.allSettled([claimService.getAll(), customerService.getAll()]);
      if (res.status === 'fulfilled') setClaims(res.value.data || res.value || []);
      if (cust.status === 'fulfilled') setCustomers(cust.value.data || cust.value || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = claims.filter(c => (c.description || c.claim_type || '').toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      await claimService.create({ ...form, amount: Number(form.amount) });
      setShowCreate(false); load();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">Claims</Typography><Typography variant="body2" color="text.secondary">Manage promotion claims and reimbursements</Typography></Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New Claim</Button>
      </Box>
      <Card>
        <CardContent>
          <TextField placeholder="Search claims..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} /> }} sx={{ mb: 2, maxWidth: 360, width: '100%' }} />
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Description</TableCell><TableCell>Type</TableCell><TableCell>Customer</TableCell><TableCell align="right">Amount</TableCell><TableCell>Status</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No claims found</Typography></TableCell></TableRow>
                  ) : filtered.map(c => (
                    <TableRow key={c.id}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{c.description || c.claim_type}</Typography></TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{(c.claim_type || '').replace(/_/g, ' ')}</TableCell>
                      <TableCell>{c.customer_name || '-'}</TableCell>
                      <TableCell align="right">{fmt(c.amount)}</TableCell>
                      <TableCell><Chip label={c.status || 'pending'} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                      <TableCell>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Claim</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Type" value={form.claim_type} onChange={(e) => setForm({ ...form, claim_type: e.target.value })}>
              <MenuItem value="promotion">Promotion</MenuItem><MenuItem value="display">Display</MenuItem><MenuItem value="rebate">Rebate</MenuItem><MenuItem value="damage">Damage</MenuItem>
            </TextField></Grid>
            <Grid item xs={12}><TextField fullWidth select label="Customer" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <MenuItem value="">Select Customer</MenuItem>{customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name || c.customer_name}</MenuItem>)}
            </TextField></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setShowCreate(false)}>Cancel</Button><Button variant="contained" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
