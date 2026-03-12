import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Chip,
  Tabs,
  Tab,
  Button,
  IconButton,
  Skeleton,
  Drawer,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  AutoAwesome as AIIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  active: { bg: '#ECFDF5', color: '#059669', label: 'Active' },
  draft: { bg: '#F1F5F9', color: '#64748B', label: 'Draft' },
  pending: { bg: '#FEF3C7', color: '#D97706', label: 'Pending' },
  approved: { bg: '#ECFDF5', color: '#059669', label: 'Approved' },
  rejected: { bg: '#FEF2F2', color: '#EF4444', label: 'Rejected' },
  completed: { bg: '#EFF6FF', color: '#1E40AF', label: 'Completed' },
  cancelled: { bg: '#F1F5F9', color: '#64748B', label: 'Cancelled' },
};

const StatusBadge = ({ status }) => {
  const config = statusColors[status?.toLowerCase()] || statusColors.draft;
  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        bgcolor: config.bg,
        color: config.color,
        fontWeight: 600,
        fontSize: '0.75rem',
        height: 24,
        borderRadius: '6px',
      }}
    />
  );
};

const DetailPage = ({
  title,
  subtitle,
  status,
  loading = false,
  tabs = [],
  activeTab = 0,
  onTabChange,
  onBack,
  onEdit,
  headerActions,
  aiSidebar,
  children,
  headerContent,
}) => {
  const navigate = useNavigate();
  const [aiOpen, setAiOpen] = useState(false);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <Box>
      <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', borderRadius: '12px', mb: 3 }}>
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <IconButton onClick={handleBack} sx={{ mt: -0.5, ml: -0.5 }}>
            <BackIcon sx={{ fontSize: 20, color: '#64748B' }} />
          </IconButton>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <>
                <Skeleton width={200} height={28} />
                <Skeleton width={120} height={16} sx={{ mt: 0.5 }} />
              </>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A' }}>
                    {title}
                  </Typography>
                  {status && <StatusBadge status={status} />}
                </Box>
                {subtitle && (
                  <Typography sx={{ fontSize: '0.8125rem', color: '#64748B', mt: 0.25 }}>
                    {subtitle}
                  </Typography>
                )}
              </>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            {aiSidebar && (
              <Button
                startIcon={<AIIcon />}
                onClick={() => setAiOpen(true)}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  bgcolor: '#F5F3FF',
                  color: '#7C3AED',
                  '&:hover': { bgcolor: '#EDE9FE' },
                }}
              >
                AI Insights
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={onEdit}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' }}
              >
                Edit
              </Button>
            )}
            {headerActions}
          </Box>
        </Box>

        {headerContent && (
          <Box sx={{ px: 2.5, pb: 2 }}>
            {headerContent}
          </Box>
        )}

        {tabs.length > 0 && (
          <Tabs
            value={activeTab}
            onChange={(_, v) => onTabChange?.(v)}
            sx={{
              px: 2.5,
              borderTop: '1px solid #E2E8F0',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8125rem',
                minHeight: 44,
                color: '#64748B',
                '&.Mui-selected': { color: '#1E40AF' },
              },
              '& .MuiTabs-indicator': { backgroundColor: '#1E40AF', height: 2 },
            }}
          >
            {tabs.map((tab, i) => (
              <Tab key={i} label={tab.label} icon={tab.icon} iconPosition="start" />
            ))}
          </Tabs>
        )}
      </Card>

      <Box>{children}</Box>

      {aiSidebar && (
        <Drawer
          anchor="right"
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          PaperProps={{ sx: { width: 380, maxWidth: '90vw', borderRadius: '12px 0 0 12px' } }}
        >
          <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>AI Insights</Typography>
            </Box>
            <IconButton onClick={() => setAiOpen(false)} size="small">
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
          <Box sx={{ p: 2.5 }}>
            {aiSidebar}
          </Box>
        </Drawer>
      )}
    </Box>
  );
};

export { StatusBadge, statusColors };
export default DetailPage;
