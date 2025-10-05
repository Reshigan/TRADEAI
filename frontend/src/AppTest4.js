import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/App.css';

// Test 4: Test Dashboard component
import ErrorBoundary from './components/common/ErrorBoundary';
import Dashboard from './components/Dashboard';

function AppTest4() {
  // Mock user data for Dashboard
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@tradeai.com',
    role: 'admin'
  };

  return (
    <div className="App">
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f3e5f5', 
        marginBottom: '20px',
        borderRadius: '8px',
        border: '2px solid #9c27b0'
      }}>
        <h2 style={{ color: '#6a1b9a', margin: '0 0 10px 0' }}>
          🧪 APP TEST 4 - Dashboard Component
        </h2>
        <p style={{ margin: '0', color: '#8e24aa' }}>
          Testing: Dashboard component
        </p>
      </div>
      
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route 
              path="*" 
              element={<Dashboard user={mockUser} />} 
            />
          </Routes>
        </Router>
      </ErrorBoundary>
    </div>
  );
}

export default AppTest4;