import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Tabs, Tab, Button, Paper, Chip, CircularProgress } from '@mui/material';
import { ArrowBack as BackIcon, Edit as EditIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../services/api/apiClient';
import analytics from '../../utils/analytics';

import BudgetOverview from './tabs/BudgetOverview';
import BudgetAllocations from './tabs/BudgetAllocations';
import BudgetSpending from './tabs/BudgetSpending';
import BudgetTransfers from './tabs/BudgetTransfers';
import BudgetApprovals from './tabs/BudgetApprovals';
import BudgetScenarios from './tabs/BudgetScenarios';
import BudgetForecast from './tabs/BudgetForecast';
import BudgetHistory from './tabs/BudgetHistory';

const BudgetDetailWithTabs = () => {
  const { id, tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab || 'overview');

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'allocations', label: 'Allocations' },
    { value: 'spending', label: 'Spending' },
    { value: 'transfers', label: 'Transfers' },
    { value: 'approvals', label: 'Approvals' },
    { value: 'scenarios', label: 'Scenarios' },
    { value: 'forecast', label: 'Forecast' },
    { value: 'history', label: 'History' }
  ];

  useEffect(() => {
    loadBudget();
    analytics.trackPageView('budget_detail', { budgetId: id, tab: activeTab });
  }, [id]);

  useEffect(() => {
    setActiveTab(tab || 'overview');
  }, [tab]);

  const loadBudget = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/budgets/${id}`);
      setBudget(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading budget:', error);
      toast.error('Failed to load budget');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/budgets/${id}/${newValue}`);
    analytics.trackEvent('budget_tab_changed', { budgetId: id, tab: newValue });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!budget) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">Budget not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/budgets')}>Back</Button>
          <Box>
            <Typography variant="h4">{budget.name}</Typography>
            <Typography variant="body2" color="text.secondary">{budget.code} - {budget.year}</Typography>
          </Box>
          <Chip label={budget.status} color={budget.status === 'approved' ? 'success' : 'default'} size="small" />
        </Box>
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/budgets/${id}/edit`)}>Edit</Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          {tabs.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      <Box sx={{ mt: 3 }}>
        {activeTab === 'overview' && <BudgetOverview budget={budget} onUpdate={loadBudget} />}
        {activeTab === 'allocations' && <BudgetAllocations budgetId={id} budget={budget} onUpdate={loadBudget} />}
        {activeTab === 'spending' && <BudgetSpending budgetId={id} budget={budget} />}
        {activeTab === 'transfers' && <BudgetTransfers budgetId={id} budget={budget} onUpdate={loadBudget} />}
        {activeTab === 'approvals' && <BudgetApprovals budgetId={id} budget={budget} />}
        {activeTab === 'scenarios' && <BudgetScenarios budgetId={id} budget={budget} />}
        {activeTab === 'forecast' && <BudgetForecast budgetId={id} budget={budget} />}
        {activeTab === 'history' && <BudgetHistory budgetId={id} budget={budget} />}
      </Box>
    </Container>
  );
};

export default BudgetDetailWithTabs;
