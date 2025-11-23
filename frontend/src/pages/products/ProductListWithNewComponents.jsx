import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Chip } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import PageLayout from '../../components/layout/PageLayout';
import { TablePro, FilterBar } from '../../components/table';
import { EmptyState, ErrorState, SkeletonList } from '../../components/states';
import { productService } from '../../services/api';

/**
 * Example implementation of Products List using new Phase 1-6 components
 * 
 * This demonstrates:
 * - Phase 1: PageLayout with consistent structure
 * - Phase 2: TablePro with server-side pagination, sorting, filtering
 * - Phase 2: FilterBar with saved views
 * - Phase 5: Bulk actions and export functionality
 * - Full-stack wiring with backend API
 */
const ProductListWithNewComponents = () => {
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  
  const [sortModel, setSortModel] = useState([]);
  
  const [activeFilters, setActiveFilters] = useState({});
  const [savedViews, setSavedViews] = useState([]);
  const [currentView, setCurrentView] = useState(null);
  
  const [selectedRows, setSelectedRows] = useState([]);

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'discontinued', label: 'Discontinued' }
      ]
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'confectionery', label: 'Confectionery' },
        { value: 'beverages', label: 'Beverages' },
        { value: 'snacks', label: 'Snacks' }
      ]
    },
    {
      key: 'search',
      label: 'Search',
      type: 'text'
    }
  ];

  const columns = [
    {
      field: 'sku',
      headerName: 'SKU',
      width: 150,
      sortable: true
    },
    {
      field: 'name',
      headerName: 'Product Name',
      width: 250,
      sortable: true
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
      sortable: true
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 120,
      sortable: true,
      valueFormatter: (params) => `$${params.value?.toFixed(2) || '0.00'}`
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      sortable: true,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'active' ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/products/${params.row.id}/edit`)}
          >
            Edit
          </Button>
        </Box>
      )
    }
  ];

  const bulkActions = [
    {
      label: 'Activate',
      icon: <EditIcon />,
      onClick: (selectedIds) => {
        console.log('Activating products:', selectedIds);
      }
    },
    {
      label: 'Deactivate',
      icon: <EditIcon />,
      onClick: (selectedIds) => {
        console.log('Deactivating products:', selectedIds);
      }
    },
    {
      label: 'Delete',
      icon: <DeleteIcon />,
      onClick: (selectedIds) => {
        console.log('Deleting products:', selectedIds);
      }
    }
  ];

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page + 1, // API uses 1-based pagination
        limit: pageSize,
        ...activeFilters
      };
      
      if (sortModel.length > 0) {
        params.sortBy = sortModel[0].field;
        params.sortOrder = sortModel[0].sort;
      }
      
      const response = await productService.getAll(params);
      
      setProducts(response.data || []);
      setTotalCount(response.total || 0);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, pageSize, sortModel, activeFilters]);

  useEffect(() => {
    const saved = localStorage.getItem('productListViews');
    if (saved) {
      try {
        setSavedViews(JSON.parse(saved));
      } catch (err) {
        console.error('Error loading saved views:', err);
      }
    }
  }, []);

  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
    setPage(0); // Reset to first page
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setCurrentView(null);
    setPage(0);
  };

  const handleSaveView = (view) => {
    const newView = {
      ...view,
      id: Date.now().toString()
    };
    const updatedViews = [...savedViews, newView];
    setSavedViews(updatedViews);
    localStorage.setItem('productListViews', JSON.stringify(updatedViews));
  };

  const handleLoadView = (view) => {
    setActiveFilters(view.filters);
    setCurrentView(view);
    setPage(0);
  };

  const handleDeleteView = (viewId) => {
    const updatedViews = savedViews.filter(v => v.id !== viewId);
    setSavedViews(updatedViews);
    localStorage.setItem('productListViews', JSON.stringify(updatedViews));
    if (currentView?.id === viewId) {
      setCurrentView(null);
    }
  };

  const handleExport = () => {
    console.log('Exporting products...');
  };

  return (
    <PageLayout
      title="Products"
      subtitle="Manage your product catalog"
      toolbar={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/products/new')}
        >
          Add Product
        </Button>
      }
    >
      {/* Filter Bar */}
      <FilterBar
        filters={filterOptions}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        savedViews={savedViews}
        currentView={currentView}
        onSaveView={handleSaveView}
        onLoadView={handleLoadView}
        onDeleteView={handleDeleteView}
        showSavedViews={true}
      />

      {/* Data Table */}
      <TablePro
        columns={columns}
        rows={products}
        loading={loading}
        error={error}
        onRetry={loadProducts}
        
        page={page}
        pageSize={pageSize}
        rowCount={totalCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        
        selectable={true}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        
        bulkActions={bulkActions}
        
        onRowClick={(params) => navigate(`/products/${params.row.id}`)}
        getRowId={(row) => row.id || row._id}
        
        onExport={handleExport}
        showExport={true}
        
        onRefresh={loadProducts}
        
        emptyTitle="No products found"
        emptyDescription="Get started by adding your first product"
        emptyAction={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/products/new')}
          >
            Add Product
          </Button>
        }
        
        height={600}
        autoHeight={false}
      />
    </PageLayout>
  );
};

export default ProductListWithNewComponents;
