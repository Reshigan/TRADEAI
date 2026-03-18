import React, { useState, useMemo } from 'react';
import {
  Autocomplete, TextField, Chip, Box, Typography,
  MenuItem, InputAdornment
} from '@mui/material';
import { Search, Plus } from 'lucide-react';

/**
 * SmartSelect — Enhanced select with search, multi-select, chips, grouping, creatable.
 */
const SmartSelect = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  options = [],
  multiple = false,
  searchable = false,
  groupBy,
  error,
  helperText,
  required,
  disabled,
  readOnly,
  creatable = false,
  placeholder,
  fullWidth = true,
  size = 'medium',
  renderOption: customRenderOption,
  sx = {},
  ...rest
}) => {
  const [inputValue, setInputValue] = useState('');

  // Normalize options to { value, label, group? } format
  const normalizedOptions = useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string') return { value: opt, label: opt };
      return { value: opt.value ?? opt.id ?? opt, label: opt.label ?? opt.name ?? String(opt.value ?? opt) , group: opt.group };
    });
  }, [options]);

  // For read-only mode
  if (readOnly) {
    let displayValue = '—';
    if (multiple && Array.isArray(value) && value.length > 0) {
      displayValue = value.map(v => {
        const opt = normalizedOptions.find(o => o.value === v);
        return opt?.label || v;
      }).join(', ');
    } else if (value) {
      const opt = normalizedOptions.find(o => o.value === value);
      displayValue = opt?.label || value;
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

  // Non-searchable simple select
  if (!searchable) {
    return (
      <TextField
        name={name}
        label={label}
        select
        value={multiple ? (Array.isArray(value) ? value : []) : (value || '')}
        onChange={(e) => {
          if (onChange) onChange({ target: { name, value: e.target.value } });
        }}
        onBlur={onBlur}
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
        {!required && !multiple && <MenuItem value="">— None —</MenuItem>}
        {normalizedOptions.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  // Searchable Autocomplete
  const currentValue = multiple
    ? normalizedOptions.filter(o => Array.isArray(value) && value.includes(o.value))
    : normalizedOptions.find(o => o.value === value) || null;

  return (
    <Autocomplete
      options={normalizedOptions}
      getOptionLabel={(opt) => opt?.label || ''}
      value={currentValue}
      onChange={(e, newVal) => {
        if (onChange) {
          const val = multiple
            ? (newVal || []).map(v => v.value)
            : (newVal?.value || '');
          onChange({ target: { name, value: val } });
        }
      }}
      inputValue={inputValue}
      onInputChange={(e, val) => setInputValue(val)}
      multiple={multiple}
      disabled={disabled}
      fullWidth={fullWidth}
      groupBy={groupBy ? (opt) => opt.group || '' : undefined}
      isOptionEqualToValue={(opt, val) => opt.value === val?.value}
      filterOptions={(opts, { inputValue: iv }) => {
        const filtered = opts.filter(o =>
          o.label.toLowerCase().includes(iv.toLowerCase())
        );
        if (creatable && iv && !filtered.some(o => o.label.toLowerCase() === iv.toLowerCase())) {
          filtered.push({ value: `__create__${iv}`, label: `Create "${iv}"`, isCreate: true });
        }
        return filtered;
      }}
      renderOption={customRenderOption || ((props, opt) => {
        const { key, ...otherProps } = props;
        return (
          <li key={key} {...otherProps}>
            {opt.isCreate && <Plus size={16} style={{ marginRight: 8, color: '#1976D2' }} />}
            <Typography variant="body2" sx={{ fontWeight: opt.isCreate ? 600 : 400 }}>
              {opt.label}
            </Typography>
          </li>
        );
      })}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((opt, index) => {
          const { key, ...chipProps } = getTagProps({ index });
          return <Chip key={key} label={opt.label} size="small" {...chipProps} />;
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={!!error}
          helperText={error || helperText}
          required={required}
          size={size}
          placeholder={placeholder || (multiple ? 'Search...' : undefined)}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                {searchable && (
                  <InputAdornment position="start" sx={{ ml: 0.5 }}>
                    <Search size={16} />
                  </InputAdornment>
                )}
                {params.InputProps.startAdornment}
              </>
            ),
          }}
          sx={sx}
        />
      )}
      {...rest}
    />
  );
};

export default SmartSelect;
