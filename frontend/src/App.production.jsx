import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Layout
import MainLayout from './components/layout/MainLayout';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Activities
import ActivityFlow from './pages/activities/ActivityFlow';
import ActivityList from './pages/activities/ActivityList';
import ActivityDashboard from './pages/activities/ActivityDashboard';

// Trading Terms
import TradingTermFlow from './pages/trading-terms/TradingTermFlow';
import TermsList from './pages/trading-terms/TermsList';

// Sales Analytics
import SalesAnalytics from './pages/sales-analytics/SalesAnalytics';
import RevenueByPeriod from './pages/sales-analytics/RevenueByPeriod';
import TopCustomers from './pages/sales-analytics/TopCustomers';
import TopProducts from './pages/sales-analytics/TopProducts';

// Dashboards
import ExecutiveDashboard from './pages/dashboards/ExecutiveDashboard';
import SalesDashboard from './pages/dashboards/SalesDashboard';
import PromotionDashboard from './pages/dashboards/PromotionDashboard';

// Budgets
import BudgetOverview from './pages/budgets/BudgetOverview';
import BudgetAnalytics from './pages/budgets/BudgetAnalytics';

// Promotions & Campaigns
import PromotionList from './pages/promotions/PromotionList';
import CampaignList from './pages/campaigns/CampaignList';

// Master Data
import CustomerList from './pages/customers/CustomerList';
import ProductList from './pages/products/ProductList';
import VendorList from './pages/vendors/VendorList';

// Reports
import ReportBuilder from './pages/reports/ReportBuilder';

// Admin Tools
import CacheManagement from './pages/admin-tools/CacheManagement';
import SecurityMonitoring from './pages/admin-tools/SecurityMonitoring';
import PerformanceMetrics from './pages/admin-tools/PerformanceMetrics';

// Governance & Data Lineage
import DataLineageDashboard from './pages/governance/DataLineageDashboard';
import BaselineConfigPage from './pages/governance/BaselineConfigPage';
import VarianceAnalysisPage from './pages/governance/VarianceAnalysisPage';

// Integrations
import WebhookManagementPage from './pages/integrations/WebhookManagementPage';
import BusinessRulesPage from './pages/admin/BusinessRulesPage';

// Common Components
import LoadingSpinner from './components/common/LoadingSpinner';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

function AppProduction() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    verifyAuth();
  }, []);

  const verifyAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get('/auth/me');
      
      if (response.data.success) {
        setAuthenticated(true);
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Initializing application..." />;
  }

  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes - Activities */}
          <Route 
            path="/activities" 
            element={
              <ProtectedRoute>
                <ActivityList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/activities/new" 
            element={
              <ProtectedRoute>
                <ActivityFlow />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/activities/dashboard" 
            element={
              <ProtectedRoute>
                <ActivityDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Protected Routes - Trading Terms */}
          <Route 
            path="/trading-terms" 
            element={
              <ProtectedRoute>
                <TermsList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trading-terms/new" 
            element={
              <ProtectedRoute>
                <TradingTermFlow />
              </ProtectedRoute>
            } 
          />

          {/* Protected Routes - Sales Analytics */}
          <Route 
            path="/sales-analytics" 
            element={
              <ProtectedRoute>
                <SalesAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sales-analytics/revenue" 
            element={
              <ProtectedRoute>
                <RevenueByPeriod />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sales-analytics/top-customers" 
            element={
              <ProtectedRoute>
                <TopCustomers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sales-analytics/top-products" 
            element={
              <ProtectedRoute>
                <TopProducts />
              </ProtectedRoute>
            } 
          />

          {/* Protected Routes - Dashboards */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <ExecutiveDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/sales" 
            element={
              <ProtectedRoute>
                <SalesDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/promotions" 
            element={
              <ProtectedRoute>
                <PromotionDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Protected Routes - Budgets */}
          <Route 
            path="/budgets" 
            element={
              <ProtectedRoute>
                <BudgetOverview />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/budgets/analytics" 
            element={
              <ProtectedRoute>
                <BudgetAnalytics />
              </ProtectedRoute>
            } 
          />

          {/* Protected Routes - Master Data */}
          <Route 
            path="/promotions" 
            element={
              <ProtectedRoute>
                <PromotionList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/campaigns" 
            element={
              <ProtectedRoute>
                <CampaignList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customers" 
            element={
              <ProtectedRoute>
                <CustomerList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/products" 
            element={
              <ProtectedRoute>
                <ProductList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vendors" 
            element={
              <ProtectedRoute>
                <VendorList />
              </ProtectedRoute>
            } 
          />

          {/* Protected Routes - Reports */}
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <ReportBuilder />
              </ProtectedRoute>
            } 
          />

          {/* Protected Routes - Admin */}
          <Route 
            path="/admin/cache" 
            element={
              <ProtectedRoute>
                <CacheManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/security" 
            element={
              <ProtectedRoute>
                <SecurityMonitoring />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/performance" 
            element={
              <ProtectedRoute>
                <PerformanceMetrics />
              </ProtectedRoute>
            } 
          />

          {/* Protected Routes - Business Rules */}
          <Route 
            path="/admin/business-rules" 
            element={
              <ProtectedRoute>
                <BusinessRulesPage />
              </ProtectedRoute>
            } 
          />

          {/* Protected Routes - Governance & Data Lineage */}
          <Route 
            path="/governance/data-lineage" 
            element={
              <ProtectedRoute>
                <DataLineageDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/governance/baseline-config" 
            element={
              <ProtectedRoute>
                <BaselineConfigPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/governance/variance-analysis" 
            element={
              <ProtectedRoute>
                <VarianceAnalysisPage />
              </ProtectedRoute>
            } 
          />

          {/* Protected Routes - Integrations */}
          <Route 
            path="/integrations/webhooks" 
            element={
              <ProtectedRoute>
                <WebhookManagementPage />
              </ProtectedRoute>
            } 
          />

          {/* Default Routes */}
          <Route path="/" element={authenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppProduction;
