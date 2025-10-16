// Centralized formatting utilities

// Get tenant's currency settings from user context
const getCurrencySettings = () => {
  try {
    // Get user data from localStorage (set during login)
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.company && user.company.currency) {
        // Map currency to locale and symbol
        const currencyMap = {
          'USD': { locale: 'en-US', symbol: '$' },
          'EUR': { locale: 'en-EU', symbol: '€' },
          'GBP': { locale: 'en-GB', symbol: '£' },
          'ZAR': { locale: 'en-ZA', symbol: 'R' },
          'AUD': { locale: 'en-AU', symbol: 'A$' },
          'CAD': { locale: 'en-CA', symbol: 'C$' },
          'JPY': { locale: 'ja-JP', symbol: '¥' },
          'CNY': { locale: 'zh-CN', symbol: '¥' },
          'INR': { locale: 'en-IN', symbol: '₹' }
        };
        
        const currencyInfo = currencyMap[user.company.currency] || currencyMap['USD'];
        return {
          currency: user.company.currency,
          symbol: currencyInfo.symbol,
          locale: currencyInfo.locale
        };
      }
    }
  } catch (error) {
    console.warn('Error getting currency settings from user context:', error);
  }
  
  // Fallback to USD if no company currency is available
  return {
    currency: 'USD',
    symbol: '$',
    locale: 'en-US'
  };
};

/**
 * Format currency amount based on user settings
 * @param {number} amount - The amount to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, options = {}) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0';
  }

  const settings = getCurrencySettings();
  const {
    currency = settings.currency,
    symbol = settings.symbol,
    locale = settings.locale,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  } = options;

  try {
    // Use Intl.NumberFormat for proper localization
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits,
      maximumFractionDigits
    });

    return formatter.format(amount);
  } catch (error) {
    // Fallback to simple formatting if Intl fails
    const formattedAmount = Number(amount).toLocaleString('en-US', {
      minimumFractionDigits,
      maximumFractionDigits
    });
    return `${symbol}${formattedAmount}`;
  }
};

/**
 * Format percentage
 * @param {number} value - The percentage value (0-100)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Format large numbers with compact notation (1.2M, 1.5K, etc.)
 * @param {number} value - The number to format
 * @param {boolean} useCompact - Whether to use compact notation
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, useCompact = true) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  if (!useCompact) {
    return Number(value).toLocaleString('en-US');
  }

  // Compact notation
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  
  return Number(value).toLocaleString('en-US');
};

/**
 * Format date according to user settings
 * @param {Date|string} date - The date to format
 * @param {string} format - Format type ('short', 'medium', 'long')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'medium') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';

  const options = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    medium: { day: '2-digit', month: 'short', year: 'numeric' },
    long: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }
  };

  return dateObj.toLocaleDateString('en-US', options[format] || options.medium);
};

/**
 * Format currency for display in tables/lists (shorter format)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrencyCompact = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    const settings = getCurrencySettings();
    return `${settings.symbol}0`;
  }

  const settings = getCurrencySettings();
  
  if (Math.abs(amount) >= 1000000) {
    return `${settings.symbol}${(amount / 1000000).toFixed(1)}M`;
  } else if (Math.abs(amount) >= 1000) {
    return `${settings.symbol}${(amount / 1000).toFixed(1)}K`;
  }
  
  return `${settings.symbol}${Number(amount).toLocaleString(settings.locale)}`;
};