import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
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
  ArrowBack as ArrowBackIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
  LocalOffer as TagIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

import { PageHeader, StatusChip, ConfirmDialog } from '../common';
import { productService, promotionService, tradeSpendService } from '../../services/api';
import ProductForm from './ProductForm';

// Mock data for development - South African product
const mockProduct = {
  id: '2',
  name: 'Biltong',
  sku: 'BLT-002',
  category: 'Snacks',
  status: 'active',
  price: 89.99,
  cost: 45.50,
  inventory: 850,
  description: 'Traditional South African dried, cured meat with signature spices.',
  specifications: 'Ingredients: Beef, vinegar, salt, coriander, black pepper, brown sugar, paprika. Packaged in 250g resealable bags.',
  is_taxable: true,
  created_at: new Date('2024-02-20'),
  updated_at: new Date('2025-04-15')
};

const mockPromotions = [
  {
    id: '1',
    name: 'Winter Promotion',
    customer: { id: '1', name: 'Shoprite Holdings' },
    start_date: new Date('2025-06-01'),
    end_date: new Date('2025-07-31'),
    status: 'active'
  },
  {
    id: '2',
    name: 'Heritage Day Special',
    customer: { id: '3', name: 'SPAR Group' },
    start_date: new Date('2025-09-01'),
    end_date: new Date('2025-09-30'),
    status: 'planned'
  },
  {
    id: '3',
    name: 'Summer Launch',
    customer: { id: '4', name: 'Woolworths Holdings' },
    start_date: new Date('2025-11-01'),
    end_date: new Date('2025-12-31'),
    status: 'planned'
  }
];

const mockTradeSpends = [
  {
    id: '1',
    description: 'Shoprite End Cap Display',
    type: 'display',
    amount: 225000,
    status: 'approved'
  },
  {
    id: '2',
    description: 'Pick n Pay Featured Product Listing',
    type: 'listing',
    amount: 300000,
    status: 'approved'
  },
  {
    id: '3',
    description: 'Woolworths Premium Placement',
    type: 'placement',
    amount: 450000,
    status: 'pending'
  }
];

const mockSalesData = [
  { month: 'Jan', sales: 5250, revenue: 472447.50 },
  { month: 'Feb', sales: 5620, revenue: 505738.80 },
  { month: 'Mar', sales: 5980, revenue: 538142.20 },
  { month: 'Apr', sales: 6210, revenue: 558839.90 },
  { month: 'May', sales: 6650, revenue: 598433.50 },
  { month: 'Jun', sales: 7120, revenue: 640728.80 },
  { month: 'Jul', sales: 7580, revenue: 682042.20 },
  { month: 'Aug', sales: 8930, revenue: 803607.70 }
];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [tradeSpends, setTradeSpends] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch product and related data on component mount
  useEffect(() => {
    fetchProduct();
    fetchPromotions();
    fetchTradeSpends();
    fetchSalesData();
  }, [id]);

  // Fetch product from API
  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, we would call the API
      // const response = await productService.getById(id);
      // setProduct(response.data);
      
      // Using mock data for development
      setTimeout(() => {
        setProduct(mockProduct);
        setLoading(false);
      }, 500);
    } catch (err) {
      setError('Failed to fetch product details. Please try again.');
      setLoading(false);
    }
  };

  // Fetch promotions from API
  const fetchPromotions = async () => {
    try {
      // In a real app, we would call the API
      // const response = await promotionService.getAll({ product_id: id });
      // setPromotions(response.data);
      
      // Using mock data for development
      setPromotions(mockPromotions);
    } catch (err) {
      console.error('Failed to fetch promotions:', err);
    }
  };

  // Fetch trade spends from API
  const fetchTradeSpends = async () => {
    try {
      // In a real app, we would call the API
      // const response = await tradeSpendService.getAll({ product_id: id });
      // setTradeSpends(response.data);
      
      // Using mock data for development
      setTradeSpends(mockTradeSpends);
    } catch (err) {
      console.error('Failed to fetch trade spends:', err);
    }
  };

  // Fetch sales data from API
  const fetchSalesData = async () => {
    try {
      // In a real app, we would call the API
      // const response = await productService.getSalesData(id);
      // setSalesData(response.data);
      
      // Using mock data for development
      setSalesData(mockSalesData);
    } catch (err) {
      console.error('Failed to fetch sales data:', err);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle edit product
  const handleEditProduct = () => {
    setOpenEditForm(true);
  };

  // Handle delete product
  const handleDeleteProduct = () => {
    setOpenDeleteDialog(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    
    try {
      // In a real app, we would call the API
      // await productService.delete(id);
      
      // Simulate API call
      setTimeout(() => {
        setDeleteLoading(false);
        setOpenDeleteDialog(false);
        navigate('/products');
      }, 1000);
    } catch (err) {
      console.error('Failed to delete product:', err);
      setDeleteLoading(false);
    }
  };

  // Handle form submit
  const handleFormSubmit = async (productData) => {
    try {
      // In a real app, we would call the API
      // await productService.update(id, productData);
      
      // Refresh product
      fetchProduct();
      setOpenEditForm(false);
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  // Format currency - South African Rand
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  // Calculate profit margin
  const calculateProfitMargin = () => {
    if (!product) return 0;
    
    return ((product.price - product.cost) / product.price * 100).toFixed(2);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/products')}
          sx={{ mt: 2 }}
        >
          Back to Products
        </Button>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="warning">Product not found.</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/products')}
          sx={{ mt: 2 }}
        >
          Back to Products
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`Product: ${product.name}`}
        subtitle={`SKU: ${product.sku}`}
        breadcrumbs={[
          { text: 'Products', link: '/products' },
          { text: product.name }
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/products')}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEditProduct}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteProduct}
            >
              Delete
            </Button>
          </Box>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ mr: 1, color: 'text.secondary', width: 24 }}>
                  <TagIcon />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">
                    {product.name}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ mr: 1, color: 'text.secondary', width: 24 }}>
                  <CategoryIcon />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body1">
                    {product.category}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ mr: 1, color: 'text.secondary', width: 24 }}>
                  <InventoryIcon />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Inventory
                  </Typography>
                  <Typography variant="body1">
                    {product.inventory.toLocaleString()} units
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ mr: 1, color: 'text.secondary', width: 24 }}>
                  <MoneyIcon />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Price / Cost
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(product.price)} / {formatCurrency(product.cost)}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Status
              </Typography>
              <StatusChip status={product.status} />
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Profit Margin
                </Typography>
                <Typography variant="h5" color="primary">
                  {calculateProfitMargin()}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
          {product.description && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2">
                  {product.description}
                </Typography>
              </CardContent>
            </Card>
          )}
          
          {product.specifications && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Specifications
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2">
                  {product.specifications}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Sales Data" />
              <Tab label="Promotions" />
              <Tab label="Trade Spends" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Sales Data
                  </Typography>
                  
                  {salesData.length > 0 ? (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Month</TableCell>
                            <TableCell align="right">Units Sold</TableCell>
                            <TableCell align="right">Revenue</TableCell>
                            <TableCell align="right">Profit</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {salesData.map((row) => (
                            <TableRow key={row.month}>
                              <TableCell component="th" scope="row">
                                {row.month}
                              </TableCell>
                              <TableCell align="right">{row.sales.toLocaleString()}</TableCell>
                              <TableCell align="right">{formatCurrency(row.revenue)}</TableCell>
                              <TableCell align="right">{formatCurrency(row.revenue - (row.sales * product.cost))}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                              Total
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {salesData.reduce((sum, row) => sum + row.sales, 0).toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(salesData.reduce((sum, row) => sum + row.revenue, 0))}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(
                                salesData.reduce((sum, row) => sum + row.revenue, 0) - 
                                salesData.reduce((sum, row) => sum + (row.sales * product.cost), 0)
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">
                      No sales data available for this product.
                    </Alert>
                  )}
                </Box>
              )}
              
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Promotions
                  </Typography>
                  
                  {promotions.length > 0 ? (
                    <List>
                      {promotions.map((promotion) => (
                        <React.Fragment key={promotion.id}>
                          <ListItem
                            button
                            onClick={() => navigate(`/promotions/${promotion.id}`)}
                          >
                            <ListItemText
                              primary={promotion.name}
                              secondary={`${formatDate(promotion.start_date)} - ${formatDate(promotion.end_date)} | ${promotion.customer.name}`}
                            />
                            <ListItemSecondaryAction>
                              <StatusChip status={promotion.status} sx={{ mr: 1 }} />
                              <IconButton
                                edge="end"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/promotions/${promotion.id}/edit`);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                          <Divider component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">
                      No promotions found for this product.
                    </Alert>
                  )}
                </Box>
              )}
              
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Trade Spends
                  </Typography>
                  
                  {tradeSpends.length > 0 ? (
                    <List>
                      {tradeSpends.map((tradeSpend) => (
                        <React.Fragment key={tradeSpend.id}>
                          <ListItem
                            button
                            onClick={() => navigate(`/trade-spends/${tradeSpend.id}`)}
                          >
                            <ListItemText
                              primary={tradeSpend.description}
                              secondary={`${tradeSpend.type.charAt(0).toUpperCase() + tradeSpend.type.slice(1)} | Amount: ${formatCurrency(tradeSpend.amount)}`}
                            />
                            <ListItemSecondaryAction>
                              <StatusChip status={tradeSpend.status} sx={{ mr: 1 }} />
                              <IconButton
                                edge="end"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/trade-spends/${tradeSpend.id}/edit`);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                          <Divider component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">
                      No trade spends found for this product.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total Sales (YTD)
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {salesData.reduce((sum, row) => sum + row.sales, 0).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Revenue (YTD)
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {formatCurrency(salesData.reduce((sum, row) => sum + row.revenue, 0))}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Profit (YTD)
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {formatCurrency(
                          salesData.reduce((sum, row) => sum + row.revenue, 0) - 
                          salesData.reduce((sum, row) => sum + (row.sales * product.cost), 0)
                        )}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Active Promotions
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {promotions.filter(p => p.status === 'active').length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Product Form */}
      {openEditForm && (
        <ProductForm
          open={openEditForm}
          onClose={() => setOpenEditForm(false)}
          onSubmit={handleFormSubmit}
          product={product}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        confirmColor="error"
        loading={deleteLoading}
      />
    </Box>
  );
};

export default ProductDetail;