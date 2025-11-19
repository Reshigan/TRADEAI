import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Tabs, Tab, Button, Paper, Chip, CircularProgress, Skeleton } from '@mui/material';
import { ArrowBack as BackIcon, Edit as EditIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../services/api/apiClient';
import analytics from '../../utils/analytics';
import { usePageVariants } from '../../hooks/usePageVariants';
import ProcessShell from '../../components/ProcessShell';

import CampaignOverview from './tabs/CampaignOverview';
import CampaignBudget from './tabs/CampaignBudget';
import CampaignPerformance from './tabs/CampaignPerformance';
import CampaignHistory from './tabs/CampaignHistory';

const CampaignDetailWithTabs = () => {
  const { id, tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab || 'overview');

  const pageVariant = usePageVariants('campaignDetail');
  const tabs = pageVariant?.tabs || [
    { id: 'overview', label: 'Overview', path: 'overview' },
    { id: 'budget', label: 'Budget', path: 'budget' },
    { id: 'performance', label: 'Performance', path: 'performance' },
    { id: 'history', label: 'History', path: 'history' }
  ];

  useEffect(() => {
    loadCampaign();
    analytics.trackPageView('campaign_detail', { campaignId: id, tab: activeTab });
  }, [id]);

  useEffect(() => {
    setActiveTab(tab || 'overview');
  }, [tab]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/campaigns/${id}`);
      setCampaign(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast.error('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/campaigns/${id}/${newValue}`);
    analytics.trackEvent('campaign_tab_changed', { campaignId: id, tab: newValue });
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

  if (!campaign) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">Campaign not found</Typography>
      </Container>
    );
  }

  return (
    <ProcessShell module="campaign" entityId={id} entity={campaign}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button startIcon={<BackIcon />} onClick={() => navigate('/campaigns')}>Back</Button>
            <Box>
              <Typography variant="h4">{campaign.name}</Typography>
              <Typography variant="body2" color="text.secondary">{campaign.campaignCode}</Typography>
            </Box>
            <Chip label={campaign.status} color={campaign.status === 'active' ? 'success' : 'default'} size="small" />
          </Box>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/campaigns/${id}/edit`)}>Edit</Button>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            {tabs.map((tab) => (
              <Tab key={tab.id} value={tab.path} label={tab.label} />
            ))}
          </Tabs>
        </Paper>

        <Box sx={{ mt: 3 }}>
          {activeTab === 'overview' && <CampaignOverview campaign={campaign} onUpdate={loadCampaign} />}
          {activeTab === 'budget' && <CampaignBudget campaignId={id} campaign={campaign} />}
          {activeTab === 'performance' && <CampaignPerformance campaignId={id} campaign={campaign} />}
          {activeTab === 'history' && <CampaignHistory campaignId={id} campaign={campaign} />}
        </Box>
      </Container>
    </ProcessShell>
  );
};

export default CampaignDetailWithTabs;
