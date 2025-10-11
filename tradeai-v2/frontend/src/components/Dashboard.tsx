import React, { useState, useEffect } from 'react';

interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  totalBudgets: number;
  totalTradeSpend: number;
  activeTradingTerms: number;
  activeActivityGrids: number;
  budgetUtilization: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

interface DashboardProps {
  tenantSlug: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ tenantSlug }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalProducts: 0,
    totalBudgets: 0,
    totalTradeSpend: 0,
    activeTradingTerms: 0,
    activeActivityGrids: 0,
    budgetUtilization: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API calls to fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // In a real app, these would be actual API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalCustomers: 45,
          totalProducts: 128,
          totalBudgets: 12,
          totalTradeSpend: 245000,
          activeTradingTerms: 23,
          activeActivityGrids: 8,
          budgetUtilization: 67.5,
          recentActivity: [
            {
              id: '1',
              type: 'budget',
              description: 'New marketing budget created for Q4',
              timestamp: '2025-10-11T10:30:00Z'
            },
            {
              id: '2',
              type: 'customer',
              description: 'Customer "Retail Corp" updated',
              timestamp: '2025-10-11T09:15:00Z'
            },
            {
              id: '3',
              type: 'trade_spend',
              description: 'Trade spend approved: $15,000',
              timestamp: '2025-10-11T08:45:00Z'
            }
          ]
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [tenantSlug]);

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>TRADEAI Dashboard</h1>
        <p>Welcome to your trade marketing management system</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalCustomers}</h3>
            <p>Total Customers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.totalProducts}</h3>
            <p>Total Products</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{stats.totalBudgets}</h3>
            <p>Active Budgets</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💸</div>
          <div className="stat-content">
            <h3>${stats.totalTradeSpend.toLocaleString()}</h3>
            <p>Total Trade Spend</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.activeTradingTerms}</h3>
            <p>Active Trading Terms</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.activeActivityGrids}</h3>
            <p>Activity Grids</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Budget Utilization</h2>
          <div className="budget-utilization">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${stats.budgetUtilization}%` }}
              ></div>
            </div>
            <p>{stats.budgetUtilization}% of total budget utilized</p>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {stats.recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-type">{activity.type}</div>
                <div className="activity-description">{activity.description}</div>
                <div className="activity-timestamp">
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button className="action-btn">
              <span>➕</span>
              Create Customer
            </button>
            <button className="action-btn">
              <span>📦</span>
              Add Product
            </button>
            <button className="action-btn">
              <span>💰</span>
              New Budget
            </button>
            <button className="action-btn">
              <span>📊</span>
              Activity Grid
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};