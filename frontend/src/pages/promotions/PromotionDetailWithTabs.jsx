import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Button,
  Paper,
  Chip,
  Skeleton
, Alert} from '@mui/material';
import {
  ArrowBack as BackIcon
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';
import { usePageVariants } from '../../hooks/usePageVariants';
import { QuickActionBar } from '../../components/shared';

import PromotionOverview from './tabs/PromotionOverview';
import PromotionProducts from './tabs/PromotionProducts';
import PromotionCustomers from './tabs/PromotionCustomers';
import PromotionBudget from './tabs/PromotionBudget';
import PromotionApprovals from './tabs/PromotionApprovals';
import PromotionDocuments from './tabs/PromotionDocuments';
import PromotionConflicts from './tabs/PromotionConflicts';
import PromotionPerformance from './tabs/PromotionPerformance';
import PromotionHistory from './tabs/PromotionHistory';
import { useToast } from '../../components/common/ToastNotification';
import useConfirmDialog from '../../hooks/useConfirmDialog';

if (typeof window !== 'undefined') {
  window.__TABS_V2_IMPORTED__ = true;
  console.info('PromotionDetailWithTabs module loaded');
}

const PromotionDetailWithTabs = () => {
  const toast = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const { id, tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab || 'overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const pageVariant = usePageVariants('promotionDetail');
  const tabs = pageVariant?.tabs || [
    { id: 'overview', label: 'Overview', path: 'overview' },
    { id: 'products', label: 'Products', path: 'products' },
    { id: 'customers', label: 'Customers', path: 'customers' },
    { id: 'budget', label: 'Budget', path: 'budget' },
    { id: 'approvals', label: 'Approvals', path: 'approvals' },
    { id: 'documents', label: 'Documents', path: 'documents' },
    { id: 'conflicts', label: 'Conflicts', path: 'conflicts' },
    { id: 'performance', label: 'Performance', path: 'performance' },
    { id: 'history', label: 'History', path: 'history' }
  ];

  useEffect(() => {
    loadPromotion();
    analytics.trackPageView('promotion_detail', { promotionId: id, tab: activeTab });
  }, [id]);

  useEffect(() => {
    setActiveTab(tab || 'overview');
  }, [tab]);

  const loadPromotion = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/promotions/${id}`);
      setPromotion(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading promotion:', error);
      toast.error('Failed to load promotion'); setFetchError(error.message || 'Failed to load data');} finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/promotions/${id}/${newValue}`);
    analytics.trackEvent('promotion_tab_changed', { promotionId: id, tab: newValue });
  };

  const handleEdit = () => {
    analytics.trackEvent('promotion_edit_clicked', { promotionId: id });
    navigate(`/promotions/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!await confirm('Are you sure you want to delete this promotion?', { severity: 'error' })) {
      return;
    }
    try {
      await apiClient.delete(`/promotions/${id}`);
      analytics.trackEvent('promotion_deleted', { promotionId: id });
      toast.success('Promotion deleted successfully');
      navigate('/promotions');
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error(error.response?.data?.message || 'Failed to delete promotion'); setFetchError(error.message || 'Failed to load data');}
  };

  // Promotion-specific actions per status — only show actions we can handle
  const getPromotionActions = () => {
    const s = (promotion.status || 'draft').toLowerCase().replace(/\s+/g, '_');
    const actionMap = {
      draft: [
        { action: 'submit', label: 'Submit for Approval', icon: null, color: 'primary', confirm: true, confirmMsg: 'Submit this promotion for approval?' },
        { action: 'edit', label: 'Edit', icon: null, color: 'inherit' },
        { action: 'delete', label: 'Delete', icon: null, color: 'error', confirm: true, confirmMsg: 'Delete this promotion?' },
      ],
      pending_approval: [
        { action: 'approve', label: 'Approve', icon: null, color: 'success', confirm: true, confirmMsg: 'Approve this promotion?' },
        { action: 'reject', label: 'Reject', icon: null, color: 'error', confirm: true, confirmMsg: 'Reject this promotion?', requireComment: true },
      ],
    };
    return actionMap[s] || [];
  };

  const handleQuickAction = async (action, metadata) => {
    setActionLoading(true);
    try {
      if (action === 'submit') await apiClient.post(`/promotions/${id}/submit`);
      else if (action === 'approve') await apiClient.post(`/promotions/${id}/approve`, { notes: metadata?.comment });
      else if (action === 'reject') await apiClient.post(`/promotions/${id}/reject`, { reason: metadata?.comment });
      else if (action === 'edit') { navigate(`/promotions/${id}/edit`); setActionLoading(false); return; }
      else if (action === 'delete') {
        await apiClient.delete(`/promotions/${id}`);
        analytics.trackEvent('promotion_deleted', { promotionId: id });
        toast.success('Promotion deleted successfully');
        navigate('/promotions');
        setActionLoading(false); return;
      }
      await loadPromotion();
    } catch (e) { toast.error(e.response?.data?.message || 'Action failed'); }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => { setFetchError(null); loadPromotion(); }}>Retry</Button>}>
          {fetchError}
        </Alert>
      )}
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={400} />
        </Box>
      </Container>
    );
  }

  if (!promotion) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">Promotion not found</Typography>
      </Container>
    );
  }

  return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/promotions')} sx={{ mb: 1, color: 'text.secondary' }}>
            Back to Promotions
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
            <Typography variant="h4" fontWeight={700} color="text.primary">{promotion.name}</Typography>
            <Chip label={formatLabel(promotion.status)} color={promotion.status === 'active' ? 'success' : promotion.status === 'approved' ? 'primary' : promotion.status === 'draft' ? 'default' : 'warning'} sx={{ fontWeight: 600 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">ID: {promotion.id || promotion._id || promotion.promotionId}</Typography>
        </Box>
        <QuickActionBar
          status={promotion.status || 'draft'}
          entityType="promotion"
          entityId={id}
          entityName={promotion.name}
          onAction={handleQuickAction}
          customActions={getPromotionActions()}
          sx={{ mb: 3 }}
        />

        {/* Modern Tabs */}
        <Paper 
          elevation={0}
          sx={{ 
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                minHeight: 56
              }
            }}
          >
            {tabs.map((tab) => (
              <Tab key={tab.id} value={tab.path} label={tab.label} />
            ))}
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box>
          {activeTab === 'overview' && <PromotionOverview promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'commitments' && <PromotionBudget promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'products' && <PromotionProducts promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'customers' && <PromotionCustomers promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'trade-spends' && <PromotionDocuments promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'claims' && <PromotionApprovals promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'budget' && <PromotionBudget promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'approvals' && <PromotionApprovals promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'documents' && <PromotionDocuments promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'conflicts' && <PromotionConflicts promotionId={id} promotion={promotion} />}
          {activeTab === 'performance' && <PromotionPerformance promotionId={id} promotion={promotion} />}
          {activeTab === 'history' && <PromotionHistory promotionId={id} promotion={promotion} />}
          {activeTab === 'vendor-funding' && <PromotionBudget promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'allocation' && <PromotionCustomers promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'offer' && <PromotionOverview promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'stores' && <PromotionCustomers promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'pos-proof' && <PromotionDocuments promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
        </Box>
      {ConfirmDialogComponent}
      </Container>
  );
};

export default PromotionDetailWithTabs;
