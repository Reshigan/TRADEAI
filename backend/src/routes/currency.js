const express = require('express');
const router = express.Router();

// Exchange rates (In production, integrate with a real API like exchangerate-api.com)
const exchangeRates = {
  'USD': 1.0,
  'ZAR': 18.50,
  'EUR': 0.85,
  'GBP': 0.73,
  'JPY': 110.0,
  'CNY': 6.45,
  'INR': 74.0,
  'AUD': 1.35
};

// Helper functions
function getCurrencyName(code) {
  const names = {
    'USD': 'US Dollar',
    'ZAR': 'South African Rand',
    'EUR': 'Euro',
    'GBP': 'British Pound',
    'JPY': 'Japanese Yen',
    'CNY': 'Chinese Yuan',
    'INR': 'Indian Rupee',
    'AUD': 'Australian Dollar'
  };
  return names[code] || code;
}

function getCurrencySymbol(code) {
  const symbols = {
    'USD': '$',
    'ZAR': 'R',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'INR': '₹',
    'AUD': 'A$'
  };
  return symbols[code] || code;
}

// GET /api/analytics/currencies - Get all supported currencies
router.get('/analytics/currencies', async (req, res) => {
  try {
    const currencies = Object.keys(exchangeRates).map(code => ({
      code,
      name: getCurrencyName(code),
      symbol: getCurrencySymbol(code),
      rate: exchangeRates[code]
    }));

    res.json({
      success: true,
      currencies,
      baseCurrency: 'USD',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/currencies/convert - Convert currency
router.get('/currencies/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.query;

    if (!amount || !from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: amount, from, to'
      });
    }

    const fromRate = exchangeRates[from.toUpperCase()];
    const toRate = exchangeRates[to.toUpperCase()];

    if (!fromRate || !toRate) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported currency code'
      });
    }

    // Convert to USD first, then to target currency
    const usdAmount = parseFloat(amount) / fromRate;
    const convertedAmount = usdAmount * toRate;

    res.json({
      success: true,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      amount: parseFloat(amount),
      convertedAmount: parseFloat(convertedAmount.toFixed(2)),
      rate: parseFloat((toRate / fromRate).toFixed(6)),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/currencies - Get all currencies (alternative endpoint)
router.get('/currencies', async (req, res) => {
  try {
    const currencies = Object.keys(exchangeRates).map(code => ({
      code,
      name: getCurrencyName(code),
      symbol: getCurrencySymbol(code),
      rate: exchangeRates[code]
    }));

    res.json({
      success: true,
      data: currencies,
      baseCurrency: 'USD',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
