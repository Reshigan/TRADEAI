import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';

// Import components
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider } from './components/common/ToastNotification';
import analytics from './utils/analytics';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import { BudgetList, BudgetDetail, BudgetPage } from './components/budgets';
import { TradeSpendList, TradeSpendDetail } from './components/tradeSpends';
import { PromotionList, PromotionDetail } from './components/promotions';
import { CustomerList, CustomerDetail } from './components/customers';
import { ProductList, ProductDetail } from './components/products';
import { AnalyticsDashboard } from './components/analytics';
import { SettingsPage } from './components/settings';
import { UserList, UserDetail, UserForm } from './components/users';
import { ReportList, ReportBuilder, BudgetReports, TradingTermsReports, CustomerReports, ProductReports, PromotionReports, TradeSpendReports } from './components/reports';
import { CompanyList, CompanyDetail, CompanyForm } from './components/companies';
import { TradingTermsList, TradingTermDetail, TradingTermForm } from './components/tradingTerms';
import ActivityGrid from './components/activityGrid';
import SimulationStudio from './components/enterprise/simulations/SimulationStudio';
import ExecutiveDashboardEnhanced from './components/enterprise/dashboards/ExecutiveDashboardEnhanced';
import TransactionManagement from './components/enterprise/transactions/TransactionManagement';
import ForecastingDashboard from './components/forecasting/ForecastingDashboard';

// New World-Class UI Components
import RealTimeDashboard from './pages/RealTimeDashboard';
import PromotionFlow from './pages/flows/PromotionFlow';

// AI-Powered Flow Components (Refactored UX)
import PromotionEntryFlow from './pages/flows/PromotionEntryFlow';
import CustomerEntryFlow from './pages/flows/CustomerEntryFlow';
import ProductEntryFlow from './pages/flows/ProductEntryFlow';
import TradeSpendEntryFlow from './pages/flows/TradeSpendEntryFlow';
import BudgetPlanningFlow from './pages/flows/BudgetPlanningFlow';
import AdminDashboard from './pages/admin/AdminDashboard';

// Transaction Components (Feature 2)
import TransactionEntryFlow from './pages/transactions/TransactionEntryFlow';
import BulkUploadTransactions from './pages/transactions/BulkUploadTransactions';

// AI Dashboard (Feature 7.2)
import AIDashboard from './pages/ai/AIDashboard';

import JAMDashboard from './pages/dashboards/JAMDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';

// World-Class Redesign Components
import CommandBar from './components/command/CommandBar';
import CopilotPanel from './components/copilot/CopilotPanel';

// AI Assistant Component
import AIAssistant from './components/AIAssistant/AIAssistant';

// Command Center (New Home Dashboard)
import CommandCenter from './components/CommandCenter/CommandCenter';
import BudgetPlanningWizard from './components/Wizards/BudgetPlanningWizard';
import PromotionWizard from './components/Wizards/PromotionWizard';

// Edit Components for CRUD operations
import BudgetEdit from './components/budgets/BudgetEdit';
import PromotionEdit from './components/promotions/PromotionEdit';
import TradeSpendEdit from './components/tradeSpends/TradeSpendEdit';
import CustomerEdit from './components/customers/CustomerEdit';
import ProductEdit from './components/products/ProductEdit';

import TradeSpendListNew from './pages/tradespend/TradeSpendList';
import TradingTermsListNew from './pages/tradingterms/TradingTermsList';
import ActivityGridCalendar from './pages/activitygrid/ActivityGridCalendar';
import SimulationStudioNew from './pages/simulation/SimulationStudio';
import PromotionsTimelineNew from './pages/timeline/PromotionsTimeline';
import Customer360New from './pages/customer360/Customer360';
import BudgetConsoleNew from './pages/budgetconsole/BudgetConsole';
import PromotionPlannerNew from './pages/promotions/PromotionPlanner';

// Approvals, Claims, and Deductions Components
import ApprovalsList from './pages/approvals/ApprovalsList';
import ApprovalDetail from './pages/approvals/ApprovalDetail';
import ClaimsList from './pages/claims/ClaimsList';
import ClaimDetail from './pages/claims/ClaimDetail';
import CreateClaim from './pages/claims/CreateClaim';
import DeductionsList from './pages/deductions/DeductionsList';
import DeductionDetail from './pages/deductions/DeductionDetail';
import CreateDeduction from './pages/deductions/CreateDeduction';
import ReconciliationDashboard from './pages/deductions/ReconciliationDashboard';

// Campaign Components
import CampaignList from './pages/campaigns/CampaignList';
import CampaignForm from './pages/campaigns/CampaignForm';
import CampaignDetail from './pages/campaigns/CampaignDetail';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotContext, setCopilotContext] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Effect to check for authentication changes
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem('isAuthenticated') === 'true';
      const userDataString = localStorage.getItem('user');
      const userData = userDataString ? JSON.parse(userDataString) : null;
      console.log('App.js useEffect - checking auth:', { authStatus, userData });
      setIsAuthenticated(authStatus);
      setUser(userData);
      
      if (userData && userData._id && userData.tenantId) {
        analytics.setUser(userData._id, userData.tenantId);
        
        const onboardingCompleted = localStorage.getItem('onboarding_completed');
        if (!onboardingCompleted && authStatus) {
          setShowOnboarding(true);
        }
      }
    };

    // Check on mount
    checkAuth();

    // Listen for storage changes (in case of multiple tabs)
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandBarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCommandExecute = (result) => {
    if (result.type === 'navigate') {
      window.location.href = result.path;
    } else if (result.type === 'api') {
      setCopilotContext({
        explanation: `Command "${result.command}" executed successfully`,
        data: result.data
      });
      setIsCopilotOpen(true);
    } else if (result.type === 'error') {
      setCopilotContext({
        explanation: `Error: ${result.error}`,
        risks: [{ level: 'high', message: result.error }]
      });
      setIsCopilotOpen(true);
    }
  };

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
    <ErrorBoundary>
      <ToastProvider>
        <Router>
        {/* Global Command Bar */}
        {isAuthenticated && (
          <>
            <CommandBar
              isOpen={isCommandBarOpen}
              onClose={() => setIsCommandBarOpen(false)}
              onExecute={handleCommandExecute}
            />
            <CopilotPanel
              isOpen={isCopilotOpen}
              onClose={() => setIsCopilotOpen(false)}
              context={copilotContext}
              recommendations={copilotContext?.recommendations}
            />
            <OnboardingWizard
              open={showOnboarding}
              onClose={() => setShowOnboarding(false)}
              userRole={user?.role}
            />
          </>
        )}
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
                {user?.role === 'jam' || user?.role === 'key_account_manager' ? (
                  <JAMDashboard />
                ) : user?.role === 'manager' || user?.role === 'admin' ? (
                  <ManagerDashboard />
                ) : (
                  <CommandCenter user={user} />
                )}
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/dashboard/jam" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <JAMDashboard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/dashboard/manager" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ManagerDashboard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/dashboard/classic" 
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
                <BudgetPage />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/budgets/new-flow" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <BudgetPlanningWizard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/budgets/:id/edit" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <BudgetEdit />
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
                <TradeSpendListNew />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/trade-spends/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradeSpendEntryFlow />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/trade-spends/new-flow" 
          element={
            isAuthenticated ? (
              <TradeSpendEntryFlow />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/trade-spends/:id/edit"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradeSpendEdit />
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
          path="/promotions/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionEdit />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/promotions/new-flow" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionWizard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/promotions/:id/edit" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionEdit />
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
          path="/customers/new-flow" 
          element={
            isAuthenticated ? (
              <CustomerEntryFlow />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/customers/:id/edit" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CustomerEdit />
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
                <Customer360New />
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
          path="/products/new-flow" 
          element={
            isAuthenticated ? (
              <ProductEntryFlow />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/products/:id/edit" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ProductEdit />
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
          path="/ai-dashboard" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <AIDashboard />
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
          path="/reports/budget" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <BudgetReports />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/reports/tradingterms" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradingTermsReports />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/reports/customers" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CustomerReports />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/reports/products" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ProductReports />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/reports/promotions" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionReports />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/reports/tradespend" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradeSpendReports />
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
          path="/campaigns" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CampaignList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/campaigns/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CampaignForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/campaigns/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CampaignDetail />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/campaigns/:id/edit" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CampaignForm />
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
                <ActivityGridCalendar />
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
                <TradingTermsListNew />
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
        <Route 
          path="/simulations" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <SimulationStudio />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/simulation-studio" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <SimulationStudioNew />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/promotions-timeline" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionsTimelineNew />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/promotion-planner" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionPlannerNew />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/budget-console" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <BudgetConsoleNew />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/customer-360/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <Customer360New />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/forecasting" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ForecastingDashboard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/transactions" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TransactionManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/transactions/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TransactionEntryFlow />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/transactions/bulk-upload" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <BulkUploadTransactions />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/executive-dashboard" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ExecutiveDashboardEnhanced />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        {/* New World-Class UI Routes */}
        <Route 
          path="/realtime-dashboard" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <RealTimeDashboard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/flows/promotion" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionFlow />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/approvals" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ApprovalsList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/approvals/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ApprovalDetail />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/claims"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ClaimsList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/claims/create" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CreateClaim />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/claims/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ClaimDetail />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/deductions" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <DeductionsList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/deductions/create" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CreateDeduction />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/deductions/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <DeductionDetail />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/deductions/reconciliation"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ReconciliationDashboard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
