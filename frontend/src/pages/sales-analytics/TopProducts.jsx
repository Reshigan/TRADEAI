import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const TopProducts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchProducts();
  }, [limit]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/sales-transactions/top-products?limit=${limit}`, {
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

  const getTotalRevenue = () => products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
  const getTotalQuantity = () => products.reduce((sum, p) => sum + (p.totalQuantity || 0), 0);

  if (loading) return <div style={{ padding: '20px' }}>Loading top products...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>📦 Top Products</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Product ranking by revenue and sales volume</p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <select value={limit} onChange={(e) => setLimit(parseInt(e.target.value))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <option value="5">Top 5</option>
          <option value="10">Top 10</option>
          <option value="20">Top 20</option>
          <option value="50">Top 50</option>
        </select>
        <button onClick={fetchProducts} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Total Products</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{products.length}</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Combined Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(getTotalRevenue())}</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Units Sold</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{getTotalQuantity().toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {products.map((product, index) => (
          <div 
            key={index} 
            style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onClick={() => navigate(`/products/${product.product?._id}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '10px', 
                backgroundColor: index < 3 ? '#fbbf24' : '#3b82f6', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 'bold',
                fontSize: '20px'
              }}>
                #{index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{product.product?.name || product.productName || 'Unknown Product'}</div>
                {product.product?.sku && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>SKU: {product.product.sku}</div>
                )}
              </div>
            </div>

            <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Revenue</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(product.totalRevenue)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '5px' }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>Units Sold</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{product.totalQuantity.toLocaleString()}</div>
              </div>

              <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '5px' }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>Avg Price</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{formatCurrency(product.avgPrice)}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '5px' }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>Min Price</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{formatCurrency(product.minPrice)}</div>
              </div>

              <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '5px' }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>Max Price</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{formatCurrency(product.maxPrice)}</div>
              </div>
            </div>

            {product.product?.category && (
              <div style={{ marginTop: '15px', padding: '8px 12px', backgroundColor: '#e5e7eb', borderRadius: '5px', fontSize: '12px', textAlign: 'center' }}>
                {product.product.category}
              </div>
            )}
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📦</div>
          <h3>No product data available</h3>
        </div>
      )}
    </div>
  );
};

export default TopProducts;
