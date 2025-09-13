import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';

// Import components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import { BudgetList, BudgetDetail } from './components/budgets';
import { TradeSpendList, TradeSpendDetail } from './components/tradeSpends';
import { PromotionList, PromotionDetail } from './components/promotions';
import { CustomerList, CustomerDetail } from './components/customers';
import { ProductList, ProductDetail } from './components/products';
import { AnalyticsDashboard } from './components/analytics';
import { SettingsPage } from './components/settings';
import { UserList, UserDetail, UserForm } from './components/users';
import { ReportList, ReportBuilder } from './components/reports';
import { CompanyList, CompanyDetail, CompanyForm } from './components/companies';
import ActivityGrid from './components/activityGrid';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user')) || null
  );

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
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
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <SettingsPage />
              </Layout>
            ) : (
              <Navigate to="/" replace />
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
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CompanyList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/companies/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CompanyDetail />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/companies/:id/edit" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CompanyForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/companies/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CompanyForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;