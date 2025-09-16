import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';

// Import components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import { BudgetList, BudgetDetail } from './components/budgets';
import BudgetListSimple from './components/budgets/BudgetListSimple';
import TestMinimal from './components/budgets/TestMinimal';
import { TradeSpendList, TradeSpendDetail } from './components/tradeSpends';
import { PromotionList, PromotionDetail } from './components/promotions';
import { CustomerList, CustomerDetail } from './components/customers';
import { ProductList, ProductDetail } from './components/products';
import { AnalyticsDashboard } from './components/analytics';
import { SettingsPage } from './components/settings';
import { UserList, UserDetail, UserForm } from './components/users';
import { ReportList, ReportBuilder } from './components/reports';
import { CompanyList, CompanyDetail, CompanyForm } from './components/companies';
import { TradingTermsList, TradingTermDetail, TradingTermForm } from './components/tradingTerms';
import ActivityGrid from './components/activityGrid';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user')) || null
  );

  // Effect to check for authentication changes
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem('isAuthenticated') === 'true';
      const userData = JSON.parse(localStorage.getItem('user')) || null;
      console.log('App.js useEffect - checking auth:', { authStatus, userData });
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
    console.log('handleLogin called with userData:', userData);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
    console.log('handleLogin completed, isAuthenticated should now be true');
    // Force a re-render by updating state after a brief delay
    setTimeout(() => {
      setIsAuthenticated(true);
      setUser(userData);
      console.log('handleLogin - forced state update completed');
    }, 100);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };

  return (
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
              <TestMinimal />
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
        <Route 
          path="/users" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <UserList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/users/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <UserDetail />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/users/:id/edit" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <UserForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/users/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <UserForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/reports" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ReportList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/reports/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ReportBuilder />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/companies" 
          element={
            isAuthenticated && user?.role === 'super_admin' ? (
              <Layout user={user} onLogout={handleLogout}>
                <CompanyList />
              </Layout>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        <Route 
          path="/companies/:id" 
          element={
            isAuthenticated && user?.role === 'super_admin' ? (
              <Layout user={user} onLogout={handleLogout}>
                <CompanyDetail />
              </Layout>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        <Route 
          path="/companies/:id/edit" 
          element={
            isAuthenticated && user?.role === 'super_admin' ? (
              <Layout user={user} onLogout={handleLogout}>
                <CompanyForm />
              </Layout>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        <Route 
          path="/companies/new" 
          element={
            isAuthenticated && user?.role === 'super_admin' ? (
              <Layout user={user} onLogout={handleLogout}>
                <CompanyForm />
              </Layout>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        <Route
          path="/activity-grid"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ActivityGrid />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route 
          path="/trading-terms" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradingTermsList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/trading-terms/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradingTermDetail />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/trading-terms/:id/edit" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradingTermForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/trading-terms/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradingTermForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;