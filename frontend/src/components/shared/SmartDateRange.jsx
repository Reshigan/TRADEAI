import React, { useMemo } from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { differenceInDays, addMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, addWeeks } from 'date-fns';

/**
 * SmartDateRange — Date range picker replacing 2 separate date inputs.
 * Features: calendar popover, preset buttons, duration display, validation.
 */
const PRESETS = [
  { label: 'This Month', getRange: () => [startOfMonth(new Date()), endOfMonth(new Date())] },
  { label: 'This Quarter', getRange: () => [startOfQuarter(new Date()), endOfQuarter(new Date())] },
  { label: 'Next 4 Weeks', getRange: () => [new Date(), addWeeks(new Date(), 4)] },
  { label: 'Next Month', getRange: () => [startOfMonth(addMonths(new Date(), 1)), endOfMonth(addMonths(new Date(), 1))] },
];

const SmartDateRange = ({
  startName = 'startDate',
  endName = 'endDate',
  startValue,
  endValue,
  onChange,
  onBlur,
  startError,
  endError,
  startLabel = 'Start Date',
  endLabel = 'End Date',
  minDate,
  maxDate,
  required,
  disabled,
  readOnly,
  showPresets = true,
  size = 'medium',
  sx = {},
}) => {
  const startDate = startValue ? new Date(startValue) : null;
  const endDate = endValue ? new Date(endValue) : null;

  const duration = useMemo(() => {
    if (startDate && endDate && endDate >= startDate) {
      const days = differenceInDays(endDate, startDate);
      if (days === 0) return '1 day';
      if (days < 7) return `${days + 1} days`;
      if (days < 30) return `${Math.ceil((days + 1) / 7)} weeks`;
      return `${Math.ceil((days + 1) / 30)} months`;
    }
    return null;
  }, [startValue, endValue]);

  const handleStartChange = (newVal) => {
    if (onChange) {
      onChange({ target: { name: startName, value: newVal ? newVal.toISOString().split('T')[0] : '' } });
    }
  };

  const handleEndChange = (newVal) => {
    if (onChange) {
      onChange({ target: { name: endName, value: newVal ? newVal.toISOString().split('T')[0] : '' } });
    }
  };

  const applyPreset = (preset) => {
    const [start, end] = preset.getRange();
    if (onChange) {
      onChange({ target: { name: startName, value: start.toISOString().split('T')[0] } });
      setTimeout(() => {
        onChange({ target: { name: endName, value: end.toISOString().split('T')[0] } });
      }, 0);
    }
  };

  if (readOnly) {
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-ZA') : '—';
    return (
      <Box sx={{ mb: 2, ...sx }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          Date Range
        </Typography>
        <Typography variant="body1">
          {fmt(startValue)} — {fmt(endValue)}
          {duration && <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>({duration})</Typography>}
        </Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={sx}>
        {showPresets && !disabled && (
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
            {PRESETS.map((preset) => (
              <Chip
                key={preset.label}
                label={preset.label}
                size="small"
                variant="outlined"
                onClick={() => applyPreset(preset)}
                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'primary.50' } }}
              />
            ))}
          </Stack>
        )}
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <DatePicker
            label={startLabel}
            value={startDate}
            onChange={handleStartChange}
            minDate={minDate ? new Date(minDate) : undefined}
            maxDate={endDate || (maxDate ? new Date(maxDate) : undefined)}
            disabled={disabled}
            slotProps={{
              textField: {
                fullWidth: true,
                size,
                error: !!startError,
                helperText: startError,
                required,
                onBlur,
              },
            }}
          />
          <DatePicker
            label={endLabel}
            value={endDate}
            onChange={handleEndChange}
            minDate={startDate || (minDate ? new Date(minDate) : undefined)}
            maxDate={maxDate ? new Date(maxDate) : undefined}
            disabled={disabled}
            slotProps={{
              textField: {
                fullWidth: true,
                size,
                error: !!endError,
                helperText: endError || (endDate && startDate && endDate < startDate ? 'End date must be after start date' : undefined),
                required,
                onBlur,
              },
            }}
          />
          {duration && (
            <Chip
              label={duration}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mt: 1.5, whiteSpace: 'nowrap', flexShrink: 0 }}
            />
          )}
        </Stack>
      </Box>
    </LocalizationProvider>
  );
};

export default SmartDateRange;
