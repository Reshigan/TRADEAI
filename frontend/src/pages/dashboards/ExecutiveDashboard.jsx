import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const ExecutiveDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalPromotions: 0,
    activeActivities: 0,
    budgetUtilization: 0
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const response = await axios.get(`${API_BASE_URL}/analytics/executive-metrics`, { headers }).catch(() => null);
      
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
      <h1>📊 Executive Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '25px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Revenue</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{formatCurrency(metrics.totalRevenue)}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '12px', padding: '25px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9' }}>Active Promotions</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{metrics.totalPromotions}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '12px', padding: '25px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Active Activities</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{metrics.activeActivities}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: '12px', padding: '25px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Budget Utilization</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{metrics.budgetUtilization}%</div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
