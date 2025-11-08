import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import './ProductDetail.css';

const ProductDetail = () => {
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
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/products/${id}`);
      setData(response.data.data || response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/products/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/products/${id}`);
        navigate('/products');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <ErrorMessage message="Product not found" />;

  return (
    <div className="product-detail">
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
          <button onClick={() => navigate('/products')} className="btn-secondary">
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
          <h2>Information</h2>
          <div className="detail-grid">
            {Object.keys(data).filter(key => !['_id', '__v', 'createdAt', 'updatedAt'].includes(key)).map(key => {
              let displayValue = 'N/A';
              try {
                if (data[key] === null || data[key] === undefined) {
                  displayValue = 'N/A';
                } else if (typeof data[key] === 'object') {
                  displayValue = JSON.stringify(data[key]);
                } else if (typeof data[key] === 'number') {
                  displayValue = data[key].toLocaleString();
                } else {
                  displayValue = String(data[key]);
                }
              } catch (error) {
                displayValue = 'N/A';
              }
              
              return (
                <div key={key} className="detail-item">
                  <label>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</label>
                  <p>{displayValue}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="detail-section">
          <h2>Metadata</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Created At</label>
              <p>{data.createdAt && data.createdAt !== 'N/A' ? new Date(data.createdAt).toLocaleString() : 'N/A'}</p>
            </div>
            <div className="detail-item">
              <label>Last Updated</label>
              <p>{data.updatedAt && data.updatedAt !== 'N/A' ? new Date(data.updatedAt).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;
