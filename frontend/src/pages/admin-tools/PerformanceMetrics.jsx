import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const PerformanceMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    avgResponseTime: 0,
    requestsPerMinute: 0,
    errorRate: 0,
    uptime: 0,
    slowestEndpoints: [],
    recentErrors: []
  });

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await axios.get(`${API_BASE_URL}/admin/performance/metrics`, { headers }).catch(() => ({ data: { data: {} } }));

      setMetrics(response.data.data || {
        avgResponseTime: 0,
        requestsPerMinute: 0,
        errorRate: 0,
        uptime: 0,
        slowestEndpoints: [],
        recentErrors: []
      });
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading performance metrics...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>⚡ Performance Metrics</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>System performance and monitoring</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Avg Response Time</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: metrics.avgResponseTime < 200 ? '#10b981' : metrics.avgResponseTime < 500 ? '#f59e0b' : '#ef4444' }}>
            {metrics.avgResponseTime}ms
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Requests/Min</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{metrics.requestsPerMinute.toLocaleString()}</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Error Rate</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: metrics.errorRate < 1 ? '#10b981' : metrics.errorRate < 5 ? '#f59e0b' : '#ef4444' }}>
            {metrics.errorRate.toFixed(2)}%
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>System Uptime</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{formatUptime(metrics.uptime)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>🐌 Slowest Endpoints</h3>
            <button onClick={fetchMetrics} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>
              Refresh
            </button>
          </div>
          
          <div>
            {metrics.slowestEndpoints.map((endpoint, index) => (
              <div key={index} style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>{endpoint.method} {endpoint.path}</span>
                  <strong style={{ color: endpoint.avgTime > 1000 ? '#ef4444' : endpoint.avgTime > 500 ? '#f59e0b' : '#10b981' }}>
                    {endpoint.avgTime}ms
                  </strong>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Requests: {endpoint.count} | Max: {endpoint.maxTime}ms
                </div>
              </div>
            ))}
            {metrics.slowestEndpoints.length === 0 && <p style={{ color: '#666', textAlign: 'center' }}>No data available</p>}
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
          <h3 style={{ marginBottom: '20px' }}>❌ Recent Errors</h3>
          
          <div>
            {metrics.recentErrors.map((error, index) => (
              <div key={index} style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{error.statusCode} - {error.message}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>
                  {error.method} {error.path}
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                  {new Date(error.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
            {metrics.recentErrors.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#10b981' }}>
                ✅ No recent errors
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
