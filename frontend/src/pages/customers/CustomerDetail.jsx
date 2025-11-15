import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import CustomerAIInsights from '../../components/ai/customers/CustomerAIInsights';
import { DetailPageSkeleton } from '../../components/common/SkeletonLoader';
import { useToast } from '../../components/common/ToastNotification';
import analytics from '../../utils/analytics';
import './CustomerDetail.css';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    analytics.trackPageView('customer_detail', { customerId: id });
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const startTime = Date.now();
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/customers/${id}`);
      setData(response.data.data || response.data);
      setError(null);
      
      analytics.trackEvent('customer_detail_loaded', {
        customerId: id,
        loadTime: Date.now() - startTime
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load customer details';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    analytics.trackEvent('customer_edit_clicked', { customerId: id });
    navigate(`/customers/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/customers/${id}`);
        analytics.trackEvent('customer_deleted', { customerId: id });
        toast.success('Customer deleted successfully!');
        navigate('/customers');
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to delete customer';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    }
  };

  if (loading) return <DetailPageSkeleton />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <ErrorMessage message="Customer not found" />;

  return (
    <div className="customer-detail">
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
          <button onClick={() => navigate('/customers')} className="btn-secondary">
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
          <CustomerAIInsights 
            customer={data}
            onApplySegmentation={(segmentData) => {
              console.log('Apply segmentation:', segmentData);
            }}
            onApplyNextBestAction={(actionData) => {
              console.log('Apply next best action:', actionData);
            }}
            onApplyRecommendations={(recommendations) => {
              console.log('Apply recommendations:', recommendations);
            }}
          />
        </section>

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

export default CustomerDetail;
