import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Menu,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Download,
  Upload,
  MoreVert,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Visibility
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../../services/api';

export default function TransactionManagement() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);


  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/transactions', { params: filters });
      setTransactions(response.data.transactions || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    try {
      await api.post('/transactions/bulk/approve', { ids: selectedRows });
      loadTransactions();
      setSelectedRows([]);
    } catch (err) {
      console.error('Bulk approve failed:', err);
    }
  };

  const handleBulkReject = async () => {
    try {
      await api.post('/transactions/bulk/reject', { ids: selectedRows });
      loadTransactions();
      setSelectedRows([]);
    } catch (err) {
      console.error('Bulk reject failed:', err);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/transactions/export', {
        params: { ...filters, format: 'excel' },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${new Date().toISOString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleEdit = (transaction) => {
    setCurrentTransaction(transaction);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.delete(`/transactions/${id}`);
        loadTransactions();
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const columns = [
    {
      field: 'transactionDate',
      headerName: 'Date',
      width: 120,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'transactionNumber',
      headerName: 'Transaction #',
      width: 150
    },
    {
      field: 'customer',
      headerName: 'Customer',
      width: 200,
      valueGetter: (params) => params.row.customer?.name || 'N/A'
    },
    {
      field: 'product',
      headerName: 'Product',
      width: 200,
      valueGetter: (params) => params.row.product?.name || 'N/A'
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'sale' ? 'success' :
            params.value === 'return' ? 'warning' :
            'default'
          }
        />
      )
    },
    {
      field: 'quantity',
      headerName: 'Quantity',
      width: 100,
      type: 'number',
      valueFormatter: (params) => params.value.toLocaleString()
    },
    {
      field: 'unitPrice',
      headerName: 'Unit Price',
      width: 120,
      type: 'number',
      valueFormatter: (params) => `R ${params.value.toFixed(2)}`
    },
    {
      field: 'totalAmount',
      headerName: 'Total Amount',
      width: 140,
      type: 'number',
      valueFormatter: (params) => `R ${params.value.toLocaleString()}`
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'approved' ? 'success' :
            params.value === 'pending' ? 'warning' :
            params.value === 'rejected' ? 'error' :
            'default'
          }
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => handleView(params.row)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEdit(params.row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDelete(params.row._id)}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const handleView = (transaction) => {
    // Navigate to detail view
    console.log('View transaction:', transaction);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            Transaction Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage, approve, and analyze all transactions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<Upload />}
          >
            Import
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setCurrentTransaction(null);
              setOpenDialog(true);
            }}
          >
            New Transaction
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="sale">Sale</MenuItem>
                <MenuItem value="return">Return</MenuItem>
                <MenuItem value="adjustment">Adjustment</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From Date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To Date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
            >
              Filter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Bulk Actions */}
      {selectedRows.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body1">
              {selectedRows.length} transaction(s) selected
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                color="success"
                startIcon={<CheckCircle />}
                onClick={handleBulkApprove}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                size="small"
                color="error"
                startIcon={<Cancel />}
                onClick={handleBulkReject}
              >
                Reject
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Download />}
              >
                Export Selected
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Data Grid */}
      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={transactions}
          columns={columns}
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
          checkboxSelection
          disableSelectionOnClick
          loading={loading}
          onSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
          getRowId={(row) => row._id}
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none'
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        />
      </Paper>

      {/* Transaction Dialog (Create/Edit) */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentTransaction ? 'Edit Transaction' : 'New Transaction'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Transaction form will be implemented here with full validation
          </Alert>
          {/* TODO: Implement transaction form */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained">
            {currentTransaction ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
