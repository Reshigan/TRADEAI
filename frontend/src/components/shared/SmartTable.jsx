import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, TableSortLabel, TextField, InputAdornment,
  Checkbox, IconButton, Button, Chip, Stack, Typography, Menu, MenuItem,
  Tooltip, LinearProgress
} from '@mui/material';
import {
  Search, Download, MoreVertical, Columns
} from 'lucide-react';
import StatusChip from './StatusChip';
import EmptyState from './EmptyState';

/**
 * SmartTable — Unified list component replacing 103 raw table implementations.
 * Features: sorting, filtering, pagination, column visibility, row selection,
 * bulk actions, CSV export, status chips, inline actions, loading states.
 */
const SmartTable = ({
  columns = [],
  data = [],
  loading = false,
  title,
  subtitle,
  // Pagination
  pagination = true,
  pageSize: initialPageSize = 20,
  pageSizeOptions = [10, 20, 50],
  totalCount,
  serverSide = false,
  onPageChange,
  onPageSizeChange,
  // Sorting
  sortable = true,
  defaultSort,
  defaultSortDirection = 'asc',
  onSortChange,
  // Filtering
  searchable = true,
  searchPlaceholder = 'Search...',
  onSearch,
  filters,
  // Selection
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  // Actions
  onRowClick,
  rowActions,
  bulkActions,
  headerActions,
  // Customization
  dense = false,
  stickyHeader = true,
  maxHeight,
  emptyMessage = 'No data found',
  emptyIcon,
  sx = {},
}) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortBy, setSortBy] = useState(defaultSort || '');
  const [sortDir, setSortDir] = useState(defaultSortDirection);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(
    columns.filter(c => !c.hidden).map(c => c.field || c.id)
  );
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionMenuRow, setActionMenuRow] = useState(null);

  // Filter visible columns
  const displayColumns = useMemo(() => {
    return columns.filter(c => visibleColumns.includes(c.field || c.id));
  }, [columns, visibleColumns]);

  // Client-side filtering
  const filteredData = useMemo(() => {
    if (serverSide || !searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const val = row[col.field || col.id];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(lower);
      })
    );
  }, [data, searchTerm, columns, serverSide]);

  // Client-side sorting
  const sortedData = useMemo(() => {
    if (serverSide || !sortBy) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortBy, sortDir, serverSide]);

  // Client-side pagination
  const paginatedData = useMemo(() => {
    if (serverSide || !pagination) return sortedData;
    const start = page * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize, pagination, serverSide]);

  const total = serverSide ? (totalCount || 0) : filteredData.length;

  // Handlers
  const handleSort = useCallback((field) => {
    const isAsc = sortBy === field && sortDir === 'asc';
    const newDir = isAsc ? 'desc' : 'asc';
    setSortBy(field);
    setSortDir(newDir);
    if (onSortChange) onSortChange(field, newDir);
  }, [sortBy, sortDir, onSortChange]);

  const handlePageChange = useCallback((e, newPage) => {
    setPage(newPage);
    if (onPageChange) onPageChange(newPage);
  }, [onPageChange]);

  const handlePageSizeChange = useCallback((e) => {
    const size = parseInt(e.target.value, 10);
    setPageSize(size);
    setPage(0);
    if (onPageSizeChange) onPageSizeChange(size);
  }, [onPageSizeChange]);

  const handleSearch = useCallback((e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setPage(0);
    if (onSearch) onSearch(term);
  }, [onSearch]);

  const handleSelectAll = useCallback((e) => {
    if (onSelectionChange) {
      if (e.target.checked) {
        onSelectionChange(paginatedData.map(r => r.id || r._id));
      } else {
        onSelectionChange([]);
      }
    }
  }, [paginatedData, onSelectionChange]);

  const handleSelectRow = useCallback((rowId) => {
    if (onSelectionChange) {
      const newSelection = selectedRows.includes(rowId)
        ? selectedRows.filter(id => id !== rowId)
        : [...selectedRows, rowId];
      onSelectionChange(newSelection);
    }
  }, [selectedRows, onSelectionChange]);

  const toggleColumn = useCallback((field) => {
    setVisibleColumns(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  }, []);

  // CSV Export
  const handleExport = useCallback(() => {
    const rows = [displayColumns.map(c => c.headerName || c.label || c.field)];
    sortedData.forEach(row => {
      rows.push(displayColumns.map(c => {
        const val = row[c.field || c.id];
        if (val === null || val === undefined) return '';
        return String(val).replace(/,/g, ';');
      }));
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [displayColumns, sortedData, title]);

  // Format cell value
  const formatCell = useCallback((col, row) => {
    const value = row[col.field || col.id];
    
    if (col.renderCell) return col.renderCell({ row, value });

    if (col.type === 'currency') {
      if (value === null || value === undefined) return '—';
      return `R ${new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)}`;
    }
    if (col.type === 'percent') return value !== null && value !== undefined ? `${value}%` : '—';
    if (col.type === 'date') {
      if (!value) return '—';
      return new Date(value).toLocaleDateString('en-ZA');
    }
    if (col.type === 'status') {
      return <StatusChip status={value} />;
    }
    if (col.type === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (col.type === 'chip') {
      if (!value) return '—';
      return <Chip label={value} size="small" variant="outlined" />;
    }

    return value ?? '—';
  }, []);

  const allSelected = paginatedData.length > 0 && paginatedData.every(r => selectedRows.includes(r.id || r._id));
  const someSelected = selectedRows.length > 0 && !allSelected;

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', ...sx }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          {title && <Typography variant="h6" sx={{ fontWeight: 600 }}>{title}</Typography>}
          {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
        </Box>

        {/* Search */}
        {searchable && (
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', sm: 250 } }}
          />
        )}

        {/* Bulk actions */}
        {selectable && selectedRows.length > 0 && bulkActions && (
          <Stack direction="row" spacing={1}>
            <Typography variant="body2" color="primary" sx={{ alignSelf: 'center' }}>
              {selectedRows.length} selected
            </Typography>
            {bulkActions.map((action) => (
              <Button
                key={action.label}
                size="small"
                variant="outlined"
                color={action.color || 'primary'}
                onClick={() => action.onClick(selectedRows)}
                startIcon={action.icon}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
        )}

        {/* Header actions */}
        <Stack direction="row" spacing={1}>
          {headerActions}
          <Tooltip title="Export CSV">
            <IconButton size="small" onClick={handleExport}>
              <Download size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Columns">
            <IconButton size="small" onClick={(e) => setColumnMenuAnchor(e.currentTarget)}>
              <Columns size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Column visibility menu */}
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => setColumnMenuAnchor(null)}
      >
        {columns.map(col => (
          <MenuItem
            key={col.field || col.id}
            onClick={() => toggleColumn(col.field || col.id)}
            dense
          >
            <Checkbox
              size="small"
              checked={visibleColumns.includes(col.field || col.id)}
              sx={{ p: 0.5, mr: 1 }}
            />
            {col.headerName || col.label || col.field}
          </MenuItem>
        ))}
      </Menu>

      {/* Active filters */}
      {filters}

      {/* Loading indicator */}
      {loading && <LinearProgress />}

      {/* Table */}
      <TableContainer sx={{ maxHeight: maxHeight || (pagination ? undefined : 600) }}>
        <Table size={dense ? 'small' : 'medium'} stickyHeader={stickyHeader}>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              {displayColumns.map(col => (
                <TableCell
                  key={col.field || col.id}
                  align={col.align || (col.type === 'currency' || col.type === 'number' || col.type === 'percent' ? 'right' : 'left')}
                  sx={{
                    fontWeight: 600,
                    bgcolor: '#F9FAFB',
                    minWidth: col.minWidth,
                    width: col.width,
                    whiteSpace: 'nowrap',
                  }}
                  sortDirection={sortBy === (col.field || col.id) ? sortDir : false}
                >
                  {sortable && col.sortable !== false ? (
                    <TableSortLabel
                      active={sortBy === (col.field || col.id)}
                      direction={sortBy === (col.field || col.id) ? sortDir : 'asc'}
                      onClick={() => handleSort(col.field || col.id)}
                    >
                      {col.headerName || col.label || col.field}
                    </TableSortLabel>
                  ) : (
                    col.headerName || col.label || col.field
                  )}
                </TableCell>
              ))}
              {rowActions && <TableCell align="right" sx={{ fontWeight: 600, bgcolor: '#F9FAFB', width: 60 }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 && !loading ? (
              <TableRow>
                <TableCell
                  colSpan={displayColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  sx={{ py: 6, textAlign: 'center' }}
                >
                  <EmptyState message={emptyMessage} icon={emptyIcon} />
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, idx) => {
                const rowId = row.id || row._id || idx;
                const isSelected = selectedRows.includes(rowId);
                return (
                  <TableRow
                    key={rowId}
                    hover
                    selected={isSelected}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => handleSelectRow(rowId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    )}
                    {displayColumns.map(col => (
                      <TableCell
                        key={col.field || col.id}
                        align={col.align || (col.type === 'currency' || col.type === 'number' || col.type === 'percent' ? 'right' : 'left')}
                        sx={{ whiteSpace: col.wrap ? 'normal' : 'nowrap' }}
                      >
                        {formatCell(col, row)}
                      </TableCell>
                    ))}
                    {rowActions && (
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setActionMenuAnchor(e.currentTarget);
                            setActionMenuRow(row);
                          }}
                        >
                          <MoreVertical size={16} />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Row action menu */}
      {rowActions && (
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={() => { setActionMenuAnchor(null); setActionMenuRow(null); }}
        >
          {rowActions.map((action) => {
            if (action.visible && actionMenuRow && !action.visible(actionMenuRow)) return null;
            return (
              <MenuItem
                key={action.label}
                onClick={() => {
                  action.onClick(actionMenuRow);
                  setActionMenuAnchor(null);
                  setActionMenuRow(null);
                }}
                disabled={action.disabled ? action.disabled(actionMenuRow) : false}
              >
                {action.icon && <Box sx={{ mr: 1, display: 'flex' }}>{action.icon}</Box>}
                {action.label}
              </MenuItem>
            );
          })}
        </Menu>
      )}

      {/* Pagination */}
      {pagination && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handlePageSizeChange}
          rowsPerPageOptions={pageSizeOptions}
        />
      )}
    </Paper>
  );
};

export default SmartTable;
