import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: 'all' });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category !== 'all') params.append('category', filters.category);

      const response = await axios.get(`${API_BASE_URL}/products?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);

  if (loading) return <div style={{ padding: '20px' }}>Loading products...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1>📦 Products</h1>
          <p>{products.length} products</p>
        </div>
        <button onClick={() => navigate('/products/new')} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          + New Product
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
        />
        <select value={filters.category} onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '5px', minWidth: '150px' }}>
          <option value="all">All Categories</option>
          <option value="Beverages">Beverages</option>
          <option value="Snacks">Snacks</option>
          <option value="Dairy">Dairy</option>
          <option value="Bakery">Bakery</option>
          <option value="Frozen">Frozen</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {products.map(product => (
          <div key={product._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white', cursor: 'pointer' }} onClick={() => navigate(`/products/${product._id}`)}>
            <h3 style={{ marginBottom: '10px' }}>{product.productName}</h3>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              <strong>SKU:</strong> {product.productCode}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              <strong>Category:</strong> {product.category}
            </div>
            {product.brand && (
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                <strong>Brand:</strong> {product.brand}
              </div>
            )}
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0fdf4', borderRadius: '5px' }}>
              <strong style={{ color: '#10b981' }}>Price:</strong> {formatCurrency(product.unitPrice)}
            </div>
            {product.inventory && (
              <div style={{ marginTop: '10px', fontSize: '14px' }}>
                <strong>Stock:</strong> {product.inventory.availableQuantity || 0} units
              </div>
            )}
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3>No products found</h3>
          <button onClick={() => navigate('/products/new')} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            + Add Product
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductList;
