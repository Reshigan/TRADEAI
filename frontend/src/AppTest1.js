import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';

// Test 1: Only import the most essential components
import ErrorBoundary from './components/common/ErrorBoundary';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import NotFound from './components/NotFound';

function AppTest1() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated.toString());
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const handleLogin = (userData) => {
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
        <div className="App">
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#e3f2fd', 
            marginBottom: '20px',
            borderRadius: '8px',
            border: '2px solid #1976d2'
          }}>
            <h2 style={{ color: '#1976d2', margin: '0 0 10px 0' }}>
              🧪 APP TEST 1 - Core Components Only
            </h2>
            <p style={{ margin: '0', color: '#1565c0' }}>
              Testing: ErrorBoundary, Login, Dashboard, Layout, NotFound
            </p>
          </div>
          
          <Routes>
            <Route 
              path="/login" 
              element={
                !isAuthenticated ? (
                  <Login onLogin={handleLogin} />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <Dashboard />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            <Route 
              path="/" 
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default AppTest1;