/**
 * Safe number utilities to handle NaN, Infinity, and null values
 */

function safeNumber(value, defaultValue = 0) {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  const num = Number(value);
  
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }
  
  return num;
}

function safeSum(...values) {
  return values.reduce((sum, val) => sum + safeNumber(val, 0), 0);
}

function safeAverage(values, defaultValue = 0) {
  if (!Array.isArray(values) || values.length === 0) {
    return defaultValue;
  }
  
  const validNumbers = values.map(v => safeNumber(v, null)).filter(v => v !== null);
  
  if (validNumbers.length === 0) {
    return defaultValue;
  }
  
  return validNumbers.reduce((sum, v) => sum + v, 0) / validNumbers.length;
}

function safePercentage(numerator, denominator, defaultValue = 0) {
  const num = safeNumber(numerator, 0);
  const den = safeNumber(denominator, 0);
  
  if (den === 0) {
    return defaultValue;
  }
  
  return (num / den) * 100;
}

function safeRound(value, decimals = 2) {
  const num = safeNumber(value, 0);
  const multiplier = Math.pow(10, decimals);
  return Math.round(num * multiplier) / multiplier;
}

module.exports = {
  safeNumber,
  safeSum,
  safeAverage,
  safePercentage,
  safeRound
};
