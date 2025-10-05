import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';

// Test 9: Add routes gradually to identify the problematic one
import ErrorBoundary from './components/common/ErrorBoundary';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
// Add first batch of imports
import { BudgetList, BudgetDetail } from './components/budgets';
import { TradeSpendList, TradeSpendDetail } from './components/tradeSpends';
import { PromotionList, PromotionDetail } from './components/promotions';

function AppTest9() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  // Effect to check for authentication changes
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem('isAuthenticated') === 'true';
      const userDataString = localStorage.getItem('user');
      const userData = userDataString ? JSON.parse(userDataString) : null;
      console.log('AppTest9 useEffect - checking auth:', { authStatus, userData });
      setIsAuthenticated(authStatus);
      setUser(userData);
    };

    // Check on mount
    checkAuth();

    // Listen for storage changes (in case of multiple tabs)
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const handleLogin = (userData) => {
    console.log('AppTest9 handleLogin called with userData:', userData);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
    console.log('AppTest9 handleLogin completed, isAuthenticated should now be true');
    // Force a re-render by updating state after a brief delay
    setTimeout(() => {
      setIsAuthenticated(true);
      setUser(userData);
      console.log('AppTest9 handleLogin - forced state update completed');
    }, 100);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };

  console.log('AppTest9 render - isAuthenticated:', isAuthenticated, 'user:', user);

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
          🧪 APP TEST 9 - First Batch of Routes
        </h2>
        <p style={{ margin: '0', color: '#f57c00' }}>
          Testing: Basic routes + Budgets, TradeSpends, Promotions (isAuthenticated: {isAuthenticated ? 'true' : 'false'})
        </p>
      </div>
      
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route 
              path="/" 
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <Dashboard user={user} />
                  </Layout>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/budgets" 
              element={
                isAuthenticated ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <BudgetList />
                  </Layout>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/budgets/:id" 
              element={
                isAuthenticated ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <BudgetDetail />
                  </Layout>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/trade-spends" 
              element={
                isAuthenticated ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <TradeSpendList />
                  </Layout>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/trade-spends/:id" 
              element={
                isAuthenticated ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <TradeSpendDetail />
                  </Layout>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/promotions" 
              element={
                isAuthenticated ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <PromotionList />
                  </Layout>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/promotions/:id" 
              element={
                isAuthenticated ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <PromotionDetail />
                  </Layout>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </div>
  );
}

export default AppTest9;