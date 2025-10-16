// Centralized formatting utilities

// Get user's currency preference from settings or default to USD
const getCurrencySettings = () => {
  // In a real app, this would come from user settings/context
  // For now, default to USD for consistency across the platform
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
    return '$0';
  }

  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  
  return `$${Number(amount).toLocaleString('en-US')}`;
};