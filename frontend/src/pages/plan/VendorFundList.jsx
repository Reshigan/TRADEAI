import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Alert } from '@mui/material';
import { Plus, Search, Building2 } from 'lucide-react';
import api from '../../services/api';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function VendorFundList() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ vendor_name: '', fund_name: '', total_amount: '', fund_type: 'marketing_development', start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/vendor-funds');
      setFunds(res.data?.data || res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = funds.filter(f => (f.fund_name || f.vendor_name || '').toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      await api.post('/vendor-funds', { ...form, total_amount: Number(form.total_amount) });
      setShowCreate(false); load();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">Vendor Funds</Typography><Typography variant="body2" color="text.secondary">Manage vendor-funded trade programs</Typography></Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New Fund</Button>
      </Box>
      <Card>
        <CardContent>
          <TextField placeholder="Search funds..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} /> }} sx={{ mb: 2, maxWidth: 360, width: '100%' }} />
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Vendor</TableCell><TableCell>Fund Name</TableCell><TableCell>Type</TableCell><TableCell align="right">Total</TableCell><TableCell align="right">Used</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No vendor funds found</Typography></TableCell></TableRow>
                  ) : filtered.map(f => (
                    <TableRow key={f.id}>
                      <TableCell>{f.vendor_name}</TableCell>
                      <TableCell><Typography variant="body2" fontWeight={500}>{f.fund_name}</Typography></TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{(f.fund_type || '').replace('_', ' ')}</TableCell>
                      <TableCell align="right">{fmt(f.total_amount)}</TableCell>
                      <TableCell align="right">{fmt(f.used_amount)}</TableCell>
                      <TableCell><Chip label={f.status || 'active'} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Vendor Fund</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField fullWidth label="Vendor Name" value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Fund Name" value={form.fund_name} onChange={(e) => setForm({ ...form, fund_name: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Total Amount" type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Fund Type" value={form.fund_type} onChange={(e) => setForm({ ...form, fund_type: e.target.value })}>
              <MenuItem value="marketing_development">Marketing Development</MenuItem><MenuItem value="trade_allowance">Trade Allowance</MenuItem><MenuItem value="volume_rebate">Volume Rebate</MenuItem>
            </TextField></Grid>
            <Grid item xs={6}><TextField fullWidth label="Start Date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="End Date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setShowCreate(false)}>Cancel</Button><Button variant="contained" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
