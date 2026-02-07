import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Event as EventIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  History as HistoryIcon
} from '@mui/icons-material';

import { PageHeader } from '../common';
import { formatLabel } from '../../utils/formatters';

// Mock data for development



const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [loginHistory] = useState([]);
  const [activityHistory] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Load user data
  useEffect(() => {
    // In a real app, we would fetch data from the API
    // For now, we'll use mock data
    setLoading(true);
    
  }, [id]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle delete dialog open
  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
  };
  
  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };
  
  // Handle status dialog open
  const handleStatusDialogOpen = () => {
    setStatusDialogOpen(true);
  };
  
  // Handle status dialog close
  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false);
  };
  
  // Handle reset password dialog open
  const handleResetPasswordDialogOpen = () => {
    setResetPasswordDialogOpen(true);
  };
  
  // Handle reset password dialog close
  const handleResetPasswordDialogClose = () => {
    setResetPasswordDialogOpen(false);
  };
  
  // Handle delete user
  const handleDeleteUser = () => {
    // In a real app, we would call the API to delete the user
    setSnackbar({
      open: true,
      message: `User ${user.name} has been deleted`,
      severity: 'success'
    });
    
    handleDeleteDialogClose();
    
    // Navigate back to user list after successful delete
    setTimeout(() => {
      navigate('/users');
    }, 1500);
  };
  
  // Handle toggle user status
  const handleToggleUserStatus = () => {
    // In a real app, we would call the API to toggle the user status
    setUser((prevUser) => ({
      ...prevUser,
      status: prevUser.status === 'active' ? 'inactive' : 'active'
    }));
    
    setSnackbar({
      open: true,
      message: `User ${user.name} has been ${user.status === 'active' ? 'deactivated' : 'activated'}`,
      severity: 'success'
    });
    
    handleStatusDialogClose();
  };
  
  // Handle reset password
  const handleResetPassword = () => {
    // In a real app, we would call the API to reset the password
    setSnackbar({
      open: true,
      message: `Password reset email has been sent to ${user.email}`,
      severity: 'success'
    });
    
    handleResetPasswordDialogClose();
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar((prevSnackbar) => ({
      ...prevSnackbar,
      open: false
    }));
  };
  
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
  
  // Group permissions by category
  const groupPermissions = (permissions) => {
    const groups = {
      budgets: [],
      trade_spends: [],
      promotions: [],
      customers: [],
      products: [],
      analytics: [],
      other: []
    };
    
    permissions.forEach(permission => {
      const [action, entity] = permission.split('_');
      
      if (groups[entity]) {
        groups[entity].push(action);
      } else {
        groups.other.push(permission);
      }
    });
    
    return groups;
  };
  
  return (
    <Box>
      <PageHeader
        title="User Details"
        subtitle="View and manage user information"
      />
      
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          component={Link}
          to="/users"
        >
          Back to Users
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar
                    alt={user.name}
                    src="/static/images/avatar/1.jpg"
                    sx={{ width: 120, height: 120 }}
                  />
                  
                  <Typography variant="h5" sx={{ mt: 2 }}>
                    {user.name}
                  </Typography>
                  
                  <Chip
                    label={user.role}
                    color={
                      user.role === 'Administrator' ? 'error' :
                      user.role === 'Manager' ? 'warning' :
                      user.role === 'Analyst' ? 'info' : 'default'
                    }
                    sx={{ mt: 1 }}
                  />
                  
                  <Chip
                    label={user.status === 'active' ? 'Active' : 'Inactive'}
                    color={user.status === 'active' ? 'success' : 'default'}
                    sx={{ mt: 1 }}
                  />
                  
                  <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      component={Link}
                      to={`/users/${id}/edit`}
                      fullWidth
                    >
                      Edit User
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color={user.status === 'active' ? 'warning' : 'success'}
                      startIcon={user.status === 'active' ? <LockIcon /> : <LockOpenIcon />}
                      onClick={handleStatusDialogOpen}
                      fullWidth
                    >
                      {user.status === 'active' ? 'Deactivate User' : 'Activate User'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color="info"
                      startIcon={<RefreshIcon />}
                      onClick={handleResetPasswordDialogOpen}
                      fullWidth
                    >
                      Reset Password
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteDialogOpen}
                      fullWidth
                    >
                      Delete User
                    </Button>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    User Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email"
                        secondary={user.email}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Phone"
                        secondary={user.phone || 'Not provided'}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <BusinessIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Department"
                        secondary={user.department}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <WorkIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Role"
                        secondary={user.role}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <EventIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Last Login"
                        secondary={formatDate(user.lastLogin)}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <HistoryIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Account Created"
                        secondary={formatDate(user.createdAt)}
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </Box>
          </Paper>
          
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Permissions" />
              <Tab label="Login History" />
              <Tab label="Activity Log" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    User Permissions
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={3}>
                    {Object.entries(groupPermissions(user.permissions)).map(([category, actions]) => {
                      if (actions.length === 0) return null;
                      
                      return (
                        <Grid item xs={12} sm={6} md={4} key={category}>
                          <Card variant="outlined">
                            <CardHeader
                              title={formatLabel(category)}
                              avatar={<SecurityIcon />}
                            />
                            <CardContent>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {actions.map(action => (
                                  <Chip
                                    key={`${action}_${category}`}
                                    label={action}
                                    color={
                                      action === 'view' ? 'info' :
                                      action === 'edit' ? 'warning' :
                                      action === 'create' ? 'success' :
                                      action === 'delete' ? 'error' : 'default'
                                    }
                                    size="small"
                                  />
                                ))}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}
              
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Login History
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date & Time</TableCell>
                          <TableCell>IP Address</TableCell>
                          <TableCell>Device</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(loginHistory || []).map((login) => (
                          <TableRow key={login.id} hover>
                            <TableCell>{formatDate(login.timestamp)}</TableCell>
                            <TableCell>{login.ipAddress}</TableCell>
                            <TableCell>{login.device}</TableCell>
                            <TableCell>
                              <Chip
                                label={login.status === 'success' ? 'Success' : 'Failed'}
                                color={login.status === 'success' ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
              
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Activity Log
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date & Time</TableCell>
                          <TableCell>Action</TableCell>
                          <TableCell>Details</TableCell>
                          <TableCell>Entity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(activityHistory || []).map((activity) => (
                          <TableRow key={activity.id} hover>
                            <TableCell>{formatDate(activity.timestamp)}</TableCell>
                            <TableCell>{activity.action}</TableCell>
                            <TableCell>{activity.details}</TableCell>
                            <TableCell>
                              {activity.entityId ? (
                                <Link to={`/${activity.entity.toLowerCase()}s/${activity.entityId}`}>
                                  {activity.entity}
                                </Link>
                              ) : (
                                activity.entity
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          </Paper>
          
          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={handleDeleteDialogClose}
          >
            <DialogTitle>Delete User</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete the user "{user.name}"? This action cannot be undone.
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
              {user.status === 'active' ? 'Deactivate User' : 'Activate User'}
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                {user.status === 'active'
                  ? `Are you sure you want to deactivate the user "${user.name}"? They will no longer be able to access the system.`
                  : `Are you sure you want to activate the user "${user.name}"? They will be able to access the system again.`
                }
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleStatusDialogClose}>Cancel</Button>
              <Button
                onClick={handleToggleUserStatus}
                color={user.status === 'active' ? 'warning' : 'success'}
                autoFocus
              >
                {user.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Reset Password Dialog */}
          <Dialog
            open={resetPasswordDialogOpen}
            onClose={handleResetPasswordDialogClose}
          >
            <DialogTitle>Reset Password</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to reset the password for "{user.name}"? A password reset email will be sent to {user.email}.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleResetPasswordDialogClose}>Cancel</Button>
              <Button onClick={handleResetPassword} color="primary" autoFocus>
                Reset Password
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
      
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

export default UserDetail;
