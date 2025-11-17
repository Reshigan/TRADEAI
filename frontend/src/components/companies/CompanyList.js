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
  Business as BusinessIcon
} from '@mui/icons-material';

import { PageHeader } from '../common';

// No more mock data - using real API calls

// Currency display mapping
const currencyDisplay = {
  'USD': '$ (USD)',
  'EUR': '€ (EUR)',
  'GBP': '£ (GBP)',
  'JPY': '¥ (JPY)',
  'CAD': 'C$ (CAD)',
  'AUD': 'A$ (AUD)',
  'BRL': 'R$ (BRL)',
  'CNY': '¥ (CNY)',
  'INR': '₹ (INR)',
  'MXN': '$ (MXN)'
};

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Filter states
  const [industryFilter, setIndustryFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  
  // Load companies data
  useEffect(() => {
    // In a real app, we would fetch data from the API
    // For now, we'll use mock data
    setLoading(true);
    
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
  
  // Handle industry filter change
  const handleIndustryFilterChange = (industry) => {
    setIndustryFilter(industry);
    handleFilterMenuClose();
  };
  
  // Handle region filter change
  const handleRegionFilterChange = (region) => {
    setRegionFilter(region);
    handleFilterMenuClose();
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    handleFilterMenuClose();
  };
  
  // Handle currency filter change
  const handleCurrencyFilterChange = (currency) => {
    setCurrencyFilter(currency);
    handleFilterMenuClose();
  };
  
  // Handle action menu open
  const handleActionMenuOpen = (event, company) => {
    setActionAnchorEl(event.currentTarget);
    setSelectedCompany(company);
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
  
  // Handle delete company
  const handleDeleteCompany = () => {
    // In a real app, we would call the API to delete the company
    setCompanies((prevCompanies) => prevCompanies.filter(company => company.id !== selectedCompany.id));
    
    setSnackbar({
      open: true,
      message: `Company ${selectedCompany.name} has been deleted`,
      severity: 'success'
    });
    
    handleDeleteDialogClose();
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar((prevSnackbar) => ({
      ...prevSnackbar,
      open: false
    }));
  };
  
  // Filter companies based on search term and filters
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.region.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = industryFilter === 'all' || company.industry === industryFilter;
    const matchesRegion = regionFilter === 'all' || company.region === regionFilter;
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    const matchesCurrency = currencyFilter === 'all' || company.currency === currencyFilter;
    
    return matchesSearch && matchesIndustry && matchesRegion && matchesStatus && matchesCurrency;
  });
  
  // Get unique industries, regions, and currencies for filters
  const industries = ['all', ...new Set(companies.map(company => company.industry))];
  const regions = ['all', ...new Set(companies.map(company => company.region))];
  const statuses = ['all', 'active', 'inactive'];
  const currencies = ['all', ...new Set(companies.map(company => company.currency))];
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  return (
    <Box>
      <PageHeader
        title="Companies"
        subtitle="Manage companies and their settings"
      />
      
      <Paper sx={{ mb: 3 }}>
        <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
          <TextField
            variant="outlined"
            margin="dense"
            placeholder="Search companies..."
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
            to="/companies/new"
            sx={{ ml: 2 }}
          >
            Add Company
          </Button>
        </Toolbar>
        
        {/* Filter chips */}
        {(industryFilter !== 'all' || regionFilter !== 'all' || statusFilter !== 'all' || currencyFilter !== 'all') && (
          <Box sx={{ px: 2, pb: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {industryFilter !== 'all' && (
              <Chip
                label={`Industry: ${industryFilter}`}
                onDelete={() => handleIndustryFilterChange('all')}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
            
            {regionFilter !== 'all' && (
              <Chip
                label={`Region: ${regionFilter}`}
                onDelete={() => handleRegionFilterChange('all')}
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
            
            {currencyFilter !== 'all' && (
              <Chip
                label={`Currency: ${currencyDisplay[currencyFilter] || currencyFilter}`}
                onDelete={() => handleCurrencyFilterChange('all')}
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
                <TableCell>Industry</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
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
              ) : filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">
                      No companies found matching the current filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((company) => (
                    <TableRow key={company.id} hover>
                      <TableCell component="th" scope="row">
                        <Link to={`/companies/${company.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
                            <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
                            {company.name}
                          </Typography>
                        </Link>
                      </TableCell>
                      <TableCell>{company.industry}</TableCell>
                      <TableCell>{company.region}</TableCell>
                      <TableCell>
                        <Chip
                          label={currencyDisplay[company.currency] || company.currency}
                          size="small"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={company.status === 'active' ? 'Active' : 'Inactive'}
                          color={company.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(company.createdAt)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            component={Link}
                            to={`/companies/${company.id}/edit`}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More actions">
                          <IconButton
                            size="small"
                            onClick={(event) => handleActionMenuOpen(event, company)}
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
          count={filteredCompanies.length}
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
          <Typography variant="subtitle2">Filter by Industry</Typography>
        </MenuItem>
        {industries.map((industry) => (
          <MenuItem
            key={`industry-${industry}`}
            onClick={() => handleIndustryFilterChange(industry)}
            selected={industryFilter === industry}
          >
            {industry === 'all' ? 'All Industries' : industry}
          </MenuItem>
        ))}
        
        <MenuItem disabled>
          <Typography variant="subtitle2">Filter by Region</Typography>
        </MenuItem>
        {regions.map((region) => (
          <MenuItem
            key={`region-${region}`}
            onClick={() => handleRegionFilterChange(region)}
            selected={regionFilter === region}
          >
            {region === 'all' ? 'All Regions' : region}
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
          <Typography variant="subtitle2">Filter by Currency</Typography>
        </MenuItem>
        {currencies.map((currency) => (
          <MenuItem
            key={`currency-${currency}`}
            onClick={() => handleCurrencyFilterChange(currency)}
            selected={currencyFilter === currency}
          >
            {currency === 'all' ? 'All Currencies' : currencyDisplay[currency] || currency}
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
          component={Link}
          to={`/companies/${selectedCompany?.id}`}
        >
          View Details
        </MenuItem>
        <MenuItem
          component={Link}
          to={`/companies/${selectedCompany?.id}/edit`}
        >
          Edit Company
        </MenuItem>
        <MenuItem
          onClick={handleDeleteDialogOpen}
          sx={{ color: 'error.main' }}
        >
          Delete Company
        </MenuItem>
      </Menu>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Delete Company</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the company "{selectedCompany?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteCompany} color="error" autoFocus>
            Delete
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

export default CompanyList;