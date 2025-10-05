import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/App.css';

// Test 6: Test NotFound component - likely the culprit!
import ErrorBoundary from './components/common/ErrorBoundary';
import NotFound from './components/NotFound';

function AppTest6() {
  return (
    <div className="App">
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#ffebee', 
        marginBottom: '20px',
        borderRadius: '8px',
        border: '2px solid #f44336'
      }}>
        <h2 style={{ color: '#c62828', margin: '0 0 10px 0' }}>
          🧪 APP TEST 6 - NotFound Component
        </h2>
        <p style={{ margin: '0', color: '#d32f2f' }}>
          Testing: NotFound component (likely the problematic one!)
        </p>
      </div>
      
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route 
              path="*" 
              element={<NotFound />} 
            />
          </Routes>
        </Router>
      </ErrorBoundary>
    </div>
  );
}

export default AppTest6;