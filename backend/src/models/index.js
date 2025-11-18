// Load all models to ensure they are registered with Mongoose
// Note: Using minimal User model for mock database mode
// For production with real database, uncomment the full models
const User = require('./UserMinimal');
// const Customer = require('./Customer');
// const Product = require('./Product');
// const Vendor = require('./Vendor');
// const Budget = require('./Budget');
// const Promotion = require('./Promotion');
// const Campaign = require('./Campaign');
// const TradeSpend = require('./TradeSpend');
// const ActivityGrid = require('./ActivityGrid');
// const SalesHistory = require('./SalesHistory');
// const MasterData = require('./MasterData');
// const Report = require('./Report');
// const AIChat = require('./AIChat');
// const CombinationAnalysis = require('./CombinationAnalysis');
// const MarketingBudgetAllocation = require('./MarketingBudgetAllocation');
// const PromotionAnalysis = require('./PromotionAnalysis');
// const TradingTerm = require('./TradingTerm');

module.exports = {
  // Company,
  User
  // Customer,
  // Product,
  // Vendor,
  // Budget,
  // Promotion,
  // Campaign,
  // TradeSpend,
  // ActivityGrid,
  // SalesHistory,
  // MasterData,
  // Report,
  // AIChat,
  // CombinationAnalysis,
  // MarketingBudgetAllocation,
  // PromotionAnalysis,
  // TradingTerm
};
