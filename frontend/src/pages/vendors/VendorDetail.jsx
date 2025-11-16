import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import './VendorDetail.css';

const VendorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/vendors/${id}`);
      setData(response.data.data || response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/vendors/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/vendors/${id}`);
        navigate('/vendors');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete vendor');
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <ErrorMessage message="Vendor not found" />;

  return (
    <div className="vendor-detail">
      <div className="detail-header">
        <div className="header-content">
          <h1>{data.name}</h1>
          {data.status && (
            <span className={`status-badge status-${data.status}`}>
              {data.status}
            </span>
          )}
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/vendors')} className="btn-secondary">
            Back to List
          </button>
          <button onClick={() => navigate(`/trade-spends?vendorId=${id}`)} className="btn-secondary">
            View Trade Spends
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
          <h2>Information</h2>
          <div className="detail-grid">
            {Object.keys(data).filter(key => !['_id', '__v', 'createdAt', 'updatedAt'].includes(key)).map(key => (
              <div key={key} className="detail-item">
                <label>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</label>
                <p>{typeof data[key] === 'object' ? JSON.stringify(data[key]) : (data[key] || 'N/A')}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="detail-section">
          <h2>Metadata</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Created At</label>
              <p>{data.createdAt ? new Date(data.createdAt).toLocaleString() : 'N/A'}</p>
            </div>
            <div className="detail-item">
              <label>Last Updated</label>
              <p>{data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VendorDetail;
