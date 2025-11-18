import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import LoginPage from '../pages/auth/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import BudgetsListPage from '../pages/budgets/BudgetsListPage'
import BudgetDetailPage from '../pages/budgets/BudgetDetailPage'
import PromotionsListPage from '../pages/promotions/PromotionsListPage'
import CustomersListPage from '../pages/customers/CustomersListPage'
import ProductsListPage from '../pages/products/ProductsListPage'
import AnalyticsPage from '../pages/analytics/AnalyticsPage'
import ReportsPage from '../pages/analytics/ReportsPage'
import MLDashboardPage from '../pages/ml/MLDashboardPage'
import AIChatbotPage from '../pages/ml/AIChatbotPage'
import MainLayout from '../layouts/MainLayout'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        
        {/* Budgets */}
        <Route path="budgets" element={<BudgetsListPage />} />
        <Route path="budgets/:id" element={<BudgetDetailPage />} />
        
        {/* Promotions */}
        <Route path="promotions" element={<PromotionsListPage />} />
        
        {/* Customers */}
        <Route path="customers" element={<CustomersListPage />} />
        
        {/* Products */}
        <Route path="products" element={<ProductsListPage />} />
        
        {/* Analytics */}
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        
        {/* ML/AI */}
        <Route path="ml" element={<MLDashboardPage />} />
        <Route path="ai-chatbot" element={<AIChatbotPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
