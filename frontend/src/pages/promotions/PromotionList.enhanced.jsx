/**
 * Enhanced Promotions List Page
 * Professional list view with all modern UI components
 */

import React, { useState, useEffect } from 'react';
import { Box, Chip } from '@mui/material';
import { 
  Megaphone, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Users,
  Target,
  BarChart3,
  Eye,
  Edit2,
  Copy,
  Trash2,
  Pause,
  Play,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ListPageTemplate } from '../enhanced-index';
import { promotionService } from '../../services/api';
import { useToast } from '../../components/common/ToastNotification';
import useConfirmDialog from '../../hooks/useConfirmDialog';

export default function PromotionsList() {
  const toast = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const response = await promotionService.getAll({ limit: 50 });
      setPromotions(response.data || response || []);
      setTotal(response.data?.length || response.length || 0);
    } catch (error) {
      console.error('Failed to load promotions:', error); toast.error('Failed to load promotions'); } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/promotions/new');
  };

  const handleView = (promotion) => {
    navigate(`/promotions/${promotion.id}`);
  };

  const handleEdit = (promotion) => {
    navigate(`/promotions/${promotion.id}/edit`);
  };

  const handleDelete = async (promotion) => {
    if (await confirm(`Are you sure you want to delete "${promotion.name}"?`, { severity: 'error' })) {
      try {
        await promotionService.delete(promotion.id);
        toast.success('Promotion deleted');
        loadPromotions();
      } catch (error) {
        console.error('Failed to delete promotion:', error); toast.error('Failed to delete promotion'); }
    }
  };

  const handleDuplicate = (promotion) => {
    navigate('/promotions/new', { 
      state: { duplicateFrom: promotion } 
    });
  };

  const statusColors = {
    draft: '#94A3B8',
    pending_approval: '#F59E0B',
    pending: '#F59E0B',
    approved: '#2563EB',
    active: '#059669',
    completed: '#6B7280',
    cancelled: '#DC2626',
    rejected: '#DC2626',
    paused: '#F59E0B',
  };

  const columns = [
    {
      key: 'name',
      label: 'Promotion Name',
      type: 'avatar',
      sortable: true,
      avatarValue: (item) => item.name || item.promotion_name,
      avatarLabel: (item) => item.name || item.promotion_name,
      avatarColor: '#2563EB',
    },
    {
      key: 'promotion_type',
      label: 'Type',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: 'discount', label: 'Discount' },
        { value: 'bogo', label: 'BOGO' },
        { value: 'bundle', label: 'Bundle' },
        { value: 'loyalty', label: 'Loyalty' },
        { value: 'seasonal', label: 'Seasonal' },
        { value: 'clearance', label: 'Clearance' },
      ],
      render: (value) => (
        <Chip
          label={value ? value.replace('_', ' ').toUpperCase() : 'N/A'}
          size="small"
          sx={{
            bgcolor: 'primary.50',
            color: 'primary.main',
            fontWeight: 600,
            height: 24,
          }}
        />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: 'draft', label: 'Draft' },
        { value: 'pending_approval', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
      type: 'chip',
      chipMap: {
        draft: 'Draft',
        pending_approval: 'Pending',
        pending: 'Pending',
        approved: 'Approved',
        active: 'Active',
        completed: 'Completed',
        cancelled: 'Cancelled',
        rejected: 'Rejected',
        paused: 'Paused',
      },
      chipColors: statusColors,
    },
    {
      key: 'budget',
      label: 'Budget',
      sortable: true,
      align: 'right',
      render: (value) => {
        const formatted = value >= 1000000 
          ? `R ${(value/1000000).toFixed(1)}M`
          : value >= 1000 
          ? `R ${(value/1000).toFixed(0)}K`
          : `R ${value?.toFixed(0) || '0'}`;
        return (
          <Box sx={{ fontWeight: 600, color: 'text.primary' }}>
            {formatted}
          </Box>
        );
      },
    },
    {
      key: 'start_date',
      label: 'Start Date',
      sortable: true,
      render: (value) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Calendar size={14} color="#94A3B8" />
          {value ? new Date(value).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }) : '-'}
        </Box>
      ),
    },
    {
      key: 'end_date',
      label: 'End Date',
      sortable: true,
      render: (value) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Calendar size={14} color="#94A3B8" />
          {value ? new Date(value).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }) : '-'}
        </Box>
      ),
    },
    {
      key: 'performance',
      label: 'ROI',
      sortable: true,
      align: 'right',
      render: (value, item) => {
        const roi = item.roi || item.performance?.roi || 0;
        const color = roi > 2 ? '#059669' : roi > 1 ? '#F59E0B' : '#DC2626';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
            <TrendingUp size={14} color={color} />
            <Box sx={{ fontWeight: 600, color }}>{roi.toFixed(1)}x</Box>
          </Box>
        );
      },
    },
  ];

  const itemActions = [
    {
      label: 'Duplicate',
      icon: Copy,
      onClick: handleDuplicate,
    },
    {
      label: 'View Performance',
      icon: BarChart3,
      onClick: (item) => navigate(`/promotions/${item.id}/performance`),
    },
    {
      label: 'Export Report',
      icon: FileText,
      onClick: (item) => {
        const rows = [
          ['Field', 'Value'],
          ['Name', item.name || item.promotion_name || ''],
          ['Type', item.promotion_type || ''],
          ['Status', item.status || ''],
          ['Budget', item.budget ?? ''],
          ['Start Date', item.start_date || ''],
          ['End Date', item.end_date || ''],
          ['ROI', item.roi ?? item.performance?.roi ?? ''],
        ];
        const escapeCsv = (val) => { const s = String(val ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s; };
        const csv = rows.map(r => r.map(escapeCsv).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `promotion-${item.id}-report.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
    },
  ];

  return (
    <>
    {ConfirmDialogComponent}
    <ListPageTemplate
      title="Promotions"
      subtitle="Manage and track all trade promotions"
      items={promotions}
      loading={loading}
      totalItems={total}
      columns={columns}
      searchable={true}
      filterable={true}
      sortable={true}
      selectable={true}
      paginated={true}
      onCreate={handleCreate}
      onView={handleView}
      onEdit={handleEdit}
      onDelete={handleDelete}
      itemActions={itemActions}
      emptyStateProps={{
        variant: 'megaphone',
        title: 'No promotions yet',
        description: 'Create your first promotion to start managing trade activities',
      }}
    />
    </>
  );
}
