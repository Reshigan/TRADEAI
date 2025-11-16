import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemText,
  Checkbox,
  Typography,
  alpha,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewColumn as ColumnsIcon,
  Download as ExportIcon,
  MoreVert as MoreIcon,
  Psychology as AIIcon
} from '@mui/icons-material';

/**
 * SmartDataGrid - Enhanced data grid with AI insights and smart features
 * 
 * Features:
 * - Smart search with AI suggestions
 * - Column visibility toggle
 * - Export functionality
 * - Row actions
 * - AI-powered insights on rows
 * - Sorting and pagination
 * - Responsive design
 */
const SmartDataGrid = ({
  data = [],
  columns = [],
  onRowClick,
  onEdit,
  onDelete,
  aiInsights = {},
  highlightRows = [], // Row IDs to highlight with AI
  enableAI = true,
  enableExport = true,
  title,
  emptyMessage = "No data available"
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [setFilterAnchor] = useState(null);
  const [columnsAnchor, setColumnsAnchor] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.id]: true }), {})
  );
  const [actionAnchor, setActionAnchor] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  // Handle sort
  const handleSort = (columnId) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  // Handle search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Handle column visibility
  const toggleColumn = (columnId) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        columns.some(col =>
          String(row[col.id] || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (orderBy) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[orderBy];
        const bVal = b[orderBy];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal < bVal ? -1 : 1;
        return order === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, orderBy, order, columns]);

  // Paginated data
  const paginatedData = filteredAndSortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handle export
  const handleExport = () => {
    const csvContent = [
      columns.filter(col => visibleColumns[col.id]).map(col => col.label).join(','),
      ...filteredAndSortedData.map(row =>
        columns.filter(col => visibleColumns[col.id]).map(col => row[col.id] || '').join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'export'}.csv`;
    a.click();
  };

  // Handle row actions
  const handleRowAction = (row, event) => {
    setSelectedRow(row);
    setActionAnchor(event.currentTarget);
  };

  // Check if row has AI insights
  const hasAIInsight = (row) => {
    return aiInsights[row.id] || highlightRows.includes(row.id);
  };

  const getAIInsightColor = (row) => {
    const insight = aiInsights[row.id];
    if (!insight) return 'default';
    if (insight.type === 'opportunity') return 'success';
    if (insight.type === 'risk') return 'error';
    if (insight.type === 'trending') return 'info';
    return 'default';
  };

  return (
    <Paper elevation={2}>
      {/* Toolbar */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        {title && (
          <Typography variant="h6" fontWeight="600">
            {title}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, justifyContent: 'flex-end' }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
            sx={{ width: 250 }}
          />

          {/* Filter Button */}
          <Tooltip title="Filters">
            <IconButton onClick={(e) => setFilterAnchor(e.currentTarget)}>
              <FilterIcon />
            </IconButton>
          </Tooltip>

          {/* Columns Toggle */}
          <Tooltip title="Columns">
            <IconButton onClick={(e) => setColumnsAnchor(e.currentTarget)}>
              <ColumnsIcon />
            </IconButton>
          </Tooltip>

          {/* Export */}
          {enableExport && (
            <Tooltip title="Export">
              <IconButton onClick={handleExport}>
                <ExportIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Columns Menu */}
      <Menu
        anchorEl={columnsAnchor}
        open={Boolean(columnsAnchor)}
        onClose={() => setColumnsAnchor(null)}
      >
        {columns.map(column => (
          <MenuItem key={column.id} onClick={() => toggleColumn(column.id)}>
            <Checkbox checked={visibleColumns[column.id]} size="small" />
            <ListItemText>{column.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {enableAI && <TableCell width={50} />}
              {columns.filter(col => visibleColumns[col.id]).map(column => (
                <TableCell key={column.id}>
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              <TableCell width={50} />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.filter(col => visibleColumns[col.id]).length + 2} align="center">
                  <Box sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={row.id || index}
                  hover
                  onClick={() => onRowClick && onRowClick(row)}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    bgcolor: hasAIInsight(row) 
                      ? alpha(theme.palette[getAIInsightColor(row)].main, 0.05)
                      : 'transparent',
                    borderLeft: hasAIInsight(row) 
                      ? `3px solid ${theme.palette[getAIInsightColor(row)].main}`
                      : 'none'
                  }}
                >
                  {enableAI && (
                    <TableCell>
                      {hasAIInsight(row) && (
                        <Tooltip title={aiInsights[row.id]?.message || 'AI Insight Available'}>
                          <AIIcon 
                            fontSize="small" 
                            color={getAIInsightColor(row)}
                          />
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                  {columns.filter(col => visibleColumns[col.id]).map(column => (
                    <TableCell key={column.id}>
                      {column.render ? column.render(row[column.id], row) : row[column.id]}
                    </TableCell>
                  ))}
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowAction(row, e);
                      }}
                    >
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Row Actions Menu */}
      <Menu
        anchorEl={actionAnchor}
        open={Boolean(actionAnchor)}
        onClose={() => setActionAnchor(null)}
      >
        {onEdit && (
          <MenuItem onClick={() => { onEdit(selectedRow); setActionAnchor(null); }}>
            Edit
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={() => { onDelete(selectedRow); setActionAnchor(null); }}>
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredAndSortedData.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Paper>
  );
};

export default SmartDataGrid;
