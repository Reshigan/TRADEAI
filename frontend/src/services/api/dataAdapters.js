/**
 * Data Adapters for normalizing API responses to frontend expectations
 * 
 * This module transforms API response data to match the field names and
 * computed values that frontend components expect.
 * 
 * API returns: _id, amount, utilized, companyId, createdAt, etc.
 * Frontend expects: id, totalAmount, spent, allocated, remaining, company_id, etc.
 */

/**
 * Normalize a single entity's ID field
 * API returns _id, frontend expects id
 */
const normalizeId = (entity) => {
  if (!entity) return entity;
  return {
    ...entity,
    id: entity.id || entity._id,
  };
};

/**
 * Normalize an array of entities
 */
const normalizeArray = (data, normalizer) => {
  if (!Array.isArray(data)) return data;
  return data.map(normalizer);
};

/**
 * Budget Adapter
 * API: { _id, amount, utilized, status, year, name, budgetType, companyId, createdBy, createdAt, updatedAt }
 * Frontend: { id, amount, totalAmount, spent, utilized, allocated, remaining, utilizationPercent, ... }
 */
export const normalizeBudget = (budget) => {
  if (!budget) return budget;
  
  const amount = budget.amount || budget.totalAmount || 0;
  const utilized = budget.utilized || budget.spent || 0;
  const remaining = amount - utilized;
  const utilizationPercent = amount > 0 ? (utilized / amount) * 100 : 0;
  
  return {
    ...budget,
    id: budget.id || budget._id,
    amount,
    totalAmount: amount,
    spent: utilized,
    utilized,
    allocated: utilized,
    remaining,
    utilizationPercent,
    // Ensure consistent field names
    companyId: budget.companyId || budget.company_id,
    budgetType: budget.budgetType || budget.budget_type,
    createdBy: budget.createdBy || budget.created_by,
    createdAt: budget.createdAt || budget.created_at,
    updatedAt: budget.updatedAt || budget.updated_at,
  };
};

export const normalizeBudgets = (budgets) => normalizeArray(budgets, normalizeBudget);

/**
 * Promotion Adapter
 * API: { _id, name, promotionType, status, startDate, endDate, financial, mechanics, ... }
 * Frontend: { id, name, type, promotion_type, status, start_date, end_date, discount, roi, ... }
 */
export const normalizePromotion = (promotion) => {
  if (!promotion) return promotion;
  
  const financial = promotion.financial || {};
  const mechanics = promotion.mechanics || {};
  
  // Calculate ROI if not present
  const actualSpend = financial.actualSpend || financial.plannedSpend || 0;
  const incrementalRevenue = financial.incrementalRevenue || 0;
  const roi = actualSpend > 0 ? ((incrementalRevenue - actualSpend) / actualSpend) * 100 : 0;
  
  // Get discount value
  const discountValue = mechanics.discountValue || mechanics.discount || 0;
  
  return {
    ...promotion,
    id: promotion.id || promotion._id,
    type: promotion.promotionType || promotion.promotion_type || promotion.type,
    promotion_type: promotion.promotionType || promotion.promotion_type,
    promotionType: promotion.promotionType || promotion.promotion_type,
    // Date fields
    start_date: promotion.startDate || promotion.start_date,
    end_date: promotion.endDate || promotion.end_date,
    startDate: promotion.startDate || promotion.start_date,
    endDate: promotion.endDate || promotion.end_date,
    // Financial fields
    discount: discountValue,
    discountPercent: discountValue,
    roi: financial.profitability?.roi || roi,
    roiDecimal: financial.profitability?.roiDecimal || (roi / 100),
    plannedSpend: financial.plannedSpend || 0,
    actualSpend: financial.actualSpend || 0,
    baselineRevenue: financial.baselineRevenue || 0,
    promoRevenue: financial.promoRevenue || 0,
    incrementalRevenue: financial.incrementalRevenue || 0,
    // Ensure consistent field names
    companyId: promotion.companyId || promotion.company_id,
    budgetId: promotion.budgetId || promotion.budget_id,
    createdBy: promotion.createdBy || promotion.created_by,
    createdAt: promotion.createdAt || promotion.created_at,
    updatedAt: promotion.updatedAt || promotion.updated_at,
  };
};

export const normalizePromotions = (promotions) => normalizeArray(promotions, normalizePromotion);

/**
 * Customer Adapter
 * API: { _id, name, code, customerType, channel, tier, status, region, city, contactName, contactEmail, contactPhone, ... }
 * Frontend: { id, name, code, type, status, contact: { name, email, phone }, address: { city, state, region }, ... }
 */
export const normalizeCustomer = (customer) => {
  if (!customer) return customer;
  
  // Build nested contact object from flat fields
  const contact = customer.contact || {
    name: customer.contactName || customer.contact_name || null,
    email: customer.contactEmail || customer.contact_email || null,
    phone: customer.contactPhone || customer.contact_phone || null,
  };
  
  // Build nested address object from flat fields
  const address = customer.address || {
    city: customer.city || null,
    state: customer.state || customer.province || null,
    region: customer.region || null,
    country: customer.country || 'South Africa',
  };
  
  return {
    ...customer,
    id: customer.id || customer._id,
    customer_type: customer.customerType || customer.customer_type,
    customerType: customer.customerType || customer.customer_type,
    type: customer.customerType || customer.customer_type || customer.type,
    contact,
    address,
    companyId: customer.companyId || customer.company_id,
    createdAt: customer.createdAt || customer.created_at,
    updatedAt: customer.updatedAt || customer.updated_at,
  };
};

export const normalizeCustomers = (customers) => normalizeArray(customers, normalizeCustomer);

/**
 * Product Adapter
 * API: { _id, name, sku, barcode, category, subcategory, brand, unitPrice, costPrice, ... }
 * Frontend: { id, name, sku, barcode, category: { primary, secondary }, pricing: { listPrice, costPrice }, ... }
 */
export const normalizeProduct = (product) => {
  if (!product) return product;
  
  const unitPrice = product.unitPrice || product.unit_price || product.listPrice || product.list_price || 0;
  const costPrice = product.costPrice || product.cost_price || 0;
  const margin = unitPrice > 0 ? ((unitPrice - costPrice) / unitPrice) * 100 : 0;
  const grossProfit = unitPrice - costPrice;
  
  // Build nested category object from flat fields
  const category = product.category && typeof product.category === 'object' 
    ? product.category 
    : {
        primary: product.category || product.categoryPrimary || product.category_primary || null,
        secondary: product.subcategory || product.categorySecondary || product.category_secondary || null,
      };
  
  // Build nested pricing object from flat fields
  const pricing = product.pricing || {
    listPrice: unitPrice,
    costPrice: costPrice,
    margin: margin,
  };
  
  return {
    ...product,
    id: product.id || product._id,
    // Add price/cost aliases for components that expect these field names
    price: unitPrice,
    cost: costPrice,
    unitPrice,
    unit_price: unitPrice,
    costPrice,
    cost_price: costPrice,
    margin,
    marginPercent: margin,
    grossProfit,
    category,
    pricing,
    companyId: product.companyId || product.company_id,
    createdAt: product.createdAt || product.created_at,
    updatedAt: product.updatedAt || product.updated_at,
  };
};

export const normalizeProducts = (products) => normalizeArray(products, normalizeProduct);

/**
 * Trade Spend Adapter
 * API: { _id, spendId, spendType, activityType, requestedAmount, approvedAmount, status, customerId, startDate, endDate, ... }
 * Frontend: { id, spendType, amount: { requested, approved }, period: { startDate, endDate }, customer: { name }, ... }
 */
export const normalizeTradeSpend = (tradeSpend) => {
  if (!tradeSpend) return tradeSpend;
  
  // Build nested amount object from flat fields
  const amount = tradeSpend.amount && typeof tradeSpend.amount === 'object'
    ? tradeSpend.amount
    : {
        requested: tradeSpend.requestedAmount || tradeSpend.requested_amount || tradeSpend.amount || 0,
        approved: tradeSpend.approvedAmount || tradeSpend.approved_amount || 0,
      };
  
  // Build nested period object from flat fields
  const period = tradeSpend.period || {
    startDate: tradeSpend.startDate || tradeSpend.start_date || null,
    endDate: tradeSpend.endDate || tradeSpend.end_date || null,
  };
  
  // Build nested customer object if not present
  const customer = tradeSpend.customer || {
    name: tradeSpend.customerName || tradeSpend.customer_name || null,
    _id: tradeSpend.customerId || tradeSpend.customer_id || null,
  };
  
  return {
    ...tradeSpend,
    id: tradeSpend.id || tradeSpend._id,
    spend_id: tradeSpend.spendId || tradeSpend.spend_id,
    spendId: tradeSpend.spendId || tradeSpend.spend_id,
    spend_type: tradeSpend.spendType || tradeSpend.spend_type,
    spendType: tradeSpend.spendType || tradeSpend.spend_type,
    activity_type: tradeSpend.activityType || tradeSpend.activity_type,
    activityType: tradeSpend.activityType || tradeSpend.activity_type,
    amount,
    period,
    customer,
    customer_id: tradeSpend.customerId || tradeSpend.customer_id,
    customerId: tradeSpend.customerId || tradeSpend.customer_id,
    promotion_id: tradeSpend.promotionId || tradeSpend.promotion_id,
    promotionId: tradeSpend.promotionId || tradeSpend.promotion_id,
    budget_id: tradeSpend.budgetId || tradeSpend.budget_id,
    budgetId: tradeSpend.budgetId || tradeSpend.budget_id,
    company_id: tradeSpend.companyId || tradeSpend.company_id,
    companyId: tradeSpend.companyId || tradeSpend.company_id,
    created_by: tradeSpend.createdBy || tradeSpend.created_by,
    createdBy: tradeSpend.createdBy || tradeSpend.created_by,
    approved_by: tradeSpend.approvedBy || tradeSpend.approved_by,
    approvedBy: tradeSpend.approvedBy || tradeSpend.approved_by,
    approved_at: tradeSpend.approvedAt || tradeSpend.approved_at,
    approvedAt: tradeSpend.approvedAt || tradeSpend.approved_at,
    createdAt: tradeSpend.createdAt || tradeSpend.created_at,
    updatedAt: tradeSpend.updatedAt || tradeSpend.updated_at,
  };
};

export const normalizeTradeSpends = (tradeSpends) => normalizeArray(tradeSpends, normalizeTradeSpend);

/**
 * Claim/Deduction Adapter
 */
export const normalizeClaim = (claim) => {
  if (!claim) return claim;
  
  return {
    ...claim,
    id: claim.id || claim._id,
    claimId: claim.claimId || claim.claim_id,
    claim_id: claim.claimId || claim.claim_id,
    claimType: claim.claimType || claim.claim_type,
    claim_type: claim.claimType || claim.claim_type,
    companyId: claim.companyId || claim.company_id,
    customerId: claim.customerId || claim.customer_id,
    createdAt: claim.createdAt || claim.created_at,
    updatedAt: claim.updatedAt || claim.updated_at,
  };
};

export const normalizeClaims = (claims) => normalizeArray(claims, normalizeClaim);

/**
 * User Adapter
 */
export const normalizeUser = (user) => {
  if (!user) return user;
  
  return {
    ...user,
    id: user.id || user._id,
    companyId: user.companyId || user.company_id,
    firstName: user.firstName || user.first_name,
    lastName: user.lastName || user.last_name,
    createdAt: user.createdAt || user.created_at,
    updatedAt: user.updatedAt || user.updated_at,
  };
};

/**
 * Generic API response normalizer
 * Handles both single entity and array responses
 */
export const normalizeApiResponse = (response, entityNormalizer) => {
  if (!response) return response;
  
  // Handle response with data property
  if (response.data) {
    if (Array.isArray(response.data)) {
      return {
        ...response,
        data: normalizeArray(response.data, entityNormalizer),
      };
    }
    return {
      ...response,
      data: entityNormalizer(response.data),
    };
  }
  
  // Handle direct array response
  if (Array.isArray(response)) {
    return normalizeArray(response, entityNormalizer);
  }
  
  // Handle direct entity response
  return entityNormalizer(response);
};

export default {
  normalizeId,
  normalizeArray,
  normalizeBudget,
  normalizeBudgets,
  normalizePromotion,
  normalizePromotions,
  normalizeCustomer,
  normalizeCustomers,
  normalizeProduct,
  normalizeProducts,
  normalizeTradeSpend,
  normalizeTradeSpends,
  normalizeClaim,
  normalizeClaims,
  normalizeUser,
  normalizeApiResponse,
};
