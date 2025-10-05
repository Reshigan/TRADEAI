import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';

// Test 10: Add second batch of routes (Customers, Products, Analytics, Settings)
import ErrorBoundary from './components/common/ErrorBoundary';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
// First batch (working)
import { BudgetList, BudgetDetail } from './components/budgets';
import { TradeSpendList, TradeSpendDetail } from './components/tradeSpends';
import { PromotionList, PromotionDetail } from './components/promotions';
// Second batch (testing)
import { CustomerList, CustomerDetail } from './components/customers';
import { ProductList, ProductDetail } from './components/products';
import { AnalyticsDashboard } from './components/analytics';
import { SettingsPage } from './components/settings';

function AppTest10() {
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
      console.log('AppTest10 useEffect - checking auth:', { authStatus, userData });
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
    console.log('AppTest10 handleLogin called with userData:', userData);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
    console.log('AppTest10 handleLogin completed, isAuthenticated should now be true');
    // Force a re-render by updating state after a brief delay
    setTimeout(() => {
      setIsAuthenticated(true);
      setUser(userData);
      console.log('AppTest10 handleLogin - forced state update completed');
    }, 100);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };

  console.log('AppTest10 render - isAuthenticated:', isAuthenticated, 'user:', user);

  return (
    <div className="App">
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#e3f2fd', 
        marginBottom: '20px',
        borderRadius: '8px',
        border: '2px solid #2196f3'
      }}>
        <h2 style={{ color: '#0d47a1', margin: '0 0 10px 0' }}>
          🧪 APP TEST 10 - Second Batch of Routes
        </h2>
        <p style={{ margin: '0', color: '#1565c0' }}>
          Testing: First batch + Customers, Products, Analytics, Settings (isAuthenticated: {isAuthenticated ? 'true' : 'false'})
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
            {/* First batch routes (working) */}
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
            {/* Second batch routes (testing) */}
            <Route 
              path="/customers" 
              element={
                isAuthenticated ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <CustomerList />
                  </Layout>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/customers/:id" 
              element={
                isAuthenticated ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <CustomerDetail />
                  </Layout>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/products" 
              element={
                isAuthenticated ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <ProductList />
                  </Layout>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/products/:id" 
              element={
                isAuthenticated ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <ProductDetail />
                  </Layout>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/analytics" 
              element={
                isAuthenticated ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <AnalyticsDashboard />
                  </Layout>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/settings" 
              element={
                isAuthenticated && (user?.role === 'admin' || user?.role === 'super_admin') ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <SettingsPage />
                  </Layout>
                ) : (
                  <Navigate to="/dashboard" replace />
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

export default AppTest10;