import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  IconButton,
  Collapse,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ExpandMore as ExpandIcon,
  Save as SaveIcon,
  Close as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const FormSection = ({ title, children, defaultOpen = true, collapsible = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', borderRadius: '12px', mb: 2 }}>
      <Box
        onClick={collapsible ? () => setOpen(!open) : undefined}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: collapsible ? 'pointer' : 'default',
          '&:hover': collapsible ? { bgcolor: '#F8FAFC' } : {},
        }}
      >
        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>{title}</Typography>
        {collapsible && (
          <ExpandIcon
            sx={{
              fontSize: 20,
              color: '#64748B',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        )}
      </Box>
      <Collapse in={open}>
        <Divider />
        <Box sx={{ p: 2.5 }}>{children}</Box>
      </Collapse>
    </Card>
  );
};

const FormPage = ({
  title,
  subtitle,
  onBack,
  onSave,
  onCancel,
  saving = false,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  children,
  leftColumn,
  rightColumn,
  stickyFooter = true,
  headerActions,
  dirty = false,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else navigate(-1);
  };

  return (
    <Box sx={{ pb: stickyFooter ? 10 : 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ ml: -0.5 }}>
          <BackIcon sx={{ fontSize: 20, color: '#64748B' }} />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A' }}>{title}</Typography>
          {subtitle && (
            <Typography sx={{ fontSize: '0.8125rem', color: '#64748B', mt: 0.25 }}>{subtitle}</Typography>
          )}
        </Box>
        {headerActions}
      </Box>

      {leftColumn && rightColumn ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
          <Box>{leftColumn}</Box>
          <Box>{rightColumn}</Box>
        </Box>
      ) : (
        children
      )}

      {stickyFooter && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: { xs: 0, md: 260 },
            right: 0,
            bgcolor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            px: 3,
            py: 1.5,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5,
            zIndex: 1100,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={handleCancel}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' }}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={onSave}
            disabled={saving}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', px: 3 }}
          >
            {saving ? 'Saving...' : saveLabel}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export { FormSection };
export default FormPage;
