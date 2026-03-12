import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Alert } from '@mui/material';
import { Plus, Search } from 'lucide-react';
import { tradingTermsService } from '../../services/api';

export default function TradingTermsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', term_type: 'rebate', rate: '', frequency: 'monthly', customer_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { const res = await tradingTermsService.getAll(); setItems(res.data || res || []); } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    setSaving(true); setError('');
    try { await tradingTermsService.create({ ...form, rate: Number(form.rate) }); setShowCreate(false); load(); } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">Trading Terms</Typography><Typography variant="body2" color="text.secondary">Manage customer trading terms and agreements</Typography></Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New Term</Button>
      </Box>
      <Card>
        <CardContent>
          <TextField placeholder="Search terms..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} /> }} sx={{ mb: 2, maxWidth: 360, width: '100%' }} />
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell align="right">Rate</TableCell><TableCell>Frequency</TableCell><TableCell>Customer</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No trading terms found</Typography></TableCell></TableRow>
                  ) : filtered.map(i => (
                    <TableRow key={i.id}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{i.name}</Typography></TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{(i.term_type || '').replace(/_/g, ' ')}</TableCell>
                      <TableCell align="right">{i.rate ? `${Number(i.rate).toFixed(1)}%` : '-'}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{i.frequency || '-'}</TableCell>
                      <TableCell>{i.customer_name || '-'}</TableCell>
                      <TableCell><Chip label={i.status || 'active'} size="small" color={i.status === 'active' ? 'success' : 'default'} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Trading Term</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Type" value={form.term_type} onChange={(e) => setForm({ ...form, term_type: e.target.value })}>
              <MenuItem value="rebate">Rebate</MenuItem><MenuItem value="discount">Discount</MenuItem><MenuItem value="allowance">Allowance</MenuItem><MenuItem value="listing_fee">Listing Fee</MenuItem>
            </TextField></Grid>
            <Grid item xs={6}><TextField fullWidth label="Rate (%)" type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Frequency" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              <MenuItem value="monthly">Monthly</MenuItem><MenuItem value="quarterly">Quarterly</MenuItem><MenuItem value="annual">Annual</MenuItem>
            </TextField></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setShowCreate(false)}>Cancel</Button><Button variant="contained" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
