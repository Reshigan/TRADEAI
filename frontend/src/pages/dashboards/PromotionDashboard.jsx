import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const PromotionDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activePromotions: 0,
    avgROI: 0,
    totalSpend: 0,
    totalRevenue: 0,
    topPromotions: [],
    promotionsByType: [],
    recentPromotions: []
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await axios.get(`${API_BASE_URL}/analytics/promotion-metrics`, { headers }).catch(() => null);

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
      <h1>🎯 Promotion Dashboard</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Promotion performance and ROI analysis</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '25px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Active Promotions</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{metrics.activePromotions}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '12px', padding: '25px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Average ROI</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{metrics.avgROI.toFixed(2)}x</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '12px', padding: '25px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Spend</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{formatCurrency(metrics.totalSpend)}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: '12px', padding: '25px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Revenue</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{formatCurrency(metrics.totalRevenue)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
          <h3 style={{ marginBottom: '15px' }}>🏆 Top Performing Promotions</h3>
          {metrics.topPromotions.map((promo, index) => (
            <div key={index} style={{ padding: '12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>#{index + 1} {promo.name}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>ROI: {promo.roi}x</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(promo.revenue)}</div>
              </div>
            </div>
          ))}
          {metrics.topPromotions.length === 0 && <p style={{ color: '#666' }}>No data available</p>}
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
          <h3 style={{ marginBottom: '15px' }}>📊 Promotions by Type</h3>
          {metrics.promotionsByType.map((item, index) => (
            <div key={index} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>{item.type}</span>
                <strong>{item.count}</strong>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(item.count / metrics.activePromotions * 100)}%`, height: '100%', backgroundColor: '#3b82f6' }} />
              </div>
            </div>
          ))}
          {metrics.promotionsByType.length === 0 && <p style={{ color: '#666' }}>No data available</p>}
        </div>
      </div>
    </div>
  );
};

export default PromotionDashboard;
