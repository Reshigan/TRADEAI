import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const CampaignList = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: 'all' });

  useEffect(() => {
    fetchCampaigns();
  }, [filters]);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API_BASE_URL}/campaigns?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setCampaigns(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
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
      'Paused': '#f59e0b'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading campaigns...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1>📢 Campaigns</h1>
          <p>{campaigns.length} campaigns</p>
        </div>
        <button onClick={() => navigate('/campaigns/new')} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          + New Campaign
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search campaigns..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
        />
        <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Planned">Planned</option>
          <option value="Completed">Completed</option>
          <option value="Paused">Paused</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {campaigns.map(campaign => (
          <div key={campaign._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white', cursor: 'pointer' }} onClick={() => navigate(`/campaigns/${campaign._id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>{campaign.campaignName}</h3>
              <span style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', backgroundColor: getStatusColor(campaign.status), color: 'white' }}>
                {campaign.status}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>{campaign.description}</p>
            <div style={{ marginBottom: '10px' }}>
              <strong>Objective:</strong> {campaign.campaignObjective}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Budget:</strong> {formatCurrency(campaign.budget)}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Duration:</strong> {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
            </div>
            {campaign.targetMetrics && (
              <div style={{ padding: '10px', backgroundColor: '#fef3c7', borderRadius: '5px', marginTop: '10px' }}>
                <strong>Target:</strong> {JSON.stringify(campaign.targetMetrics)}
              </div>
            )}
            {campaign.promotions && campaign.promotions.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                <strong>Promotions:</strong> {campaign.promotions.length}
              </div>
            )}
          </div>
        ))}
      </div>

      {campaigns.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3>No campaigns found</h3>
          <button onClick={() => navigate('/campaigns/new')} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            + Create Campaign
          </button>
        </div>
      )}
    </div>
  );
};

export default CampaignList;
