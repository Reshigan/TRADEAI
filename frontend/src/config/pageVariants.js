
export const PAGE_VARIANTS = {
  budgetDetail: {
    manufacturer: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'funding', label: 'Funding & Planning', path: 'funding' },
        { id: 'allocations', label: 'Allocations', path: 'allocations' },
        { id: 'promotions', label: 'Linked Promotions', path: 'promotions' },
        { id: 'claims', label: 'Claims', path: 'claims' },
        { id: 'reconcile', label: 'Reconcile', path: 'reconcile' },
        { id: 'audit', label: 'Audit Trail', path: 'audit' },
      ],
      actions: ['edit', 'allocate', 'approve', 'export'],
      defaultFilters: {},
    },
    distributor: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'vendor-funding', label: 'Vendor Funding', path: 'vendor-funding' },
        { id: 'allocations', label: 'Allocation to Retailers', path: 'allocations' },
        { id: 'promotions', label: 'Linked Promotions', path: 'promotions' },
        { id: 'claims', label: 'Claims', path: 'claims' },
        { id: 'reconcile', label: 'Reconcile', path: 'reconcile' },
        { id: 'audit', label: 'Audit Trail', path: 'audit' },
      ],
      actions: ['edit', 'allocate', 'approve', 'export'],
      defaultFilters: { showVendorColumn: true },
    },
    retailer: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'store-budgets', label: 'Store Budgets', path: 'store-budgets' },
        { id: 'offers', label: 'Offers', path: 'offers' },
        { id: 'execution', label: 'Execution', path: 'execution' },
        { id: 'claims', label: 'Claims', path: 'claims' },
        { id: 'settlements', label: 'Settlements', path: 'settlements' },
        { id: 'audit', label: 'Audit Trail', path: 'audit' },
      ],
      actions: ['view', 'accept-offer', 'submit-claim', 'export'],
      defaultFilters: { scope: 'store' },
    },
  },

  promotionDetail: {
    manufacturer: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'commitments', label: 'Commitments', path: 'commitments' },
        { id: 'products', label: 'Products', path: 'products' },
        { id: 'customers', label: 'Customers', path: 'customers' },
        { id: 'trade-spends', label: 'Trade Spends', path: 'trade-spends' },
        { id: 'claims', label: 'Claims', path: 'claims' },
        { id: 'performance', label: 'Performance', path: 'performance' },
      ],
      actions: ['edit', 'approve', 'execute', 'export'],
      defaultFilters: {},
    },
    distributor: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'vendor-funding', label: 'Vendor Funding Link', path: 'vendor-funding' },
        { id: 'allocation', label: 'Allocation to Retailers', path: 'allocation' },
        { id: 'customers', label: 'Retailers', path: 'customers' },
        { id: 'trade-spends', label: 'Trade Spends', path: 'trade-spends' },
        { id: 'claims', label: 'Claims', path: 'claims' },
        { id: 'performance', label: 'Performance', path: 'performance' },
      ],
      actions: ['edit', 'allocate', 'execute', 'export'],
      defaultFilters: { showVendorColumn: true },
    },
    retailer: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'offer', label: 'Offer Details', path: 'offer' },
        { id: 'stores', label: 'Store Execution', path: 'stores' },
        { id: 'trade-spends', label: 'Trade Spends', path: 'trade-spends' },
        { id: 'claims', label: 'Claims', path: 'claims' },
        { id: 'pos-proof', label: 'POS Proof', path: 'pos-proof' },
        { id: 'performance', label: 'Performance', path: 'performance' },
      ],
      actions: ['accept', 'execute', 'submit-claim', 'export'],
      defaultFilters: { scope: 'store' },
    },
  },

  tradeSpendDetail: {
    manufacturer: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'budget-link', label: 'Budget Link', path: 'budget-link' },
        { id: 'scope', label: 'Products & Customers', path: 'scope' },
        { id: 'accruals', label: 'Accruals', path: 'accruals' },
        { id: 'claims', label: 'Claims', path: 'claims' },
        { id: 'reconcile', label: 'Reconcile', path: 'reconcile' },
      ],
      actions: ['edit', 'approve', 'reconcile', 'export'],
      defaultFilters: {},
    },
    distributor: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'vendor-wallet', label: 'Vendor Wallet', path: 'vendor-wallet' },
        { id: 'allocation', label: 'Retailer Allocation', path: 'allocation' },
        { id: 'accruals', label: 'Accruals', path: 'accruals' },
        { id: 'claims', label: 'Claims', path: 'claims' },
        { id: 'reconcile', label: 'Reconcile', path: 'reconcile' },
      ],
      actions: ['edit', 'allocate', 'reconcile', 'export'],
      defaultFilters: { showVendorColumn: true },
    },
    retailer: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'offers', label: 'Applicable Offers', path: 'offers' },
        { id: 'execution', label: 'Store Execution', path: 'execution' },
        { id: 'claim-submission', label: 'Claim Submission', path: 'claim-submission' },
        { id: 'settlements', label: 'Settlements', path: 'settlements' },
      ],
      actions: ['execute', 'submit-claim', 'export'],
      defaultFilters: { scope: 'store' },
    },
  },

  customerDetail: {
    manufacturer: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'hierarchy', label: 'Hierarchy', path: 'hierarchy' },
        { id: 'promotions', label: 'Promotions', path: 'promotions' },
        { id: 'trade-spends', label: 'Trade Spends', path: 'trade-spends' },
        { id: 'claims', label: 'Claims', path: 'claims' },
        { id: 'deductions', label: 'Deductions', path: 'deductions' },
        { id: 'sales-history', label: 'Sales History', path: 'sales-history' },
      ],
      actions: ['edit', 'create-promotion', 'view-hierarchy', 'export'],
      defaultFilters: {},
      labels: { entity: 'Customer', plural: 'Customers' },
    },
    distributor: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'hierarchy', label: 'Hierarchy', path: 'hierarchy' },
        { id: 'allocations', label: 'Allocations', path: 'allocations' },
        { id: 'promotions', label: 'Promotions', path: 'promotions' },
        { id: 'trade-spends', label: 'Trade Spends', path: 'trade-spends' },
        { id: 'claims', label: 'Claims', path: 'claims' },
        { id: 'deductions', label: 'Deductions', path: 'deductions' },
        { id: 'sales-history', label: 'Sales History', path: 'sales-history' },
      ],
      actions: ['edit', 'allocate', 'view-hierarchy', 'export'],
      defaultFilters: { showVendorColumn: true },
      labels: { entity: 'Retailer', plural: 'Retailers' },
    },
    retailer: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'hierarchy', label: 'Store Hierarchy', path: 'hierarchy' },
        { id: 'offers', label: 'Offers', path: 'offers' },
        { id: 'execution', label: 'Execution', path: 'execution' },
        { id: 'claims', label: 'Claims', path: 'claims' },
        { id: 'settlements', label: 'Settlements', path: 'settlements' },
        { id: 'sales-history', label: 'Sales History', path: 'sales-history' },
      ],
      actions: ['edit', 'view-hierarchy', 'export'],
      defaultFilters: { scope: 'store' },
      labels: { entity: 'Store', plural: 'Stores' },
    },
  },

  productDetail: {
    manufacturer: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'hierarchy', label: 'Hierarchy', path: 'hierarchy' },
        { id: 'promotions', label: 'Promotions', path: 'promotions' },
        { id: 'trade-spends', label: 'Trade Spends', path: 'trade-spends' },
        { id: 'trading-terms', label: 'Trading Terms', path: 'trading-terms' },
        { id: 'sales-history', label: 'Sales History', path: 'sales-history' },
      ],
      actions: ['edit', 'create-promotion', 'view-hierarchy', 'export'],
      defaultFilters: {},
    },
    distributor: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'hierarchy', label: 'Hierarchy', path: 'hierarchy' },
        { id: 'promotions', label: 'Promotions', path: 'promotions' },
        { id: 'trade-spends', label: 'Trade Spends', path: 'trade-spends' },
        { id: 'trading-terms', label: 'Trading Terms', path: 'trading-terms' },
        { id: 'sales-history', label: 'Sales History', path: 'sales-history' },
      ],
      actions: ['edit', 'view-hierarchy', 'export'],
      defaultFilters: { showVendorColumn: true },
    },
    retailer: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'hierarchy', label: 'Hierarchy', path: 'hierarchy' },
        { id: 'promotions', label: 'Promotions', path: 'promotions' },
        { id: 'range', label: 'Range & Planogram', path: 'range' },
        { id: 'sales-history', label: 'Sales History', path: 'sales-history' },
      ],
      actions: ['view', 'view-hierarchy', 'export'],
      defaultFilters: { scope: 'store' },
    },
  },

  campaignDetail: {
    manufacturer: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'promotions', label: 'Promotions', path: 'promotions' },
        { id: 'budget', label: 'Budget', path: 'budget' },
        { id: 'performance', label: 'Performance', path: 'performance' },
      ],
      actions: ['edit', 'add-promotion', 'export'],
      defaultFilters: {},
    },
    distributor: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'promotions', label: 'Promotions', path: 'promotions' },
        { id: 'vendor-funding', label: 'Vendor Funding', path: 'vendor-funding' },
        { id: 'performance', label: 'Performance', path: 'performance' },
      ],
      actions: ['edit', 'add-promotion', 'export'],
      defaultFilters: { showVendorColumn: true },
    },
    retailer: {
      tabs: [
        { id: 'overview', label: 'Overview', path: 'overview' },
        { id: 'offers', label: 'Offers', path: 'offers' },
        { id: 'execution', label: 'Execution', path: 'execution' },
        { id: 'performance', label: 'Performance', path: 'performance' },
      ],
      actions: ['view', 'export'],
      defaultFilters: { scope: 'store' },
    },
  },

  budgetList: {
    manufacturer: {
      columns: ['name', 'year', 'totalAmount', 'allocated', 'spent', 'remaining', 'status'],
      filters: ['year', 'status', 'category'],
      actions: ['create', 'edit', 'allocate', 'export'],
      defaultSort: { field: 'year', order: 'desc' },
    },
    distributor: {
      columns: ['name', 'vendor', 'year', 'totalAmount', 'allocated', 'spent', 'remaining', 'status'],
      filters: ['vendor', 'year', 'status', 'category'],
      actions: ['create', 'edit', 'allocate', 'export'],
      defaultSort: { field: 'year', order: 'desc' },
    },
    retailer: {
      columns: ['name', 'supplier', 'year', 'totalAmount', 'available', 'status'],
      filters: ['supplier', 'year', 'status', 'store'],
      actions: ['view', 'export'],
      defaultSort: { field: 'year', order: 'desc' },
    },
  },

  promotionList: {
    manufacturer: {
      columns: ['name', 'type', 'period', 'customers', 'products', 'budget', 'status'],
      filters: ['status', 'type', 'customer', 'product', 'dateRange'],
      actions: ['create', 'edit', 'approve', 'export'],
      defaultSort: { field: 'startDate', order: 'desc' },
    },
    distributor: {
      columns: ['name', 'vendor', 'type', 'period', 'retailers', 'products', 'budget', 'status'],
      filters: ['vendor', 'status', 'type', 'retailer', 'product', 'dateRange'],
      actions: ['create', 'edit', 'allocate', 'export'],
      defaultSort: { field: 'startDate', order: 'desc' },
    },
    retailer: {
      columns: ['name', 'supplier', 'type', 'period', 'stores', 'products', 'status'],
      filters: ['supplier', 'status', 'type', 'store', 'product', 'dateRange'],
      actions: ['view', 'accept', 'execute', 'export'],
      defaultSort: { field: 'startDate', order: 'desc' },
    },
  },

  tradeSpendList: {
    manufacturer: {
      columns: ['name', 'type', 'customer', 'amount', 'accrued', 'claimed', 'status'],
      filters: ['status', 'type', 'customer', 'dateRange'],
      actions: ['create', 'edit', 'approve', 'export'],
      defaultSort: { field: 'createdAt', order: 'desc' },
    },
    distributor: {
      columns: ['name', 'vendor', 'type', 'retailer', 'amount', 'accrued', 'claimed', 'status'],
      filters: ['vendor', 'status', 'type', 'retailer', 'dateRange'],
      actions: ['create', 'edit', 'allocate', 'export'],
      defaultSort: { field: 'createdAt', order: 'desc' },
    },
    retailer: {
      columns: ['name', 'supplier', 'type', 'store', 'amount', 'claimed', 'settled', 'status'],
      filters: ['supplier', 'status', 'type', 'store', 'dateRange'],
      actions: ['view', 'claim', 'export'],
      defaultSort: { field: 'createdAt', order: 'desc' },
    },
  },
};

export const getPageVariant = (pageKey, companyType = 'manufacturer') => {
  const pageConfig = PAGE_VARIANTS[pageKey];
  if (!pageConfig) {
    console.warn(`No page variant configuration found for: ${pageKey}`);
    return null;
  }
  
  const variant = pageConfig[companyType];
  if (!variant) {
    console.warn(`No variant found for company type: ${companyType} on page: ${pageKey}`);
    return pageConfig.manufacturer || null;
  }
  
  return variant;
};
