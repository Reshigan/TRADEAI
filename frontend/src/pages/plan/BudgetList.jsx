import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, LinearProgress, Alert } from '@mui/material';
import { Plus, Search, Edit2, Trash2, Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { budgetService } from '../../services/api';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function BudgetList() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', total_amount: '', fiscal_year: new Date().getFullYear(), category: 'trade_promotion', status: 'draft' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await budgetService.getAll();
      setBudgets(res.data || res || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = budgets.filter(b => (b.name || '').toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      await budgetService.create({ ...form, total_amount: Number(form.total_amount) });
      setShowCreate(false);
      setForm({ name: '', total_amount: '', fiscal_year: new Date().getFullYear(), category: 'trade_promotion', status: 'draft' });
      load();
    } catch (e) { setError(e.response?.data?.message || 'Failed to create budget'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try { await budgetService.delete(id); load(); } catch (e) { console.error(e); }
  };

  const statusColor = (s) => ({ draft: '#94A3B8', approved: '#2563EB', active: '#059669', closed: '#6B7280' }[s] || '#94A3B8');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">Budgets</Typography><Typography variant="body2" color="text.secondary">Manage trade promotion budgets</Typography></Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New Budget</Button>
      </Box>

      <Card>
        <CardContent sx={{ pb: '16px !important' }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField placeholder="Search budgets..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} /> }} sx={{ flex: 1, maxWidth: 360 }} />
          </Box>
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Budget Name</TableCell><TableCell>Category</TableCell><TableCell>Fiscal Year</TableCell><TableCell align="right">Total</TableCell><TableCell align="right">Spent</TableCell><TableCell>Utilization</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No budgets found</Typography></TableCell></TableRow>
                  ) : filtered.map(b => {
                    const spent = Number(b.spent_amount || b.committed_amount || 0);
                    const total = Number(b.total_amount || 0);
                    const util = total > 0 ? (spent / total) * 100 : 0;
                    return (
                      <TableRow key={b.id}>
                        <TableCell><Typography variant="body2" fontWeight={500}>{b.name}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{(b.category || '').replace('_', ' ')}</Typography></TableCell>
                        <TableCell>{b.fiscal_year}</TableCell>
                        <TableCell align="right">{fmt(total)}</TableCell>
                        <TableCell align="right">{fmt(spent)}</TableCell>
                        <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LinearProgress variant="determinate" value={Math.min(util, 100)} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: util > 90 ? '#DC2626' : '#2563EB', borderRadius: 3 } }} /><Typography variant="caption">{util.toFixed(0)}%</Typography></Box></TableCell>
                        <TableCell><Chip label={b.status || 'draft'} size="small" sx={{ bgcolor: `${statusColor(b.status)}15`, color: statusColor(b.status), fontWeight: 600, textTransform: 'capitalize' }} /></TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => navigate(`/plan/budgets/${b.id}`)}><Eye size={16} /></IconButton>
                          <IconButton size="small" onClick={() => handleDelete(b.id)}><Trash2 size={16} /></IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Budget</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Budget Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Total Amount" type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Fiscal Year" type="number" value={form.fiscal_year} onChange={(e) => setForm({ ...form, fiscal_year: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <MenuItem value="trade_promotion">Trade Promotion</MenuItem><MenuItem value="marketing">Marketing</MenuItem><MenuItem value="vendor_funded">Vendor Funded</MenuItem>
            </TextField></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setShowCreate(false)}>Cancel</Button><Button variant="contained" onClick={handleCreate} disabled={saving || !form.name || !form.total_amount}>{saving ? 'Creating...' : 'Create'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
