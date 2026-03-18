import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, TextField, Chip, Stack, Paper, Checkbox,
  InputAdornment, IconButton, Collapse, CircularProgress, List, ListItemButton, ListItemIcon, ListItemText
} from '@mui/material';
import { Search, X, ChevronRight, ChevronDown } from 'lucide-react';

/**
 * SmartHierarchy — Tree-based picker replacing 5-7 dropdown cascades.
 * Features: tree view, search, multi-select, chips, breadcrumbs, badges.
 */
const SmartHierarchy = ({
  name,
  label,
  type = 'customer',
  value = [],
  onChange,
  options = [],
  multiple = true,
  error,
  helperText,
  required,
  disabled,
  readOnly,
  loading,
  placeholder,
  sx = {},
}) => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState([]);
  const [open, setOpen] = useState(false);

  const selectedValues = useMemo(() => {
    if (Array.isArray(value)) return value;
    if (value) return [value];
    return [];
  }, [value]);

  // Build flat lookup from hierarchical options
  const flatItems = useMemo(() => {
    const items = [];
    const flatten = (nodes, parentPath = []) => {
      (nodes || []).forEach(node => {
        const path = [...parentPath, node.label || node.name || node.id];
        items.push({
          id: node.id || node.value,
          label: node.label || node.name,
          path,
          count: node.count,
          revenue: node.revenue,
          children: node.children || [],
          parentId: parentPath.length > 0 ? nodes[0]?.parentId : null,
        });
        if (node.children) flatten(node.children, path);
      });
    };
    flatten(options);
    return items;
  }, [options]);

  // Filter by search
  const filteredIds = useMemo(() => {
    if (!search) return null;
    const lower = search.toLowerCase();
    return new Set(
      flatItems
        .filter(item => item.label?.toLowerCase().includes(lower))
        .map(item => item.id)
    );
  }, [search, flatItems]);

  const handleToggle = useCallback((itemId) => {
    const newSelected = selectedValues.includes(itemId)
      ? selectedValues.filter(v => v !== itemId)
      : multiple ? [...selectedValues, itemId] : [itemId];

    if (onChange) {
      onChange({
        target: {
          name,
          value: multiple ? newSelected : (newSelected[0] || ''),
        },
      });
    }
    if (!multiple) setOpen(false);
  }, [selectedValues, multiple, name, onChange]);

  const handleRemove = useCallback((itemId) => {
    const newSelected = selectedValues.filter(v => v !== itemId);
    if (onChange) {
      onChange({
        target: {
          name,
          value: multiple ? newSelected : '',
        },
      });
    }
  }, [selectedValues, multiple, name, onChange]);

  const getLabel = useCallback((id) => {
    const item = flatItems.find(i => i.id === id);
    return item?.label || id;
  }, [flatItems]);

  const toggleExpand = useCallback((nodeId) => {
    setExpanded(prev =>
      prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]
    );
  }, []);

  if (readOnly) {
    return (
      <Box sx={{ mb: 2, ...sx }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          {label}
        </Typography>
        {selectedValues.length > 0 ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {selectedValues.map(id => (
              <Chip key={id} label={getLabel(id)} size="small" />
            ))}
          </Stack>
        ) : (
          <Typography variant="body1">—</Typography>
        )}
      </Box>
    );
  }

  const renderTreeNodes = (nodes, depth = 0) => {
    return (nodes || []).map(node => {
      const nodeId = node.id || node.value;
      const nodeLabel = node.label || node.name;
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expanded.includes(nodeId);

      if (filteredIds && !filteredIds.has(nodeId) && !(node.children || []).some(c => filteredIds.has(c.id || c.value))) {
        return null;
      }

      return (
        <React.Fragment key={nodeId}>
          <ListItemButton
            dense
            sx={{ pl: 1 + depth * 2, py: 0.25, borderRadius: 1 }}
            onClick={() => hasChildren ? toggleExpand(nodeId) : handleToggle(nodeId)}
          >
            {hasChildren ? (
              <ListItemIcon sx={{ minWidth: 24 }}>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </ListItemIcon>
            ) : (
              <ListItemIcon sx={{ minWidth: 24 }} />
            )}
            <Checkbox
              size="small"
              checked={selectedValues.includes(nodeId)}
              onChange={() => handleToggle(nodeId)}
              onClick={(e) => e.stopPropagation()}
              sx={{ p: 0.25, mr: 0.5 }}
            />
            <ListItemText primary={nodeLabel} primaryTypographyProps={{ variant: 'body2' }} />
            {node.count !== undefined && (
              <Chip label={node.count} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem', ml: 1 }} />
            )}
            {node.revenue !== undefined && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                R {new Intl.NumberFormat('en-ZA').format(node.revenue)}
              </Typography>
            )}
          </ListItemButton>
          {hasChildren && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List disablePadding>
                {renderTreeNodes(node.children, depth + 1)}
              </List>
            </Collapse>
          )}
        </React.Fragment>
      );
    }).filter(Boolean);
  };

  return (
    <Box sx={sx}>
      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
        {label}
        {required && (
          <Box
            component="span"
            sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main', display: 'inline-block', ml: 0.5, mb: 0.5 }}
          />
        )}
      </Typography>

      {/* Selected chips */}
      {selectedValues.length > 0 && (
        <Stack direction="row" spacing={0.5} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
          {selectedValues.map(id => (
            <Chip
              key={id}
              label={getLabel(id)}
              size="small"
              onDelete={disabled ? undefined : () => handleRemove(id)}
              color="primary"
              variant="outlined"
            />
          ))}
        </Stack>
      )}

      {/* Search & tree toggle */}
      <TextField
        size="small"
        fullWidth
        placeholder={placeholder || `Search ${type}s...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setOpen(true)}
        disabled={disabled}
        error={!!error}
        helperText={error || helperText}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={16} />
            </InputAdornment>
          ),
          endAdornment: search ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearch('')}>
                <X size={14} />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        }}
      />

      {/* Tree view */}
      <Collapse in={open && !disabled}>
        <Paper
          variant="outlined"
          sx={{
            mt: 0.5,
            maxHeight: 300,
            overflow: 'auto',
            p: 1,
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : options.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No {type}s available
            </Typography>
          ) : (
            <List disablePadding>
              {renderTreeNodes(options)}
            </List>
          )}
        </Paper>
      </Collapse>
    </Box>
  );
};

export default SmartHierarchy;
