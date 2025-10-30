import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const TopCustomers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('revenue');

  useEffect(() => {
    fetchCustomers();
  }, [limit, sortBy]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: limit.toString(), sortBy });

      const response = await axios.get(`${API_BASE_URL}/sales-transactions/top-customers?${params}`, {
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

  const getTotalRevenue = () => customers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
  const getTotalTransactions = () => customers.reduce((sum, c) => sum + (c.transactionCount || 0), 0);

  if (loading) return <div style={{ padding: '20px' }}>Loading top customers...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>👥 Top Customers</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Customer ranking by revenue and transactions</p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <select value={limit} onChange={(e) => setLimit(parseInt(e.target.value))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <option value="5">Top 5</option>
          <option value="10">Top 10</option>
          <option value="20">Top 20</option>
          <option value="50">Top 50</option>
          <option value="100">Top 100</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <option value="revenue">Sort by Revenue</option>
          <option value="transactions">Sort by Transactions</option>
          <option value="quantity">Sort by Quantity</option>
          <option value="avgValue">Sort by Avg Value</option>
        </select>

        <button onClick={fetchCustomers} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Total Customers</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{customers.length}</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Combined Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(getTotalRevenue())}</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Combined Transactions</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{getTotalTransactions().toLocaleString()}</div>
        </div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
        <h3 style={{ marginBottom: '20px' }}>Customer Rankings</h3>
        
        <div style={{ overflowX: 'auto' }}>
          {customers.map((customer, index) => (
            <div 
              key={index} 
              style={{ padding: '20px', borderBottom: '1px solid #eee', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              onClick={() => navigate(`/customers/${customer.customer?._id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    backgroundColor: index < 3 ? '#fbbf24' : '#3b82f6', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 'bold',
                    fontSize: '18px'
                  }}>
                    #{index + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{customer.customer?.name || customer.customerName || 'Unknown Customer'}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      {customer.transactionCount} transactions | {customer.totalQuantity} units
                    </div>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '24px', color: '#10b981' }}>{formatCurrency(customer.totalRevenue)}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Avg: {formatCurrency(customer.avgTransactionValue)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '5px' }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>First Purchase</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                    {customer.firstPurchase ? new Date(customer.firstPurchase).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '5px' }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>Last Purchase</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                    {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '5px' }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>Avg Order Size</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                    {(customer.totalQuantity / customer.transactionCount).toFixed(1)} units
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {customers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
            No customer data available
          </div>
        )}
      </div>
    </div>
  );
};

export default TopCustomers;
