// T-02: TerminologyContext - Per-tenant configurable entity labels
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsService } from '../services/api';

// Default terminology (hardcoded fallback)
const DEFAULT_TERMINOLOGY = {
  budget: 'Budget',
  promotion: 'Promotion',
  trade_spend: 'Trade Spend',
  campaign: 'Campaign',
  rebate: 'Rebate',
  claim: 'Claim',
  deduction: 'Deduction',
  settlement: 'Settlement',
  accrual: 'Accrual',
  trading_term: 'Trading Term',
  vendor: 'Vendor',
  customer: 'Customer',
  product: 'Product',
  approval: 'Approval',
  notification: 'Notification',
  kam_wallet: 'KAM Wallet',
  vendor_fund: 'Vendor Fund',
  pnl: 'P&L',
  forecast: 'Forecast',
  baseline: 'Baseline',
  scenario: 'Scenario',
};

const TerminologyContext = createContext({
  labels: DEFAULT_TERMINOLOGY,
  t: (key) => DEFAULT_TERMINOLOGY[key] || key,
  tPlural: (key) => (DEFAULT_TERMINOLOGY[key] || key) + 's',
  loading: false,
  companyType: 'distributor',
  refresh: () => {},
  updateTerminology: async () => {},
  resetTerminology: async () => {},
});

export const TerminologyProvider = ({ children }) => {
  const [labels, setLabels] = useState(DEFAULT_TERMINOLOGY);
  const [companyType, setCompanyType] = useState('distributor');
  const [loading, setLoading] = useState(false);

  const fetchTerminology = useCallback(async () => {
    try {
      setLoading(true);
      const response = await settingsService.getTerminology();
      const data = response?.data || response;
      if (data?.labels) {
        setLabels({ ...DEFAULT_TERMINOLOGY, ...data.labels });
      }
      if (data?.companyType) {
        setCompanyType(data.companyType);
      }
    } catch (error) {
      console.log('Using default terminology (API unavailable):', error.message);
      setLabels(DEFAULT_TERMINOLOGY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      fetchTerminology();
    }
  }, [fetchTerminology]);

  // t(key) - Get singular label for a terminology key
  const t = useCallback((key) => {
    return labels[key] || DEFAULT_TERMINOLOGY[key] || key;
  }, [labels]);

  // tPlural(key) - Get plural label
  const tPlural = useCallback((key) => {
    const singular = labels[key] || DEFAULT_TERMINOLOGY[key] || key;
    // Simple English pluralization
    if (singular.endsWith('s') || singular.endsWith('x') || singular.endsWith('z')) return singular + 'es';
    if (singular.endsWith('y') && !['a','e','i','o','u'].includes(singular[singular.length - 2])) {
      return singular.slice(0, -1) + 'ies';
    }
    return singular + 's';
  }, [labels]);

  const updateTerminology = useCallback(async (updates) => {
    try {
      await settingsService.updateTerminology(updates);
      setLabels(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Failed to update terminology:', error);
      throw error;
    }
  }, []);

  const resetTerminology = useCallback(async () => {
    try {
      await settingsService.resetTerminology();
      setLabels(DEFAULT_TERMINOLOGY);
    } catch (error) {
      console.error('Failed to reset terminology:', error);
      throw error;
    }
  }, []);

  return (
    <TerminologyContext.Provider value={{
      labels,
      t,
      tPlural,
      loading,
      companyType,
      refresh: fetchTerminology,
      updateTerminology,
      resetTerminology,
    }}>
      {children}
    </TerminologyContext.Provider>
  );
};

// Hook for consuming terminology
export const useTerminology = () => {
  const context = useContext(TerminologyContext);
  if (!context) {
    return {
      labels: DEFAULT_TERMINOLOGY,
      t: (key) => DEFAULT_TERMINOLOGY[key] || key,
      tPlural: (key) => (DEFAULT_TERMINOLOGY[key] || key) + 's',
      loading: false,
      companyType: 'distributor',
      refresh: () => {},
      updateTerminology: async () => {},
      resetTerminology: async () => {},
    };
  }
  return context;
};

export { DEFAULT_TERMINOLOGY };
export default TerminologyContext;
