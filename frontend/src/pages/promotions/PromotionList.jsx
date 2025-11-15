import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const PromotionList = () => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: 'all', type: 'all' });

  useEffect(() => {
    fetchPromotions();
  }, [filters]);

  const fetchPromotions = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.type !== 'all') params.append('promotionType', filters.type);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API_BASE_URL}/promotions?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setPromotions(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  const getStatusColor = (status) => {
    const colors = {
      'Active': '#10b981',
      'Planned': '#3b82f6',
      'Completed': '#6b7280',
      'Cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading promotions...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1>🎯 Promotions</h1>
          <p>{promotions.length} promotions found</p>
        </div>
        <button onClick={() => navigate('/promotions/new')} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          + New Promotion
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search promotions..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
        />
        <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Planned">Planned</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select value={filters.type} onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <option value="all">All Types</option>
          <option value="Trade Promotion">Trade Promotion</option>
          <option value="Consumer Promotion">Consumer Promotion</option>
          <option value="Volume Discount">Volume Discount</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {promotions.map(promo => (
          <div key={promo._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white', cursor: 'pointer' }} onClick={() => navigate(`/promotions/${promo._id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>{promo.promotionName}</h3>
              <span style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', backgroundColor: getStatusColor(promo.status), color: 'white' }}>
                {promo.status}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>{promo.description}</p>
            <div style={{ marginBottom: '10px' }}>
              <strong>Type:</strong> {promo.promotionType}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Budget:</strong> {formatCurrency(promo.budget)}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Duration:</strong> {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
            </div>
            {promo.expectedROI && (
              <div style={{ padding: '10px', backgroundColor: '#f0fdf4', borderRadius: '5px', marginTop: '10px' }}>
                <strong style={{ color: '#10b981' }}>Expected ROI:</strong> {promo.expectedROI}x
              </div>
            )}
          </div>
        ))}
      </div>

      {promotions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3>No promotions found</h3>
          <button onClick={() => navigate('/promotions/new')} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            + Create Promotion
          </button>
        </div>
      )}
    </div>
  );
};

export default PromotionList;
