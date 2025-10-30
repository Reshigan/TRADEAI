import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const ActivityList = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    activityType: 'all',
    performance: 'all'
  });

  useEffect(() => {
    fetchActivities();
  }, [filters]);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.activityType !== 'all') params.append('activityType', filters.activityType);
      if (filters.performance !== 'all') params.append('performance', filters.performance);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API_BASE_URL}/activities?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setActivities(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Planned': '#3b82f6',
      'In Progress': '#f59e0b',
      'Completed': '#10b981',
      'Cancelled': '#ef4444',
      'On Hold': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) return <div className="loading">Loading activities...</div>;

  return (
    <div className="activity-list-container" style={{ padding: '20px' }}>
      <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1>🎯 Activities</h1>
          <p>{activities.length} activities found</p>
        </div>
        <button onClick={() => navigate('/activities/new')} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          + New Activity
        </button>
      </div>

      <div className="filters-section" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search activities..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
        />
        <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <option value="all">All Status</option>
          <option value="Planned">Planned</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      <div className="activities-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {activities.map(activity => (
          <div key={activity._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', cursor: 'pointer', backgroundColor: 'white' }} onClick={() => navigate(`/activities/${activity._id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3>{activity.activityName}</h3>
              <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: getStatusColor(activity.status), color: 'white' }}>
                {activity.status}
              </span>
            </div>
            <p><strong>Type:</strong> {activity.activityType}</p>
            <p><strong>Customer:</strong> {activity.customerName}</p>
            <p><strong>Duration:</strong> {formatDate(activity.startDate)} - {formatDate(activity.endDate)}</p>
            <p><strong>Budget:</strong> {formatCurrency(activity.budget?.allocated)}</p>
          </div>
        ))}
      </div>

      {activities.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No activities found</h3>
          <button onClick={() => navigate('/activities/new')} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            + Create Activity
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityList;
