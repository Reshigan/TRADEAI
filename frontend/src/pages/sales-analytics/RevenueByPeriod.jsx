import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const RevenueByPeriod = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState('month');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchData();
  }, [period, dateRange]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ period });
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await axios.get(`${API_BASE_URL}/sales-transactions/revenue-by-period?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);

  const getTotalRevenue = () => data.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
  const getTotalTransactions = () => data.reduce((sum, item) => sum + (item.transactionCount || 0), 0);
  const getAvgTransaction = () => {
    const total = getTotalTransactions();
    return total > 0 ? getTotalRevenue() / total : 0;
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading revenue data...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>💰 Revenue by Period</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Time-series revenue analysis</p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="quarter">Quarterly</option>
          <option value="year">Yearly</option>
        </select>

        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
          placeholder="Start Date"
        />

        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
          placeholder="End Date"
        />

        <button onClick={fetchData} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Apply
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Total Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(getTotalRevenue())}</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Total Transactions</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{getTotalTransactions().toLocaleString()}</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Avg Transaction</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(getAvgTransaction())}</div>
        </div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
        <h3 style={{ marginBottom: '20px' }}>Revenue Trend</h3>
        
        <div>
          {data.map((item, index) => {
            const maxRevenue = Math.max(...data.map(d => d.totalRevenue));
            const barWidth = (item.totalRevenue / maxRevenue * 100);
            
            return (
              <div key={index} style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {period === 'month' && `${item._id?.year}-${String(item._id?.month).padStart(2, '0')}`}
                      {period === 'quarter' && `Q${item._id?.quarter} ${item._id?.year}`}
                      {period === 'year' && item._id?.year}
                      {period === 'week' && `Week ${item._id?.week} ${item._id?.year}`}
                      {period === 'day' && `${item._id?.year}-${String(item._id?.month).padStart(2, '0')}-${String(item._id?.day).padStart(2, '0')}`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      {item.transactionCount} transactions | {item.totalQuantity} units
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{formatCurrency(item.totalRevenue)}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      Avg: {formatCurrency(item.avgTransactionValue)}
                    </div>
                  </div>
                </div>
                
                <div style={{ width: '100%', height: '10px', backgroundColor: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${barWidth}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.3s' }} />
                </div>
              </div>
            );
          })}
        </div>

        {data.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
            No revenue data available for the selected period
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueByPeriod;
