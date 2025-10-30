import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const SalesAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    revenueByPeriod: [],
    topCustomers: [],
    topProducts: [],
    summary: null
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [revenueRes, customersRes, productsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/sales-transactions/revenue-by-period`, { headers }),
        axios.get(`${API_BASE_URL}/sales-transactions/top-customers`, { headers }),
        axios.get(`${API_BASE_URL}/sales-transactions/top-products`, { headers })
      ]);

      setData({
        revenueByPeriod: revenueRes.data.data || [],
        topCustomers: customersRes.data.data || [],
        topProducts: productsRes.data.data || []
      });
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading analytics...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>📊 Sales Analytics</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <h3>💰 Revenue by Period</h3>
          {data.revenueByPeriod.length > 0 ? (
            <div style={{ marginTop: '15px' }}>
              {data.revenueByPeriod.map((item, index) => (
                <div key={index} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item._id?.year}/{item._id?.month}</span>
                    <strong>{formatCurrency(item.totalRevenue)}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    {item.transactionCount} transactions | {item.totalQuantity} units
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', marginTop: '10px' }}>No revenue data available</p>
          )}
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <h3>👥 Top Customers</h3>
          {data.topCustomers.length > 0 ? (
            <div style={{ marginTop: '15px' }}>
              {data.topCustomers.slice(0, 10).map((item, index) => (
                <div key={index} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>#{index + 1} {item.customer?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {item.transactionCount} transactions
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold' }}>{formatCurrency(item.totalRevenue)}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Avg: {formatCurrency(item.avgTransactionValue)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', marginTop: '10px' }}>No customer data available</p>
          )}
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <h3>📦 Top Products</h3>
          {data.topProducts.length > 0 ? (
            <div style={{ marginTop: '15px' }}>
              {data.topProducts.slice(0, 10).map((item, index) => (
                <div key={index} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>#{index + 1} {item.product?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {item.totalQuantity} units sold
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold' }}>{formatCurrency(item.totalRevenue)}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Avg: {formatCurrency(item.avgPrice)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', marginTop: '10px' }}>No product data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesAnalytics;
