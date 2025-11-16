import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const SecurityMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, criticalEvents: 0, blockedIPs: 0, activeUsers: 0 });

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [eventsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/security/events?limit=50`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE_URL}/admin/security/stats`, { headers }).catch(() => ({ data: { data: {} } }))
      ]);

      setSecurityEvents(eventsRes.data.data || []);
      setStats(statsRes.data.data || { totalEvents: 0, criticalEvents: 0, blockedIPs: 0, activeUsers: 0 });
    } catch (err) {
      console.error('Failed to fetch security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981'
    };
    return colors[severity] || '#6b7280';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-ZA');
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading security monitoring...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>🔒 Security Monitoring</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>System security events and monitoring</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Total Events</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.totalEvents.toLocaleString()}</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Critical Events</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{stats.criticalEvents.toLocaleString()}</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Blocked IPs</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.blockedIPs.toLocaleString()}</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Active Users</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{stats.activeUsers.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Recent Security Events</h3>
          <button onClick={fetchSecurityData} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Refresh
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Timestamp</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Severity</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>IP Address</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {securityEvents.map((event, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{formatDate(event.timestamp)}</td>
                  <td style={{ padding: '12px' }}>{event.eventType}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: getSeverityColor(event.severity), color: 'white' }}>
                      {event.severity}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{event.ipAddress}</td>
                  <td style={{ padding: '12px' }}>{event.description}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {securityEvents.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              No security events found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityMonitoring;
