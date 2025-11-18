import { useMemo } from 'react';
import { useCompanyType } from '../contexts/CompanyTypeContext';
import { getPageVariant } from '../config/pageVariants';

/**
 * Hook to get page-specific variant configuration based on company type
 * Ensures cohesive UI across all levels (L1-L5) for manufacturer, distributor, and retailer
 * 
 * @param {string} pageKey - The page identifier (e.g., 'budgetDetail', 'promotionList')
 * @returns {object} Page variant configuration with tabs, actions, filters, labels
 */
export const usePageVariants = (pageKey) => {
  const { companyType } = useCompanyType();
  
  const variant = useMemo(() => {
    return getPageVariant(pageKey, companyType);
  }, [pageKey, companyType]);
  
  return variant;
};

export default usePageVariants;
