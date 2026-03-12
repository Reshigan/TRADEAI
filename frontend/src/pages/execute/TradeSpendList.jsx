import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, LinearProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Alert } from '@mui/material';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tradeSpendService, customerService } from '../../services/api';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function TradeSpendList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ description: '', amount: '', spend_type: 'promotion', customer_id: '', date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [res, cust] = await Promise.allSettled([tradeSpendService.getAll(), customerService.getAll()]);
      if (res.status === 'fulfilled') setItems(res.value.data || res.value || []);
      if (cust.status === 'fulfilled') setCustomers(cust.value.data || cust.value || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(i => (i.description || '').toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      await tradeSpendService.create({ ...form, amount: Number(form.amount) });
      setShowCreate(false); load();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await tradeSpendService.delete(id); load(); } catch (e) { console.error(e); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">Trade Spends</Typography><Typography variant="body2" color="text.secondary">Track and manage trade spend transactions</Typography></Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New Trade Spend</Button>
      </Box>
      <Card>
        <CardContent>
          <TextField placeholder="Search..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} /> }} sx={{ mb: 2, maxWidth: 360, width: '100%' }} />
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Description</TableCell><TableCell>Type</TableCell><TableCell>Customer</TableCell><TableCell align="right">Amount</TableCell><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No trade spends found</Typography></TableCell></TableRow>
                  ) : filtered.map(i => (
                    <TableRow key={i.id}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{i.description || i.name}</Typography></TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{(i.spend_type || i.type || '').replace(/_/g, ' ')}</TableCell>
                      <TableCell>{i.customer_name || '-'}</TableCell>
                      <TableCell align="right">{fmt(i.amount)}</TableCell>
                      <TableCell>{i.date ? new Date(i.date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell><Chip label={i.status || 'active'} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                      <TableCell align="right"><IconButton size="small" onClick={() => handleDelete(i.id)}><Trash2 size={16} /></IconButton></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Trade Spend</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Type" value={form.spend_type} onChange={(e) => setForm({ ...form, spend_type: e.target.value })}>
              <MenuItem value="promotion">Promotion</MenuItem><MenuItem value="display">Display</MenuItem><MenuItem value="slotting">Slotting</MenuItem><MenuItem value="rebate">Rebate</MenuItem>
            </TextField></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Customer" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <MenuItem value="">None</MenuItem>{customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name || c.customer_name}</MenuItem>)}
            </TextField></Grid>
            <Grid item xs={6}><TextField fullWidth label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setShowCreate(false)}>Cancel</Button><Button variant="contained" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
