export const formatCurrency = (amount, currency = 'ZAR', locale = 'en-ZA') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currency} 0.00`;
  }

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return formatter.format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
};

export const formatNumber = (number, decimals = 0, locale = 'en-ZA') => {
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

export const parseCurrency = (formattedAmount) => {
  if (!formattedAmount) return 0;
  
  const cleaned = String(formattedAmount).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
};

export default {
  formatCurrency,
  formatNumber,
  parseCurrency
};
