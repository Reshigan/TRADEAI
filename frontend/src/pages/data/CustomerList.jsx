import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { customerService } from '../../services/api';
import { SmartTable, PageHeader, SmartField, FormSection } from '../../components/shared';
import { useToast } from '../../components/common/ToastNotification';
import useConfirmDialog from '../../hooks/useConfirmDialog';

const CHANNELS = [
  { value: 'retail', label: 'Retail' }, { value: 'wholesale', label: 'Wholesale' },
  { value: 'ecommerce', label: 'E-Commerce' }, { value: 'foodservice', label: 'Foodservice' },
  { value: 'convenience', label: 'Convenience' }, { value: 'pharmacy', label: 'Pharmacy' },
];
const SUB_CHANNELS = [
  { value: '', label: 'None' }, { value: 'hypermarket', label: 'Hypermarket' }, { value: 'supermarket', label: 'Supermarket' },
  { value: 'discounter', label: 'Discounter' }, { value: 'cash_carry', label: 'Cash & Carry' },
  { value: 'independent', label: 'Independent' }, { value: 'online_marketplace', label: 'Online Marketplace' },
];
const CUSTOMER_TYPES = [
  { value: 'key_account', label: 'Key Account' }, { value: 'regional', label: 'Regional' },
  { value: 'independent', label: 'Independent' }, { value: 'distributor', label: 'Distributor' },
  { value: 'buying_group', label: 'Buying Group' },
];
const SEGMENTATIONS = [
  { value: '', label: 'None' }, { value: 'premium', label: 'Premium' }, { value: 'mainstream', label: 'Mainstream' },
  { value: 'value', label: 'Value' }, { value: 'economy', label: 'Economy' },
];

const emptyForm = {
  name: '', code: '', sap_customer_id: '', customer_type: 'key_account',
  channel: 'retail', sub_channel: '', tier: 'A', status: 'active',
  region: '', city: '', segmentation: '',
  hierarchy_1: '', hierarchy_2: '', hierarchy_3: '', head_office: '',
};

export default function CustomerList() {
  const toast = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await customerService.getAll();
      const data = res?.data || res || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); setFetchError(e.message || 'Failed to load data'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
    if (!await confirm('Delete this customer?', { severity: 'error' })) return;
    try { await customerService.delete(id); load(); } catch (e) { console.error(e); toast.error('An error occurred'); }
  };

  const tierColor = (tc) => ({ A: '#059669', B: '#2563EB', C: '#D97706', D: '#DC2626' }[tc] || '#94A3B8');
  const activeCount = items.filter(i => i.status === 'active').length;
  const tierCounts = { A: items.filter(i => i.tier === 'A').length, B: items.filter(i => i.tier === 'B').length, C: items.filter(i => i.tier === 'C').length };

  const columns = [
    { field: 'name', headerName: 'Name', renderCell: ({ row }) => row.name || row.customer_name || '—' },
    { field: 'code', headerName: 'Code', renderCell: ({ row }) => row.code || row.customer_code || '—' },
    { field: 'customer_type', headerName: 'Type', renderCell: ({ row }) => (row.customer_type || '').replace(/_/g, ' ') },
    { field: 'channel', headerName: 'Channel' },
    { field: 'region', headerName: 'Region' },
    { field: 'tier', headerName: 'Tier', type: 'chip', renderCell: ({ row }) => row.tier || '—' },
    { field: 'status', headerName: 'Status', type: 'status' },
  ];

  const rowActions = [
    { label: 'Edit', icon: <Edit2 size={16} />, onClick: (row) => handleEdit(row) },
    { label: 'Delete', icon: <Trash2 size={16} />, onClick: (row) => handleDelete(row.id) },
  ];

  return (
    <Box>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => { setFetchError(null); load(); }}>Retry</Button>}>
          {fetchError}
        </Alert>
      )}
      <PageHeader
        title="Customer Management"
        subtitle="Manage customer master data, hierarchy, and segmentation"
        actions={
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setEditId(null); setForm({ ...emptyForm }); setShowCreate(true); }}>
            Add Customer
          </Button>
        }
      />

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

      <SmartTable
        columns={columns}
        data={items}
        loading={loading}
        rowActions={rowActions}
        searchPlaceholder="Search by name or code..."
        emptyMessage="No customers found"
      />

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editId ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <FormSection title="Basic Information" defaultOpen required>
            <Grid container spacing={2}>
              <Grid item xs={6}><SmartField name="name" label="Customer Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Grid>
              <Grid item xs={3}><SmartField name="code" label="Customer Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Grid>
              <Grid item xs={3}><SmartField name="sap_customer_id" label="SAP Customer ID" value={form.sap_customer_id} onChange={(e) => setForm({ ...form, sap_customer_id: e.target.value })} /></Grid>
              <Grid item xs={4}>
                <SmartField name="customer_type" label="Customer Type" type="select" value={form.customer_type} onChange={(e) => setForm({ ...form, customer_type: e.target.value })}
                  options={CUSTOMER_TYPES} />
              </Grid>
              <Grid item xs={4}>
                <SmartField name="tier" label="Tier" type="select" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}
                  options={[{ value: 'A', label: 'A - Strategic' }, { value: 'B', label: 'B - Important' }, { value: 'C', label: 'C - Standard' }, { value: 'D', label: 'D - Transactional' }]} />
              </Grid>
              <Grid item xs={4}>
                <SmartField name="status" label="Status" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'prospect', label: 'Prospect' }, { value: 'suspended', label: 'Suspended' }]} />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title="Channel & Segmentation" defaultOpen>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <SmartField name="channel" label="Channel" type="select" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}
                  options={CHANNELS} />
              </Grid>
              <Grid item xs={4}>
                <SmartField name="sub_channel" label="Sub-Channel" type="select" value={form.sub_channel} onChange={(e) => setForm({ ...form, sub_channel: e.target.value })}
                  options={SUB_CHANNELS} />
              </Grid>
              <Grid item xs={4}>
                <SmartField name="segmentation" label="Segmentation" type="select" value={form.segmentation} onChange={(e) => setForm({ ...form, segmentation: e.target.value })}
                  options={SEGMENTATIONS} />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title="Location & Hierarchy" defaultOpen>
            <Grid container spacing={2}>
              <Grid item xs={4}><SmartField name="region" label="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></Grid>
              <Grid item xs={4}><SmartField name="city" label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Grid>
              <Grid item xs={4}><SmartField name="head_office" label="Head Office" value={form.head_office} onChange={(e) => setForm({ ...form, head_office: e.target.value })} /></Grid>
              <Grid item xs={4}><SmartField name="hierarchy_1" label="Hierarchy Level 1" value={form.hierarchy_1} onChange={(e) => setForm({ ...form, hierarchy_1: e.target.value })} /></Grid>
              <Grid item xs={4}><SmartField name="hierarchy_2" label="Hierarchy Level 2" value={form.hierarchy_2} onChange={(e) => setForm({ ...form, hierarchy_2: e.target.value })} /></Grid>
              <Grid item xs={4}><SmartField name="hierarchy_3" label="Hierarchy Level 3" value={form.hierarchy_3} onChange={(e) => setForm({ ...form, hierarchy_3: e.target.value })} /></Grid>
            </Grid>
          </FormSection>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name}>{saving ? 'Saving...' : editId ? 'Update Customer' : 'Create Customer'}</Button>
        </DialogActions>
      </Dialog>
    {ConfirmDialogComponent}
    </Box>
  );
}
