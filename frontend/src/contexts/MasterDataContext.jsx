import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const MasterDataContext = createContext();

export const useMasterFilters = () => {
  const context = useContext(MasterDataContext);
  if (!context) {
    throw new Error('useMasterFilters must be used within MasterDataProvider');
  }
  return context;
};

export const MasterDataProvider = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filters, setFilters] = useState({
    customerId: searchParams.get('customerId') || null,
    productId: searchParams.get('productId') || null,
    brandId: searchParams.get('brandId') || null,
    vendorId: searchParams.get('vendorId') || null,
    period: searchParams.get('period') || null
  });

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: null }));
  };

  const clearAllFilters = () => {
    setFilters({
      customerId: null,
      productId: null,
      brandId: null,
      vendorId: null,
      period: null
    });
  };

  const getQueryString = () => {
    const active = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {});
    return new URLSearchParams(active).toString();
  };

  const value = {
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    getQueryString
  };

  return (
    <MasterDataContext.Provider value={value}>
      {children}
    </MasterDataContext.Provider>
  );
};

export default MasterDataContext;
