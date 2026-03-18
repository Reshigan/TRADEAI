import React, { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { settlementService } from '../../services/api';
import { useTerminology } from '../../contexts/TerminologyContext';
import { SmartTable, PageHeader } from '../../components/shared';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function SettlementList() {
  const { t, tPlural } = useTerminology();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const res = await settlementService.getAll(); setSettlements(res.data || res || []); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setLoading(true);
    try { await settlementService.generate(); load(); } catch (e) { console.error(e); setLoading(false); }
  };

  const columns = [
    { field: 'settlement_number', headerName: `${t('settlement')} #`, renderCell: ({ row }) => row.settlement_number || row.id },
    { field: 'customer_name', headerName: t('customer') },
    { field: 'net_amount', headerName: 'Amount', align: 'right', renderCell: ({ row }) => fmt(row.net_amount || row.amount) },
    { field: 'settlement_type', headerName: 'Type', renderCell: ({ row }) => (row.settlement_type || '').replace(/_/g, ' ') },
    { field: 'status', headerName: 'Status', type: 'status' },
    { field: 'created_at', headerName: 'Date', type: 'date' },
  ];

  const rowActions = [
    {
      label: 'Approve', icon: <CheckCircle size={16} />,
      onClick: async (row) => { try { await settlementService.approve(row.id); load(); } catch(e) { console.error(e); } },
      visible: (row) => row.status === 'pending' || row.status === 'pending_approval',
    },
    {
      label: 'Reject', icon: <XCircle size={16} />,
      onClick: async (row) => { try { await settlementService.reject(row.id); load(); } catch(e) { console.error(e); } },
      visible: (row) => row.status === 'pending' || row.status === 'pending_approval',
    },
  ];

  return (
    <Box>
      <PageHeader
        title={tPlural('settlement')}
        subtitle={`Generate and track ${t('settlement').toLowerCase()} documents`}
        actions={
          <Button variant="contained" startIcon={<RefreshCw size={16} />} onClick={generate} disabled={loading}>
            Generate {tPlural('settlement')}
          </Button>
        }
      />
      <SmartTable
        columns={columns}
        data={settlements}
        loading={loading}
        rowActions={rowActions}
        emptyMessage={`No ${tPlural('settlement').toLowerCase()} generated yet`}
      />
    </Box>
  );
}
