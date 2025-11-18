import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
} from '@mui/material';
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

const CustomerHierarchy = () => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    customerType: 'retailer',
  });

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/customers/hierarchy');
      setTree(response.data || []);
    } catch (error) {
      console.error('Error fetching customer hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = (parent) => {
    setSelectedNode(parent);
    setFormData({
      name: '',
      code: '',
      customerType: 'retailer',
    });
    setDialogOpen(true);
  };

  const handleEdit = (node) => {
    setSelectedNode(node);
    setFormData({
      name: node.name,
      code: node.code,
      customerType: node.customerType || 'retailer',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedNode && selectedNode._id) {
        await apiClient.put(`/customers/${selectedNode._id}`, formData);
      } else {
        await apiClient.post('/customers', {
          ...formData,
          parentId: selectedNode?._id || null,
        });
      }
      setDialogOpen(false);
      fetchHierarchy();
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const renderTree = (nodes) => {
    return nodes.map((node) => (
      <TreeItem
        key={node._id}
        nodeId={node._id}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
            <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {node.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {node.code} • Level {node.level || 0} • {node.customerType}
              </Typography>
            </Box>
            <Chip
              label={`${node.childrenCount || 0} children`}
              size="small"
              sx={{ mr: 1 }}
            />
            <IconButton size="small" onClick={() => handleAddChild(node)}>
              <AddIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => handleEdit(node)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        {node.children && node.children.length > 0 && renderTree(node.children)}
      </TreeItem>
    ));
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading hierarchy...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          👥 Customer Hierarchy
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedNode(null);
            setFormData({ name: '', code: '', customerType: 'retailer' });
            setDialogOpen(true);
          }}
        >
          Add Root Customer
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Organize customers in a hierarchy (e.g., Chain → Region → Store). Budget and spend roll up automatically.
        </Typography>
      </Alert>

      <Card>
        <CardContent>
          {tree.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No customers yet. Click "Add Root Customer" to get started.
            </Typography>
          ) : (
            <TreeView
              defaultCollapseIcon={<ExpandMoreIcon />}
              defaultExpandIcon={<ChevronRightIcon />}
              sx={{ flexGrow: 1, overflowY: 'auto' }}
            >
              {renderTree(tree)}
            </TreeView>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedNode && selectedNode._id ? 'Edit Customer' : 'Add Customer'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Customer Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Customer Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              fullWidth
              required
            />
            <TextField
              label="Customer Type"
              value={formData.customerType}
              onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
              select
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="retailer">Retailer</option>
              <option value="wholesaler">Wholesaler</option>
              <option value="distributor">Distributor</option>
              <option value="chain">Chain</option>
              <option value="independent">Independent</option>
            </TextField>
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

export default CustomerHierarchy;
