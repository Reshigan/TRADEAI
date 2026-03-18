import React, { useState, useEffect, useMemo } from 'react';
import { Box, Button, Grid, Paper, Typography, alpha } from '@mui/material';
import { Add, AccountBalance, TrendingUp, CheckCircle } from '@mui/icons-material';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatLabel } from '../../utils/formatters';
import { useTerminology } from '../../contexts/TerminologyContext';
import { SmartTable, PageHeader } from '../../components/shared';

const RebatesList = () => {
  const navigate = useNavigate();
  const { t, tPlural } = useTerminology();
  const [rebates, setRebates] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRebates = async () => {
    try {
      const response = await api.get('/rebates');
      if (response.data.success) setRebates(response.data.data);
    } catch (error) {
      console.error('Failed to load rebates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRebates(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rebate?')) {
      try { await api.delete(`/rebates/${id}`); loadRebates(); } catch (error) { console.error('Failed to delete rebate:', error); }
    }
  };

  const getTypeLabel = (type) => ({ volume: 'Volume Rebate', growth: 'Growth Rebate', 'early-payment': 'Early Payment', slotting: 'Slotting Fee', coop: 'Co-op Marketing', 'off-invoice': 'Off-Invoice', billback: 'Bill-Back', display: 'Display/Feature' })[type] || formatLabel(type);

  const stats = useMemo(() => {
    const total = rebates.length;
    const active = rebates.filter(r => r.status === 'active').length;
    const totalAccrued = rebates.reduce((s, r) => s + (r.accruedAmount || r.totalAccrued || 0), 0);
    return { total, active, totalAccrued };
  }, [rebates]);

  const summaryCards = [
    { label: 'Total Rebates', value: stats.total, icon: <AccountBalance />, color: '#1E40AF', bg: alpha('#1E40AF', 0.08) },
    { label: 'Active', value: stats.active, icon: <CheckCircle />, color: '#059669', bg: alpha('#059669', 0.08) },
    { label: 'Total Accrued', value: `R${(stats.totalAccrued / 1000).toFixed(1)}K`, icon: <TrendingUp />, color: '#2563EB', bg: alpha('#2563EB', 0.08) },
  ];

  const columns = [
    { field: 'name', headerName: 'Name' },
    { field: 'rebateType', headerName: 'Type', renderCell: ({ row }) => getTypeLabel(row.rebateType || row.type) },
    { field: 'status', headerName: 'Status', type: 'status' },
    { field: 'rate', headerName: 'Rate/Amount', renderCell: ({ row }) => (row.rateType === 'percentage' || row.calculationType === 'percentage') ? `${row.rate || 0}%` : `R ${(row.amount || 0).toLocaleString()}` },
    { field: 'startDate', headerName: 'Period', type: 'date' },
    { field: 'accruedAmount', headerName: 'Accrued', align: 'right', renderCell: ({ row }) => `R ${(row.accruedAmount || row.totalAccrued || 0).toLocaleString()}` },
    { field: 'settledAmount', headerName: 'Paid', align: 'right', renderCell: ({ row }) => `R ${(row.settledAmount || row.totalPaid || 0).toLocaleString()}` },
  ];

  const rowActions = [
    { label: 'View', icon: <Eye size={16} />, onClick: (row) => navigate(`/rebates/${row.id || row._id}`) },
    { label: 'Edit', icon: <Edit size={16} />, onClick: (row) => navigate(`/rebates/${row.id || row._id}/edit`) },
    { label: 'Delete', icon: <Trash2 size={16} />, onClick: (row) => handleDelete(row.id || row._id) },
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <PageHeader
        title={tPlural('rebate')}
        subtitle={`Configure and manage all ${t('rebate').toLowerCase()} programs`}
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/rebates/new')}>
            New {t('rebate')}
          </Button>
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((s) => (
          <Grid item xs={12} sm={4} key={s.label}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 1.5, bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {React.cloneElement(s.icon, { sx: { color: s.color, fontSize: 22 } })}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
                <Typography variant="h6" fontWeight={700}>{s.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <SmartTable
        columns={columns}
        data={rebates}
        loading={loading}
        onRowClick={(row) => navigate(`/rebates/${row.id || row._id}`)}
        rowActions={rowActions}
        searchPlaceholder={`Search ${tPlural('rebate').toLowerCase()}...`}
        emptyMessage={`No ${tPlural('rebate').toLowerCase()} found. Create your first rebate program.`}
      />
    </Box>
  );
};

export default RebatesList;
