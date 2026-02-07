import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as RegionIcon,
  LocationCity as DistrictIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../services/api/apiClient';
import { formatLabel } from '../../utils/formatters';

const HierarchyManager = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [dialogType, setDialogType] = useState('region'); // 'region', 'district', 'store'
  const [formData, setFormData] = useState({});


  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 0) {
        const response = await apiClient.get('/hierarchy/regions');
        setRegions(response.data.data || []);
      } else if (activeTab === 1) {
        const response = await apiClient.get('/hierarchy/districts');
        setDistricts(response.data.data || []);
      } else if (activeTab === 2) {
        const response = await apiClient.get('/hierarchy/stores');
        setStores(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode, type, item = null) => {
    setDialogMode(mode);
    setDialogType(type);
    if (item) {
      setFormData(item);
    } else {
      setFormData({});
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({});
  };

  const handleSave = async () => {
    try {
      const endpoint = `/hierarchy/${dialogType}s`;
      if (dialogMode === 'create') {
        await apiClient.post(endpoint, formData);
        toast.success(`${formatLabel(dialogType)} created successfully`);
      } else {
        await apiClient.put(`${endpoint}/${formData.id || formData._id}`, formData);
        toast.success(`${formatLabel(dialogType)} updated successfully`);
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }
    try {
      await apiClient.delete(`/hierarchy/${type}s/${id}`);
      toast.success(`${formatLabel(type)} deleted successfully`);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  const renderRegionsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Country</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {regions.map((region) => (
            <TableRow key={region.id || region._id}>
              <TableCell>{region.code}</TableCell>
              <TableCell>{region.name}</TableCell>
              <TableCell>{region.country}</TableCell>
              <TableCell>
                <Chip
                  label={region.isActive ? 'Active' : 'Inactive'}
                  color={region.isActive ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog('edit', 'region', region)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete('region', region._id)}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderDistrictsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Region</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {districts.map((district) => (
            <TableRow key={district.id || district._id}>
              <TableCell>{district.code}</TableCell>
              <TableCell>{district.name}</TableCell>
              <TableCell>{district.region?.name || 'N/A'}</TableCell>
              <TableCell>
                <Chip
                  label={district.isActive ? 'Active' : 'Inactive'}
                  color={district.isActive ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog('edit', 'district', district)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete('district', district._id)}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderStoresTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Store Code</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>District</TableCell>
            <TableCell>Region</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stores.map((store) => (
            <TableRow key={store.id || store._id}>
              <TableCell>{store.storeCode}</TableCell>
              <TableCell>{store.name}</TableCell>
              <TableCell>{store.district?.name || 'N/A'}</TableCell>
              <TableCell>{store.region?.name || 'N/A'}</TableCell>
              <TableCell>{store.storeType}</TableCell>
              <TableCell>
                <Chip
                  label={store.isActive ? 'Active' : 'Inactive'}
                  color={store.isActive ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog('edit', 'store', store)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete('store', store._id)}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderDialog = () => (
    <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle>
        {dialogMode === 'create' ? 'Create' : 'Edit'} {formatLabel(dialogType)}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {dialogType === 'region' && (
            <>
              <TextField
                label="Code"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
              <TextField
                label="Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                label="Country"
                value={formData.country || 'ZA'}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </>
          )}
          {dialogType === 'district' && (
            <>
              <TextField
                label="Code"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
              <TextField
                label="Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                select
                label="Region"
                value={formData.region || ''}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                SelectProps={{ native: true }}
                required
              >
                <option value="">Select Region</option>
                {regions.map((region) => (
                  <option key={region.id || region._id} value={region.id || region._id}>
                    {region.name}
                  </option>
                ))}
              </TextField>
            </>
          )}
          {dialogType === 'store' && (
            <>
              <TextField
                label="Store Code"
                value={formData.storeCode || ''}
                onChange={(e) => setFormData({ ...formData, storeCode: e.target.value })}
                required
              />
              <TextField
                label="Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                select
                label="District"
                value={formData.district || ''}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                SelectProps={{ native: true }}
                required
              >
                <option value="">Select District</option>
                {districts.map((district) => (
                  <option key={district.id || district._id} value={district.id || district._id}>
                    {district.name}
                  </option>
                ))}
              </TextField>
              <TextField
                select
                label="Region"
                value={formData.region || ''}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                SelectProps={{ native: true }}
                required
              >
                <option value="">Select Region</option>
                {regions.map((region) => (
                  <option key={region.id || region._id} value={region.id || region._id}>
                    {region.name}
                  </option>
                ))}
              </TextField>
              <TextField
                select
                label="Store Type"
                value={formData.storeType || 'supermarket'}
                onChange={(e) => setFormData({ ...formData, storeType: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="hypermarket">Hypermarket</option>
                <option value="supermarket">Supermarket</option>
                <option value="convenience">Convenience</option>
                <option value="wholesale">Wholesale</option>
                <option value="other">Other</option>
              </TextField>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Hierarchy Manager</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create', activeTab === 0 ? 'region' : activeTab === 1 ? 'district' : 'store')}
        >
          Add {activeTab === 0 ? 'Region' : activeTab === 1 ? 'District' : 'Store'}
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Manage your organizational hierarchy: Regions → Districts → Stores. This hierarchy is used in Promotion Planner and other modules.
      </Alert>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<RegionIcon />} label="Regions" />
          <Tab icon={<DistrictIcon />} label="Districts" />
          <Tab icon={<StoreIcon />} label="Stores" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {activeTab === 0 && renderRegionsTable()}
          {activeTab === 1 && renderDistrictsTable()}
          {activeTab === 2 && renderStoresTable()}
        </>
      )}

      {renderDialog()}
    </Container>
  );
};

export default HierarchyManager;
