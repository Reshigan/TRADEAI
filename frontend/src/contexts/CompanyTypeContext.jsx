import React, { createContext, useContext, useMemo } from 'react';

const CompanyTypeContext = createContext(null);

const COMPANY_TYPE_CONFIG = {
  manufacturer: {
    labels: {
      fundingPlanning: 'Funding & Planning',
      activityPlanning: 'Activity Planning',
      execution: 'Execution',
      claimsSettlement: 'Claims & Settlement',
      performanceInsights: 'Performance & Insights',
      customers: 'Customers',
      claims: 'Customer Claims',
      reconciliationHub: 'Reconciliation Hub',
      deductions: 'Deductions',
      fundingOverview: 'Funding Overview',
    },
    processSteps: ['Plan', 'Commit', 'Execute', 'Claim', 'Reconcile', 'Review'],
    features: {
      showVendors: false,
      showSupplierTerms: false,
      showStoreHierarchy: false,
      showOfferInbox: false,
      enableMultiVendorWallets: false,
    },
  },
  distributor: {
    labels: {
      fundingPlanning: 'Vendor Funding & Planning',
      activityPlanning: 'Activity Planning',
      execution: 'Execution',
      claimsSettlement: 'Claims & Settlements',
      performanceInsights: 'Performance & Insights',
      customers: 'Retailers',
      claims: 'Claims Management',
      reconciliationHub: 'Reconciliation Hub',
      deductions: 'Deductions',
      fundingOverview: 'Funding Overview (by Vendor)',
    },
    processSteps: ['Receive Funding', 'Allocate', 'Execute', 'Claim', 'Reconcile', 'Review'],
    features: {
      showVendors: true,
      showSupplierTerms: false,
      showStoreHierarchy: false,
      showOfferInbox: false,
      enableMultiVendorWallets: true,
    },
  },
  retailer: {
    labels: {
      fundingPlanning: 'Supplier Terms & Store Budgets',
      activityPlanning: 'Promotion Planning',
      execution: 'In-Store Execution',
      claimsSettlement: 'Claim Submissions',
      performanceInsights: 'Performance & Insights',
      customers: 'Suppliers',
      claims: 'Claim Submissions',
      reconciliationHub: 'Settlement Tracking',
      deductions: 'Settlements',
      fundingOverview: 'Supplier Terms Overview',
    },
    processSteps: ['Receive Offers', 'Accept', 'Execute', 'Submit Claims', 'Track Settlement', 'Review'],
    features: {
      showVendors: false,
      showSupplierTerms: true,
      showStoreHierarchy: true,
      showOfferInbox: true,
      enableMultiVendorWallets: false,
    },
  },
};

export const CompanyTypeProvider = ({ children, user }) => {
  const companyType = user?.company?.companyType || user?.companyType || 'manufacturer';
  
  const config = useMemo(() => {
    return COMPANY_TYPE_CONFIG[companyType] || COMPANY_TYPE_CONFIG.manufacturer;
  }, [companyType]);

  const value = useMemo(() => ({
    companyType,
    labels: config.labels,
    processSteps: config.processSteps,
    features: config.features,
    isManufacturer: companyType === 'manufacturer',
    isDistributor: companyType === 'distributor',
    isRetailer: companyType === 'retailer',
  }), [companyType, config]);

  return (
    <CompanyTypeContext.Provider value={value}>
      {children}
    </CompanyTypeContext.Provider>
  );
};

export const useCompanyType = () => {
  const context = useContext(CompanyTypeContext);
  if (!context) {
    throw new Error('useCompanyType must be used within CompanyTypeProvider');
  }
  return context;
};

export default CompanyTypeContext;
