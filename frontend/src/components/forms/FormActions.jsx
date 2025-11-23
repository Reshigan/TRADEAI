import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';

const FormActions = ({
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  submitting = false,
  disabled = false,
  showCancel = true,
  submitIcon = <SaveIcon />,
  cancelIcon = <CancelIcon />,
  sx = {},
  ...props
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        justifyContent: 'flex-end',
        pt: 3,
        borderTop: 1,
        borderColor: 'divider',
        ...sx
      }}
      {...props}
    >
      {showCancel && (
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={submitting}
          startIcon={cancelIcon}
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        variant="contained"
        onClick={onSubmit}
        disabled={disabled || submitting}
        startIcon={submitting ? <CircularProgress size={20} /> : submitIcon}
      >
        {submitting ? 'Saving...' : submitLabel}
      </Button>
    </Box>
  );
};

export default FormActions;
