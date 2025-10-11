import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

interface HealthStatus {
  status: string;
  service: string;
  version: string;
}

interface Customer {
  id: string;
  name: string;
  code: string;
  customer_type: string;
  status: string;
  email?: string;
  city?: string;
  country?: string;
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check API health
        const healthResponse = await axios.get('/api/v1/health/');
        setHealth(healthResponse.data);

        // Try to fetch customers (will fail without auth, but shows API is working)
        try {
          const customersResponse = await axios.get('/api/v1/customers/');
          setCustomers(customersResponse.data);
        } catch (authError) {
          // Expected - no authentication yet
          console.log('Authentication required for customers endpoint');
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to connect to API');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading TRADEAI v2.0...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Connection Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 TRADEAI v2.0</h1>
        <p>Trade Spend Management Platform</p>
      </header>

      <main className="app-main">
        <div className="status-card">
          <h2>🟢 System Status</h2>
          {health && (
            <div className="status-info">
              <p><strong>Service:</strong> {health.service}</p>
              <p><strong>Version:</strong> {health.version}</p>
              <p><strong>Status:</strong> <span className="status-healthy">{health.status}</span></p>
            </div>
          )}
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <h3>📊 API Endpoints</h3>
            <ul>
              <li>✅ Authentication (JWT)</li>
              <li>✅ Customer Management</li>
              <li>✅ Product Catalog</li>
              <li>✅ Budget Management</li>
              <li>✅ Promotion Management</li>
              <li>🔄 Trade Spend (In Progress)</li>
              <li>🔄 Trading Terms (In Progress)</li>
              <li>🔄 Activity Grids (In Progress)</li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>🏗️ Infrastructure</h3>
            <ul>
              <li>✅ FastAPI Backend</li>
              <li>✅ SQLAlchemy ORM</li>
              <li>✅ Multi-tenant Architecture</li>
              <li>✅ Database Models (10 tables)</li>
              <li>✅ Docker Containerization</li>
              <li>✅ Auto-generated API Docs</li>
              <li>✅ Health Monitoring</li>
              <li>✅ React Frontend</li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>🔐 Security & Auth</h3>
            <ul>
              <li>✅ JWT Authentication</li>
              <li>✅ Password Hashing</li>
              <li>✅ Tenant Isolation</li>
              <li>✅ API Key Support</li>
              <li>🔄 Role-based Access Control</li>
              <li>🔄 Permission Management</li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>📈 Progress</h3>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: '50%'}}></div>
            </div>
            <p><strong>50% Complete</strong></p>
            <p>Ready for MVP deployment with core functionality</p>
            <div className="next-steps">
              <h4>Next Steps:</h4>
              <ul>
                <li>Complete remaining API endpoints</li>
                <li>Add business workflow logic</li>
                <li>Implement RBAC permissions</li>
                <li>Enhanced frontend features</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="api-docs">
          <h2>📚 API Documentation</h2>
          <p>Interactive API documentation is available at:</p>
          <a 
            href="/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="docs-link"
          >
            🔗 FastAPI Swagger UI - /docs
          </a>
        </div>
      </main>

      <footer className="app-footer">
        <p>TRADEAI v2.0 - Accelerated Development Using Existing Patterns</p>
      </footer>
    </div>
  );
}

export default App;