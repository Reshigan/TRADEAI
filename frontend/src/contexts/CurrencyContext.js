import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('ZAR');
  const [locale, setLocale] = useState('en-ZA');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.company?.currency) {
          setCurrency(user.company.currency);
        }
        if (user.company?.country === 'ZA') {
          setLocale('en-ZA');
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  const formatCurrency = (amount, options = {}) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return `${currency} 0.00`;
    }

    const {
      minimumFractionDigits = 2,
      maximumFractionDigits = 2,
      showSymbol = true
    } = options;

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: showSymbol ? 'currency' : 'decimal',
        currency: currency,
        minimumFractionDigits,
        maximumFractionDigits
      });

      return formatter.format(amount);
    } catch (error) {
      console.error('Currency formatting error:', error);
      return `${currency} ${Number(amount).toFixed(2)}`;
    }
  };

  const formatNumber = (number, decimals = 0) => {
    if (number === null || number === undefined || isNaN(number)) {
      return '0';
    }

    try {
      const formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });

      return formatter.format(number);
    } catch (error) {
      console.error('Number formatting error:', error);
      return Number(number).toFixed(decimals);
    }
  };

  const value = {
    currency,
    locale,
    setCurrency,
    setLocale,
    formatCurrency,
    formatNumber
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;
