import React, { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './styles/App.css';

import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider } from './components/common/ToastNotification';
import analytics from './utils/analytics';
import Login from './components/Login';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import LandingPage from './pages/landing/LandingPage';

import { CompanyTypeProvider } from './contexts/CompanyTypeContext';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { UserSkillProvider } from './hooks/useUserSkillContext';
import { ThemeContextProvider } from './contexts/ThemeContext';
import { TerminologyProvider } from './contexts/TerminologyContext';

const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
    <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const OnboardingWizard = lazy(() => import('./components/onboarding/OnboardingWizard'));
const CommandBar = lazy(() => import('./components/command/CommandBar'));
const CopilotPanel = lazy(() => import('./components/copilot/CopilotPanel'));

const Dashboard = lazy(() => import('./components/Dashboard'));
const CommandCenter = lazy(() => import('./components/CommandCenter/CommandCenter'));
const JAMDashboard = lazy(() => import('./pages/dashboards/JAMDashboard'));
const ManagerDashboard = lazy(() => import('./pages/dashboards/ManagerDashboard'));
const ExecutiveKpiDashboard = lazy(() => import('./pages/executive-kpi/ExecutiveKpiDashboard'));

// Hermes Dashboard Components
const HermesDashboardWrapper = lazy(() => import('./components/worldclass-dashboard/HermesDashboardWrapper'));

const BudgetPage = lazy(() => import('./components/budgets').then(m => ({ default: m.BudgetPage })));
const BudgetPlanningWizard = lazy(() => import('./components/Wizards/BudgetPlanningWizard'));
const BudgetEdit = lazy(() => import('./components/budgets/BudgetEdit'));
const BudgetDetailWithTabs = lazy(() => import('./pages/budgets/BudgetDetailWithTabs'));

const PromotionList = lazy(() => import('./components/promotions').then(m => ({ default: m.PromotionList })));
const PromotionWizard = lazy(() => import('./components/Wizards/PromotionWizard'));
const PromotionEdit = lazy(() => import('./components/promotions/PromotionEdit'));
const PromotionDetailWithTabs = lazy(() => import('./pages/promotions/PromotionDetailWithTabs'));

const TradeSpendListNew = lazy(() => import('./pages/tradespend/TradeSpendList'));
const TradeSpendEntryFlow = lazy(() => import('./pages/flows/TradeSpendEntryFlow'));
const TradeSpendEdit = lazy(() => import('./components/tradeSpends/TradeSpendEdit'));
const TradeSpendDetailWithTabs = lazy(() => import('./pages/trade-spends/TradeSpendDetailWithTabs'));

const CustomerList = lazy(() => import('./components/customers').then(m => ({ default: m.CustomerList })));
const CustomerEntryFlow = lazy(() => import('./pages/flows/CustomerEntryFlow'));
const CustomerEdit = lazy(() => import('./components/customers/CustomerEdit'));
const CustomerDetailWithTabs = lazy(() => import('./pages/customers/CustomerDetailWithTabs'));

const ProductList = lazy(() => import('./components/products').then(m => ({ default: m.ProductList })));
const ProductEntryFlow = lazy(() => import('./pages/flows/ProductEntryFlow'));
const ProductEdit = lazy(() => import('./components/products/ProductEdit'));
const ProductDetailWithTabs = lazy(() => import('./pages/products/ProductDetailWithTabs'));

const CampaignList = lazy(() => import('./pages/campaigns/CampaignList'));
const CampaignForm = lazy(() => import('./pages/campaigns/CampaignForm'));
const CampaignDetailWithTabs = lazy(() => import('./pages/campaigns/CampaignDetailWithTabs'));

const SettingsPage = lazy(() => import('./components/settings').then(m => ({ default: m.SettingsPage })));
const UserList = lazy(() => import('./components/users').then(m => ({ default: m.UserList })));
const UserDetail = lazy(() => import('./components/users').then(m => ({ default: m.UserDetail })));
const UserForm = lazy(() => import('./components/users').then(m => ({ default: m.UserForm })));
const ReportList = lazy(() => import('./components/reports').then(m => ({ default: m.ReportList })));

const CompanyList = lazy(() => import('./components/companies').then(m => ({ default: m.CompanyList })));
const CompanyDetail = lazy(() => import('./components/companies').then(m => ({ default: m.CompanyDetail })));
const CompanyForm = lazy(() => import('./components/companies').then(m => ({ default: m.CompanyForm })));

const TradingTermsListNew = lazy(() => import('./pages/tradingterms/TradingTermsList'));
const TradingTermDetail = lazy(() => import('./components/tradingTerms').then(m => ({ default: m.TradingTermDetail })));
const TradingTermForm = lazy(() => import('./components/tradingTerms').then(m => ({ default: m.TradingTermForm })));

const TransactionManagement = lazy(() => import('./components/enterprise/transactions/TransactionManagement'));
const TransactionEntryFlow = lazy(() => import('./pages/transactions/TransactionEntryFlow'));
const BulkUploadTransactions = lazy(() => import('./pages/transactions/BulkUploadTransactions'));

const ApprovalsList = lazy(() => import('./pages/approvals/ApprovalsList'));
const ApprovalDetail = lazy(() => import('./pages/approvals/ApprovalDetail'));
const ApprovalHistory = lazy(() => import('./pages/approvals/ApprovalHistory'));
const ClaimsList = lazy(() => import('./pages/claims/ClaimsList'));
const ClaimDetail = lazy(() => import('./pages/claims/ClaimDetail'));
const CreateClaim = lazy(() => import('./pages/claims/CreateClaim'));
const DeductionsList = lazy(() => import('./pages/deductions/DeductionsList'));
const DeductionDetail = lazy(() => import('./pages/deductions/DeductionDetail'));
const CreateDeduction = lazy(() => import('./pages/deductions/CreateDeduction'));
const ReconciliationDashboard = lazy(() => import('./pages/deductions/ReconciliationDashboard'));

const RebatesList = lazy(() => import('./pages/rebates/RebatesList'));
const RebateDetail = lazy(() => import('./pages/rebates/RebateDetail'));
const RebateForm = lazy(() => import('./pages/rebates/RebateForm'));

const VendorList = lazy(() => import('./pages/vendors/VendorList'));
const VendorDetail = lazy(() => import('./pages/vendors/VendorDetail'));
const VendorForm = lazy(() => import('./pages/vendors/VendorForm'));

const ActivityList = lazy(() => import('./pages/activities/ActivityList'));
const ActivityDetailPage = lazy(() => import('./pages/activities/ActivityDetailPage'));
const ActivityFormPage = lazy(() => import('./pages/activities/ActivityFormPage'));

const AdvancedReportingManagement = lazy(() => import('./pages/advanced-reporting/AdvancedReportingManagement'));
const RevenueGrowthManagement = lazy(() => import('./pages/revenue-growth/RevenueGrowthManagement'));
const ForecastingDashboard = lazy(() => import('./components/forecasting/ForecastingDashboard'));
const Customer360New = lazy(() => import('./pages/customer360/Customer360'));

const BaselineManagement = lazy(() => import('./pages/baselines/BaselineManagement'));
const AccrualManagement = lazy(() => import('./pages/accruals/AccrualManagement'));
const SettlementManagement = lazy(() => import('./pages/settlements/SettlementManagement'));
const PnLManagement = lazy(() => import('./pages/pnl/PnLManagement'));
const BudgetAllocationManagement = lazy(() => import('./pages/budget-allocations/BudgetAllocationManagement'));
const TradeCalendarManagement = lazy(() => import('./pages/trade-calendar/TradeCalendarManagement'));
const DemandSignalManagement = lazy(() => import('./pages/demand-signals/DemandSignalManagement'));
const ScenarioPlanningManagement = lazy(() => import('./pages/scenarios/ScenarioPlanningManagement'));
const PromotionOptimizerManagement = lazy(() => import('./pages/promotion-optimizer/PromotionOptimizerManagement'));

const KAMWalletManagement = lazy(() => import('./pages/kamwallet/KAMWalletManagement'));
const KAMWalletAllocate = lazy(() => import('./pages/kamwallet/KAMWalletAllocate'));

const HierarchyManager = lazy(() => import('./pages/hierarchy/HierarchyManager'));
const CustomerHierarchy = lazy(() => import('./pages/hierarchy/CustomerHierarchy'));
const ProductHierarchy = lazy(() => import('./pages/hierarchy/ProductHierarchy'));
const HierarchyComparison = lazy(() => import('./components/hierarchy/HierarchyComparison'));

const AdminUserList = lazy(() => import('./pages/admin/users/UserList'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const TenantManagement = lazy(() => import('./pages/admin/tenants/TenantManagement'));
const CustomerAssignment = lazy(() => import('./pages/admin/customer-assignment/CustomerAssignment'));
const Alerts = lazy(() => import('./pages/admin/alerts/Alerts'));

const AzureADPage = lazy(() => import('./pages/company-admin/AzureADPage'));
const ERPSettingsPage = lazy(() => import('./pages/company-admin/ERPSettingsPage'));
const CompanyAdminUsersPage = lazy(() => import('./pages/company-admin/UsersPage'));

const DataImportExport = lazy(() => import('./pages/data/DataImportExport'));
const ImportCenter = lazy(() => import('./pages/import/ImportCenter'));

const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

const NotificationCenter = lazy(() => import('./pages/notification-center/NotificationCenter'));
const DocumentManagement = lazy(() => import('./pages/document-management/DocumentManagement'));
const IntegrationHub = lazy(() => import('./pages/integration-hub/IntegrationHub'));
const RoleManagement = lazy(() => import('./pages/role-management/RoleManagement'));
const SystemConfig = lazy(() => import('./pages/system-config/SystemConfig'));
const WorkflowEngine = lazy(() => import('./pages/workflow-engine/WorkflowEngine'));

const VendorFundManagement = lazy(() => import('./pages/vendor-funds/VendorFundManagement'));
const SAPExportManagement = lazy(() => import('./pages/sap-export/SAPExportManagement'));
const WasteDetectionManagement = lazy(() => import('./pages/waste-detection/WasteDetectionManagement'));

const PlanBudgetList = lazy(() => import('./pages/plan/BudgetList'));
const PlanBudgetDetail = lazy(() => import('./pages/plan/BudgetDetail'));
const PlanVendorFundList = lazy(() => import('./pages/plan/VendorFundList'));
const PlanKAMWallet = lazy(() => import('./pages/plan/KAMWallet'));
const PlanTradeCalendar = lazy(() => import('./pages/plan/TradeCalendar'));
const PlanScenarios = lazy(() => import('./pages/plan/Scenarios'));
const PlanForecasting = lazy(() => import('./pages/plan/Forecasting'));
const ExecPromotionList = lazy(() => import('./pages/execute/PromotionList'));
const ExecPromotionWizard = lazy(() => import('./pages/execute/PromotionWizard'));
const ExecPromotionDetail = lazy(() => import('./pages/execute/PromotionDetail'));
const ExecTradeSpendList = lazy(() => import('./pages/execute/TradeSpendList'));
const ExecCampaignList = lazy(() => import('./pages/execute/CampaignList'));
const ApprovalQueue = lazy(() => import('./pages/approve/ApprovalQueue'));
const SettleClaimList = lazy(() => import('./pages/settle/ClaimList'));
const SettleDeductionList = lazy(() => import('./pages/settle/DeductionList'));
const SettleReconciliation = lazy(() => import('./pages/settle/Reconciliation'));
const SettleAccrualList = lazy(() => import('./pages/settle/AccrualList'));
const SettleSettlementList = lazy(() => import('./pages/settle/SettlementList'));
const AnalyzePnL = lazy(() => import('./pages/analyze/PnLAnalysis'));
const AnalyzeCustomer360 = lazy(() => import('./pages/analyze/Customer360'));
const AnalyzeReports = lazy(() => import('./pages/analyze/Reports'));
const AnalyzeExecutiveKPIs = lazy(() => import('./pages/analyze/ExecutiveKPIs'));
const AnalyzeWasteDetection = lazy(() => import('./pages/analyze/WasteDetection'));
const DataCustomerList = lazy(() => import('./pages/data/CustomerList'));
const DataProductList = lazy(() => import('./pages/data/ProductList'));
const DataVendorList = lazy(() => import('./pages/data/VendorList'));
const DataTradingTermsList = lazy(() => import('./pages/data/TradingTermsList'));
const DataBaselineList = lazy(() => import('./pages/data/BaselineList'));
const DataHierarchyManager = lazy(() => import('./pages/data/HierarchyManager'));
const AdminUserListNew = lazy(() => import('./pages/admin/UserList'));
const AdminRoleList = lazy(() => import('./pages/admin/RoleList'));
const AdminSystemConfig = lazy(() => import('./pages/admin/SystemConfig'));
const AdminSAPExport = lazy(() => import('./pages/admin/SAPExport'));
const AdminSAPIntegration = lazy(() => import('./pages/admin/SAPIntegration'));
const AdminIntegrations = lazy(() => import('./pages/admin/Integrations'));
const AdminTerminology = lazy(() => import('./pages/admin/TerminologySettings'));
const ModuleConfiguration = lazy(() => import('./pages/admin/ModuleConfiguration'));
const AdminAssignment = lazy(() => import('./pages/admin/AdminAssignment'));
const CompanyAdminSetup = lazy(() => import('./pages/admin/CompanyAdminSetup'));

const HelpCenter = lazy(() => import('./pages/help').then(m => ({ default: m.HelpCenter })));
const PromotionsHelp = lazy(() => import('./pages/help').then(m => ({ default: m.PromotionsHelp })));
const BudgetsHelp = lazy(() => import('./pages/help').then(m => ({ default: m.BudgetsHelp })));
const TradeSpendsHelp = lazy(() => import('./pages/help').then(m => ({ default: m.TradeSpendsHelp })));
const CustomersHelp = lazy(() => import('./pages/help').then(m => ({ default: m.CustomersHelp })));
const ProductsHelp = lazy(() => import('./pages/help').then(m => ({ default: m.ProductsHelp })));
const AnalyticsHelp = lazy(() => import('./pages/help').then(m => ({ default: m.AnalyticsHelp })));
const SimulationsHelp = lazy(() => import('./pages/help').then(m => ({ default: m.SimulationsHelp })));
const ApprovalsHelp = lazy(() => import('./pages/help').then(m => ({ default: m.ApprovalsHelp })));
const RebatesHelp = lazy(() => import('./pages/help').then(m => ({ default: m.RebatesHelp })));
const ClaimsHelp = lazy(() => import('./pages/help').then(m => ({ default: m.ClaimsHelp })));
const DeductionsHelp = lazy(() => import('./pages/help').then(m => ({ default: m.DeductionsHelp })));
const ForecastingHelp = lazy(() => import('./pages/help').then(m => ({ default: m.ForecastingHelp })));
const BusinessProcessGuide = lazy(() => import('./pages/help').then(m => ({ default: m.BusinessProcessGuide })));

// Sales Analytics Pages
const SalesAnalytics = lazy(() => import('./pages/sales-analytics/SalesAnalytics'));
const TopCustomers = lazy(() => import('./pages/sales-analytics/TopCustomers'));
const TopProducts = lazy(() => import('./pages/sales-analytics/TopProducts'));
const RevenueByPeriod = lazy(() => import('./pages/sales-analytics/RevenueByPeriod'));

// Rebates Pages
const RebateAnalytics = lazy(() => import('./pages/rebates/RebateAnalytics'));
const RebateApproval = lazy(() => import('./pages/rebates/RebateApproval'));

// Admin Tools Pages
const CacheManagement = lazy(() => import('./pages/admin-tools/CacheManagement'));
const PerformanceMetrics = lazy(() => import('./pages/admin-tools/PerformanceMetrics'));
const SecurityMonitoring = lazy(() => import('./pages/admin-tools/SecurityMonitoring'));

// Products Tabs
const ProductOverview = lazy(() => import('./pages/products/tabs/ProductOverview'));
const ProductPromotions = lazy(() => import('./pages/products/tabs/ProductPromotions'));
const ProductCampaigns = lazy(() => import('./pages/products/tabs/ProductCampaigns'));
const ProductSalesHistory = lazy(() => import('./pages/products/tabs/ProductSalesHistory'));
const ProductTradingTerms = lazy(() => import('./pages/products/tabs/ProductTradingTerms'));

// Customers Tabs
const CustomerOverview = lazy(() => import('./pages/customers/tabs/CustomerOverview'));
const CustomerPromotions = lazy(() => import('./pages/customers/tabs/CustomerPromotions'));
const CustomerTradeSpends = lazy(() => import('./pages/customers/tabs/CustomerTradeSpends'));
const CustomerBudgets = lazy(() => import('./pages/customers/tabs/CustomerBudgets'));
const CustomerClaims = lazy(() => import('./pages/customers/tabs/CustomerClaims'));
const CustomerDeductions = lazy(() => import('./pages/customers/tabs/CustomerDeductions'));
const CustomerSalesHistory = lazy(() => import('./pages/customers/tabs/CustomerSalesHistory'));
const CustomerTradingTerms = lazy(() => import('./pages/customers/tabs/CustomerTradingTerms'));

// Products Forms
const ProductForm = lazy(() => import('./pages/products/ProductForm'));
const ProductListWithNewComponents = lazy(() => import('./pages/products/ProductListWithNewComponents'));
const ProductFormWithNewComponents = lazy(() => import('./pages/products/ProductFormWithNewComponents'));

// Customer Form
const CustomerForm = lazy(() => import('./pages/customers/CustomerForm'));

// Activity Grid
const ActivityGridCalendar = lazy(() => import('./pages/activitygrid/ActivityGridCalendar'));

// Vendor Management
const VendorManagement = lazy(() => import('./pages/vendors/VendorManagement'));

// Personalized Dashboard
const PersonalizedDashboard = lazy(() => import('./pages/PersonalizedDashboard'));

// Auth - Two Factor
const TwoFASetup = lazy(() => import('./pages/auth/twofa/TwoFASetup'));

// Budget Console
const BudgetConsole = lazy(() => import('./pages/budgetconsole/BudgetConsole'));

// Admin - Rebates, Workflows, System, Users, Business Rules
const RebateConfiguration = lazy(() => import('./pages/admin/rebates/RebateConfiguration'));
const WorkflowAutomation = lazy(() => import('./pages/admin/workflows/WorkflowAutomation'));
const SystemSettings = lazy(() => import('./pages/admin/system/SystemSettings'));
const UserManagement = lazy(() => import('./pages/admin/users/UserManagement'));
const BusinessRulesPage = lazy(() => import('./pages/admin/BusinessRulesPage'));

// Planning
const PredictiveAnalytics = lazy(() => import('./pages/planning/PredictiveAnalytics'));

// Simulation
const SimulationStudio = lazy(() => import('./pages/simulation/SimulationStudio'));
const SimulationDashboard = lazy(() => import('./pages/simulation/SimulationDashboard'));

// Integrations
const WebhookManagementPage = lazy(() => import('./pages/integrations/WebhookManagementPage'));

// Transactions Steps
const BasicTransactionStep = lazy(() => import('./pages/transactions/steps/BasicTransactionStep'));
const LineItemsStep = lazy(() => import('./pages/transactions/steps/LineItemsStep'));
const PaymentTermsStep = lazy(() => import('./pages/transactions/steps/PaymentTermsStep'));
const ReviewSubmitStep = lazy(() => import('./pages/transactions/steps/ReviewSubmitStep'));

// Promotions Tabs
const PromotionOverview = lazy(() => import('./pages/promotions/tabs/PromotionOverview'));
const PromotionProducts = lazy(() => import('./pages/promotions/tabs/PromotionProducts'));
const PromotionCustomers = lazy(() => import('./pages/promotions/tabs/PromotionCustomers'));
const PromotionBudget = lazy(() => import('./pages/promotions/tabs/PromotionBudget'));
const PromotionApprovals = lazy(() => import('./pages/promotions/tabs/PromotionApprovals'));
const PromotionDocuments = lazy(() => import('./pages/promotions/tabs/PromotionDocuments'));
const PromotionHistory = lazy(() => import('./pages/promotions/tabs/PromotionHistory'));
const PromotionPerformance = lazy(() => import('./pages/promotions/tabs/PromotionPerformance'));
const PromotionConflicts = lazy(() => import('./pages/promotions/tabs/PromotionConflicts'));

// Promotions Forms
const PromotionForm = lazy(() => import('./pages/promotions/PromotionForm'));
const PromotionPlanner = lazy(() => import('./pages/promotions/PromotionPlanner'));

// Dashboards
const ExecutiveDashboard = lazy(() => import('./pages/dashboards/ExecutiveDashboard'));
const SalesDashboard = lazy(() => import('./pages/dashboards/SalesDashboard'));
const PromotionDashboard = lazy(() => import('./pages/dashboards/PromotionDashboard'));

// AI Dashboard
const AIDashboard = lazy(() => import('./pages/ai/AIDashboard'));

// Budgets Tabs
const BudgetOverview = lazy(() => import('./pages/budgets/tabs/BudgetOverview'));
const BudgetSpending = lazy(() => import('./pages/budgets/tabs/BudgetSpending'));
const BudgetAllocations = lazy(() => import('./pages/budgets/tabs/BudgetAllocations'));
const BudgetScenarios = lazy(() => import('./pages/budgets/tabs/BudgetScenarios'));
const BudgetForecast = lazy(() => import('./pages/budgets/tabs/BudgetForecast'));
const BudgetTransfers = lazy(() => import('./pages/budgets/tabs/BudgetTransfers'));
const BudgetApprovals = lazy(() => import('./pages/budgets/tabs/BudgetApprovals'));
const BudgetHistory = lazy(() => import('./pages/budgets/tabs/BudgetHistory'));

// Budgets Components
const BudgetAnalytics = lazy(() => import('./pages/budgets/BudgetAnalytics'));
const BudgetOverviewPage = lazy(() => import('./pages/budgets/BudgetOverview'));

// Governance
const VarianceAnalysisPage = lazy(() => import('./pages/governance/VarianceAnalysisPage'));
const BaselineConfigPage = lazy(() => import('./pages/governance/BaselineConfigPage'));
const DataLineageDashboard = lazy(() => import('./pages/governance/DataLineageDashboard'));

// Login Page
const LoginPage = lazy(() => import('./pages/LoginPage'));

// Activities
const ActivityDashboard = lazy(() => import('./pages/activities/ActivityDashboard'));

// Campaigns Tabs
const CampaignOverview = lazy(() => import('./pages/campaigns/tabs/CampaignOverview'));
const CampaignPerformance = lazy(() => import('./pages/campaigns/tabs/CampaignPerformance'));
const CampaignBudget = lazy(() => import('./pages/campaigns/tabs/CampaignBudget'));
const CampaignHistory = lazy(() => import('./pages/campaigns/tabs/CampaignHistory'));

// RealTime Dashboard
const RealTimeDashboard = lazy(() => import('./pages/RealTimeDashboard'));

// Performance Analytics
const CustomerSegmentation = lazy(() => import('./pages/performance-analytics/CustomerSegmentation'));
const BudgetVariance = lazy(() => import('./pages/performance-analytics/BudgetVariance'));
const PromotionEffectiveness = lazy(() => import('./pages/performance-analytics/PromotionEffectiveness'));

// Timeline
const PromotionsTimeline = lazy(() => import('./pages/timeline/PromotionsTimeline'));

// Company Admin
const AnnouncementsPage = lazy(() => import('./pages/company-admin/AnnouncementsPage'));
const CompanySettingsPage = lazy(() => import('./pages/company-admin/CompanySettingsPage'));
const CompanyAdminDashboard = lazy(() => import('./pages/company-admin/CompanyAdminDashboard'));
const GamesPage = lazy(() => import('./pages/company-admin/GamesPage'));
const PoliciesPage = lazy(() => import('./pages/company-admin/PoliciesPage'));
const LearningCoursesPage = lazy(() => import('./pages/company-admin/LearningCoursesPage'));

// Flows
const BudgetPlanningFlow = lazy(() => import('./pages/flows/BudgetPlanningFlow'));
const CustomerFlow = lazy(() => import('./pages/flows/CustomerFlow'));
const ActivityFlow = lazy(() => import('./pages/flows/ActivityFlow'));
const PromotionFlow = lazy(() => import('./pages/flows/PromotionFlow'));
const PromotionEntryFlow = lazy(() => import('./pages/flows/PromotionEntryFlow'));

// Customer Flow Steps
const BasicInfoStep = lazy(() => import('./pages/flows/customer/steps/BasicInfoStep'));
const ContactDetailsStep = lazy(() => import('./pages/flows/customer/steps/ContactDetailsStep'));
const BusinessProfileStep = lazy(() => import('./pages/flows/customer/steps/BusinessProfileStep'));
const CustomerPaymentTermsStep = lazy(() => import('./pages/flows/customer/steps/PaymentTermsStep'));
const RebateEligibilityStep = lazy(() => import('./pages/flows/customer/steps/RebateEligibilityStep'));
const AIAnalysisStep = lazy(() => import('./pages/flows/customer/steps/AIAnalysisStep'));
const CustomerReviewSubmitStep = lazy(() => import('./pages/flows/customer/steps/ReviewSubmitStep'));

// Trade Spends Tabs
const TradeSpendOverview = lazy(() => import('./pages/trade-spends/tabs/TradeSpendOverview'));
const TradeSpendPerformance = lazy(() => import('./pages/trade-spends/tabs/TradeSpendPerformance'));
const TradeSpendAccruals = lazy(() => import('./pages/trade-spends/tabs/TradeSpendAccruals'));
const TradeSpendApprovals = lazy(() => import('./pages/trade-spends/tabs/TradeSpendApprovals'));
const TradeSpendDocuments = lazy(() => import('./pages/trade-spends/tabs/TradeSpendDocuments'));
const TradeSpendHistory = lazy(() => import('./pages/trade-spends/tabs/TradeSpendHistory'));

// Reports
const ReportBuilder = lazy(() => import('./pages/reports/ReportBuilder'));

// Funding
const FundingOverview = lazy(() => import('./pages/funding/FundingOverview'));

// ProtectedRoute defined outside App to maintain stable component identity.
// Uses a redirect guard to prevent infinite history.replaceState() loops.
const ProtectedRoute = React.memo(function ProtectedRoute({ children, user, onLogout, requiredRoles }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const location = useLocation();
  const lastRedirect = useRef({ path: '', time: 0 });

  if (!isAuthenticated) {
    // Guard against redirect loop: if we just redirected to /login, don't redirect again
    const now = Date.now();
    if (lastRedirect.current.path === '/login' && now - lastRedirect.current.time < 2000) {
      return <LoadingFallback />;
    }
    lastRedirect.current = { path: '/login', time: now };
    return <Navigate to="/login" replace />;
  }
  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    const now = Date.now();
    if (lastRedirect.current.path === '/dashboard' && now - lastRedirect.current.time < 2000) {
      return <LoadingFallback />;
    }
    lastRedirect.current = { path: '/dashboard', time: now };
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <Layout user={user} onLogout={onLogout}>
      <Suspense fallback={<LoadingFallback />}>
        {children}
      </Suspense>
    </Layout>
  );
});

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

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem('isAuthenticated') === 'true';
      const userDataString = localStorage.getItem('user');
      const userData = userDataString ? JSON.parse(userDataString) : null;
      setIsAuthenticated(authStatus);
      setUser(userData);
      if (userData && (userData.id || userData._id) && userData.tenantId) {
        analytics.setUser(userData.id || userData._id, userData.tenantId);
        const onboardingCompleted = localStorage.getItem('onboarding_completed');
        if (!onboardingCompleted && authStatus) {
          setShowOnboarding(true);
        }
      }
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
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
      setCopilotContext({ explanation: `Command "${result.command}" executed successfully`, data: result.data });
      setIsCopilotOpen(true);
    } else if (result.type === 'error') {
      setCopilotContext({ explanation: `Error: ${result.error}`, risks: [{ level: 'high', message: result.error }] });
      setIsCopilotOpen(true);
    }
  };

  const handleLogin = useCallback((userData) => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  // P must be defined outside render or memoized to prevent component identity changes.
  // We use useRef to hold a stable component reference that only updates props, not identity.
  const pRef = useRef(null);
  if (!pRef.current) {
    pRef.current = ({ children, requiredRoles }) => (
      <ProtectedRoute user={pRef.currentUser} onLogout={pRef.currentLogout} requiredRoles={requiredRoles}>
        {children}
      </ProtectedRoute>
    );
  }
  // Update the current values without changing component identity
  pRef.currentUser = user;
  pRef.currentLogout = handleLogout;
  const P = pRef.current;

  return (
    <ErrorBoundary>
      <ThemeContextProvider>
      <ToastProvider>
        <AuthProvider>
          <CurrencyProvider>
            <CompanyTypeProvider user={user}>
              <TerminologyProvider>
              <Router>
                <UserSkillProvider>
          {isAuthenticated && (
            <Suspense fallback={null}>
              <CommandBar isOpen={isCommandBarOpen} onClose={() => setIsCommandBarOpen(false)} onExecute={handleCommandExecute} />
              <CopilotPanel isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} context={copilotContext} recommendations={copilotContext?.recommendations} />
              <OnboardingWizard open={showOnboarding} onClose={() => setShowOnboarding(false)} userRole={user?.role} />
            </Suspense>
          )}
          <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage onLogin={handleLogin} />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            <Route path="/dashboard" element={
              <P>{user?.role === 'jam' || user?.role === 'key_account_manager' ? <JAMDashboard /> : user?.role === 'manager' || user?.role === 'admin' || user?.role === 'super_admin' ? <ManagerDashboard /> : <CommandCenter user={user} />}</P>
            } />
            <Route path="/dashboard/hermes" element={<P><HermesDashboardWrapper /></P>} />
            <Route path="/dashboard/jam" element={<P><JAMDashboard /></P>} />
            <Route path="/dashboard/manager" element={<P><ManagerDashboard /></P>} />
            <Route path="/dashboard/classic" element={<P><Dashboard user={user} /></P>} />
            <Route path="/executive-kpi" element={<P><ExecutiveKpiDashboard /></P>} />
            <Route path="/executive-kpi/:id" element={<P><ExecutiveKpiDashboard /></P>} />

            <Route path="/budgets" element={<P><BudgetPage /></P>} />
            <Route path="/budgets/new-flow" element={<Navigate to="/budgets/new" replace />} />
            <Route path="/budgets/new" element={<P><BudgetPlanningWizard /></P>} />
            <Route path="/budgets/:id/edit" element={<P><BudgetEdit /></P>} />
            <Route path="/budgets/:id/:tab" element={<P><BudgetDetailWithTabs /></P>} />
            <Route path="/budgets/:id" element={<P><BudgetDetailWithTabs /></P>} />

            <Route path="/trade-spends" element={<P><TradeSpendListNew /></P>} />
            <Route path="/trade-spends/new" element={<P><TradeSpendEntryFlow /></P>} />
            <Route path="/trade-spends/new-flow" element={<Navigate to="/trade-spends/new" replace />} />
            <Route path="/trade-spends/:id/edit" element={<P><TradeSpendEdit /></P>} />
            <Route path="/trade-spends/:id/:tab" element={<P><TradeSpendDetailWithTabs /></P>} />
            <Route path="/trade-spends/:id" element={<P><TradeSpendDetailWithTabs /></P>} />

            <Route path="/promotions" element={<P><PromotionList /></P>} />
            <Route path="/promotions/new" element={<P><PromotionWizard /></P>} />
            <Route path="/promotions/new-flow" element={<Navigate to="/promotions/new" replace />} />
            <Route path="/promotions/:id/edit" element={<P><PromotionEdit /></P>} />
            <Route path="/promotions/:id/:tab" element={<P><PromotionDetailWithTabs /></P>} />
            <Route path="/promotions/:id" element={<P><PromotionDetailWithTabs /></P>} />

            <Route path="/customers" element={<P><CustomerList /></P>} />
            <Route path="/customers/new-flow" element={<Navigate to="/customers/new" replace />} />
            <Route path="/customers/new" element={<P><CustomerEntryFlow /></P>} />
            <Route path="/customers/:id/edit" element={<P><CustomerEdit /></P>} />
            <Route path="/customers/:id/:tab" element={<P><CustomerDetailWithTabs /></P>} />
            <Route path="/customers/:id" element={<P><CustomerDetailWithTabs /></P>} />

            <Route path="/products" element={<P><ProductList /></P>} />
            <Route path="/products/new-flow" element={<Navigate to="/products/new" replace />} />
            <Route path="/products/new" element={<P><ProductEntryFlow /></P>} />
            <Route path="/products/:id/edit" element={<P><ProductEdit /></P>} />
            <Route path="/products/:id/:tab" element={<P><ProductDetailWithTabs /></P>} />
            <Route path="/products/:id" element={<P><ProductDetailWithTabs /></P>} />

            <Route path="/campaigns" element={<P><CampaignList /></P>} />
            <Route path="/campaigns/new" element={<P><CampaignForm /></P>} />
            <Route path="/campaigns/:id/:tab" element={<P><CampaignDetailWithTabs /></P>} />
            <Route path="/campaigns/:id" element={<P><CampaignDetailWithTabs /></P>} />
            <Route path="/campaigns/:id/edit" element={<P><CampaignForm /></P>} />

            <Route path="/trading-terms" element={<P><TradingTermsListNew /></P>} />
            <Route path="/trading-terms/:id" element={<P><TradingTermDetail /></P>} />
            <Route path="/trading-terms/:id/edit" element={<P><TradingTermForm /></P>} />
            <Route path="/trading-terms/new" element={<P><TradingTermForm /></P>} />

            <Route path="/baselines" element={<P><BaselineManagement /></P>} />
            <Route path="/accruals" element={<P><AccrualManagement /></P>} />
            <Route path="/settlements" element={<P><SettlementManagement /></P>} />
            <Route path="/pnl" element={<P><PnLManagement /></P>} />
            <Route path="/budget-allocations" element={<P><BudgetAllocationManagement /></P>} />

            <Route path="/trade-calendar" element={<P><TradeCalendarManagement /></P>} />
            <Route path="/demand-signals" element={<P><DemandSignalManagement /></P>} />
            <Route path="/scenarios" element={<P><ScenarioPlanningManagement /></P>} />
            <Route path="/promotion-optimizer" element={<P><PromotionOptimizerManagement /></P>} />
            <Route path="/forecasting" element={<P><ForecastingDashboard /></P>} />

            <Route path="/customer-360" element={<P><Customer360New /></P>} />
            <Route path="/customer-360/:id" element={<P><Customer360New /></P>} />
            <Route path="/advanced-reporting" element={<P><AdvancedReportingManagement /></P>} />
            <Route path="/advanced-reporting/:id" element={<P><AdvancedReportingManagement /></P>} />
            <Route path="/revenue-growth" element={<P><RevenueGrowthManagement /></P>} />
            <Route path="/revenue-growth/:id" element={<P><RevenueGrowthManagement /></P>} />

            <Route path="/transactions" element={<P><TransactionManagement /></P>} />
            <Route path="/transactions/new" element={<P><TransactionEntryFlow /></P>} />
            <Route path="/transactions/bulk-upload" element={<P><BulkUploadTransactions /></P>} />

            <Route path="/approvals" element={<P><ApprovalsList /></P>} />
            <Route path="/approvals/history" element={<P><ApprovalHistory /></P>} />
            <Route path="/approvals/:id" element={<P><ApprovalDetail /></P>} />

            <Route path="/claims" element={<P><ClaimsList /></P>} />
            <Route path="/claims/create" element={<P><CreateClaim /></P>} />
            <Route path="/claims/:id" element={<P><ClaimDetail /></P>} />
            <Route path="/deductions" element={<P><DeductionsList /></P>} />
            <Route path="/deductions/create" element={<P><CreateDeduction /></P>} />
            <Route path="/deductions/reconciliation" element={<P><ReconciliationDashboard /></P>} />
            <Route path="/deductions/:id" element={<P><DeductionDetail /></P>} />

            <Route path="/activities" element={<P><ActivityList /></P>} />
            <Route path="/activities/new" element={<P><ActivityFormPage /></P>} />
            <Route path="/activities/:id" element={<P><ActivityDetailPage /></P>} />
            <Route path="/activities/:id/edit" element={<P><ActivityFormPage /></P>} />

            <Route path="/rebates" element={<P><RebatesList /></P>} />
            <Route path="/rebates/new" element={<P><RebateForm /></P>} />
            <Route path="/rebates/:id" element={<P><RebateDetail /></P>} />
            <Route path="/rebates/:id/edit" element={<P><RebateForm /></P>} />

            <Route path="/vendors" element={<P><VendorList /></P>} />
            <Route path="/vendors/new" element={<P><VendorForm /></P>} />
            <Route path="/vendors/:id" element={<P><VendorDetail /></P>} />
            <Route path="/vendors/:id/edit" element={<P><VendorForm /></P>} />

            <Route path="/kamwallet" element={<P><KAMWalletManagement /></P>} />
            <Route path="/kamwallet/:id" element={<P><KAMWalletAllocate /></P>} />
            <Route path="/kamwallet/:id/allocate" element={<P><KAMWalletAllocate /></P>} />

            <Route path="/settings" element={<P requiredRoles={['admin', 'super_admin']}><SettingsPage /></P>} />
            <Route path="/users" element={<P><UserList /></P>} />
            <Route path="/users/new" element={<P><UserForm /></P>} />
            <Route path="/users/:id" element={<P><UserDetail /></P>} />
            <Route path="/users/:id/edit" element={<P><UserForm /></P>} />
            <Route path="/reports" element={<P><ReportList /></P>} />
            <Route path="/profile" element={<P><UserDetail /></P>} />

            <Route path="/companies" element={<P requiredRoles={['super_admin']}><CompanyList /></P>} />
            <Route path="/companies/new" element={<P requiredRoles={['super_admin']}><CompanyForm /></P>} />
            <Route path="/companies/:id" element={<P requiredRoles={['super_admin']}><CompanyDetail /></P>} />
            <Route path="/companies/:id/edit" element={<P requiredRoles={['super_admin']}><CompanyForm /></P>} />

            <Route path="/customer-assignment" element={<P><CustomerAssignment /></P>} />
            <Route path="/alerts" element={<P><Alerts /></P>} />
            <Route path="/admin/*" element={isAuthenticated ? (
              <Suspense fallback={<LoadingFallback />}><AdminLayout user={user} onLogout={handleLogout} /></Suspense>
            ) : (<Navigate to="/" replace />)}>
              <Route path="dashboard" element={<Suspense fallback={<LoadingFallback />}><AdminDashboardPage /></Suspense>} />
              <Route path="users" element={<Suspense fallback={<LoadingFallback />}><AdminUserList /></Suspense>} />
              <Route path="tenants" element={<Suspense fallback={<LoadingFallback />}><TenantManagement /></Suspense>} />
              <Route path="users/new" element={<Suspense fallback={<LoadingFallback />}><UserForm /></Suspense>} />
              <Route path="users/:id" element={<Suspense fallback={<LoadingFallback />}><UserDetail /></Suspense>} />
              <Route path="users/:id/edit" element={<Suspense fallback={<LoadingFallback />}><UserForm /></Suspense>} />
              <Route path="companies" element={<Suspense fallback={<LoadingFallback />}><CompanyList /></Suspense>} />
              <Route path="companies/new" element={<Suspense fallback={<LoadingFallback />}><CompanyForm /></Suspense>} />
              <Route path="companies/:id" element={<Suspense fallback={<LoadingFallback />}><CompanyDetail /></Suspense>} />
              <Route path="companies/:id/edit" element={<Suspense fallback={<LoadingFallback />}><CompanyForm /></Suspense>} />
              <Route path="hierarchy" element={<Suspense fallback={<LoadingFallback />}><HierarchyManager /></Suspense>} />
              <Route path="security" element={<Suspense fallback={<LoadingFallback />}><SettingsPage /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<LoadingFallback />}><SettingsPage /></Suspense>} />
              <Route path="azure-ad" element={<Suspense fallback={<LoadingFallback />}><AzureADPage /></Suspense>} />
              <Route path="erp-settings" element={<Suspense fallback={<LoadingFallback />}><ERPSettingsPage /></Suspense>} />
              <Route path="company-users" element={<Suspense fallback={<LoadingFallback />}><CompanyAdminUsersPage /></Suspense>} />
            </Route>

            <Route path="/import-center" element={<P><ImportCenter /></P>} />
            <Route path="/data/import-export" element={<P><DataImportExport /></P>} />
            <Route path="/hierarchy/customers" element={<P><CustomerHierarchy /></P>} />
            <Route path="/hierarchy/products" element={<P><ProductHierarchy /></P>} />
            <Route path="/hierarchy/compare" element={<P><HierarchyComparison /></P>} />

            <Route path="/notification-center" element={<P><NotificationCenter /></P>} />
            <Route path="/document-management" element={<P><DocumentManagement /></P>} />
            <Route path="/integration-hub" element={<P><IntegrationHub /></P>} />
            <Route path="/role-management" element={<P requiredRoles={['admin', 'super_admin']}><RoleManagement /></P>} />
            <Route path="/system-config" element={<P requiredRoles={['admin', 'super_admin']}><SystemConfig /></P>} />
            <Route path="/workflow-engine" element={<P requiredRoles={['admin', 'super_admin']}><WorkflowEngine /></P>} />

            <Route path="/vendor-funds" element={<P><VendorFundManagement /></P>} />
            <Route path="/vendor-funds/:id" element={<P><VendorFundManagement /></P>} />
            <Route path="/sap-export" element={<P><SAPExportManagement /></P>} />
            <Route path="/waste-detection" element={<P><WasteDetectionManagement /></P>} />

            <Route path="/help" element={<P><HelpCenter /></P>} />
            <Route path="/help/promotions" element={<P><PromotionsHelp /></P>} />
            <Route path="/help/budgets" element={<P><BudgetsHelp /></P>} />
            <Route path="/help/trade-spends" element={<P><TradeSpendsHelp /></P>} />
            <Route path="/help/customers" element={<P><CustomersHelp /></P>} />
            <Route path="/help/products" element={<P><ProductsHelp /></P>} />
            <Route path="/help/analytics" element={<P><AnalyticsHelp /></P>} />
            <Route path="/help/simulations" element={<P><SimulationsHelp /></P>} />
            <Route path="/help/approvals" element={<P><ApprovalsHelp /></P>} />
            <Route path="/help/rebates" element={<P><RebatesHelp /></P>} />
            <Route path="/help/claims" element={<P><ClaimsHelp /></P>} />
            <Route path="/help/deductions" element={<P><DeductionsHelp /></P>} />
            <Route path="/help/forecasting" element={<P><ForecastingHelp /></P>} />
            <Route path="/help/business-process-guide" element={<P><BusinessProcessGuide /></P>} />

            <Route path="/plan/budgets" element={<P><PlanBudgetList /></P>} />
            <Route path="/plan/budgets/:id" element={<P><PlanBudgetDetail /></P>} />
            <Route path="/plan/vendor-funds" element={<P><PlanVendorFundList /></P>} />
            <Route path="/plan/wallet" element={<P><PlanKAMWallet /></P>} />
            <Route path="/plan/calendar" element={<P><PlanTradeCalendar /></P>} />
            <Route path="/plan/scenarios" element={<P><PlanScenarios /></P>} />
            <Route path="/plan/forecasting" element={<P><PlanForecasting /></P>} />

            <Route path="/execute/promotions" element={<P><ExecPromotionList /></P>} />
            <Route path="/execute/promotions/new" element={<P><ExecPromotionWizard /></P>} />
            <Route path="/execute/promotions/:id" element={<P><ExecPromotionDetail /></P>} />
            <Route path="/execute/trade-spends" element={<P><ExecTradeSpendList /></P>} />
            <Route path="/execute/trade-spends/new" element={<P><TradeSpendEntryFlow /></P>} />
            <Route path="/execute/campaigns" element={<P><ExecCampaignList /></P>} />

            <Route path="/approve" element={<P><ApprovalQueue /></P>} />

            <Route path="/settle/claims" element={<P><SettleClaimList /></P>} />
            <Route path="/settle/claims/new" element={<P><CreateClaim /></P>} />
            <Route path="/settle/claims/:id" element={<P><ClaimDetail /></P>} />
            <Route path="/settle/deductions" element={<P><SettleDeductionList /></P>} />
            <Route path="/settle/deductions/new" element={<P><CreateDeduction /></P>} />
            <Route path="/settle/reconciliation" element={<P><SettleReconciliation /></P>} />
            <Route path="/settle/accruals" element={<P><SettleAccrualList /></P>} />
            <Route path="/settle/settlements" element={<P><SettleSettlementList /></P>} />

            <Route path="/analyze/pnl" element={<P><AnalyzePnL /></P>} />
            <Route path="/analyze/customer-360" element={<P><AnalyzeCustomer360 /></P>} />
            <Route path="/analyze/reports" element={<P><AnalyzeReports /></P>} />
            <Route path="/analyze/forecast" element={<P><AnalyzeExecutiveKPIs /></P>} />
            <Route path="/analyze/waste" element={<P><AnalyzeWasteDetection /></P>} />

            <Route path="/data/customers" element={<P><DataCustomerList /></P>} />
            <Route path="/data/products" element={<P><DataProductList /></P>} />
            <Route path="/data/vendors" element={<P><DataVendorList /></P>} />
            <Route path="/data/trading-terms" element={<P><DataTradingTermsList /></P>} />
            <Route path="/data/baselines" element={<P><DataBaselineList /></P>} />
            <Route path="/data/hierarchy" element={<P><DataHierarchyManager /></P>} />

            <Route path="/admin/users" element={<P><AdminUserListNew /></P>} />
            <Route path="/admin/roles" element={<P><AdminRoleList /></P>} />
            <Route path="/admin/config" element={<P><AdminSystemConfig /></P>} />
            <Route path="/admin/sap-export" element={<P><AdminSAPExport /></P>} />
            <Route path="/admin/sap-integration" element={<P><AdminSAPIntegration /></P>} />
            <Route path="/admin/integrations" element={<P><AdminIntegrations /></P>} />
            <Route path="/admin/terminology" element={<P requiredRoles={['admin', 'super_admin']}><AdminTerminology /></P>} />
            <Route path="/admin/modules" element={<P requiredRoles={['super_admin']}><ModuleConfiguration /></P>} />
            <Route path="/admin/assign-admin" element={<P requiredRoles={['super_admin']}><AdminAssignment /></P>} />
            <Route path="/admin/company-setup" element={<P requiredRoles={['admin', 'super_admin']}><CompanyAdminSetup /></P>} />

            <Route path="/baselines/:id" element={<P><BaselineManagement /></P>} />
            <Route path="/accruals/:id" element={<P><AccrualManagement /></P>} />
            <Route path="/settlements/:id" element={<P><SettlementManagement /></P>} />
            <Route path="/transactions/:id" element={<P><TransactionManagement /></P>} />

            <Route path="/simulations" element={<Navigate to="/scenarios" replace />} />
            <Route path="/simulation-studio" element={<Navigate to="/scenarios" replace />} />
            <Route path="/promotion-planner" element={<Navigate to="/promotions" replace />} />
            <Route path="/promotions-timeline" element={<Navigate to="/trade-calendar" replace />} />
            <Route path="/activity-grid" element={<Navigate to="/trade-calendar" replace />} />
            <Route path="/realtime-dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/executive-dashboard" element={<Navigate to="/executive-kpi" replace />} />
            <Route path="/analytics" element={<Navigate to="/advanced-reporting" replace />} />
            <Route path="/reports/budget" element={<Navigate to="/advanced-reporting" replace />} />
            <Route path="/reports/customers" element={<Navigate to="/advanced-reporting" replace />} />
            <Route path="/reports/products" element={<Navigate to="/advanced-reporting" replace />} />
            <Route path="/reports/promotions" element={<Navigate to="/advanced-reporting" replace />} />
            <Route path="/reports/tradespend" element={<Navigate to="/advanced-reporting" replace />} />
            <Route path="/reports/tradingterms" element={<Navigate to="/advanced-reporting" replace />} />
            <Route path="/vendor-management" element={<Navigate to="/vendors" replace />} />
            <Route path="/predictive-analytics" element={<Navigate to="/forecasting" replace />} />
            <Route path="/ai-dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/budget-console" element={<Navigate to="/budgets" replace />} />
            <Route path="/funding-overview" element={<Navigate to="/budgets" replace />} />
            <Route path="/enterprise/budget" element={<Navigate to="/budgets" replace />} />
            <Route path="/enterprise/promotions" element={<Navigate to="/promotions" replace />} />
            <Route path="/enterprise/trade-spend" element={<Navigate to="/trade-spends" replace />} />
            <Route path="/performance-analytics/promotion-effectiveness" element={<Navigate to="/advanced-reporting" replace />} />
            <Route path="/performance-analytics/budget-variance" element={<Navigate to="/advanced-reporting" replace />} />
            <Route path="/performance-analytics/customer-segmentation" element={<Navigate to="/advanced-reporting" replace />} />
            <Route path="/flows/promotion" element={<Navigate to="/promotions/new" replace />} />
            
            {/* Sales Analytics Routes */}
            <Route path="/sales-analytics" element={<P><SalesAnalytics /></P>} />
            <Route path="/sales-analytics/top-customers" element={<P><TopCustomers /></P>} />
            <Route path="/sales-analytics/top-products" element={<P><TopProducts /></P>} />
            <Route path="/sales-analytics/revenue-by-period" element={<P><RevenueByPeriod /></P>} />
            
            {/* Rebates Routes */}
            <Route path="/rebates/analytics" element={<P><RebateAnalytics /></P>} />
            <Route path="/rebates/approvals" element={<P><RebateApproval /></P>} />
            
            {/* Admin Tools Routes */}
            <Route path="/admin-tools/cache" element={<P><CacheManagement /></P>} />
            <Route path="/admin-tools/performance" element={<P><PerformanceMetrics /></P>} />
            <Route path="/admin-tools/security" element={<P><SecurityMonitoring /></P>} />
            
            {/* Products Tabs Routes */}
            <Route path="/products/:id/overview" element={<P><ProductOverview /></P>} />
            <Route path="/products/:id/promotions" element={<P><ProductPromotions /></P>} />
            <Route path="/products/:id/campaigns" element={<P><ProductCampaigns /></P>} />
            <Route path="/products/:id/sales-history" element={<P><ProductSalesHistory /></P>} />
            <Route path="/products/:id/trading-terms" element={<P><ProductTradingTerms /></P>} />
            
            {/* Products Forms Routes */}
            <Route path="/products/form" element={<P><ProductForm /></P>} />
            <Route path="/products/new-components" element={<P><ProductListWithNewComponents /></P>} />
            <Route path="/products/form-new" element={<P><ProductFormWithNewComponents /></P>} />
            
            {/* Customers Tabs Routes */}
            <Route path="/customers/:id/overview" element={<P><CustomerOverview /></P>} />
            <Route path="/customers/:id/promotions" element={<P><CustomerPromotions /></P>} />
            <Route path="/customers/:id/trade-spends" element={<P><CustomerTradeSpends /></P>} />
            <Route path="/customers/:id/budgets" element={<P><CustomerBudgets /></P>} />
            <Route path="/customers/:id/claims" element={<P><CustomerClaims /></P>} />
            <Route path="/customers/:id/deductions" element={<P><CustomerDeductions /></P>} />
            <Route path="/customers/:id/sales-history" element={<P><CustomerSalesHistory /></P>} />
            <Route path="/customers/:id/trading-terms" element={<P><CustomerTradingTerms /></P>} />
            
            {/* Customer Form Route */}
            <Route path="/customers/form" element={<P><CustomerForm /></P>} />
            
            {/* Activity Grid Route */}
            <Route path="/activity-grid" element={<P><ActivityGridCalendar /></P>} />
            
            {/* Vendor Management Route */}
            <Route path="/vendors/management" element={<P><VendorManagement /></P>} />
            
            {/* Personalized Dashboard Route */}
            <Route path="/dashboard/personalized" element={<P><PersonalizedDashboard /></P>} />
            
            {/* Two Factor Auth Route */}
            <Route path="/auth/2fa/setup" element={<P><TwoFASetup /></P>} />
            
            {/* Budget Console Route */}
            <Route path="/budget-console" element={<P><BudgetConsole /></P>} />
            
            {/* Admin Configuration Routes */}
            <Route path="/admin/rebates/config" element={<P><RebateConfiguration /></P>} />
            <Route path="/admin/workflows/automation" element={<P><WorkflowAutomation /></P>} />
            <Route path="/admin/system/settings" element={<P><SystemSettings /></P>} />
            <Route path="/admin/users/management" element={<P><UserManagement /></P>} />
            <Route path="/admin/business-rules" element={<P><BusinessRulesPage /></P>} />
            
            {/* Planning Routes */}
            <Route path="/planning/predictive" element={<P><PredictiveAnalytics /></P>} />
            
            {/* Simulation Routes */}
            <Route path="/simulation/studio" element={<P><SimulationStudio /></P>} />
            <Route path="/simulation/dashboard" element={<P><SimulationDashboard /></P>} />
            
            {/* Integrations Routes */}
            <Route path="/integrations/webhooks" element={<P><WebhookManagementPage /></P>} />
            
            {/* Transaction Flow Steps Routes */}
            <Route path="/transactions/steps/basic" element={<P><BasicTransactionStep /></P>} />
            <Route path="/transactions/steps/line-items" element={<P><LineItemsStep /></P>} />
            <Route path="/transactions/steps/payment-terms" element={<P><PaymentTermsStep /></P>} />
            <Route path="/transactions/steps/review" element={<P><ReviewSubmitStep /></P>} />
            
            {/* Promotions Tabs Routes */}
            <Route path="/promotions/:id/overview" element={<P><PromotionOverview /></P>} />
            <Route path="/promotions/:id/products" element={<P><PromotionProducts /></P>} />
            <Route path="/promotions/:id/customers" element={<P><PromotionCustomers /></P>} />
            <Route path="/promotions/:id/budget" element={<P><PromotionBudget /></P>} />
            <Route path="/promotions/:id/approvals" element={<P><PromotionApprovals /></P>} />
            <Route path="/promotions/:id/documents" element={<P><PromotionDocuments /></P>} />
            <Route path="/promotions/:id/history" element={<P><PromotionHistory /></P>} />
            <Route path="/promotions/:id/performance" element={<P><PromotionPerformance /></P>} />
            <Route path="/promotions/:id/conflicts" element={<P><PromotionConflicts /></P>} />
            
            {/* Promotions Forms Routes */}
            <Route path="/promotions/form" element={<P><PromotionForm /></P>} />
            <Route path="/promotions/planner" element={<P><PromotionPlanner /></P>} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard/executive" element={<P><ExecutiveDashboard /></P>} />
            <Route path="/dashboard/sales" element={<P><SalesDashboard /></P>} />
            <Route path="/dashboard/promotion" element={<P><PromotionDashboard /></P>} />
            
            {/* AI Dashboard Route */}
            <Route path="/ai/dashboard" element={<P><AIDashboard /></P>} />
            
            {/* Budgets Tabs Routes */}
            <Route path="/budgets/:id/overview" element={<P><BudgetOverview /></P>} />
            <Route path="/budgets/:id/spending" element={<P><BudgetSpending /></P>} />
            <Route path="/budgets/:id/allocations" element={<P><BudgetAllocations /></P>} />
            <Route path="/budgets/:id/scenarios" element={<P><BudgetScenarios /></P>} />
            <Route path="/budgets/:id/forecast" element={<P><BudgetForecast /></P>} />
            <Route path="/budgets/:id/transfers" element={<P><BudgetTransfers /></P>} />
            <Route path="/budgets/:id/approvals" element={<P><BudgetApprovals /></P>} />
            <Route path="/budgets/:id/history" element={<P><BudgetHistory /></P>} />
            
            {/* Budgets Component Routes */}
            <Route path="/budgets/analytics" element={<P><BudgetAnalytics /></P>} />
            <Route path="/budgets/overview" element={<P><BudgetOverviewPage /></P>} />
            
            {/* Governance Routes */}
            <Route path="/governance/variance" element={<P><VarianceAnalysisPage /></P>} />
            <Route path="/governance/baseline-config" element={<P><BaselineConfigPage /></P>} />
            <Route path="/governance/data-lineage" element={<P><DataLineageDashboard /></P>} />
            
            {/* Login Route */}
            <Route path="/login-page" element={<P><LoginPage /></P>} />
            
            {/* Activities Route */}
            <Route path="/activities/dashboard" element={<P><ActivityDashboard /></P>} />
            
            {/* Campaigns Tabs Routes */}
            <Route path="/campaigns/:id/overview" element={<P><CampaignOverview /></P>} />
            <Route path="/campaigns/:id/performance" element={<P><CampaignPerformance /></P>} />
            <Route path="/campaigns/:id/budget" element={<P><CampaignBudget /></P>} />
            <Route path="/campaigns/:id/history" element={<P><CampaignHistory /></P>} />
            
            {/* RealTime Dashboard Route */}
            <Route path="/realtime-dashboard" element={<P><RealTimeDashboard /></P>} />
            
            {/* Performance Analytics Routes */}
            <Route path="/performance-analytics/customer-segmentation" element={<P><CustomerSegmentation /></P>} />
            <Route path="/performance-analytics/budget-variance" element={<P><BudgetVariance /></P>} />
            <Route path="/performance-analytics/promotion-effectiveness" element={<P><PromotionEffectiveness /></P>} />
            
            {/* Timeline Route */}
            <Route path="/timeline/promotions" element={<P><PromotionsTimeline /></P>} />
            
            {/* Company Admin Routes */}
            <Route path="/company-admin/announcements" element={<P><AnnouncementsPage /></P>} />
            <Route path="/company-admin/settings" element={<P><CompanySettingsPage /></P>} />
            <Route path="/company-admin/dashboard" element={<P><CompanyAdminDashboard /></P>} />
            <Route path="/company-admin/games" element={<P><GamesPage /></P>} />
            <Route path="/company-admin/policies" element={<P><PoliciesPage /></P>} />
            <Route path="/company-admin/learning" element={<P><LearningCoursesPage /></P>} />
            
            {/* Flow Routes */}
            <Route path="/flows/budget-planning" element={<P><BudgetPlanningFlow /></P>} />
            <Route path="/flows/customer" element={<P><CustomerFlow /></P>} />
            <Route path="/flows/activity" element={<P><ActivityFlow /></P>} />
            <Route path="/flows/promotion" element={<P><PromotionFlow /></P>} />
            <Route path="/flows/promotion-entry" element={<P><PromotionEntryFlow /></P>} />
            
            {/* Customer Flow Steps Routes */}
            <Route path="/flows/customer/basic-info" element={<P><BasicInfoStep /></P>} />
            <Route path="/flows/customer/contact-details" element={<P><ContactDetailsStep /></P>} />
            <Route path="/flows/customer/business-profile" element={<P><BusinessProfileStep /></P>} />
            <Route path="/flows/customer/payment-terms" element={<P><CustomerPaymentTermsStep /></P>} />
            <Route path="/flows/customer/rebate-eligibility" element={<P><RebateEligibilityStep /></P>} />
            <Route path="/flows/customer/ai-analysis" element={<P><AIAnalysisStep /></P>} />
            <Route path="/flows/customer/review" element={<P><CustomerReviewSubmitStep /></P>} />
            
            {/* Trade Spends Tabs Routes */}
            <Route path="/trade-spends/:id/overview" element={<P><TradeSpendOverview /></P>} />
            <Route path="/trade-spends/:id/performance" element={<P><TradeSpendPerformance /></P>} />
            <Route path="/trade-spends/:id/accruals" element={<P><TradeSpendAccruals /></P>} />
            <Route path="/trade-spends/:id/approvals" element={<P><TradeSpendApprovals /></P>} />
            <Route path="/trade-spends/:id/documents" element={<P><TradeSpendDocuments /></P>} />
            <Route path="/trade-spends/:id/history" element={<P><TradeSpendHistory /></P>} />
            
            {/* Report Builder Route */}
            <Route path="/reports/builder" element={<P><ReportBuilder /></P>} />
            
            {/* Funding Route */}
            <Route path="/funding/overview" element={<P><FundingOverview /></P>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
                </UserSkillProvider>
              </Router>
              </TerminologyProvider>
            </CompanyTypeProvider>
          </CurrencyProvider>
        </AuthProvider>
      </ToastProvider>
      </ThemeContextProvider>
    </ErrorBoundary>
  );
}

export default App;
