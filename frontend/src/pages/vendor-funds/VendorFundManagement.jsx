import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Chip, LinearProgress, Card, CardContent, Grid, TextField, MenuItem, Table, TableHead, TableBody, TableRow, TableCell, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

const statusColors = { draft: 'default', active: 'success', expired: 'warning', closed: 'error', cancelled: 'error' };

const VendorFundManagement = () => {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ vendor_id: '', name: '', fund_type: 'marketing_coop', total_amount: '', start_date: '', end_date: '' });
  const navigate = useNavigate();

  const fetchFunds = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/vendor-funds');
      setFunds(res.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchVendors = async () => {
    try {
      const res = await apiClient.get('/vendors');
      setVendors(res.data?.data || res.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchFunds(); fetchVendors(); }, []);

  const totalAmount = funds.reduce((s, f) => s + (f.total_amount || 0), 0);
  const totalAvailable = funds.filter(f => f.status === 'active').reduce((s, f) => s + ((f.total_amount || 0) - (f.committed_amount || 0) - (f.spent_amount || 0)), 0);
  const activeFunds = funds.filter(f => f.status === 'active').length;
  const expiringSoon = funds.filter(f => f.status === 'active' && f.end_date && new Date(f.end_date) <= new Date(Date.now() + 30 * 86400000)).length;

  const handleCreate = async () => {
    try {
      await apiClient.post('/vendor-funds', { ...form, total_amount: parseFloat(form.total_amount) || 0 });
      setCreateOpen(false);
      setForm({ vendor_id: '', name: '', fund_type: 'marketing_coop', total_amount: '', start_date: '', end_date: '' });
      fetchFunds();
    } catch (e) { console.error(e); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Vendor Funds</Typography>
          <Typography variant="body2" color="text.secondary">Manage vendor-funded trade programs</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>New Fund</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Funds', value: `R${(totalAmount / 1000).toFixed(0)}K`, icon: <AccountBalanceIcon />, color: '#1E40AF' },
          { label: 'Active', value: activeFunds, icon: <CheckCircleIcon />, color: '#059669' },
          { label: 'Available Balance', value: `R${(totalAvailable / 1000).toFixed(0)}K`, icon: <AccountBalanceIcon />, color: '#3B82F6' },
          { label: 'Expiring Soon', value: expiringSoon, icon: <WarningAmberIcon />, color: '#F59E0B' },
        ].map((kpi, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ border: '1px solid #E2E8F0' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
                    <Typography variant="h5" fontWeight={700}>{kpi.value}</Typography>
                  </Box>
                  <Box sx={{ color: kpi.color }}>{kpi.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {loading ? <LinearProgress /> : (
        <Card sx={{ border: '1px solid #E2E8F0' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Fund Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vendor</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Utilization</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Expiry</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {funds.map(f => {
                const util = f.total_amount > 0 ? Math.round(((f.committed_amount || 0) + (f.spent_amount || 0)) / f.total_amount * 100) : 0;
                const utilColor = util > 90 ? '#EF4444' : util > 75 ? '#F59E0B' : '#059669';
                return (
                  <TableRow key={f.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/vendor-funds/${f.id}`)}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{f.name}</Typography></TableCell>
                    <TableCell>{f.vendor_id?.substring(0, 8)}</TableCell>
                    <TableCell><Chip label={f.fund_type} size="small" variant="outlined" /></TableCell>
                    <TableCell>R{(f.total_amount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={util} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: utilColor } }} />
                        <Typography variant="caption" fontWeight={600} sx={{ color: utilColor, minWidth: 36 }}>{util}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{f.end_date ? new Date(f.end_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell><Chip label={f.status} size="small" color={statusColors[f.status] || 'default'} /></TableCell>
                  </TableRow>
                );
              })}
              {funds.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No vendor funds yet. Create one to get started.</Typography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Vendor Fund</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Fund Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField select label="Vendor" value={form.vendor_id} onChange={e => setForm({ ...form, vendor_id: e.target.value })} fullWidth>
              {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
            </TextField>
            <TextField select label="Fund Type" value={form.fund_type} onChange={e => setForm({ ...form, fund_type: e.target.value })} fullWidth>
              {['marketing_coop', 'listing_fee', 'volume_rebate', 'display_allowance', 'scan_deal', 'lump_sum'].map(t => (
                <MenuItem key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</MenuItem>
              ))}
            </TextField>
            <TextField label="Total Amount (R)" type="number" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} fullWidth />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Start Date" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="End Date" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name || !form.vendor_id}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorFundManagement;
