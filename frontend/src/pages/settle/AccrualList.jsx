import React, { useState, useEffect } from 'react';
import { Box, Button, Alert} from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { accrualService } from '../../services/api';
import { useTerminology } from '../../contexts/TerminologyContext';
import { SmartTable, PageHeader } from '../../components/shared';
import { useToast } from '../../components/common/ToastNotification';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function AccrualList() {
  const toast = useToast();
  const { t, tPlural } = useTerminology();
  const [accruals, setAccruals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const load = async () => {
    try {
      const res = await accrualService.getAll();
      setAccruals(res.data || res || []);
    } catch (e) { console.error(e); toast.error('An error occurred'); setFetchError(e.message || 'Failed to load data'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runCalculation = async () => {
    setLoading(true);
    try { await accrualService.calculate(); load(); } catch (e) { console.error(e); setLoading(false); }
  };

  const columns = [
    { field: 'name', headerName: 'Promotion', renderCell: ({ row }) => row.name || row.promotionName || row.promotion_name || row.promotionId || row.promotion_id || '—' },
    { field: 'frequency', headerName: 'Period', renderCell: ({ row }) => { const s = row.startDate || row.start_date; const e = row.endDate || row.end_date; return s && e ? `${new Date(s).toLocaleDateString()} - ${new Date(e).toLocaleDateString()}` : row.frequency || row.period || row.accrualDate || row.accrual_date || '—'; } },
    { field: 'accruedAmount', headerName: 'Accrued Amount', align: 'right', renderCell: ({ row }) => fmt(row.accruedAmount || row.accrued_amount || row.amount) },
    { field: 'settledAmount', headerName: 'Actual Spend', align: 'right', renderCell: ({ row }) => fmt(row.settledAmount || row.settled_amount || row.actualAmount || row.actual_amount) },
    { field: 'status', headerName: 'Status', type: 'status' },
  ];

  return (
    <Box>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => { setFetchError(null); load(); }}>Retry</Button>}>
          {fetchError}
        </Alert>
      )}
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
