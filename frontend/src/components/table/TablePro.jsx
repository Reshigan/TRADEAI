import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Button,
  CircularProgress,
  Typography
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport
} from '@mui/x-data-grid';
import {
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  FileDownload as ExportIcon,
  ViewColumn as ViewColumnIcon
} from '@mui/icons-material';
import { EmptyState, ErrorState } from '../states';

const CustomToolbar = ({ 
  onRefresh, 
  refreshing, 
  selectedRows, 
  bulkActions,
  onExport,
  showExport = true
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleBulkActionClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleBulkActionClose = () => {
    setAnchorEl(null);
  };

  const handleBulkAction = (action) => {
    action.onClick(selectedRows);
    handleBulkActionClose();
  };

  return (
    <GridToolbarContainer sx={{ p: 2, justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        {showExport && <GridToolbarExport />}
      </Box>
      
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {selectedRows.length > 0 && bulkActions && bulkActions.length > 0 && (
          <>
            <Chip 
              label={`${selectedRows.length} selected`} 
              size="small" 
              color="primary"
            />
            <Button
              size="small"
              startIcon={<MoreVertIcon />}
              onClick={handleBulkActionClick}
            >
              Bulk Actions
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleBulkActionClose}
            >
              {bulkActions.map((action, index) => (
                <MenuItem 
                  key={index} 
                  onClick={() => handleBulkAction(action)}
                  disabled={action.disabled}
                >
                  {action.icon && <ListItemIcon>{action.icon}</ListItemIcon>}
                  <ListItemText>{action.label}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
        
        {onExport && (
          <Tooltip title="Export">
            <IconButton size="small" onClick={onExport}>
              <ExportIcon />
            </IconButton>
          </Tooltip>
        )}
        
        <Tooltip title="Refresh">
          <IconButton 
            size="small" 
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </GridToolbarContainer>
  );
};

const TablePro = ({
  columns,
  rows = [],
  loading = false,
  error = null,
  onRetry,
  
  page = 0,
  pageSize = 25,
  rowCount = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  
  sortModel = [],
  onSortModelChange,
  
  filterModel,
  onFilterModelChange,
  
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  
  bulkActions = [],
  
  onRowClick,
  getRowId,
  
  onExport,
  showExport = true,
  
  onRefresh,
  
  emptyTitle = 'No data found',
  emptyDescription,
  emptyAction,
  
  height = 600,
  autoHeight = false,
  sx = {},
  
  ...dataGridProps
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [internalSelectedRows, setInternalSelectedRows] = useState(selectedRows);

  useEffect(() => {
    setInternalSelectedRows(selectedRows);
  }, [selectedRows]);

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  }, [onRefresh]);

  const handleSelectionChange = useCallback((newSelection) => {
    setInternalSelectedRows(newSelection);
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  }, [onSelectionChange]);

  if (error && !loading) {
    return (
      <Paper sx={{ p: 3, ...sx }}>
        <ErrorState 
          error={error}
          onRetry={onRetry || handleRefresh}
          showRetry={!!(onRetry || onRefresh)}
        />
      </Paper>
    );
  }

  if (!loading && rows.length === 0) {
    return (
      <Paper sx={{ p: 3, ...sx }}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', ...sx }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        
        pagination
        paginationMode="server"
        page={page}
        pageSize={pageSize}
        rowCount={rowCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        rowsPerPageOptions={pageSizeOptions}
        
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={onSortModelChange}
        
        filterMode="server"
        filterModel={filterModel}
        onFilterModelChange={onFilterModelChange}
        
        checkboxSelection={selectable}
        selectionModel={internalSelectedRows}
        onSelectionModelChange={handleSelectionChange}
        disableSelectionOnClick
        
        onRowClick={onRowClick}
        getRowId={getRowId}
        
        autoHeight={autoHeight}
        sx={{
          height: autoHeight ? 'auto' : height,
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-row:hover': {
            cursor: onRowClick ? 'pointer' : 'default',
          },
        }}
        
        components={{
          Toolbar: CustomToolbar,
        }}
        componentsProps={{
          toolbar: {
            onRefresh: handleRefresh,
            refreshing,
            selectedRows: internalSelectedRows,
            bulkActions,
            onExport,
            showExport,
          },
        }}
        
        disableColumnMenu={false}
        {...dataGridProps}
      />
    </Paper>
  );
};

export default TablePro;
