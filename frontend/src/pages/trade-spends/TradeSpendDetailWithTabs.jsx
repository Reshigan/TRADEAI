import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Tabs, Tab, Button, Paper, Chip, Skeleton } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { tradeSpendService } from '../../services/api';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';
import { usePageVariants } from '../../hooks/usePageVariants';
import { useTerminology } from '../../contexts/TerminologyContext';
import { QuickActionBar } from '../../components/shared';

import TradeSpendOverview from './tabs/TradeSpendOverview';
import TradeSpendAccruals from './tabs/TradeSpendAccruals';
import TradeSpendDocuments from './tabs/TradeSpendDocuments';
import TradeSpendApprovals from './tabs/TradeSpendApprovals';
import TradeSpendPerformance from './tabs/TradeSpendPerformance';
import TradeSpendHistory from './tabs/TradeSpendHistory';

const TradeSpendDetailWithTabs = () => {
  const { id, tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const [tradeSpend, setTradeSpend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab || 'overview');
  const [actionLoading, setActionLoading] = useState(false);
  const { t } = useTerminology();

  const pageVariant = usePageVariants('tradeSpendDetail');
  const tabs = pageVariant?.tabs || [
    { id: 'overview', label: 'Overview', path: 'overview' },
    { id: 'accruals', label: 'Accruals', path: 'accruals' },
    { id: 'documents', label: 'Documents', path: 'documents' },
    { id: 'approvals', label: 'Approvals', path: 'approvals' },
    { id: 'performance', label: 'Performance', path: 'performance' },
    { id: 'history', label: 'History', path: 'history' }
  ];

  useEffect(() => {
    loadTradeSpend();
    analytics.trackPageView('trade_spend_detail', { tradeSpendId: id, tab: activeTab });
  }, [id]);

  useEffect(() => {
    setActiveTab(tab || 'overview');
  }, [tab]);

  const loadTradeSpend = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/trade-spends/${id}`);
      setTradeSpend(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading trade spend:', error);
      toast.error('Failed to load trade spend');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/trade-spends/${id}/${newValue}`);
    analytics.trackEvent('trade_spend_tab_changed', { tradeSpendId: id, tab: newValue });
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={400} />
        </Box>
      </Container>
    );
  }

  if (!tradeSpend) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">{t('trade_spend')} not found</Typography>
      </Container>
    );
  }

  const handleQuickAction = async (action, metadata) => {
    setActionLoading(true);
    try {
      if (action === 'submit') await tradeSpendService.submit(id);
      else if (action === 'approve') await tradeSpendService.approve(id);
      else if (action === 'reject') await tradeSpendService.reject(id, { reason: metadata?.comment });
      else if (action === 'edit') { navigate(`/trade-spends/${id}/edit`); setActionLoading(false); return; }
      await loadTradeSpend();
    } catch (e) { toast.error(e.response?.data?.message || 'Action failed'); }
    setActionLoading(false);
  };

  return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/trade-spends')} sx={{ mb: 1, color: 'text.secondary' }}>Back to Trade Spends</Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
            <Typography variant="h4" fontWeight={700} color="text.primary">{formatLabel(tradeSpend.spendType)} - {tradeSpend.category}</Typography>
            <Chip label={formatLabel(tradeSpend.status)} color={tradeSpend.status === 'approved' ? 'success' : 'default'} sx={{ fontWeight: 600 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">ID: {tradeSpend.spendId}</Typography>
        </Box>
        <QuickActionBar
          status={tradeSpend.status || 'draft'}
          entityType="trade_spend"
          entityId={id}
          entityName={`${formatLabel(tradeSpend.spendType)} - ${tradeSpend.category}`}
          onAction={handleQuickAction}
          sx={{ mb: 3 }}
        />

        <Paper elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9375rem', minHeight: 56 } }}>
            {tabs.map((tab) => (
              <Tab key={tab.id} value={tab.path} label={tab.label} />
            ))}
          </Tabs>
        </Paper>

        <Box>
          {activeTab === 'overview' && <TradeSpendOverview tradeSpend={tradeSpend} onUpdate={loadTradeSpend} />}
          {activeTab === 'budget-link' && <TradeSpendPerformance tradeSpendId={id} tradeSpend={tradeSpend} />}
          {activeTab === 'scope' && <TradeSpendDocuments tradeSpendId={id} tradeSpend={tradeSpend} onUpdate={loadTradeSpend} />}
          {activeTab === 'accruals' && <TradeSpendAccruals tradeSpendId={id} tradeSpend={tradeSpend} onUpdate={loadTradeSpend} />}
          {activeTab === 'claims' && <TradeSpendApprovals tradeSpendId={id} tradeSpend={tradeSpend} />}
          {activeTab === 'reconcile' && <TradeSpendPerformance tradeSpendId={id} tradeSpend={tradeSpend} />}
          {activeTab === 'documents' && <TradeSpendDocuments tradeSpendId={id} tradeSpend={tradeSpend} onUpdate={loadTradeSpend} />}
          {activeTab === 'approvals' && <TradeSpendApprovals tradeSpendId={id} tradeSpend={tradeSpend} />}
          {activeTab === 'performance' && <TradeSpendPerformance tradeSpendId={id} tradeSpend={tradeSpend} />}
          {activeTab === 'history' && <TradeSpendHistory tradeSpendId={id} tradeSpend={tradeSpend} />}
          {activeTab === 'vendor-wallet' && <TradeSpendPerformance tradeSpendId={id} tradeSpend={tradeSpend} />}
          {activeTab === 'allocation' && <TradeSpendAccruals tradeSpendId={id} tradeSpend={tradeSpend} onUpdate={loadTradeSpend} />}
          {activeTab === 'offers' && <TradeSpendOverview tradeSpend={tradeSpend} onUpdate={loadTradeSpend} />}
          {activeTab === 'execution' && <TradeSpendPerformance tradeSpendId={id} tradeSpend={tradeSpend} />}
          {activeTab === 'claim-submission' && <TradeSpendApprovals tradeSpendId={id} tradeSpend={tradeSpend} />}
          {activeTab === 'settlements' && <TradeSpendHistory tradeSpendId={id} tradeSpend={tradeSpend} />}
        </Box>
      </Container>
  );
};

export default TradeSpendDetailWithTabs;
