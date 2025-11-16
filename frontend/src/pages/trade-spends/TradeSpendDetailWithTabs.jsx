import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Tabs, Tab, Button, Paper, Chip, CircularProgress } from '@mui/material';
import { ArrowBack as BackIcon, Edit as EditIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../services/api/apiClient';
import analytics from '../../utils/analytics';

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

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'accruals', label: 'Accruals' },
    { value: 'documents', label: 'Documents' },
    { value: 'approvals', label: 'Approvals' },
    { value: 'performance', label: 'Performance' },
    { value: 'history', label: 'History' }
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tradeSpend) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">Trade Spend not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/trade-spends')}>Back</Button>
          <Box>
            <Typography variant="h4">{tradeSpend.spendType} - {tradeSpend.category}</Typography>
            <Typography variant="body2" color="text.secondary">{tradeSpend.spendId}</Typography>
          </Box>
          <Chip label={tradeSpend.status} color={tradeSpend.status === 'approved' ? 'success' : 'default'} size="small" />
        </Box>
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/trade-spends/${id}/edit`)}>Edit</Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          {tabs.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      <Box sx={{ mt: 3 }}>
        {activeTab === 'overview' && <TradeSpendOverview tradeSpend={tradeSpend} onUpdate={loadTradeSpend} />}
        {activeTab === 'accruals' && <TradeSpendAccruals tradeSpendId={id} tradeSpend={tradeSpend} onUpdate={loadTradeSpend} />}
        {activeTab === 'documents' && <TradeSpendDocuments tradeSpendId={id} tradeSpend={tradeSpend} onUpdate={loadTradeSpend} />}
        {activeTab === 'approvals' && <TradeSpendApprovals tradeSpendId={id} tradeSpend={tradeSpend} />}
        {activeTab === 'performance' && <TradeSpendPerformance tradeSpendId={id} tradeSpend={tradeSpend} />}
        {activeTab === 'history' && <TradeSpendHistory tradeSpendId={id} tradeSpend={tradeSpend} />}
      </Box>
    </Container>
  );
};

export default TradeSpendDetailWithTabs;
