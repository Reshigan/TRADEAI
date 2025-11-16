import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = search ? `?search=${search}` : '';
      const response = await axios.get(`${API_BASE_URL}/customers${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setCustomers(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);

  if (loading) return <div style={{ padding: '20px' }}>Loading customers...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1>👥 Customers</h1>
          <p>{customers.length} customers</p>
        </div>
        <button onClick={() => navigate('/customers/new')} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          + New Customer
        </button>
      </div>

      <input
        type="text"
        placeholder="Search customers by name, code, or location..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '20px' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {customers.map(customer => (
          <div key={customer._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white', cursor: 'pointer' }} onClick={() => navigate(`/customers/${customer._id}`)}>
            <h3 style={{ marginBottom: '10px' }}>{customer.customerName}</h3>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              <strong>Code:</strong> {customer.customerCode}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              <strong>Type:</strong> {customer.customerType}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              <strong>Location:</strong> {customer.location?.city}, {customer.location?.state}
            </div>
            {customer.creditLimit && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f9ff', borderRadius: '5px' }}>
                <strong style={{ color: '#3b82f6' }}>Credit Limit:</strong> {formatCurrency(customer.creditLimit)}
              </div>
            )}
          </div>
        ))}
      </div>

      {customers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3>No customers found</h3>
          <button onClick={() => navigate('/customers/new')} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            + Add Customer
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
