import React, { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTerminology } from '../../contexts/TerminologyContext';
import { SmartTable, PageHeader } from '../../components/shared';

export default function CampaignList() {
  const navigate = useNavigate();
  const { t, tPlural } = useTerminology();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { const res = await api.get('/campaigns'); setCampaigns(res.data?.data || res.data || []); } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const columns = [
    { field: 'name', headerName: 'Campaign Name' },
    { field: 'promotion_count', headerName: 'Promotions', renderCell: ({ row }) => row.promotion_count || 0 },
    { field: 'status', headerName: 'Status', type: 'status' },
    { field: 'total_budget', headerName: 'Total Budget', type: 'currency' },
    { field: 'start_date', headerName: 'Period', type: 'date' },
  ];

  const rowActions = [
    { label: 'View', icon: <Eye size={16} />, onClick: (row) => navigate(`/execute/campaigns/${row.id}`) },
  ];

  return (
    <Box>
      <PageHeader
        title={tPlural('campaign')}
        subtitle={`Multi-${t('promotion').toLowerCase()} ${t('campaign').toLowerCase()} management`}
        actions={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => navigate('/campaigns/new')}>New {t('campaign')}</Button>}
      />
      <SmartTable
        columns={columns}
        data={campaigns}
        loading={loading}
        onRowClick={(row) => navigate(`/execute/campaigns/${row.id}`)}
        rowActions={rowActions}
        searchPlaceholder={`Search ${tPlural('campaign').toLowerCase()}...`}
        emptyMessage={`No ${tPlural('campaign').toLowerCase()} found`}
      />
    </Box>
  );
}
