import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/App.css';

// Test 3: Test Login component
import ErrorBoundary from './components/common/ErrorBoundary';
import Login from './components/Login';

function AppTest3() {
  const handleLogin = (userData) => {
    console.log('Login successful:', userData);
  };

  return (
    <div className="App">
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fff3e0', 
        marginBottom: '20px',
        borderRadius: '8px',
        border: '2px solid #ff9800'
      }}>
        <h2 style={{ color: '#e65100', margin: '0 0 10px 0' }}>
          🧪 APP TEST 3 - Login Component
        </h2>
        <p style={{ margin: '0', color: '#f57c00' }}>
          Testing: Login component
        </p>
      </div>
      
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route 
              path="*" 
              element={<Login onLogin={handleLogin} />} 
            />
          </Routes>
        </Router>
      </ErrorBoundary>
    </div>
  );
}

export default AppTest3;