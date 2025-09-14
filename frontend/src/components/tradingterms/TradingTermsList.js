import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Menu,
  MenuItem as MenuItemComponent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Send as SubmitIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { tradingTermsService } from '../../services/tradingTermsService';
import TradingTermForm from './TradingTermForm';
import TradingTermDetail from './TradingTermDetail';

const TradingTermsList = () => {
  const { user } = useAuth();
  const [tradingTerms, setTradingTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [termType, setTermType] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  
  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuTerm, setMenuTerm] = useState(null);
  
  // Options
  const [termOptions, setTermOptions] = useState({});

  useEffect(() => {
    loadTradingTerms();
    loadTermOptions();
  }, [page, rowsPerPage, search, termType, status, priority]);

  const loadTradingTerms = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search,
        termType,
        status,
        priority
      };
      
      const response = await tradingTermsService.getTradingTerms(params);
      setTradingTerms(response.data.tradingTerms);
      setTotalCount(response.data.pagination.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTermOptions = async () => {
    try {
      const response = await tradingTermsService.getTradingTermOptions();
      setTermOptions(response.data);
    } catch (err) {
      console.error('Failed to load term options:', err);
    }
  };

  const handleMenuOpen = (event, term) => {
    setAnchorEl(event.currentTarget);
    setMenuTerm(term);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTerm(null);
  };

  const handleView = (term) => {
    setSelectedTerm(term);
    setDetailOpen(true);
    handleMenuClose();
  };

  const handleEdit = (term) => {
    setSelectedTerm(term);
    setFormOpen(true);
    handleMenuClose();
  };

  const handleDelete = (term) => {
    setSelectedTerm(term);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleSubmitForApproval = async (term) => {
    try {
      await tradingTermsService.submitForApproval(term._id);
      loadTradingTerms();
      handleMenuClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApprovalAction = (term, action) => {
    setSelectedTerm(term);
    setApprovalAction(action);
    setApprovalDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    try {
      await tradingTermsService.deleteTradingTerm(selectedTerm._id);
      loadTradingTerms();
      setDeleteDialogOpen(false);
      setSelectedTerm(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmApproval = async () => {
    try {
      await tradingTermsService.approveRejectTradingTerm(selectedTerm._id, {
        action: approvalAction,
        notes: approvalNotes
      });
      loadTradingTerms();
      setApprovalDialogOpen(false);
      setSelectedTerm(null);
      setApprovalNotes('');
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      pending_approval: 'warning',
      approved: 'success',
      rejected: 'error',
      expired: 'secondary',
      suspended: 'error'
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'success',
      medium: 'info',
      high: 'warning',
      critical: 'error'
    };
    return colors[priority] || 'default';
  };

  const canEdit = (term) => {
    return user?.hasPermission && user.hasPermission('tradingterms', 'write') && 
           (term.approvalWorkflow.status === 'draft' || 
            term.approvalWorkflow.status === 'rejected');
  };

  const canDelete = (term) => {
    return user?.hasPermission && user.hasPermission('tradingterms', 'delete') && 
           term.approvalWorkflow.status !== 'approved';
  };

  const canSubmitForApproval = (term) => {
    return term.approvalWorkflow.status === 'draft';
  };

  const canApprove = (term) => {
    return user?.hasPermission && user.hasPermission('tradingterms', 'approve') && 
           term.approvalWorkflow.status === 'pending_approval';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Trading Terms
        </Typography>
        {user?.hasPermission && user.hasPermission('tradingterms', 'write') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedTerm(null);
              setFormOpen(true);
            }}
          >
            Add Trading Term
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Term Type</InputLabel>
                <Select
                  value={termType}
                  onChange={(e) => setTermType(e.target.value)}
                  label="Term Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {termOptions.termTypes?.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {termOptions.statuses?.map((stat) => (
                    <MenuItem key={stat.value} value={stat.value}>
                      {stat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  {termOptions.priorities?.map((prio) => (
                    <MenuItem key={prio.value} value={prio.value}>
                      {prio.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  setSearch('');
                  setTermType('');
                  setStatus('');
                  setPriority('');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Trading Terms Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Valid From</TableCell>
                <TableCell>Valid To</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : tradingTerms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No trading terms found
                  </TableCell>
                </TableRow>
              ) : (
                tradingTerms.map((term) => (
                  <TableRow key={term._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {term.name}
                      </Typography>
                      {term.description && (
                        <Typography variant="body2" color="text.secondary">
                          {term.description.substring(0, 50)}...
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {term.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={termOptions.termTypes?.find(t => t.value === term.termType)?.label || term.termType}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={termOptions.statuses?.find(s => s.value === term.approvalWorkflow.status)?.label || term.approvalWorkflow.status}
                        size="small"
                        color={getStatusColor(term.approvalWorkflow.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={term.priority}
                        size="small"
                        color={getPriorityColor(term.priority)}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(term.validityPeriod.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(term.validityPeriod.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, term)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItemComponent onClick={() => handleView(menuTerm)}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItemComponent>
        
        {canEdit(menuTerm) && (
          <MenuItemComponent onClick={() => handleEdit(menuTerm)}>
            <EditIcon sx={{ mr: 1 }} />
            Edit
          </MenuItemComponent>
        )}
        
        {canSubmitForApproval(menuTerm) && (
          <MenuItemComponent onClick={() => handleSubmitForApproval(menuTerm)}>
            <SubmitIcon sx={{ mr: 1 }} />
            Submit for Approval
          </MenuItemComponent>
        )}
        
        {canApprove(menuTerm) && (
          <>
            <MenuItemComponent onClick={() => handleApprovalAction(menuTerm, 'approve')}>
              <ApproveIcon sx={{ mr: 1 }} />
              Approve
            </MenuItemComponent>
            <MenuItemComponent onClick={() => handleApprovalAction(menuTerm, 'reject')}>
              <RejectIcon sx={{ mr: 1 }} />
              Reject
            </MenuItemComponent>
          </>
        )}
        
        {canDelete(menuTerm) && (
          <MenuItemComponent onClick={() => handleDelete(menuTerm)} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete
          </MenuItemComponent>
        )}
      </Menu>

      {/* Trading Term Form Dialog */}
      {formOpen && (
        <TradingTermForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setSelectedTerm(null);
          }}
          term={selectedTerm}
          onSave={() => {
            loadTradingTerms();
            setFormOpen(false);
            setSelectedTerm(null);
          }}
        />
      )}

      {/* Trading Term Detail Dialog */}
      {detailOpen && (
        <TradingTermDetail
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setSelectedTerm(null);
          }}
          term={selectedTerm}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the trading term "{selectedTerm?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)}>
        <DialogTitle>
          {approvalAction === 'approve' ? 'Approve' : 'Reject'} Trading Term
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {approvalAction === 'approve' 
              ? `Are you sure you want to approve "${selectedTerm?.name}"?`
              : `Are you sure you want to reject "${selectedTerm?.name}"?`
            }
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (optional)"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmApproval} 
            color={approvalAction === 'approve' ? 'success' : 'error'}
            variant="contained"
          >
            {approvalAction === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TradingTermsList;