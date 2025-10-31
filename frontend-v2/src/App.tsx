import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLayout } from './components/Layout/MainLayout';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { PromotionsList } from './pages/promotions/PromotionsList';
import { CreatePromotion } from './pages/promotions/CreatePromotion';
import { CustomersList } from './pages/customers/CustomersList';
import { ProductsList } from './pages/products/ProductsList';
import { BudgetsList } from './pages/budgets/BudgetsList';
import { MLPage } from './pages/ml/MLPage';
import { CustomerFlow } from './components/workflows/CustomerFlow';
import RebatesList from './pages/rebates/RebatesList';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import SystemSettings from './pages/admin/SystemSettings';
import AnalyticsDashboard from './pages/reports/AnalyticsDashboard';

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="promotions" element={<PromotionsList />} />
              <Route path="promotions/create" element={<CreatePromotion />} />
              <Route path="customers" element={<CustomersList />} />
              <Route path="customers/create" element={<CustomerFlow />} />
              <Route path="products" element={<ProductsList />} />
              <Route path="budgets" element={<BudgetsList />} />
              <Route path="rebates" element={<RebatesList />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/users" element={<UsersManagement />} />
              <Route path="admin/settings" element={<SystemSettings />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
              <Route path="ml" element={<MLPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
