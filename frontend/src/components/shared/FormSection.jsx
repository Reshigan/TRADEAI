import React, { useState } from 'react';
import { Box, Typography, Collapse, IconButton, Chip, Divider } from '@mui/material';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * FormSection — Collapsible section within SmartForm.
 * Features: collapse/expand with animation, completion badge, required indicator.
 */
const FormSection = ({
  title,
  description,
  defaultOpen = true,
  required,
  children,
  completedCount,
  totalCount,
  sx = {},
}) => {
  const [open, setOpen] = useState(defaultOpen);

  const hasCompletion = completedCount !== undefined && totalCount !== undefined;
  const isComplete = hasCompletion && completedCount >= totalCount;

  return (
    <Box sx={{ mb: 3, ...sx }}>
      <Box
        onClick={() => setOpen(!open)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          py: 1,
          px: 1,
          borderRadius: 1,
          '&:hover': { bgcolor: 'action.hover' },
          userSelect: 'none',
        }}
      >
        <IconButton size="small" sx={{ mr: 1, p: 0.5 }}>
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
          {title}
          {required && (
            <Box
              component="span"
              sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main', display: 'inline-block', ml: 1, mb: 0.5 }}
            />
          )}
        </Typography>
        {hasCompletion && (
          <Chip
            size="small"
            label={`${completedCount}/${totalCount}`}
            color={isComplete ? 'success' : 'default'}
            variant={isComplete ? 'filled' : 'outlined'}
            sx={{ fontSize: '0.75rem', height: 24 }}
          />
        )}
      </Box>
      {description && open && (
        <Typography variant="body2" color="text.secondary" sx={{ ml: 5, mb: 1 }}>
          {description}
        </Typography>
      )}
      <Collapse in={open} timeout={300}>
        <Box sx={{ pl: 1, pr: 1, pt: 1.5 }}>
          {children}
        </Box>
      </Collapse>
      {!open && <Divider sx={{ mt: 1 }} />}
    </Box>
  );
};

export default FormSection;
