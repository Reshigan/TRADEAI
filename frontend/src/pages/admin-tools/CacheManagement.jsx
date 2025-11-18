import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const CacheManagement = () => {
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0, keys: 0, memory: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCacheStats();
  }, []);

  const fetchCacheStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/cache/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => ({ data: { data: { hits: 0, misses: 0, keys: 0, memory: 0 } } }));

      setCacheStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch cache stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async (pattern = '*') => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/admin/cache/clear`, { pattern }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setMessage('Cache cleared successfully');
      setTimeout(() => setMessage(''), 3000);
      fetchCacheStats();
    } catch (err) {
      setMessage('Failed to clear cache');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const hitRate = cacheStats.hits + cacheStats.misses > 0 
    ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1) 
    : 0;

  if (loading) return <div style={{ padding: '20px' }}>Loading cache management...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>🗄️ Cache Management</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Monitor and manage application caching</p>

      {message && (
        <div style={{ padding: '10px 15px', marginBottom: '20px', borderRadius: '5px', backgroundColor: message.includes('Failed') ? '#fee2e2' : '#d1fae5', color: message.includes('Failed') ? '#991b1b' : '#065f46' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Cache Hits</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{cacheStats.hits.toLocaleString()}</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Cache Misses</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{cacheStats.misses.toLocaleString()}</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Hit Rate</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{hitRate}%</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Cached Keys</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{cacheStats.keys.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
        <h3 style={{ marginBottom: '20px' }}>Cache Operations</h3>
        
        <div style={{ display: 'grid', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '5px' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>Clear All Cache</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Remove all cached data</div>
            </div>
            <button onClick={() => clearCache('*')} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Clear All
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '5px' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>Clear Analytics Cache</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Remove analytics-related cached data</div>
            </div>
            <button onClick={() => clearCache('analytics:*')} style={{ padding: '8px 16px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Clear
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '5px' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>Clear User Cache</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Remove user session cached data</div>
            </div>
            <button onClick={() => clearCache('user:*')} style={{ padding: '8px 16px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Clear
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '5px' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>Refresh Stats</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Reload cache statistics</div>
            </div>
            <button onClick={fetchCacheStats} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheManagement;
