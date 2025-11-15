import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const ActivityDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalActivities: 0,
    activeActivities: 0,
    completedActivities: 0,
    avgROI: 0,
    totalBudget: 0,
    totalSpent: 0,
    activitiesByType: [],
    activitiesByStatus: [],
    performanceMetrics: []
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await axios.get(`${API_BASE_URL}/activities/metrics`, { headers });

      if (response.data.success) {
        setMetrics(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);

  if (loading) return <div style={{ padding: '20px' }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>🎯 Activity Dashboard</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Activity performance tracking and ROI analysis</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '25px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Activities</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{metrics.totalActivities}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '12px', padding: '25px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Active Now</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{metrics.activeActivities}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '12px', padding: '25px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Completed</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{metrics.completedActivities}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: '12px', padding: '25px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Average ROI</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{metrics.avgROI.toFixed(2)}x</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '25px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Total Budget</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '10px' }}>{formatCurrency(metrics.totalBudget)}</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '25px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Total Spent</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '10px', color: '#ef4444' }}>{formatCurrency(metrics.totalSpent)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
          <h3 style={{ marginBottom: '15px' }}>📊 Activities by Type</h3>
          {metrics.activitiesByType.map((item, index) => (
            <div key={index} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>{item.type}</span>
                <strong>{item.count}</strong>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(item.count / metrics.totalActivities * 100)}%`, height: '100%', backgroundColor: '#3b82f6' }} />
              </div>
            </div>
          ))}
          {metrics.activitiesByType.length === 0 && <p style={{ color: '#666' }}>No data available</p>}
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
          <h3 style={{ marginBottom: '15px' }}>📈 Performance Metrics</h3>
          {metrics.performanceMetrics.map((item, index) => (
            <div key={index} style={{ padding: '12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{item.performance}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>{item.count} activities</div>
              </div>
              <div style={{ fontSize: '24px' }}>
                {item.performance === 'On Track' && '✅'}
                {item.performance === 'At Risk' && '⚠️'}
                {item.performance === 'Delayed' && '⏰'}
                {item.performance === 'Not Started' && '⏸️'}
                {item.performance === 'Completed' && '🎉'}
              </div>
            </div>
          ))}
          {metrics.performanceMetrics.length === 0 && <p style={{ color: '#666' }}>No data available</p>}
        </div>
      </div>
    </div>
  );
};

export default ActivityDashboard;
