import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Tabs, Tab, Button, Paper, Chip, CircularProgress } from '@mui/material';
import { ArrowBack as BackIcon, Edit as EditIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../services/api/apiClient';
import analytics from '../../utils/analytics';

import CustomerOverview from './tabs/CustomerOverview';
import CustomerPromotions from './tabs/CustomerPromotions';
import CustomerTradeSpends from './tabs/CustomerTradeSpends';
import CustomerTradingTerms from './tabs/CustomerTradingTerms';
import CustomerBudgets from './tabs/CustomerBudgets';
import CustomerClaims from './tabs/CustomerClaims';
import CustomerDeductions from './tabs/CustomerDeductions';
import CustomerSalesHistory from './tabs/CustomerSalesHistory';

const CustomerDetailWithTabs = () => {
  const { id, tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab || 'overview');

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'promotions', label: 'Promotions' },
    { value: 'trade-spends', label: 'Trade Spends' },
    { value: 'trading-terms', label: 'Trading Terms' },
    { value: 'budgets', label: 'Budgets' },
    { value: 'claims', label: 'Claims' },
    { value: 'deductions', label: 'Deductions' },
    { value: 'sales-history', label: 'Sales History' }
  ];

  useEffect(() => {
    loadCustomer();
    analytics.trackPageView('customer_detail', { customerId: id, tab: activeTab });
  }, [id]);

  useEffect(() => {
    setActiveTab(tab || 'overview');
  }, [tab]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/customers/${id}`);
      setCustomer(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading customer:', error);
      toast.error('Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/customers/${id}/${newValue}`);
    analytics.trackEvent('customer_tab_changed', { customerId: id, tab: newValue });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!customer) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">Customer not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/customers')}>Back</Button>
          <Box>
            <Typography variant="h4">{customer.name}</Typography>
            <Typography variant="body2" color="text.secondary">{customer.code}</Typography>
          </Box>
          <Chip label={customer.status} color={customer.status === 'active' ? 'success' : 'default'} size="small" />
        </Box>
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/customers/${id}/edit`)}>Edit</Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          {tabs.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      <Box sx={{ mt: 3 }}>
        {activeTab === 'overview' && <CustomerOverview customer={customer} onUpdate={loadCustomer} />}
        {activeTab === 'promotions' && <CustomerPromotions customerId={id} customer={customer} />}
        {activeTab === 'trade-spends' && <CustomerTradeSpends customerId={id} customer={customer} />}
        {activeTab === 'trading-terms' && <CustomerTradingTerms customerId={id} customer={customer} />}
        {activeTab === 'budgets' && <CustomerBudgets customerId={id} customer={customer} />}
        {activeTab === 'claims' && <CustomerClaims customerId={id} customer={customer} />}
        {activeTab === 'deductions' && <CustomerDeductions customerId={id} customer={customer} />}
        {activeTab === 'sales-history' && <CustomerSalesHistory customerId={id} customer={customer} />}
      </Box>
    </Container>
  );
};

export default CustomerDetailWithTabs;
