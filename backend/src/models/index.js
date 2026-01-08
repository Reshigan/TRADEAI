// Load all models to ensure they are registered with Mongoose
// Production mode - all models enabled for full functionality

// Core models
const User = require('./User');
const Company = require('./Company');
const Tenant = require('./Tenant');
const Customer = require('./Customer');
const Product = require('./Product');
const Vendor = require('./Vendor');

// Budget and financial models
const Budget = require('./Budget');
const MarketingBudgetAllocation = require('./MarketingBudgetAllocation');
const Accrual = require('./Accrual');
const Rebate = require('./Rebate');
const RebateAccrual = require('./RebateAccrual');

// Promotion and campaign models
const Promotion = require('./Promotion');
const Campaign = require('./Campaign');
const PromotionAnalysis = require('./PromotionAnalysis');
const CombinationAnalysis = require('./CombinationAnalysis');

// Trade spend and transaction models
const TradeSpend = require('./TradeSpend');
const TradingTerm = require('./TradingTerm');
const Transaction = require('./Transaction');
const SalesTransaction = require('./SalesTransaction');
const SalesHistory = require('./SalesHistory');

// Financial documents
const Invoice = require('./Invoice');
const Payment = require('./Payment');
const PurchaseOrder = require('./PurchaseOrder');
const Claim = require('./Claim');
const Deduction = require('./Deduction');
const Dispute = require('./Dispute');
const Settlement = require('./Settlement');

// Activity and analytics
const ActivityGrid = require('./ActivityGrid');
const AnalyticsEvent = require('./AnalyticsEvent');
const Insight = require('./Insight');

// Reporting
const Report = require('./Report');
const ReportDefinition = require('./ReportDefinition');
const ReportRun = require('./ReportRun');

// Master data and hierarchy
const MasterData = require('./MasterData');
const StoreHierarchy = require('./StoreHierarchy');

// AI and chat
const AIChat = require('./AIChat');

// Security and audit
const AuditLog = require('./AuditLog');
const SecurityEvent = require('./SecurityEvent');

// Data lineage and governance
const ImportBatch = require('./ImportBatch');
const DataLineage = require('./DataLineage');
const BaselineConfig = require('./BaselineConfig');
const VarianceReasonCode = require('./VarianceReasonCode');

// Approvals and permissions
const Approval = require('./Approval');
const ApprovalPolicy = require('./ApprovalPolicy');
const Permission = require('./Permission');
const Role = require('./Role');
const License = require('./License');

// KAM specific
const KAMWallet = require('./KAMWallet');

// Webhooks
const Webhook = require('./Webhook');
const WebhookDelivery = require('./WebhookDelivery');

module.exports = {
  // Core
  User,
  Company,
  Tenant,
  Customer,
  Product,
  Vendor,

  // Budget and financial
  Budget,
  MarketingBudgetAllocation,
  Accrual,
  Rebate,
  RebateAccrual,

  // Promotions
  Promotion,
  Campaign,
  PromotionAnalysis,
  CombinationAnalysis,

  // Trade spend and transactions
  TradeSpend,
  TradingTerm,
  Transaction,
  SalesTransaction,
  SalesHistory,

  // Financial documents
  Invoice,
  Payment,
  PurchaseOrder,
  Claim,
  Deduction,
  Dispute,
  Settlement,

  // Activity and analytics
  ActivityGrid,
  AnalyticsEvent,
  Insight,

  // Reporting
  Report,
  ReportDefinition,
  ReportRun,

  // Master data
  MasterData,
  StoreHierarchy,

  // AI
  AIChat,

  // Security and audit
  AuditLog,
  SecurityEvent,

  // Data lineage and governance
  ImportBatch,
  DataLineage,
  BaselineConfig,
  VarianceReasonCode,

  // Approvals and permissions
  Approval,
  ApprovalPolicy,
  Permission,
  Role,
  License,

  // KAM
  KAMWallet,

  // Webhooks
  Webhook,
  WebhookDelivery
};
