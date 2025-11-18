import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ErrorMessage from '../../components/common/ErrorMessage';
import { DetailPageSkeleton } from '../../components/common/SkeletonLoader';
import { useToast } from '../../components/common/ToastNotification';
import analytics from '../../utils/analytics';
import './PromotionDetail.css';

const PromotionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPromotion();
    analytics.trackPageView('promotion_detail', { promotionId: id });
  }, [id]);

  const fetchPromotion = async () => {
    try {
      setLoading(true);
      const startTime = Date.now();
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/promotions/${id}`);
      setPromotion(response.data.data || response.data);
      setError(null);
      
      analytics.trackEvent('promotion_detail_loaded', {
        promotionId: id,
        loadTime: Date.now() - startTime
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load promotion details';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    analytics.trackEvent('promotion_edit_clicked', { promotionId: id });
    navigate(`/promotions/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/promotions/${id}`);
        analytics.trackEvent('promotion_deleted', { promotionId: id });
        toast.success('Promotion deleted successfully!');
        navigate('/promotions');
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to delete promotion';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    }
  };

  if (loading) return <DetailPageSkeleton />;
  if (error) return <ErrorMessage message={error} />;
  if (!promotion) return <ErrorMessage message="Promotion not found" />;

  return (
    <div className="promotion-detail">
      <div className="detail-header">
        <div className="header-content">
          <h1>{promotion.name}</h1>
          <span className={`status-badge status-${promotion.status}`}>
            {promotion.status}
          </span>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/promotions')} className="btn-secondary">
            Back to List
          </button>
          <button onClick={() => navigate(`/trade-spends?promotionId=${id}`)} className="btn-secondary">
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
          <h2>Basic Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Promotion Name</label>
              <p>{promotion.name}</p>
            </div>
            <div className="detail-item">
              <label>Type</label>
              <p>{promotion.type || 'N/A'}</p>
            </div>
            <div className="detail-item">
              <label>Status</label>
              <p>{promotion.status}</p>
            </div>
            <div className="detail-item">
              <label>Priority</label>
              <p>{promotion.priority || 'Normal'}</p>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <h2>Dates</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Start Date</label>
              <p>{promotion.startDate ? new Date(promotion.startDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="detail-item">
              <label>End Date</label>
              <p>{promotion.endDate ? new Date(promotion.endDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="detail-item">
              <label>Duration</label>
              <p>
                {promotion.startDate && promotion.endDate
                  ? `${Math.ceil((new Date(promotion.endDate) - new Date(promotion.startDate)) / (1000 * 60 * 60 * 24))} days`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <h2>Financial Details</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Budget</label>
              <p>R {promotion.budget ? promotion.budget.toLocaleString() : '0'}</p>
            </div>
            <div className="detail-item">
              <label>Spend</label>
              <p>R {promotion.actualSpend ? promotion.actualSpend.toLocaleString() : '0'}</p>
            </div>
            <div className="detail-item">
              <label>Remaining</label>
              <p className={promotion.budget && promotion.actualSpend && promotion.actualSpend > promotion.budget ? 'text-danger' : ''}>
                R {promotion.budget && promotion.actualSpend
                  ? (promotion.budget - promotion.actualSpend).toLocaleString()
                  : promotion.budget?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="detail-item">
              <label>ROI</label>
              <p>{promotion.roi ? `${promotion.roi}%` : 'N/A'}</p>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <h2>Description</h2>
          <p className="description-text">
            {promotion.description || 'No description available'}
          </p>
        </section>

        {promotion.products && promotion.products.length > 0 && (
          <section className="detail-section">
            <h2>Products</h2>
            <div className="products-list">
              {promotion.products.map((product, index) => (
                <div key={index} className="product-chip">
                  {product.name || product}
                </div>
              ))}
            </div>
          </section>
        )}

        {promotion.customers && promotion.customers.length > 0 && (
          <section className="detail-section">
            <h2>Target Customers</h2>
            <div className="customers-list">
              {promotion.customers.map((customer, index) => (
                <div key={index} className="customer-chip">
                  {customer.name || customer}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="detail-section">
          <h2>Metadata</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Created At</label>
              <p>{promotion.createdAt ? new Date(promotion.createdAt).toLocaleString() : 'N/A'}</p>
            </div>
            <div className="detail-item">
              <label>Last Updated</label>
              <p>{promotion.updatedAt ? new Date(promotion.updatedAt).toLocaleString() : 'N/A'}</p>
            </div>
            <div className="detail-item">
              <label>Created By</label>
              <p>{promotion.createdBy?.name || promotion.createdBy || 'N/A'}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PromotionDetail;
