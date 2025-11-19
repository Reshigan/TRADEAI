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
  Category as CategoryIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

const ProductHierarchy = () => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    productType: 'own_brand',
  });

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/products/hierarchy');
      setTree(response.data || []);
    } catch (error) {
      console.error('Error fetching product hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = (parent) => {
    setSelectedNode(parent);
    setFormData({
      name: '',
      sku: '',
      productType: 'own_brand',
    });
    setDialogOpen(true);
  };

  const handleEdit = (node) => {
    setSelectedNode(node);
    setFormData({
      name: node.name,
      sku: node.sku,
      productType: node.productType || 'own_brand',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedNode && selectedNode._id) {
        await apiClient.put(`/products/${selectedNode._id}`, formData);
      } else {
        await apiClient.post('/products', {
          ...formData,
          parentId: selectedNode?._id || null,
          sapMaterialId: formData.sku,
        });
      }
      setDialogOpen(false);
      fetchHierarchy();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const renderTree = (nodes) => {
    return nodes.map((node) => (
      <TreeItem
        key={node._id}
        nodeId={node._id}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
            <CategoryIcon sx={{ mr: 1, color: 'secondary.main' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {node.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {node.sku} • Level {node.level || 0} • {node.productType}
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
          📦 Product Hierarchy
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedNode(null);
            setFormData({ name: '', sku: '', productType: 'own_brand' });
            setDialogOpen(true);
          }}
        >
          Add Root Product
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Organize products in a hierarchy (e.g., Division → Category → Brand → SKU). Budget and performance roll up automatically.
        </Typography>
      </Alert>

      <Card>
        <CardContent>
          {tree.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No products yet. Click "Add Root Product" to get started.
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
          {selectedNode && selectedNode._id ? 'Edit Product' : 'Add Product'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="SKU / Material Code"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              fullWidth
              required
            />
            <TextField
              label="Product Type"
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              select
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="own_brand">Own Brand</option>
              <option value="distributed">Distributed</option>
              <option value="private_label">Private Label</option>
              <option value="consignment">Consignment</option>
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

export default ProductHierarchy;
