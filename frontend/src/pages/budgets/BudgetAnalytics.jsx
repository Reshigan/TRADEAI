import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const BudgetAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    utilizationTrend: [],
    topSpendingCategories: [],
    departmentAllocation: [],
    forecastVsActual: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await axios.get(`${API_BASE_URL}/budgets/analytics`, { headers });

      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);

  if (loading) return <div style={{ padding: '20px' }}>Loading analytics...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>📊 Budget Analytics</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Detailed budget analysis and insights</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
          <h3 style={{ marginBottom: '15px' }}>📈 Utilization Trend</h3>
          {analytics.utilizationTrend.map((item, index) => (
            <div key={index} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>{item.month}</span>
                <strong>{item.utilization}%</strong>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${item.utilization}%`, height: '100%', backgroundColor: item.utilization > 90 ? '#ef4444' : item.utilization > 75 ? '#f59e0b' : '#10b981' }} />
              </div>
            </div>
          ))}
          {analytics.utilizationTrend.length === 0 && <p style={{ color: '#666' }}>No trend data available</p>}
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
          <h3 style={{ marginBottom: '15px' }}>💰 Top Spending Categories</h3>
          {analytics.topSpendingCategories.map((item, index) => (
            <div key={index} style={{ padding: '12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>#{index + 1} {item.category}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>{item.percentage}% of total</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold' }}>{formatCurrency(item.amount)}</div>
              </div>
            </div>
          ))}
          {analytics.topSpendingCategories.length === 0 && <p style={{ color: '#666' }}>No spending data available</p>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
          <h3 style={{ marginBottom: '15px' }}>🏢 Department Allocation</h3>
          {analytics.departmentAllocation.map((dept, index) => (
            <div key={index} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>{dept.department}</span>
                <span>{formatCurrency(dept.allocated)}</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(dept.spent / dept.allocated * 100)}%`, height: '100%', backgroundColor: '#3b82f6' }} />
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Spent: {formatCurrency(dept.spent)} ({((dept.spent / dept.allocated) * 100).toFixed(1)}%)
              </div>
            </div>
          ))}
          {analytics.departmentAllocation.length === 0 && <p style={{ color: '#666' }}>No allocation data available</p>}
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
          <h3 style={{ marginBottom: '15px' }}>🎯 Forecast vs Actual</h3>
          {analytics.forecastVsActual.map((item, index) => (
            <div key={index} style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>{item.period}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' }}>
                <span style={{ color: '#666' }}>Forecast:</span>
                <span>{formatCurrency(item.forecast)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' }}>
                <span style={{ color: '#666' }}>Actual:</span>
                <span>{formatCurrency(item.actual)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>Variance:</span>
                <span style={{ color: item.variance >= 0 ? '#10b981' : '#ef4444' }}>
                  {item.variance >= 0 ? '+' : ''}{item.variance}%
                </span>
              </div>
            </div>
          ))}
          {analytics.forecastVsActual.length === 0 && <p style={{ color: '#666' }}>No forecast data available</p>}
        </div>
      </div>
    </div>
  );
};

export default BudgetAnalytics;
