/**
 * Enhanced ListPage Template
 * Professional list page with consistent patterns for all list views
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Button,
  Chip,
  Tooltip,
  Checkbox,
  Menu,
  MenuItem,
  Divider,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  FormGroup,
  FormControlLabel,
  Switch,
  Popover,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Settings,
  Columns,
  ArrowUpDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyState, { EmptyTableState, SearchEmptyState, FilterEmptyState } from './EmptyState.enhanced';
import PageHeader from './PageHeader.enhanced';

/**
 * Professional List Page Template
 * Use this as a base for all list pages in the application
 */
export default function ListPageTemplate({
  // Data
  items = [],
  loading = false,
  totalItems = 0,
  
  // Configuration
  title,
  subtitle,
  columns = [],
  searchable = true,
  filterable = true,
  sortable = true,
  selectable = true,
  paginated = true,
  
  // Actions
  onCreate,
  onExport,
  onImport,
  onRefresh,
  onBulkAction,
  
  // Item actions
  onView,
  onEdit,
  onDelete,
  itemActions = [],
  
  // Customization
  renderRow = null,
  renderCell = null,
  getRowId = (item) => item.id,
  emptyStateProps = {},
}) {
  const navigate = useNavigate();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Derived state
  const selectedCount = selectedItems.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  
  // Search and filter items
  const filteredItems = useMemo(() => {
    let result = [...items];
    
    // Apply search
    if (searchQuery && searchable) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(query)
        )
      );
    }
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((item) => item[key] === value);
      }
    });
    
    // Apply sorting
    if (sortConfig.key && sortable) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return result;
  }, [items, searchQuery, filters, sortConfig, searchable, sortable]);
  
  // Pagination
  const paginatedItems = useMemo(() => {
    if (!paginated) return filteredItems;
    const start = (page - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, page, rowsPerPage, paginated]);
  
  // Handlers
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedItems(paginatedItems.map(getRowId));
    } else {
      setSelectedItems([]);
    }
  };
  
  const handleSelectRow = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };
  
  const handleSort = (key) => {
    if (!sortable) return;
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };
  
  const handleRowClick = (item) => {
    if (onView) {
      onView(item);
    }
  };
  
  const handleActionClick = (event, item) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(item);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };
  
  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
  };
  
  const hasActiveFilters = searchQuery || Object.keys(filters).length > 0;
  
  // Render header cell with sorting
  const renderHeaderCell = (column) => {
    const canSort = sortable && column.sortable !== false;
    const isSorted = sortConfig.key === column.key;
    
    return (
      <TableCell
        key={column.key}
        align={column.align || 'left'}
        sx={{
          fontWeight: 700,
          cursor: canSort ? 'pointer' : 'default',
          userSelect: 'none',
          '&:hover': {
            color: canSort ? 'primary.main' : 'inherit',
          },
        }}
        onClick={() => handleSort(column.key)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {column.label}
          {canSort && (
            <ArrowUpDown
              size={14}
              color={isSorted ? 'primary.main' : '#94A3B8'}
              style={{
                transform: isSorted && sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'none',
              }}
            />
          )}
        </Box>
      </TableCell>
    );
  };
  
  // Render cell content
  const renderCellContent = (item, column) => {
    if (renderCell) {
      return renderCell(item, column);
    }
    
    const value = item[column.key];
    
    if (column.render) {
      return column.render(value, item);
    }
    
    if (column.type === 'chip') {
      return (
        <Chip
          label={column.chipMap ? column.chipMap[value] : value}
          size="small"
          sx={{
            bgcolor: column.chipColors?.[value] || 'action.hover',
            color: 'text.primary',
            fontWeight: 600,
            height: 24,
          }}
        />
      );
    }
    
    if (column.type === 'avatar') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: column.avatarColor || 'primary.50',
              color: column.avatarColor ? 'white' : 'primary.main',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {column.avatarValue ? column.avatarValue(item) : value?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Typography variant="body2" fontWeight={500}>
            {column.avatarLabel ? column.avatarLabel(item) : value}
          </Typography>
        </Box>
      );
    }
    
    if (column.type === 'progress') {
      return (
        <Box sx={{ width: '100%' }}>
          <LinearProgress
            variant="determinate"
            value={value}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                bgcolor: value > 90 ? '#DC2626' : value > 75 ? '#F59E0B' : '#2563EB',
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {value}%
          </Typography>
        </Box>
      );
    }
    
    return (
      <Typography variant="body2" sx={{ color: column.color || 'text.primary' }}>
        {value ?? '-'}
      </Typography>
    );
  };
  
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Page Header */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={columns[0]?.icon}
        actions={[
          onRefresh && {
            label: 'Refresh',
            onClick: onRefresh,
            icon: <RefreshCw size={18} />,
            variant: 'outlined',
          },
          onExport && {
            label: 'Export',
            onClick: onExport,
            icon: <Download size={18} />,
            variant: 'outlined',
          },
          onImport && {
            label: 'Import',
            onClick: onImport,
            icon: <Upload size={18} />,
            variant: 'outlined',
          },
          onCreate && {
            label: 'Create New',
            onClick: onCreate,
            icon: <Plus size={18} />,
            variant: 'contained',
          },
        ].filter(Boolean)}
      />
      
      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <Card
          sx={{
            mb: 3,
            bgcolor: 'primary.50',
            border: '1px solid',
            borderColor: 'primary.200',
          }}
        >
          <CardContent sx={{ py: 1.5, px: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" fontWeight={600} color="primary.main">
                {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {onBulkAction && (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onBulkAction(selectedItems, 'approve')}
                      sx={{ fontWeight: 600 }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onBulkAction(selectedItems, 'reject')}
                      sx={{ fontWeight: 600 }}
                    >
                      Reject
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => onBulkAction(selectedItems, 'delete')}
                      sx={{ fontWeight: 600 }}
                    >
                      Delete
                    </Button>
                  </>
                )}
                <IconButton size="small" onClick={() => setSelectedItems([])}>
                  <X size={18} />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
      
      {/* Filters and Search Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2, px: 2.5 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Search */}
            {searchable && (
              <TextField
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                InputProps={{
                  startAdornment: <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />,
                }}
                sx={{
                  width: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
                size="small"
              />
            )}
            
            {/* Filter Toggle */}
            {filterable && (
              <Button
                variant={showFilters || hasActiveFilters ? 'contained' : 'outlined'}
                startIcon={<Filter size={18} />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ fontWeight: 600 }}
              >
                Filters
                {hasActiveFilters && (
                  <Chip
                    label="Active"
                    size="small"
                    sx={{ ml: 1, height: 20, bgcolor: 'white', color: 'primary.main' }}
                  />
                )}
              </Button>
            )}
            
            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="text"
                startIcon={<X size={16} />}
                onClick={handleClearFilters}
                sx={{ fontWeight: 600 }}
              >
                Clear All
              </Button>
            )}
            
            <Box sx={{ flexGrow: 1 }} />
            
            {/* View Options */}
            <Tooltip title="Customize Columns">
              <IconButton sx={{ bgcolor: 'background.subtle' }}>
                <Columns size={18} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Settings">
              <IconButton sx={{ bgcolor: 'background.subtle' }}>
                <Settings size={18} />
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Expanded Filters */}
          {showFilters && filterable && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {/* Add filter fields here based on columns */}
                {columns.filter((c) => c.filterable).map((column) => (
                  <FormControl key={column.key} size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>{column.label}</InputLabel>
                    <Select
                      value={filters[column.key] || ''}
                      onChange={(e) => {
                        setFilters((prev) => ({ ...prev, [column.key]: e.target.value }));
                        setPage(1);
                      }}
                      label={column.label}
                      input={<OutlinedInput label={column.label} />}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">All</MenuItem>
                      {column.filterOptions?.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Data Table */}
      <Card>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow>
                {selectable && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedCount > 0 && selectedCount === paginatedItems.length}
                      indeterminate={selectedCount > 0 && selectedCount < paginatedItems.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                )}
                {columns.map(renderHeaderCell)}
                <TableCell align="right" sx={{ width: 60 }}>
                  <Typography variant="caption" fontWeight={700}>
                    Actions
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                // Loading skeleton rows
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {selectable && <TableCell padding="checkbox"><Checkbox disabled /></TableCell>}
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        <Box sx={{ height: 20, width: '80%', bgcolor: 'action.hover', borderRadius: 1 }} />
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <Box sx={{ height: 32, width: 32, bgcolor: 'action.hover', borderRadius: 2 }} />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selectable ? 2 : 1)}
                    sx={{ py: 8 }}
                  >
                    {hasActiveFilters ? (
                      <FilterEmptyState onClearFilters={handleClearFilters} />
                    ) : searchQuery ? (
                      <SearchEmptyState query={searchQuery} onClear={handleClearFilters} />
                    ) : (
                      <EmptyState
                        variant="inbox"
                        title="No items yet"
                        description={emptyStateProps.description || 'Get started by creating your first item'}
                        action={
                          onCreate
                            ? {
                                label: 'Create New',
                                onClick: onCreate,
                                icon: <Plus size={18} />,
                              }
                            : undefined
                        }
                        {...emptyStateProps}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => (
                  <TableRow
                    key={getRowId(item)}
                    onClick={() => handleRowClick(item)}
                    selected={selectedItems.includes(getRowId(item))}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'background.subtle',
                        '& .action-buttons': { opacity: 1 },
                      },
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedItems.includes(getRowId(item))}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectRow(getRowId(item));
                          }}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        align={column.align || 'left'}
                        sx={{ color: column.color || 'text.primary' }}
                      >
                        {renderCellContent(item, column)}
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <Box className="action-buttons" sx={{ opacity: 0, transition: 'opacity 0.2s ease' }}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleActionClick(e, item)}
                          sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          <MoreVertical size={18} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        {paginated && filteredItems.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2.5,
              py: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Showing {Math.min((page - 1) * rowsPerPage + 1, filteredItems.length)} to{' '}
              {Math.min(page * rowsPerPage, filteredItems.length)} of {filteredItems.length} items
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(e.target.value);
                    setPage(1);
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  {[10, 20, 50, 100].map((size) => (
                    <MenuItem key={size} value={size}>
                      {size} / page
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          </Box>
        )}
      </Card>
      
      {/* Row Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 180,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        {onView && (
          <MenuItem onClick={() => { onView(selectedRow); handleCloseMenu(); }}>
            <Eye size={18} style={{ marginRight: 12 }} />
            View Details
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem onClick={() => { onEdit(selectedRow); handleCloseMenu(); }}>
            <Edit2 size={18} style={{ marginRight: 12 }} />
            Edit
          </MenuItem>
        )}
        {itemActions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              action.onClick(selectedRow);
              handleCloseMenu();
            }}
            sx={{ color: action.color || 'inherit' }}
          >
            {action.icon && <action.icon size={18} style={{ marginRight: 12 }} />}
            {action.label}
          </MenuItem>
        ))}
        {onDelete && (
          <>
            <Divider />
            <MenuItem
              onClick={() => { onDelete(selectedRow); handleCloseMenu(); }}
              sx={{ color: 'error.main' }}
            >
              <Trash2 size={18} style={{ marginRight: 12 }} />
              Delete
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
}
