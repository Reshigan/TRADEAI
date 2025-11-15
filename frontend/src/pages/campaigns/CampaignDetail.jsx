import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import './CampaignDetail.css';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/campaigns/${id}`);
      setCampaign(response.data.data || response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/campaigns/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/campaigns/${id}`);
        navigate('/campaigns');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete campaign');
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!campaign) return <ErrorMessage message="Campaign not found" />;

  return (
    <div className="campaign-detail">
      <div className="detail-header">
        <div className="header-content">
          <h1>{campaign.name}</h1>
          {campaign.status && (
            <span className={`status-badge status-${campaign.status}`}>
              {campaign.status}
            </span>
          )}
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/campaigns')} className="btn-secondary">
            Back to List
          </button>
          <button onClick={handleEdit} className="btn-primary">
            Edit
          </button>
          <button onClick={handleDelete} className="btn-danger">
            Delete
          </button>
        </div>
      </div>

      <div className="detail-content">
        <section className="detail-section">
          <h2>Basic Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Campaign Name</label>
              <p>{campaign.name}</p>
            </div>
            <div className="detail-item">
              <label>Type</label>
              <p>{campaign.type || 'N/A'}</p>
            </div>
            <div className="detail-item">
              <label>Status</label>
              <p>{campaign.status}</p>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <h2>Timeline</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Start Date</label>
              <p>{campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="detail-item">
              <label>End Date</label>
              <p>{campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="detail-item">
              <label>Duration</label>
              <p>
                {campaign.startDate && campaign.endDate
                  ? `${Math.ceil((new Date(campaign.endDate) - new Date(campaign.startDate)) / (1000 * 60 * 60 * 24))} days`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <h2>Budget</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Total Budget</label>
              <p>R {campaign.budget ? campaign.budget.toLocaleString() : '0'}</p>
            </div>
          </div>
        </section>

        {campaign.description && (
          <section className="detail-section">
            <h2>Description</h2>
            <p className="description-text">{campaign.description}</p>
          </section>
        )}

        <section className="detail-section">
          <h2>Metadata</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Created At</label>
              <p>{campaign.createdAt ? new Date(campaign.createdAt).toLocaleString() : 'N/A'}</p>
            </div>
            <div className="detail-item">
              <label>Last Updated</label>
              <p>{campaign.updatedAt ? new Date(campaign.updatedAt).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CampaignDetail;
