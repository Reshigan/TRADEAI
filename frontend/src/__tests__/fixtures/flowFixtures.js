/**
 * Test Fixtures for Flow Components
 */

export const mockFlowSteps = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Enter customer basic details',
    validation: {
      fields: {
        name: { required: true, minLength: 3, message: 'Name is required (min 3 characters)' },
        type: { required: true, message: 'Customer type is required' },
        territory: { required: true, message: 'Territory is required' }
      }
    },
    aiEnabled: true
  },
  {
    id: 'contact',
    title: 'Contact Details',
    description: 'Enter contact information',
    validation: {
      fields: {
        email: { required: true, email: true, message: 'Valid email is required' },
        phone: { required: true, phone: true, message: 'Valid phone number is required' },
        address: { required: false }
      }
    },
    aiEnabled: true
  },
  {
    id: 'business',
    title: 'Business Profile',
    description: 'Enter business information',
    validation: {
      fields: {
        industry: { required: true, message: 'Industry is required' },
        annualVolume: { required: true, number: true, min: 0, message: 'Annual volume must be a positive number' },
        size: { required: false }
      }
    },
    aiEnabled: true
  },
  {
    id: 'payment',
    title: 'Payment Terms',
    description: 'Configure payment terms',
    validation: {
      fields: {
        creditLimit: { required: true, number: true, min: 0, message: 'Credit limit must be a positive number' },
        paymentDays: { required: true, number: true, min: 0, max: 90, message: 'Payment days must be between 0-90' }
      }
    },
    aiEnabled: true
  },
  {
    id: 'rebates',
    title: 'Rebate Eligibility',
    description: 'Select eligible rebate programs',
    validation: {
      fields: {}
    },
    aiEnabled: true,
    optional: true
  },
  {
    id: 'ai-analysis',
    title: 'AI Analysis',
    description: 'AI-powered risk and growth analysis',
    validation: {
      fields: {}
    },
    aiEnabled: true
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Review all information before submitting',
    validation: {
      fields: {}
    },
    aiEnabled: false
  }
];

export const mockAIRecommendations = [
  {
    type: 'insight',
    priority: 'high',
    title: 'High Growth Potential',
    message: 'This customer segment shows 82% growth potential based on historical data from similar customers in the Gauteng region.',
    metric: {
      label: 'Growth Potential',
      value: '82%',
      change: 15
    }
  },
  {
    type: 'warning',
    priority: 'medium',
    title: 'Credit Risk Assessment',
    message: 'Payment history analysis indicates 2 late payments in the past 12 months. Consider applying a more conservative credit limit.',
    action: {
      label: 'Adjust Credit Limit',
      onClick: () => console.log('Adjust credit limit clicked')
    }
  },
  {
    type: 'suggestion',
    priority: 'medium',
    title: 'Volume Rebate Recommendation',
    message: 'Based on projected annual volume, this customer qualifies for Tier 2 volume rebates. Expected ROI: 3.2x',
    action: {
      label: 'Apply Recommendation',
      data: {
        rebates: {
          volumeRebate: true,
          tier: 2
        }
      }
    }
  },
  {
    type: 'best-practice',
    priority: 'low',
    title: 'Onboarding Best Practice',
    message: 'Consider scheduling an initial business review meeting within 30 days of onboarding to establish KPIs and success metrics.',
    action: {
      label: 'Schedule Meeting'
    }
  }
];

export const mockCustomerData = {
  'basic-info': {
    name: 'Test Customer Inc',
    type: 'Retail',
    territory: 'Gauteng'
  },
  'contact': {
    email: 'test@customer.com',
    phone: '+27111234567',
    address: '123 Test Street, Johannesburg'
  },
  'business': {
    industry: 'Retail',
    annualVolume: 1500000,
    size: 'Medium'
  },
  'payment': {
    creditLimit: 75000,
    paymentDays: 30
  },
  'rebates': {
    volumeRebate: true,
    growthRebate: true,
    earlyPayment: false
  },
  'ai-analysis': {
    riskScore: 65,
    growthPotential: 82,
    recommendedCreditLimit: 75000
  }
};

export const mockProductData = {
  'identification': {
    sku: 'PROD-001',
    name: 'Premium Soda 24-pack',
    category: 'Beverages',
    brand: 'Test Brand'
  },
  'pricing': {
    basePrice: 15.00,
    cogs: 9.00,
    margin: 40
  },
  'inventory': {
    warehouse: 'Main Warehouse',
    minLevel: 100,
    maxLevel: 1000,
    reorderPoint: 250
  },
  'promotions': {
    allowPromotions: true,
    promoTypes: ['Off-Invoice', 'Scan Allowance', 'Display']
  },
  'rebates': {
    volumeRebate: true,
    coopMarketing: true
  },
  'ai-insights': {
    demandForecast: {
      next30Days: 5000,
      next60Days: 8000,
      next90Days: 12000
    },
    seasonality: 'Summer Peak',
    priceElasticity: -1.2
  }
};

export const mockBudgetData = {
  'scope': {
    year: 2025,
    quarter: 'Q1',
    brand: 'All Brands',
    category: 'All Categories'
  },
  'historical': {
    previousBudget: 1000000,
    actualSpend: 950000,
    variance: -5
  },
  'allocation': {
    tradeSpend: 500000,
    marketing: 200000,
    promotions: 300000
  },
  'reserves': {
    volumeRebates: 150000,
    growthRebates: 50000,
    coopMarketing: 100000
  },
  'ai-optimization': {
    recommendedAllocation: {
      tradeSpend: 450000,
      marketing: 250000,
      promotions: 300000
    },
    expectedROI: 3.5,
    confidence: 87
  }
};

export const mockAPIResponses = {
  customerCreate: {
    success: true,
    data: {
      id: 'cust-123',
      ...mockCustomerData['basic-info'],
      ...mockCustomerData['contact'],
      ...mockCustomerData['business'],
      ...mockCustomerData['payment'],
      createdAt: '2025-10-29T00:00:00Z'
    }
  },
  customerUpdate: {
    success: true,
    data: {
      id: 'cust-123',
      ...mockCustomerData['basic-info'],
      ...mockCustomerData['contact'],
      updatedAt: '2025-10-29T00:00:00Z'
    }
  },
  aiAnalysis: {
    riskScore: 65,
    growthPotential: 82,
    creditSuggestion: 75000,
    recommendations: mockAIRecommendations.slice(0, 2),
    warnings: [mockAIRecommendations[1]],
    confidence: 87
  },
  productForecast: {
    demandForecast: {
      next30Days: 5000,
      next60Days: 8000,
      next90Days: 12000
    },
    seasonality: {
      peakMonths: ['Jun', 'Jul', 'Aug'],
      lowMonths: ['Jan', 'Feb', 'Mar']
    },
    confidence: 87,
    recommendations: [
      {
        type: 'insight',
        message: 'Increase inventory for summer season'
      }
    ]
  },
  priceOptimization: {
    currentPrice: 15.00,
    optimalPrice: 16.50,
    priceElasticity: -1.2,
    marginImpact: {
      current: 40,
      optimal: 44
    },
    volumeImpact: -8,
    revenueImpact: 12,
    recommendations: [
      {
        type: 'suggestion',
        message: 'Price increase of 10% has minimal volume impact'
      }
    ]
  },
  budgetOptimization: {
    currentAllocation: {
      tradeSpend: 500000,
      marketing: 200000,
      promotions: 300000
    },
    recommendedAllocation: {
      tradeSpend: 450000,
      marketing: 250000,
      promotions: 300000
    },
    expectedROI: {
      current: 2.8,
      recommended: 3.5
    },
    rationale: [
      'Marketing spend shows 4.2x ROI, recommend 25% increase',
      'Trade spend optimization saves R50k with minimal impact'
    ],
    confidence: 89
  }
};

export const mockErrors = {
  validation: {
    name: 'Name is required',
    email: 'Invalid email format',
    phone: 'Invalid phone number',
    creditLimit: 'Credit limit must be a positive number'
  },
  api: {
    network: {
      message: 'Network error: Unable to connect to server',
      code: 'NETWORK_ERROR'
    },
    server: {
      message: 'Internal server error',
      code: 'SERVER_ERROR',
      status: 500
    },
    unauthorized: {
      message: 'Unauthorized: Invalid or expired token',
      code: 'UNAUTHORIZED',
      status: 401
    },
    notFound: {
      message: 'Resource not found',
      code: 'NOT_FOUND',
      status: 404
    },
    validation: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      status: 400,
      errors: {
        name: 'Name is required',
        email: 'Invalid email format'
      }
    }
  }
};
