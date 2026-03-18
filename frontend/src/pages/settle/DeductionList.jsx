import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Alert } from '@mui/material';
import { Plus, Search } from 'lucide-react';
import { deductionService, customerService } from '../../services/api';
import { useTerminology } from '../../contexts/TerminologyContext';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function DeductionList() {
  const { t, tPlural } = useTerminology();
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ deduction_type: 'trade_promotion', amount: '', customer_id: '', description: '', invoice_number: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [res, cust] = await Promise.allSettled([deductionService.getAll(), customerService.getAll()]);
      if (res.status === 'fulfilled') setDeductions(res.value.data || res.value || []);
      if (cust.status === 'fulfilled') setCustomers(cust.value.data || cust.value || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = deductions.filter(d => (d.description || d.invoice_number || '').toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      await deductionService.create({ ...form, amount: Number(form.amount) });
      setShowCreate(false); load();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const statusColor = (s) => ({ matched: '#059669', unmatched: '#F59E0B', disputed: '#DC2626', resolved: '#2563EB' }[s] || '#94A3B8');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">{tPlural('deduction')}</Typography><Typography variant="body2" color="text.secondary">Track and resolve {t('customer').toLowerCase()} {tPlural('deduction').toLowerCase()}</Typography></Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New {t('deduction')}</Button>
      </Box>
      <Card>
        <CardContent>
          <TextField placeholder="Search deductions..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} /> }} sx={{ mb: 2, maxWidth: 360, width: '100%' }} />
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Description</TableCell><TableCell>Invoice</TableCell><TableCell>Customer</TableCell><TableCell align="right">Amount</TableCell><TableCell>Status</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No deductions found</Typography></TableCell></TableRow>
                  ) : filtered.map(d => (
                    <TableRow key={d.id}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{d.description || d.deduction_type}</Typography></TableCell>
                      <TableCell>{d.invoice_number || '-'}</TableCell>
                      <TableCell>{d.customer_name || '-'}</TableCell>
                      <TableCell align="right">{fmt(d.amount)}</TableCell>
                      <TableCell><Chip label={(d.status || 'unmatched').replace(/_/g, ' ')} size="small" sx={{ bgcolor: `${statusColor(d.status)}15`, color: statusColor(d.status), fontWeight: 600, textTransform: 'capitalize' }} /></TableCell>
                      <TableCell>{d.created_at ? new Date(d.created_at).toLocaleDateString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Deduction</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Invoice Number" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Type" value={form.deduction_type} onChange={(e) => setForm({ ...form, deduction_type: e.target.value })}>
              <MenuItem value="trade_promotion">Trade Promotion</MenuItem><MenuItem value="damage">Damage</MenuItem><MenuItem value="shortage">Shortage</MenuItem><MenuItem value="pricing">Pricing</MenuItem>
            </TextField></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Customer" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <MenuItem value="">Select</MenuItem>{customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name || c.customer_name}</MenuItem>)}
            </TextField></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setShowCreate(false)}>Cancel</Button><Button variant="contained" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
