import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';

// Import only essential components
import ErrorBoundary from './components/common/ErrorBoundary';
import Login from './components/Login';

function SimpleApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  const handleLogin = (userData) => {
    console.log('handleLogin called with userData:', userData);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <h1>Welcome to Trade AI!</h1>
                  <p>Hello, {user?.name || 'User'}!</p>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              ) : (
                <Login onLogin={handleLogin} />
              )
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <h1>Dashboard</h1>
                  <p>Welcome to your dashboard, {user?.name || 'User'}!</p>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route path="*" element={<div>Page not found</div>} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default SimpleApp;