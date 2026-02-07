import React, { useState, useEffect } from 'react';
import apiClient from '../services/api/apiClient';
import './TransactionDashboard.css';

const TransactionDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'accrual',
    amount: '',
    customerId: '',
    productId: '',
    description: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/transactions?status=${filter}`);
      setTransactions(response.data.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/transactions', formData);
      setShowCreateModal(false);
      fetchTransactions();
      setFormData({ type: 'accrual', amount: '', customerId: '', productId: '', description: '' });
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Error creating transaction');
    }
  };

  const handleApprove = async (id) => {
    try {
      await apiClient.post(`/transactions/${id}/approve`, {});
      fetchTransactions();
    } catch (error) {
      console.error('Error approving transaction:', error);
      alert('Error approving transaction');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    
    try {
      await apiClient.post(`/transactions/${id}/reject`, { reason });
      fetchTransactions();
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      alert('Error rejecting transaction');
    }
  };

  const handleSettle = async (id) => {
    const reference = prompt('Payment reference:');
    if (!reference) return;
    
    try {
      await apiClient.post(`/transactions/${id}/settle`, { paymentReference: reference });
      fetchTransactions();
    } catch (error) {
      console.error('Error settling transaction:', error);
      alert('Error settling transaction');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'badge-gray',
      pending: 'badge-yellow',
      approved: 'badge-green',
      rejected: 'badge-red',
      settled: 'badge-blue'
    };
    return <span className={`badge ${colors[status]}`}>{status.toUpperCase()}</span>;
  };

  return (
    <div className="transaction-dashboard">
      <div className="dashboard-header">
        <h1>Transaction Management</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Transaction
        </button>
      </div>

      <div className="filter-tabs">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          All Transactions
        </button>
        <button className={filter === 'draft' ? 'active' : ''} onClick={() => setFilter('draft')}>
          Drafts
        </button>
        <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
          Pending Approval
        </button>
        <button className={filter === 'approved' ? 'active' : ''} onClick={() => setFilter('approved')}>
          Approved
        </button>
        <button className={filter === 'settled' ? 'active' : ''} onClick={() => setFilter('settled')}>
          Settled
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading transactions...</div>
      ) : (
        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(txn => (
                <tr key={txn.id || txn._id}>
                  <td>{txn._id.substring(0, 8)}</td>
                  <td>{txn.type}</td>
                  <td>${txn.amount.toLocaleString()}</td>
                  <td>{txn.customer?.name || 'N/A'}</td>
                  <td>{txn.product?.name || 'N/A'}</td>
                  <td>{getStatusBadge(txn.status)}</td>
                  <td>{new Date(txn.createdAt).toLocaleDateString()}</td>
                  <td className="actions">
                    {txn.status === 'pending' && (
                      <>
                        <button className="btn-sm btn-success" onClick={() => handleApprove(txn._id)}>
                          Approve
                        </button>
                        <button className="btn-sm btn-danger" onClick={() => handleReject(txn._id)}>
                          Reject
                        </button>
                      </>
                    )}
                    {txn.status === 'approved' && (
                      <button className="btn-sm btn-primary" onClick={() => handleSettle(txn._id)}>
                        Settle
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Transaction</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Transaction Type</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  required
                >
                  <option value="accrual">Accrual</option>
                  <option value="settlement">Settlement</option>
                  <option value="rebate">Rebate</option>
                  <option value="allowance">Allowance</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount ($)</label>
                <input 
                  type="number" 
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Customer ID</label>
                <input 
                  type="text" 
                  value={formData.customerId}
                  onChange={e => setFormData({...formData, customerId: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Product ID</label>
                <input 
                  type="text" 
                  value={formData.productId}
                  onChange={e => setFormData({...formData, productId: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDashboard;
