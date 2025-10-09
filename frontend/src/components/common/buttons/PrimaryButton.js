/**
 * Refactored Primary/Green Button Component
 * Standardized button with consistent styling and behavior
 */

import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';

const PrimaryButton = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  startIcon,
  endIcon,
  type = 'button',
  sx = {},
  ...rest
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      endIcon={!loading && endIcon}
      type={type}
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        ...sx
      }}
      {...rest}
    >
      {loading ? 'Processing...' : children}
    </Button>
  );
};

PrimaryButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'warning', 'info', 'success']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  sx: PropTypes.object
};

export default PrimaryButton;
