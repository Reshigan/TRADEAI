import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const TradingTermFlow = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customer: '',
    customerName: '',
    termType: 'Volume Discount',
    description: '',
    paymentTerms: 'Net 30',
    value: '',
    valueType: 'Percentage',
    startDate: '',
    endDate: '',
    targetVolume: '',
    estimatedPayout: '',
    currency: 'INR',
    notes: ''
  });

  const steps = [
    { number: 1, title: 'Basic Info', icon: '📋' },
    { number: 2, title: 'Terms & Value', icon: '💰' },
    { number: 3, title: 'Timeline', icon: '📅' },
    { number: 4, title: 'Targets & Review', icon: '🎯' }
  ];

  const termTypes = [
    'Volume Discount',
    'Growth Incentive',
    'Listing Fee',
    'Annual Rebate',
    'Promotional Support',
    'Marketing Fund',
    'Distribution Support'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const termData = {
        termId: `TERM-${Date.now()}`,
        customerName: formData.customerName,
        termType: formData.termType,
        value: parseFloat(formData.value),
        valueType: formData.valueType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        paymentTerms: formData.paymentTerms,
        currency: formData.currency,
        status: 'Active'
      };

      await axios.post(`${API_BASE_URL}/trading-terms`, termData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      navigate('/trading-terms');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create term');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>📜 Create Trading Term</h1>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <div style={{ marginBottom: '15px' }}>
        <label>Customer Name *</label>
        <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>Term Type *</label>
        <select name="termType" value={formData.termType} onChange={handleInputChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
          {termTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
        <div>
          <label>Value *</label>
          <input type="number" name="value" value={formData.value} onChange={handleInputChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </div>
        <div>
          <label>Value Type *</label>
          <select name="valueType" value={formData.valueType} onChange={handleInputChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
            <option value="Percentage">Percentage</option>
            <option value="Fixed Amount">Fixed Amount</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
        <div>
          <label>Start Date *</label>
          <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </div>
        <div>
          <label>End Date *</label>
          <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </div>
      </div>

      <button onClick={handleSubmit} disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        {loading ? 'Creating...' : 'Create Trading Term'}
      </button>
    </div>
  );
};

export default TradingTermFlow;
