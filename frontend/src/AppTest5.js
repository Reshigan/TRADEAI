import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/App.css';

// Test 5: Test Layout component
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/Layout';

function AppTest5() {
  // Mock user data for Layout
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
        backgroundColor: '#e3f2fd', 
        marginBottom: '20px',
        borderRadius: '8px',
        border: '2px solid #2196f3'
      }}>
        <h2 style={{ color: '#1565c0', margin: '0 0 10px 0' }}>
          🧪 APP TEST 5 - Layout Component
        </h2>
        <p style={{ margin: '0', color: '#1976d2' }}>
          Testing: Layout component
        </p>
      </div>
      
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route 
              path="*" 
              element={
                <Layout user={mockUser}>
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h3>✅ Layout is working!</h3>
                    <p>If you can see this content inside the layout, Layout component is working correctly.</p>
                  </div>
                </Layout>
              } 
            />
          </Routes>
        </Router>
      </ErrorBoundary>
    </div>
  );
}

export default AppTest5;