import React from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Switch,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Get currency symbol from user's company settings
const getCurrencySymbol = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      const currencyMap = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'ZAR': 'R', 'AUD': 'A$',
        'CAD': 'C$', 'JPY': '¥', 'CNY': '¥', 'INR': '₹', 'MXN': '$'
      };
      return currencyMap[user?.company?.currency] || 'R';
    }
  } catch (e) {
    console.warn('Error getting currency symbol:', e);
  }
  return 'R'; // Default to ZAR
};

const FormField = ({
  type = 'text',
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  options = [],
  multiline = false,
  rows = 4,
  placeholder,
  sx = {},
  ...props
}) => {
  const handleChange = (event, newValue) => {
    if (type === 'autocomplete') {
      onChange({ target: { name, value: newValue } });
    } else if (type === 'switch' || type === 'checkbox') {
      onChange({ target: { name, value: event.target.checked } });
    } else if (type === 'date') {
      onChange({ target: { name, value: newValue } });
    } else {
      onChange(event);
    }
  };

  const commonProps = {
    name,
    value: value || '',
    onChange: handleChange,
    onBlur,
    error: !!error,
    disabled,
    fullWidth,
    sx,
  };

  switch (type) {
    case 'select':
      return (
        <FormControl {...commonProps}>
          <InputLabel required={required}>{label}</InputLabel>
          <Select
            label={label}
            {...props}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {(error || helperText) && (
            <FormHelperText error={!!error}>
              {error || helperText}
            </FormHelperText>
          )}
        </FormControl>
      );

    case 'autocomplete':
      return (
        <Autocomplete
          options={options}
          getOptionLabel={(option) => option.label || option}
          value={options.find(opt => opt.value === value) || null}
          onChange={handleChange}
          disabled={disabled}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              required={required}
              error={!!error}
              helperText={error || helperText}
              placeholder={placeholder}
            />
          )}
          sx={sx}
          {...props}
        />
      );

    case 'date':
      return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label={label}
            value={value || null}
            onChange={handleChange}
            disabled={disabled}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth={fullWidth}
                required={required}
                error={!!error}
                helperText={error || helperText}
                sx={sx}
              />
            )}
            {...props}
          />
        </LocalizationProvider>
      );

    case 'switch':
      return (
        <FormControlLabel
          control={
            <Switch
              checked={!!value}
              onChange={handleChange}
              name={name}
              disabled={disabled}
              {...props}
            />
          }
          label={label}
          sx={sx}
        />
      );

    case 'checkbox':
      return (
        <FormControlLabel
          control={
            <Checkbox
              checked={!!value}
              onChange={handleChange}
              name={name}
              disabled={disabled}
              {...props}
            />
          }
          label={label}
          sx={sx}
        />
      );

    case 'radio':
      return (
        <FormControl {...commonProps}>
          <InputLabel required={required}>{label}</InputLabel>
          <RadioGroup
            name={name}
            value={value}
            onChange={handleChange}
          >
            {options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
          {(error || helperText) && (
            <FormHelperText error={!!error}>
              {error || helperText}
            </FormHelperText>
          )}
        </FormControl>
      );

    case 'number':
    case 'currency':
      return (
        <TextField
          {...commonProps}
          type="number"
          label={label}
          required={required}
          helperText={error || helperText}
          placeholder={placeholder}
          multiline={multiline}
          rows={rows}
          InputProps={{
            startAdornment: type === 'currency' ? getCurrencySymbol() : undefined,
          }}
          {...props}
        />
      );

    case 'textarea':
      return (
        <TextField
          {...commonProps}
          label={label}
          required={required}
          helperText={error || helperText}
          placeholder={placeholder}
          multiline
          rows={rows}
          {...props}
        />
      );

    default:
      return (
        <TextField
          {...commonProps}
          type={type}
          label={label}
          required={required}
          helperText={error || helperText}
          placeholder={placeholder}
          multiline={multiline}
          rows={rows}
          {...props}
        />
      );
  }
};

export default FormField;
