import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BudgetAIInsights from '../../components/ai/budgets/BudgetAIInsights';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const BudgetOverview = () => {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, allocated: 0, spent: 0, remaining: 0 });

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/budgets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        const budgetData = response.data.data;
        setBudgets(budgetData);
        
        const total = budgetData.reduce((sum, b) => sum + (b.totalBudget || 0), 0);
        const allocated = budgetData.reduce((sum, b) => sum + (b.allocated || 0), 0);
        const spent = budgetData.reduce((sum, b) => sum + (b.spent || 0), 0);
        
        setSummary({ total, allocated, spent, remaining: allocated - spent });
      }
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
  
  const getUtilizationColor = (percent) => {
    if (percent >= 90) return '#ef4444';
    if (percent >= 75) return '#f59e0b';
    return '#10b981';
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading budgets...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h1>💰 Budget Overview</h1>
          <p style={{ color: '#666' }}>{budgets.length} budget(s) found</p>
        </div>
        <button onClick={() => navigate('/budgets/new')} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          + New Budget
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Budget</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatCurrency(summary.total)}</div>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Allocated</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatCurrency(summary.allocated)}</div>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Spent</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatCurrency(summary.spent)}</div>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Remaining</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(summary.remaining)}</div>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <BudgetAIInsights 
          budget={{
            _id: 'overview',
            name: 'Overall Budget Portfolio',
            totalAmount: summary.total,
            allocation: summary.allocated,
            spendRate: summary.allocated > 0 ? (summary.spent / summary.allocated) * 100 : 0,
            remainingAmount: summary.remaining,
            performance: budgets.map(b => ({ id: b._id, name: b.budgetName, roi: b.roi || 0 }))
          }}
          onApplyReallocation={(reallocationData) => {
            console.log('Apply reallocation:', reallocationData);
          }}
          onApplyOptimization={(optimizationData) => {
            console.log('Apply optimization:', optimizationData);
          }}
          onApplyForecasting={(forecastData) => {
            console.log('Apply forecasting:', forecastData);
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {budgets.map(budget => {
          const utilization = budget.allocated ? ((budget.spent / budget.allocated) * 100).toFixed(1) : 0;
          
          return (
            <div key={budget._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white', cursor: 'pointer' }} onClick={() => navigate(`/budgets/${budget._id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>{budget.budgetName}</h3>
                <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', backgroundColor: budget.status === 'Active' ? '#10b981' : '#6b7280', color: 'white' }}>
                  {budget.status}
                </span>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>Department: {budget.department}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Period: {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}</div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' }}>
                  <span>Allocated: {formatCurrency(budget.allocated)}</span>
                  <span>Spent: {formatCurrency(budget.spent)}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${utilization}%`, height: '100%', backgroundColor: getUtilizationColor(utilization), transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px', textAlign: 'right' }}>
                  {utilization}% utilized
                </div>
              </div>

              <button onClick={(e) => { e.stopPropagation(); navigate(`/budgets/${budget._id}/edit`); }} style={{ width: '100%', padding: '8px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>
                Edit Budget
              </button>
            </div>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3>No budgets found</h3>
          <button onClick={() => navigate('/budgets/new')} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            + Create Budget
          </button>
        </div>
      )}
    </div>
  );
};

export default BudgetOverview;
