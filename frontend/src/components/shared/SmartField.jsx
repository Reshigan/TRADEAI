import React, { useState, useCallback } from 'react';
import {
  TextField, InputAdornment, MenuItem,
  Box, Typography, Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

/**
 * SmartField — Enhanced TextField wrapper consuming design tokens.
 * Replaces raw MUI TextField with type-aware formatting, validation display, and design token integration.
 */
const SmartField = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required,
  disabled,
  readOnly,
  placeholder,
  prefix,
  suffix,
  options = [],
  multiple,
  searchable,
  fullWidth = true,
  size = 'medium',
  rows,
  maxRows,
  inputProps = {},
  sx = {},
  ...rest
}) => {
  const [focused, setFocused] = useState(false);

  const formatCurrency = useCallback((val) => {
    if (val === '' || val === null || val === undefined) return '';
    const num = typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : val;
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
  }, []);

  const handleCurrencyChange = useCallback((e) => {
    const raw = e.target.value.replace(/[^\d.-]/g, '');
    if (onChange) {
      onChange({ target: { name, value: raw } });
    }
  }, [name, onChange]);

  const handlePercentChange = useCallback((e) => {
    let val = e.target.value.replace(/[^\d.]/g, '');
    const num = parseFloat(val);
    if (!isNaN(num) && num > 100) val = '100';
    if (onChange) {
      onChange({ target: { name, value: val } });
    }
  }, [name, onChange]);

  const handleChange = useCallback((e) => {
    if (onChange) onChange(e);
  }, [onChange]);

  const handleBlur = useCallback((e) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  }, [onBlur]);

  // Read-only display mode
  if (readOnly) {
    let displayValue = value || '—';
    if (type === 'currency' && value) displayValue = `R ${formatCurrency(value)}`;
    if (type === 'percent' && value) displayValue = `${value}%`;
    if (type === 'select' && value) {
      const opt = options.find(o => (o.value || o) === value);
      displayValue = opt?.label || opt || value;
    }
    return (
      <Box sx={{ mb: 2, ...sx }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body1">{displayValue}</Typography>
      </Box>
    );
  }

  // Date type
  if (type === 'date') {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label={label}
          value={value ? new Date(value) : null}
          onChange={(newVal) => {
            if (onChange) onChange({ target: { name, value: newVal ? newVal.toISOString().split('T')[0] : '' } });
          }}
          disabled={disabled}
          slotProps={{
            textField: {
              fullWidth,
              size,
              error: !!error,
              helperText: error || helperText,
              required,
              onBlur: handleBlur,
              sx,
              InputProps: {
                startAdornment: required && !value ? (
                  <InputAdornment position="start">
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main' }} />
                  </InputAdornment>
                ) : undefined,
              },
            },
          }}
        />
      </LocalizationProvider>
    );
  }

  // Select type
  if (type === 'select') {
    if (searchable) {
      return (
        <Autocomplete
          options={options}
          getOptionLabel={(opt) => opt?.label || opt || ''}
          value={multiple ? (Array.isArray(value) ? value : []) : (options.find(o => (o.value || o) === value) || null)}
          onChange={(e, newVal) => {
            if (onChange) {
              const val = multiple
                ? (newVal || []).map(v => v.value || v)
                : (newVal?.value || newVal || '');
              onChange({ target: { name, value: val } });
            }
          }}
          multiple={multiple}
          disabled={disabled}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              error={!!error}
              helperText={error || helperText}
              required={required}
              size={size}
              sx={sx}
            />
          )}
          fullWidth={fullWidth}
          isOptionEqualToValue={(opt, val) => (opt.value || opt) === (val.value || val)}
        />
      );
    }
    return (
      <TextField
        name={name}
        label={label}
        select
        value={value || (multiple ? [] : '')}
        onChange={handleChange}
        onBlur={handleBlur}
        error={!!error}
        helperText={error || helperText}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        SelectProps={{ multiple }}
        sx={sx}
        {...rest}
      >
        {options.map((opt) => {
          const optValue = opt.value !== undefined ? opt.value : opt;
          const optLabel = opt.label || opt;
          return (
            <MenuItem key={optValue} value={optValue}>
              {optLabel}
            </MenuItem>
          );
        })}
      </TextField>
    );
  }

  // Currency type
  if (type === 'currency') {
    return (
      <TextField
        name={name}
        label={label}
        value={focused ? (value || '') : formatCurrency(value)}
        onChange={handleCurrencyChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        error={!!error}
        helperText={error || helperText}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {required && !value && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main', mr: 0.5 }} />}
              R
            </InputAdornment>
          ),
          ...inputProps,
        }}
        sx={sx}
        {...rest}
      />
    );
  }

  // Percent type
  if (type === 'percent') {
    return (
      <TextField
        name={name}
        label={label}
        value={value || ''}
        onChange={handlePercentChange}
        onBlur={handleBlur}
        error={!!error}
        helperText={error || helperText}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        InputProps={{
          endAdornment: <InputAdornment position="end">%</InputAdornment>,
          inputProps: { min: 0, max: 100 },
          ...inputProps,
        }}
        sx={sx}
        {...rest}
      />
    );
  }

  // Textarea type
  if (type === 'textarea') {
    return (
      <TextField
        name={name}
        label={label}
        value={value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        error={!!error}
        helperText={error || helperText}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        multiline
        rows={rows || 3}
        maxRows={maxRows}
        sx={sx}
        {...rest}
      />
    );
  }

  // Number type
  if (type === 'number') {
    return (
      <TextField
        name={name}
        label={label}
        type="number"
        value={value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        error={!!error}
        helperText={error || helperText}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        InputProps={{
          startAdornment: prefix ? <InputAdornment position="start">{prefix}</InputAdornment> : (
            required && !value ? (
              <InputAdornment position="start">
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main' }} />
              </InputAdornment>
            ) : undefined
          ),
          endAdornment: suffix ? <InputAdornment position="end">{suffix}</InputAdornment> : undefined,
          ...inputProps,
        }}
        sx={sx}
        {...rest}
      />
    );
  }

  // Default text/email/phone
  return (
    <TextField
      name={name}
      label={label}
      type={type === 'phone' ? 'tel' : type === 'email' ? 'email' : type === 'password' ? 'password' : 'text'}
      value={value || ''}
      onChange={handleChange}
      onBlur={handleBlur}
      error={!!error}
      helperText={error || helperText}
      required={required}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      placeholder={placeholder}
      InputProps={{
        startAdornment: prefix ? <InputAdornment position="start">{prefix}</InputAdornment> : (
          required && !value ? (
            <InputAdornment position="start">
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main' }} />
            </InputAdornment>
          ) : undefined
        ),
        endAdornment: suffix ? <InputAdornment position="end">{suffix}</InputAdornment> : undefined,
        ...inputProps,
      }}
      sx={sx}
      {...rest}
    />
  );
};

export default SmartField;
