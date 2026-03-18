import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, LinearProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Alert, Divider, Tabs, Tab } from '@mui/material';
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react';
import { customerService } from '../../services/api';

const CHANNELS = [
  { value: 'retail', label: 'Retail' }, { value: 'wholesale', label: 'Wholesale' },
  { value: 'ecommerce', label: 'E-Commerce' }, { value: 'foodservice', label: 'Foodservice' },
  { value: 'convenience', label: 'Convenience' }, { value: 'pharmacy', label: 'Pharmacy' },
];
const SUB_CHANNELS = [
  { value: 'hypermarket', label: 'Hypermarket' }, { value: 'supermarket', label: 'Supermarket' },
  { value: 'discounter', label: 'Discounter' }, { value: 'cash_carry', label: 'Cash & Carry' },
  { value: 'independent', label: 'Independent' }, { value: 'online_marketplace', label: 'Online Marketplace' },
];
const CUSTOMER_TYPES = [
  { value: 'key_account', label: 'Key Account' }, { value: 'regional', label: 'Regional' },
  { value: 'independent', label: 'Independent' }, { value: 'distributor', label: 'Distributor' },
  { value: 'buying_group', label: 'Buying Group' },
];
const SEGMENTATIONS = [
  { value: 'premium', label: 'Premium' }, { value: 'mainstream', label: 'Mainstream' },
  { value: 'value', label: 'Value' }, { value: 'economy', label: 'Economy' },
];

const emptyForm = {
  name: '', code: '', sap_customer_id: '', customer_type: 'key_account',
  channel: 'retail', sub_channel: '', tier: 'A', status: 'active',
  region: '', city: '', segmentation: '',
  hierarchy_1: '', hierarchy_2: '', hierarchy_3: '', head_office: '',
};

export default function CustomerList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [tabFilter, setTabFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const res = await customerService.getAll();
      const data = res?.data || res || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = (Array.isArray(items) ? items : []).filter(i => {
    const matchSearch = (i.name || i.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.code || i.customer_code || '').toLowerCase().includes(search.toLowerCase());
    const matchTab = tabFilter === 'all' || i.tier === tabFilter || i.channel === tabFilter;
    return matchSearch && matchTab;
  });

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (!editId) Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });
      if (editId) { await customerService.update(editId, payload); }
      else { await customerService.create(payload); }
      setShowCreate(false); setEditId(null); setForm({ ...emptyForm }); load();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name || item.customer_name || '', code: item.code || item.customer_code || '',
      sap_customer_id: item.sap_customer_id || '', customer_type: item.customer_type || 'key_account',
      channel: item.channel || 'retail', sub_channel: item.sub_channel || '',
      tier: item.tier || 'A', status: item.status || 'active',
      region: item.region || '', city: item.city || '', segmentation: item.segmentation || '',
      hierarchy_1: item.hierarchy_1 || '', hierarchy_2: item.hierarchy_2 || '',
      hierarchy_3: item.hierarchy_3 || '', head_office: item.head_office || '',
    });
    setEditId(item.id); setShowCreate(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try { await customerService.delete(id); load(); } catch (e) { console.error(e); }
  };

  const tierColor = (t) => ({ A: '#059669', B: '#2563EB', C: '#D97706', D: '#DC2626' }[t] || '#94A3B8');
  const activeCount = items.filter(i => i.status === 'active').length;
  const tierCounts = { A: items.filter(i => i.tier === 'A').length, B: items.filter(i => i.tier === 'B').length, C: items.filter(i => i.tier === 'C').length };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Customer Management</Typography>
          <Typography variant="body2" color="text.secondary">Manage customer master data, hierarchy, and segmentation</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setEditId(null); setForm({ ...emptyForm }); setShowCreate(true); }}>Add Customer</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Customers', value: items.length, icon: <Users size={18} /> },
          { label: 'Active', value: activeCount, color: 'success.main' },
          { label: 'Tier A', value: tierCounts.A, color: '#059669' },
          { label: 'Tier B / C', value: `${tierCounts.B} / ${tierCounts.C}` },
        ].map(kpi => (
          <Grid item xs={6} sm={3} key={kpi.label}>
            <Card><CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
              <Typography variant="h6" fontWeight={700} color={kpi.color}>{kpi.value}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField placeholder="Search by name or code..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} /> }} sx={{ flex: 1, maxWidth: 360 }} />
            <Tabs value={tabFilter} onChange={(e, v) => setTabFilter(v)} sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0 } }}>
              <Tab label={`All (${items.length})`} value="all" />
              <Tab label={`Tier A (${tierCounts.A})`} value="A" />
              <Tab label={`Tier B (${tierCounts.B})`} value="B" />
            </Tabs>
          </Box>
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Name</TableCell><TableCell>Code</TableCell><TableCell>Type</TableCell><TableCell>Channel</TableCell>
                  <TableCell>Region</TableCell><TableCell>City</TableCell><TableCell>Tier</TableCell><TableCell>Segmentation</TableCell>
                  <TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={10} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No customers found</Typography></TableCell></TableRow>
                  ) : filtered.map(i => (
                    <TableRow key={i.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{i.name || i.customer_name}</Typography>
                        {i.head_office && <Typography variant="caption" color="text.secondary" display="block">HO: {i.head_office}</Typography>}
                      </TableCell>
                      <TableCell><Typography variant="body2" fontFamily="monospace">{i.code || i.customer_code || '-'}</Typography></TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{(i.customer_type || '').replace('_', ' ') || '-'}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{i.channel || '-'}{i.sub_channel ? ` / ${i.sub_channel.replace('_', ' ')}` : ''}</TableCell>
                      <TableCell>{i.region || '-'}</TableCell>
                      <TableCell>{i.city || '-'}</TableCell>
                      <TableCell><Chip label={i.tier || '-'} size="small" sx={{ bgcolor: `${tierColor(i.tier)}15`, color: tierColor(i.tier), fontWeight: 700 }} /></TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{(i.segmentation || '-').replace('_', ' ')}</TableCell>
                      <TableCell><Chip label={i.status || 'active'} size="small" color={i.status === 'active' ? 'success' : 'default'} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleEdit(i)} title="Edit"><Edit2 size={16} /></IconButton>
                        <IconButton size="small" onClick={() => handleDelete(i.id)} title="Delete"><Trash2 size={16} /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editId ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>Basic Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField fullWidth label="Customer Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required helperText="Legal or trading name" /></Grid>
            <Grid item xs={3}><TextField fullWidth label="Customer Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} helperText="Internal code" /></Grid>
            <Grid item xs={3}><TextField fullWidth label="SAP Customer ID" value={form.sap_customer_id} onChange={(e) => setForm({ ...form, sap_customer_id: e.target.value })} helperText="SAP KNA1 number" /></Grid>
            <Grid item xs={4}>
              <TextField fullWidth select label="Customer Type" value={form.customer_type} onChange={(e) => setForm({ ...form, customer_type: e.target.value })}>
                {CUSTOMER_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth select label="Tier" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
                <MenuItem value="A">A - Strategic</MenuItem><MenuItem value="B">B - Important</MenuItem><MenuItem value="C">C - Standard</MenuItem><MenuItem value="D">D - Transactional</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem><MenuItem value="prospect">Prospect</MenuItem><MenuItem value="suspended">Suspended</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Channel & Segmentation</Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField fullWidth select label="Channel" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                {CHANNELS.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth select label="Sub-Channel" value={form.sub_channel} onChange={(e) => setForm({ ...form, sub_channel: e.target.value })}>
                <MenuItem value="">None</MenuItem>
                {SUB_CHANNELS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth select label="Segmentation" value={form.segmentation} onChange={(e) => setForm({ ...form, segmentation: e.target.value })}>
                <MenuItem value="">None</MenuItem>
                {SEGMENTATIONS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Location & Hierarchy</Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}><TextField fullWidth label="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} helperText="E.g. Gauteng, Western Cape" /></Grid>
            <Grid item xs={4}><TextField fullWidth label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Head Office" value={form.head_office} onChange={(e) => setForm({ ...form, head_office: e.target.value })} helperText="Parent company / HO" /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Hierarchy Level 1" value={form.hierarchy_1} onChange={(e) => setForm({ ...form, hierarchy_1: e.target.value })} helperText="E.g. Banner Group" /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Hierarchy Level 2" value={form.hierarchy_2} onChange={(e) => setForm({ ...form, hierarchy_2: e.target.value })} helperText="E.g. Division" /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Hierarchy Level 3" value={form.hierarchy_3} onChange={(e) => setForm({ ...form, hierarchy_3: e.target.value })} helperText="E.g. Store Group" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name}>{saving ? 'Saving...' : editId ? 'Update Customer' : 'Create Customer'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
