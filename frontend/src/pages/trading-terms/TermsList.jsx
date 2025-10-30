import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const TermsList = () => {
  const navigate = useNavigate();
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: 'all', termType: 'all' });

  useEffect(() => {
    fetchTerms();
  }, [filters]);

  const fetchTerms = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.termType !== 'all') params.append('termType', filters.termType);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API_BASE_URL}/trading-terms?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setTerms(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch terms:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading trading terms...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1>📜 Trading Terms</h1>
          <p>{terms.length} terms found</p>
        </div>
        <button onClick={() => navigate('/trading-terms/new')} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          + New Term
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search terms..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
        />
        <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
          <option value="Pending">Pending</option>
        </select>
        <select value={filters.termType} onChange={(e) => setFilters(prev => ({ ...prev, termType: e.target.value }))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <option value="all">All Types</option>
          <option value="Volume Discount">Volume Discount</option>
          <option value="Growth Incentive">Growth Incentive</option>
          <option value="Annual Rebate">Annual Rebate</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {terms.map(term => (
          <div key={term._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white', cursor: 'pointer' }} onClick={() => navigate(`/trading-terms/${term._id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>{term.customerName}</h3>
              <span style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', backgroundColor: term.status === 'Active' ? '#10b981' : '#6b7280', color: 'white' }}>
                {term.status}
              </span>
            </div>
            <p><strong>Type:</strong> {term.termType}</p>
            <p><strong>Value:</strong> {term.value}{term.valueType === 'Percentage' ? '%' : ` ${term.currency}`}</p>
            <p><strong>Payment Terms:</strong> {term.paymentTerms}</p>
            <p><strong>Duration:</strong> {formatDate(term.startDate)} - {formatDate(term.endDate)}</p>
            {term.estimatedPayout && <p><strong>Est. Payout:</strong> {formatCurrency(term.estimatedPayout, term.currency)}</p>}
          </div>
        ))}
      </div>

      {terms.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3>No trading terms found</h3>
          <button onClick={() => navigate('/trading-terms/new')} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            + Create Term
          </button>
        </div>
      )}
    </div>
  );
};

export default TermsList;
