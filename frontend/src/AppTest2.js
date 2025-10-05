import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/App.css';

// Test 2: Test only ErrorBoundary
import ErrorBoundary from './components/common/ErrorBoundary';

function AppTest2() {
  return (
    <div className="App">
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#e8f5e8', 
        marginBottom: '20px',
        borderRadius: '8px',
        border: '2px solid #4caf50'
      }}>
        <h2 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>
          🧪 APP TEST 2 - ErrorBoundary Only
        </h2>
        <p style={{ margin: '0', color: '#388e3c' }}>
          Testing: ErrorBoundary component only
        </p>
      </div>
      
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route 
              path="*" 
              element={
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <h3>✅ ErrorBoundary is working!</h3>
                  <p>If you can see this, ErrorBoundary is not the problem.</p>
                </div>
              } 
            />
          </Routes>
        </Router>
      </ErrorBoundary>
    </div>
  );
}

export default AppTest2;