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
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { useCompanyType } from '../../contexts/CompanyTypeContext';
import { formatLabel } from '../../utils/formatters';

const VendorManagement = () => {
  const { isDistributor } = useCompanyType();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactEmail: '',
  });

  useEffect(() => {
    if (isDistributor) {
      fetchVendors();
    }
  }, [isDistributor]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/vendors');
      setVendors(response.data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedVendor(null);
    setFormData({ name: '', code: '', contactEmail: '' });
    setDialogOpen(true);
  };

  const handleEdit = (vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      code: vendor.code,
      contactEmail: vendor.contactEmail || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedVendor) {
        await apiClient.put(`/vendors/${selectedVendor.id || selectedVendor._id}`, formData);
      } else {
        await apiClient.post('/vendors', formData);
      }
      setDialogOpen(false);
      fetchVendors();
    } catch (error) {
      console.error('Error saving vendor:', error);
    }
  };

  if (!isDistributor) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Vendor management is only available for distributor companies.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading vendors...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          🏭 Vendor Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Vendor
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Manage your manufacturer/vendor relationships. Track funding, terms, and wallets per vendor.
        </Typography>
      </Alert>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Vendor Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No vendors yet. Click "Add Vendor" to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  vendors.map((vendor) => (
                    <TableRow key={vendor.id || vendor._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                          {vendor.name}
                        </Box>
                      </TableCell>
                      <TableCell>{vendor.code}</TableCell>
                      <TableCell>{vendor.contactEmail || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={formatLabel(vendor.status || 'active')}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleEdit(vendor)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedVendor ? 'Edit Vendor' : 'Add Vendor'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Vendor Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Vendor Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              fullWidth
              required
            />
            <TextField
              label="Contact Email"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorManagement;
