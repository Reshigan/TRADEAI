import React, { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { accrualService } from '../../services/api';
import { useTerminology } from '../../contexts/TerminologyContext';
import { SmartTable, PageHeader } from '../../components/shared';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function AccrualList() {
  const { t, tPlural } = useTerminology();
  const [accruals, setAccruals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await accrualService.getAll();
      setAccruals(res.data || res || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runCalculation = async () => {
    setLoading(true);
    try { await accrualService.calculate(); load(); } catch (e) { console.error(e); setLoading(false); }
  };

  const columns = [
    { field: 'promotion_name', headerName: 'Promotion', renderCell: ({ row }) => row.promotion_name || row.promotion_id || '—' },
    { field: 'period', headerName: 'Period', renderCell: ({ row }) => row.period || row.accrual_date || '—' },
    { field: 'accrued_amount', headerName: 'Accrued Amount', align: 'right', renderCell: ({ row }) => fmt(row.accrued_amount || row.amount) },
    { field: 'actual_amount', headerName: 'Actual Spend', align: 'right', renderCell: ({ row }) => fmt(row.actual_amount) },
    { field: 'status', headerName: 'Status', type: 'status' },
  ];

  return (
    <Box>
      <PageHeader
        title={tPlural('accrual')}
        subtitle={`${t('promotion')} ${t('accrual').toLowerCase()} calculations and tracking`}
        actions={
          <Button variant="contained" startIcon={<RefreshCw size={16} />} onClick={runCalculation} disabled={loading}>
            Recalculate
          </Button>
        }
      />
      <SmartTable
        columns={columns}
        data={accruals}
        loading={loading}
        emptyMessage={`No ${tPlural('accrual').toLowerCase()} calculated yet`}
      />
    </Box>
  );
}
