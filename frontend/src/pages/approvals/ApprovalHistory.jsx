/**
 * Approval History Page
 * Shows historical approval records with sorting and pagination
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search,
  CheckCircle,
  Cancel,
  Visibility,
  History,
  ThumbUp,
  ThumbDown
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ApprovalHistory = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Sorting and pagination state
  const [orderBy, setOrderBy] = useState('completedAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchApprovals = async () => {
      setLoading(true);
      try {
        const response = await api.get('/approvals?status=approved,rejected');
        const data = response.data;
        
        // Transform API data to match component format
        const transformedApprovals = (data.approvals || data || []).map((approval, index) => ({
          _id: approval._id || index.toString(),
          type: approval.type || approval.approvalType || 'promotion',
          title: approval.title || approval.name || `Approval #${index + 1}`,
          requestedBy: approval.requestedBy?.name || approval.createdBy?.name || 'Unknown',
          approvedBy: approval.approvedBy?.name || approval.reviewedBy?.name || null,
          status: approval.status || 'approved',
          createdAt: approval.createdAt || new Date().toISOString(),
          completedAt: approval.completedAt || approval.updatedAt || new Date().toISOString(),
          rejectionReason: approval.rejectionReason || approval.comments || null
        }));
        
        setApprovals(transformedApprovals);
      } catch (error) {
        console.error('Error fetching approval history:', error);
        enqueueSnackbar('Failed to load approval history', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchApprovals();
  }, [enqueueSnackbar]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'promotion': return 'primary';
      case 'tradespend': return 'secondary';
      case 'claim': return 'warning';
      case 'budget': return 'info';
      default: return 'default';
    }
  };

  // Sorting handler
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredApprovals = approvals
    .filter(approval => {
      const matchesSearch = approval.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           approval.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !typeFilter || approval.type === typeFilter;
      const matchesStatus = !statusFilter || approval.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      if (orderBy === 'completedAt' || orderBy === 'createdAt') {
        return order === 'asc' 
          ? new Date(a[orderBy]) - new Date(b[orderBy])
          : new Date(b[orderBy]) - new Date(a[orderBy]);
      }
      const aVal = a[orderBy] || '';
      const bVal = b[orderBy] || '';
      if (typeof aVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const paginatedApprovals = filteredApprovals.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Summary stats
  const approvedCount = approvals.filter(a => a.status === 'approved').length;
  const rejectedCount = approvals.filter(a => a.status === 'rejected').length;

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="/dashboard">Home</Link>
        <Link color="inherit" href="/approvals">Approvals</Link>
        <Typography color="text.primary">History</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Approval History
        </Typography>
        <Typography variant="body2" color="textSecondary">
          View past approval decisions and audit trail
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <History color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">{approvals.length}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Decisions</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ThumbUp color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">{approvedCount}</Typography>
                  <Typography variant="body2" color="textSecondary">Approved</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ThumbDown color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">{rejectedCount}</Typography>
                  <Typography variant="body2" color="textSecondary">Rejected</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by title or requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="promotion">Promotion</MenuItem>
                <MenuItem value="tradespend">Trade Spend</MenuItem>
                <MenuItem value="claim">Claim</MenuItem>
                <MenuItem value="budget">Budget</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'title'}
                    direction={orderBy === 'title' ? order : 'asc'}
                    onClick={() => handleSort('title')}
                  >
                    Title
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'requestedBy'}
                    direction={orderBy === 'requestedBy' ? order : 'asc'}
                    onClick={() => handleSort('requestedBy')}
                  >
                    Requested By
                  </TableSortLabel>
                </TableCell>
                <TableCell>Decided By</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'createdAt'}
                    direction={orderBy === 'createdAt' ? order : 'asc'}
                    onClick={() => handleSort('createdAt')}
                  >
                    Requested
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'completedAt'}
                    direction={orderBy === 'completedAt' ? order : 'asc'}
                    onClick={() => handleSort('completedAt')}
                  >
                    Completed
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedApprovals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary" py={4}>
                      {searchTerm || typeFilter || statusFilter ? 'No approvals match your filters' : 'No approval history found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedApprovals.map((approval) => (
                  <TableRow key={approval._id} hover>
                    <TableCell>
                      <Chip 
                        label={approval.type} 
                        size="small" 
                        color={getTypeColor(approval.type)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{approval.title}</Typography>
                      {approval.rejectionReason && (
                        <Typography variant="caption" color="error">
                          Reason: {approval.rejectionReason}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{approval.requestedBy}</TableCell>
                    <TableCell>{approval.approvedBy || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        icon={approval.status === 'approved' ? <CheckCircle /> : <Cancel />}
                        label={approval.status}
                        size="small"
                        color={approval.status === 'approved' ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>{formatDate(approval.createdAt)}</TableCell>
                    <TableCell>{formatDate(approval.completedAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/approvals/${approval._id}`)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredApprovals.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>
    </Container>
  );
};

export default ApprovalHistory;
