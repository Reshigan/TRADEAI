import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';

import { PageHeader } from '../common';
import { userService } from '../../services/api';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Filter states
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  // Load users data
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await userService.getAll();
        const data = response.data || response || [];
        setUsers(Array.isArray(data) ? data.map(u => ({
          id: u.id,
          name: u.name || u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
          email: u.email,
          role: u.role || 'Viewer',
          department: u.department || 'General',
          status: u.status || 'active',
          lastLogin: u.last_login || u.updated_at || u.created_at
        })) : []);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };
  
  // Handle filter menu open
  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  // Handle filter menu close
  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };
  
  // Handle role filter change
  const handleRoleFilterChange = (role) => {
    setRoleFilter(role);
    handleFilterMenuClose();
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    handleFilterMenuClose();
  };
  
  // Handle department filter change
  const handleDepartmentFilterChange = (department) => {
    setDepartmentFilter(department);
    handleFilterMenuClose();
  };
  
  // Handle action menu open
  const handleActionMenuOpen = (event, user) => {
    setActionAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };
  
  // Handle action menu close
  const handleActionMenuClose = () => {
    setActionAnchorEl(null);
  };
  
  // Handle delete dialog open
  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };
  
  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };
  
  // Handle status dialog open
  const handleStatusDialogOpen = () => {
    setStatusDialogOpen(true);
    handleActionMenuClose();
  };
  
  // Handle status dialog close
  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false);
  };
  
  // Handle delete user
  const handleDeleteUser = async () => {
    try {
      await userService.delete(selectedUser.id);
      setUsers((prevUsers) => prevUsers.filter(user => user.id !== selectedUser.id));
      setSnackbar({
        open: true,
        message: `User ${selectedUser.name} has been deleted`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to delete user:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete user',
        severity: 'error'
      });
    }
    handleDeleteDialogClose();
  };
  
  // Handle toggle user status
  const handleToggleUserStatus = async () => {
    const newStatus = selectedUser.status === 'active' ? 'inactive' : 'active';
    try {
      await userService.update(selectedUser.id, { status: newStatus });
      setUsers((prevUsers) =>
        prevUsers.map(user =>
          user.id === selectedUser.id
            ? { ...user, status: newStatus }
            : user
        )
      );
      setSnackbar({
        open: true,
        message: `User ${selectedUser.name} has been ${selectedUser.status === 'active' ? 'deactivated' : 'activated'}`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to update user status:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update user status',
        severity: 'error'
      });
    }
    handleStatusDialogClose();
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar((prevSnackbar) => ({
      ...prevSnackbar,
      open: false
    }));
  };
  
  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
    
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });
  
  // Get unique roles, statuses, and departments for filters
  const roles = ['all', ...new Set(users.map(user => user.role))];
  const statuses = ['all', ...new Set(users.map(user => user.status))];
  const departments = ['all', ...new Set(users.map(user => user.department))];
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <Box>
      <PageHeader
        title="User Management"
        subtitle="Manage system users, roles, and permissions"
      />
      
      <Paper sx={{ mb: 3 }}>
        <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
          <TextField
            variant="outlined"
            margin="dense"
            placeholder="Search users..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mr: 2, flexGrow: 1 }}
            value={searchTerm}
            onChange={handleSearch}
          />
          
          <Tooltip title="Filter list">
            <IconButton onClick={handleFilterMenuOpen}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            to="/users/new"
            sx={{ ml: 2 }}
          >
            Add User
          </Button>
        </Toolbar>
        
        {/* Filter chips */}
        {(roleFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all') && (
          <Box sx={{ px: 2, pb: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {roleFilter !== 'all' && (
              <Chip
                label={`Role: ${roleFilter}`}
                onDelete={() => handleRoleFilterChange('all')}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
            
            {statusFilter !== 'all' && (
              <Chip
                label={`Status: ${statusFilter}`}
                onDelete={() => handleStatusFilterChange('all')}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
            
            {departmentFilter !== 'all' && (
              <Chip
                label={`Department: ${departmentFilter}`}
                onDelete={() => handleDepartmentFilterChange('all')}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
          </Box>
        )}
        
        <TableContainer>
          <Table sx={{ minWidth: 750 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">
                      No users found matching the current filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell component="th" scope="row">
                        <Link to={`/users/${user.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {user.name}
                          </Typography>
                        </Link>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={
                            user.role === 'Administrator' ? 'error' :
                            user.role === 'Manager' ? 'warning' :
                            user.role === 'Analyst' ? 'info' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.status === 'active' ? 'Active' : 'Inactive'}
                          color={user.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.lastLogin)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            component={Link}
                            to={`/users/${user.id}/edit`}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More actions">
                          <IconButton
                            size="small"
                            onClick={(event) => handleActionMenuOpen(event, user)}
                          >
                            <MoreVertIcon fontSize="small" />
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
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterMenuClose}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">Filter by Role</Typography>
        </MenuItem>
        {roles.map((role) => (
          <MenuItem
            key={`role-${role}`}
            onClick={() => handleRoleFilterChange(role)}
            selected={roleFilter === role}
          >
            {role === 'all' ? 'All Roles' : role}
          </MenuItem>
        ))}
        
        <MenuItem disabled>
          <Typography variant="subtitle2">Filter by Status</Typography>
        </MenuItem>
        {statuses.map((status) => (
          <MenuItem
            key={`status-${status}`}
            onClick={() => handleStatusFilterChange(status)}
            selected={statusFilter === status}
          >
            {status === 'all' ? 'All Statuses' : status === 'active' ? 'Active' : 'Inactive'}
          </MenuItem>
        ))}
        
        <MenuItem disabled>
          <Typography variant="subtitle2">Filter by Department</Typography>
        </MenuItem>
        {departments.map((department) => (
          <MenuItem
            key={`department-${department}`}
            onClick={() => handleDepartmentFilterChange(department)}
            selected={departmentFilter === department}
          >
            {department === 'all' ? 'All Departments' : department}
          </MenuItem>
        ))}
      </Menu>
      
      {/* Action Menu */}
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={handleActionMenuClose}
      >
        <MenuItem
          onClick={handleStatusDialogOpen}
        >
          {selectedUser?.status === 'active' ? (
            <>
              <LockIcon fontSize="small" sx={{ mr: 1 }} />
              Deactivate User
            </>
          ) : (
            <>
              <LockOpenIcon fontSize="small" sx={{ mr: 1 }} />
              Activate User
            </>
          )}
        </MenuItem>
        <MenuItem
          onClick={handleDeleteDialogOpen}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete User
        </MenuItem>
      </Menu>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user "{selectedUser?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Status Change Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={handleStatusDialogClose}
      >
        <DialogTitle>
          {selectedUser?.status === 'active' ? 'Deactivate User' : 'Activate User'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedUser?.status === 'active'
              ? `Are you sure you want to deactivate the user "${selectedUser?.name}"? They will no longer be able to access the system.`
              : `Are you sure you want to activate the user "${selectedUser?.name}"? They will be able to access the system again.`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose}>Cancel</Button>
          <Button
            onClick={handleToggleUserStatus}
            color={selectedUser?.status === 'active' ? 'warning' : 'success'}
            autoFocus
          >
            {selectedUser?.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserList;
