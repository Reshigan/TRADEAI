import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, Paper } from '@mui/material';
import PageLayout from '../../components/layout/PageLayout';
import { FormField, FormActions } from '../../components/forms';
import { ErrorState, SkeletonList } from '../../components/states';
import { productService } from '../../services/api';

/**
 * Example implementation of Product Form using new Phase 3 components
 * 
 * This demonstrates:
 * - Phase 1: PageLayout with consistent structure
 * - Phase 3: Form components with validation
 * - Full-stack wiring with backend API
 */
const ProductFormWithNewComponents = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    price: '',
    cost: '',
    status: 'active',
    stockLevel: '',
    reorderPoint: '',
    supplier: '',
    brand: '',
    weight: '',
    dimensions: '',
    barcode: ''
  });
  const [errors, setErrors] = useState({});

  const categoryOptions = [
    { value: 'confectionery', label: 'Confectionery' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'snacks', label: 'Snacks' },
    { value: 'dairy', label: 'Dairy' },
    { value: 'bakery', label: 'Bakery' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'discontinued', label: 'Discontinued' }
  ];

  useEffect(() => {
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await productService.getById(id);
      setFormData(response.data || response);
    } catch (err) {
      console.error('Error loading product:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.sku) {
      newErrors.sku = 'SKU is required';
    }
    
    if (!formData.name) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    
    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      newErrors.cost = 'Valid cost is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (isEdit) {
        await productService.update(id, formData);
      } else {
        await productService.create(formData);
      }
      
      navigate('/products');
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/products');
  };

  if (loading) {
    return (
      <PageLayout title={isEdit ? 'Edit Product' : 'Add Product'}>
        <Paper sx={{ p: 3 }}>
          <SkeletonList rows={8} variant="list" />
        </Paper>
      </PageLayout>
    );
  }

  if (error && !loading) {
    return (
      <PageLayout title={isEdit ? 'Edit Product' : 'Add Product'}>
        <Paper sx={{ p: 3 }}>
          <ErrorState 
            error={error}
            onRetry={isEdit ? loadProduct : undefined}
            showRetry={isEdit}
          />
        </Paper>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={isEdit ? 'Edit Product' : 'Add Product'}
      subtitle={isEdit ? `Editing ${formData.name}` : 'Create a new product'}
    >
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <h3>Basic Information</h3>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormField
              type="text"
              name="sku"
              label="SKU"
              value={formData.sku}
              onChange={handleChange}
              error={errors.sku}
              required
              disabled={isEdit} // SKU cannot be changed
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormField
              type="text"
              name="name"
              label="Product Name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormField
              type="textarea"
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormField
              type="select"
              name="category"
              label="Category"
              value={formData.category}
              onChange={handleChange}
              options={categoryOptions}
              error={errors.category}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormField
              type="select"
              name="status"
              label="Status"
              value={formData.status}
              onChange={handleChange}
              options={statusOptions}
              required
            />
          </Grid>
          
          {/* Pricing */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2, mt: 2 }}>
              <h3>Pricing</h3>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormField
              type="currency"
              name="price"
              label="Price"
              value={formData.price}
              onChange={handleChange}
              error={errors.price}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormField
              type="currency"
              name="cost"
              label="Cost"
              value={formData.cost}
              onChange={handleChange}
              error={errors.cost}
              required
            />
          </Grid>
          
          {/* Inventory */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2, mt: 2 }}>
              <h3>Inventory</h3>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormField
              type="number"
              name="stockLevel"
              label="Stock Level"
              value={formData.stockLevel}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormField
              type="number"
              name="reorderPoint"
              label="Reorder Point"
              value={formData.reorderPoint}
              onChange={handleChange}
            />
          </Grid>
          
          {/* Additional Details */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2, mt: 2 }}>
              <h3>Additional Details</h3>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormField
              type="text"
              name="supplier"
              label="Supplier"
              value={formData.supplier}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormField
              type="text"
              name="brand"
              label="Brand"
              value={formData.brand}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormField
              type="text"
              name="weight"
              label="Weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="e.g., 500g"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormField
              type="text"
              name="dimensions"
              label="Dimensions"
              value={formData.dimensions}
              onChange={handleChange}
              placeholder="e.g., 10x10x5 cm"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormField
              type="text"
              name="barcode"
              label="Barcode"
              value={formData.barcode}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
        
        {/* Form Actions */}
        <FormActions
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel={isEdit ? 'Update Product' : 'Create Product'}
          submitting={submitting}
          disabled={submitting}
        />
      </Paper>
    </PageLayout>
  );
};

export default ProductFormWithNewComponents;
