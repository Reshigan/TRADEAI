import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, LinearProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Alert } from '@mui/material';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tradeSpendService, customerService } from '../../services/api';
import { useTerminology } from '../../contexts/TerminologyContext';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function TradeSpendList() {
  const navigate = useNavigate();
  const { t, tPlural } = useTerminology();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ notes: '', spendType: 'promotion', category: 'volume_discount', amountRequested: '', customer: '', startDate: new Date().toISOString().split('T')[0], endDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [res, cust] = await Promise.allSettled([tradeSpendService.getAll(), customerService.getAll()]);
      if (res.status === 'fulfilled') {
        const data = res.value?.data || res.value || [];
        setItems(Array.isArray(data) ? data : []);
      }
      if (cust.status === 'fulfilled') {
        const data = cust.value?.data || cust.value || [];
        setCustomers(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = (Array.isArray(items) ? items : []).filter(i => {
    const text = `${i.notes || ''} ${i.category || ''} ${i.spendId || ''}`.toLowerCase();
    const custName = (i.customer?.name || '').toLowerCase();
    return text.includes(search.toLowerCase()) || custName.includes(search.toLowerCase());
  });

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      await tradeSpendService.create({ spendType: form.spendType, category: form.category, amount: { requested: Number(form.amountRequested) }, period: { startDate: form.startDate, endDate: form.endDate || form.startDate }, customer: form.customer, notes: form.notes });
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
        <Box><Typography variant="h1">{tPlural('trade_spend')}</Typography><Typography variant="body2" color="text.secondary">Track and manage {tPlural('trade_spend').toLowerCase()}</Typography></Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New {t('trade_spend')}</Button>
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
                    <TableRow key={i._id || i.id}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{i.notes || i.category || i.spendId || '-'}</Typography></TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{(i.spendType || '').replace(/_/g, ' ')}</TableCell>
                      <TableCell>{i.customer?.name || '-'}</TableCell>
                      <TableCell align="right">{fmt(i.amount?.requested || i.amount?.approved || i.amount?.spent || 0)}</TableCell>
                      <TableCell>{i.period?.startDate ? new Date(i.period.startDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell><Chip label={i.status || 'active'} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                      <TableCell align="right"><IconButton size="small" onClick={() => handleDelete(i._id || i.id)}><Trash2 size={16} /></IconButton></TableCell>
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
            <Grid item xs={12}><TextField fullWidth label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Amount" type="number" value={form.amountRequested} onChange={(e) => setForm({ ...form, amountRequested: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Type" value={form.spendType} onChange={(e) => setForm({ ...form, spendType: e.target.value })}>
              <MenuItem value="promotion">Promotion</MenuItem><MenuItem value="marketing">Marketing</MenuItem><MenuItem value="cash_coop">Cash Co-op</MenuItem><MenuItem value="trading_terms">Trading Terms</MenuItem><MenuItem value="rebate">Rebate</MenuItem>
            </TextField></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <MenuItem value="volume_discount">Volume Discount</MenuItem><MenuItem value="display_allowance">Display Allowance</MenuItem><MenuItem value="promotional_support">Promotional Support</MenuItem><MenuItem value="listing_fee">Listing Fee</MenuItem><MenuItem value="slotting_fee">Slotting Fee</MenuItem>
            </TextField></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Customer" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} required>
              <MenuItem value="">Select Customer</MenuItem>{customers.map(c => <MenuItem key={c._id || c.id} value={c._id || c.id}>{c.name || c.customer_name}</MenuItem>)}
            </TextField></Grid>
            <Grid item xs={6}><TextField fullWidth label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} InputLabelProps={{ shrink: true }} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setShowCreate(false)}>Cancel</Button><Button variant="contained" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
