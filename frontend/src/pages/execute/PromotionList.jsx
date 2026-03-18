import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, MenuItem, TextField } from '@mui/material';
import { Plus, Eye, Trash2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { promotionService } from '../../services/api';
import { useTerminology } from '../../contexts/TerminologyContext';
import { SmartTable, PageHeader } from '../../components/shared';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function PromotionList() {
  const navigate = useNavigate();
  const { t, tPlural } = useTerminology();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await promotionService.getAll(params);
      setPromos(res.data || res || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promotion?')) return;
    try { await promotionService.delete(id); load(); } catch (e) { console.error(e); }
  };

  const columns = [
    { field: 'name', headerName: 'Name', renderCell: ({ row }) => row.name || row.promotion_name || '—' },
    { field: 'type', headerName: 'Type', renderCell: ({ row }) => (row.type || row.promotion_type || '').replace(/_/g, ' ') },
    { field: 'customer_name', headerName: 'Customer' },
    { field: 'status', headerName: 'Status', type: 'status' },
    { field: 'planned_spend', headerName: 'Budget', type: 'currency', renderCell: ({ row }) => fmt(row.planned_spend || row.budget) },
    { field: 'start_date', headerName: 'Start', type: 'date' },
    { field: 'end_date', headerName: 'End', type: 'date' },
  ];

  const rowActions = [
    { label: 'View', icon: <Eye size={16} />, onClick: (row) => navigate(`/execute/promotions/${row.id}`) },
    { label: 'Edit', icon: <Edit size={16} />, onClick: (row) => navigate(`/execute/promotions/${row.id}`) },
    { label: 'Delete', icon: <Trash2 size={16} />, onClick: (row) => handleDelete(row.id) },
  ];

  return (
    <Box>
      <PageHeader
        title={tPlural('promotion')}
        subtitle={`Manage ${tPlural('promotion').toLowerCase()}`}
        actions={
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => navigate('/execute/promotions/new')}>
            New {t('promotion')}
          </Button>
        }
      />
      <SmartTable
        columns={columns}
        data={promos}
        loading={loading}
        onRowClick={(row) => navigate(`/execute/promotions/${row.id}`)}
        rowActions={rowActions}
        searchPlaceholder={`Search ${tPlural('promotion').toLowerCase()}...`}
        emptyMessage={`No ${tPlural('promotion').toLowerCase()} found`}
        filters={
          <Box sx={{ px: 2, pb: 1 }}>
            <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="pending_approval">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
          </Box>
        }
      />
    </Box>
  );
}
