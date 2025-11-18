import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const SalesDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    salesGrowth: 0,
    topTerritory: '',
    avgDealSize: 0,
    salesByTeam: [],
    salesByProduct: [],
    salesByChannel: []
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await axios.get(`${API_BASE_URL}/analytics/sales-metrics`, { headers }).catch(() => null);

      if (response?.data) {
        setMetrics(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(amount || 0);

  if (loading) return <div style={{ padding: '20px' }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>📈 Sales Dashboard</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Sales team performance and territory analysis</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '25px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Sales</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{formatCurrency(metrics.totalSales)}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '10px' }}>↑ {metrics.salesGrowth}% growth</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '12px', padding: '25px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Top Territory</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '10px' }}>{metrics.topTerritory || 'N/A'}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '12px', padding: '25px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Avg Deal Size</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{formatCurrency(metrics.avgDealSize)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
          <h3 style={{ marginBottom: '15px' }}>👥 Sales by Team</h3>
          {metrics.salesByTeam.map((item, index) => (
            <div key={index} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.team}</span>
              <strong>{formatCurrency(item.amount)}</strong>
            </div>
          ))}
          {metrics.salesByTeam.length === 0 && <p style={{ color: '#666' }}>No data available</p>}
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
          <h3 style={{ marginBottom: '15px' }}>📦 Sales by Product</h3>
          {metrics.salesByProduct.map((item, index) => (
            <div key={index} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.product}</span>
              <strong>{formatCurrency(item.amount)}</strong>
            </div>
          ))}
          {metrics.salesByProduct.length === 0 && <p style={{ color: '#666' }}>No data available</p>}
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
          <h3 style={{ marginBottom: '15px' }}>🌐 Sales by Channel</h3>
          {metrics.salesByChannel.map((item, index) => (
            <div key={index} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.channel}</span>
              <strong>{formatCurrency(item.amount)}</strong>
            </div>
          ))}
          {metrics.salesByChannel.length === 0 && <p style={{ color: '#666' }}>No data available</p>}
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
