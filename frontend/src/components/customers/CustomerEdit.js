import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Box,
  MenuItem,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { formatLabel } from '../../utils/formatters';


const getCurrencySymbol = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.company && user.company.currency) {
        const currencyMap = {
          'USD': '$', 'EUR': '€', 'GBP': '£', 'ZAR': 'R', 'AUD': 'A$',
          'CAD': 'C$', 'JPY': '¥', 'CNY': '¥', 'INR': '₹'
        };
        return currencyMap[user.company.currency] || 'R';
      }
    }
  } catch (error) {
    console.warn('Error getting currency symbol:', error);
  }
  return 'R';
};

const CustomerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [customer, setCustomer] = useState({
    name: '',
    code: '',
    type: 'Retailer',
    status: 'active',
    email: '',
    phone: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    },
    contacts: [],
    paymentTerms: 'Net 30',
    creditLimit: 0,
    taxId: '',
    notes: ''
  });

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/customers/${id}`);
      setCustomer({
        ...response.data,
        address: response.data.address || {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: 'USA'
        },
        contacts: response.data.contacts || []
      });
    } catch (err) {
      setError('Error loading customer: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setCustomer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field, value) => {
    setCustomer(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleContactChange = (index, field, value) => {
    const newContacts = [...customer.contacts];
    newContacts[index] = {
      ...newContacts[index],
      [field]: value
    };
    setCustomer(prev => ({
      ...prev,
      contacts: newContacts
    }));
  };

  const addContact = () => {
    setCustomer(prev => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          name: '',
          title: '',
          email: '',
          phone: '',
          isPrimary: false
        }
      ]
    }));
  };

  const removeContact = (index) => {
    setCustomer(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!customer.name || !customer.code) {
        setError('Name and code are required');
        return;
      }

      setSaving(true);
      setError('');

      await apiClient.put(`/customers/${id}`, customer);
      
      setSuccess('Customer updated successfully!');
      setTimeout(() => {
        navigate(`/customers/${id}`);
      }, 1500);
    } catch (err) {
      setError('Error updating customer: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Container>
    );
  }

  const customerTypes = ['Retailer', 'Wholesaler', 'Distributor', 'Direct', 'E-commerce'];
  const statusOptions = ['active', 'inactive', 'pending'];
  const paymentTermsOptions = ['Net 30', 'Net 60', 'Net 90', 'Due on Receipt', 'COD'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Edit Customer
          </Typography>
          <Chip 
            label={customer.status || 'Active'} 
            color={customer.status === 'active' ? 'success' : customer.status === 'inactive' ? 'error' : 'warning'}
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Customer Name"
              value={customer.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Customer Code"
              value={customer.code}
              onChange={(e) => handleChange('code', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Customer Type"
              value={customer.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {customerTypes.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Status"
              value={customer.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              {statusOptions.map(status => (
                <MenuItem key={status} value={status}>
                  {formatLabel(status)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Contact Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={customer.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Phone"
              value={customer.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Website"
              value={customer.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
            />
          </Grid>

          {/* Address */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Address
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address"
              value={customer.address.street}
              onChange={(e) => handleAddressChange('street', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="City"
              value={customer.address.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="State"
              value={customer.address.state}
              onChange={(e) => handleAddressChange('state', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="ZIP Code"
              value={customer.address.zip}
              onChange={(e) => handleAddressChange('zip', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Country"
              value={customer.address.country}
              onChange={(e) => handleAddressChange('country', e.target.value)}
            />
          </Grid>

          {/* Financial Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Financial Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Payment Terms"
              value={customer.paymentTerms}
              onChange={(e) => handleChange('paymentTerms', e.target.value)}
            >
              {paymentTermsOptions.map(term => (
                <MenuItem key={term} value={term}>{term}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Credit Limit"
              value={customer.creditLimit || 0}
              onChange={(e) => handleChange('creditLimit', parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: getCurrencySymbol()
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Tax ID"
              value={customer.taxId || ''}
              onChange={(e) => handleChange('taxId', e.target.value)}
            />
          </Grid>

          {/* Contacts */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 2 }}>
              <Typography variant="h6">
                Contacts
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addContact}
              >
                Add Contact
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customer.contacts.map((contact, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={contact.name || ''}
                          onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={contact.title || ''}
                          onChange={(e) => handleContactChange(index, 'title', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          type="email"
                          value={contact.email || ''}
                          onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={contact.phone || ''}
                          onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => removeContact(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Notes
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes"
              value={customer.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional notes or comments..."
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => navigate(`/customers/${id}`)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default CustomerEdit;
