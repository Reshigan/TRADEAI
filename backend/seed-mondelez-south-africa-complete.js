/**
 * COMPREHENSIVE MONDELEZ SOUTH AFRICA SEED DATA
 * 
 * Complete dataset for demo with first potential customer
 * Includes: Products, Customers, Sales, Trading Terms, Trade Spends, Activities, Budgets, Promotions
 * Currency: ZAR (South African Rand)
 * Location: South Africa
 * Brand: Mondelez International
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai';

// South African Mondelez Products
const productsData = [
  // Cadbury Chocolate
  { productId: 'MON-SA-001', name: 'Cadbury Dairy Milk 80g', category: 'Chocolate', brand: 'Cadbury', sku: 'CDM-80G-SA', price: 22.50, cost: 14.50, margin: 35.6, unit: 'bar', weight: 80, status: 'Active' },
  { productId: 'MON-SA-002', name: 'Cadbury Dairy Milk 150g', category: 'Chocolate', brand: 'Cadbury', sku: 'CDM-150G-SA', price: 38.95, cost: 25.50, margin: 34.5, unit: 'bar', weight: 150, status: 'Active' },
  { productId: 'MON-SA-003', name: 'Cadbury Lunch Bar 48g', category: 'Chocolate', brand: 'Cadbury', sku: 'CLB-48G-SA', price: 12.50, cost: 8.00, margin: 36.0, unit: 'bar', weight: 48, status: 'Active' },
  { productId: 'MON-SA-004', name: 'Cadbury PS (Peppermint Crisp) 49g', category: 'Chocolate', brand: 'Cadbury', sku: 'CPS-49G-SA', price: 13.95, cost: 8.95, margin: 35.8, unit: 'bar', weight: 49, status: 'Active' },
  { productId: 'MON-SA-005', name: 'Cadbury Flake 32g', category: 'Chocolate', brand: 'Cadbury', sku: 'CFL-32G-SA', price: 11.50, cost: 7.50, margin: 34.8, unit: 'bar', weight: 32, status: 'Active' },
  { productId: 'MON-SA-006', name: 'Cadbury Top Deck 80g', category: 'Chocolate', brand: 'Cadbury', sku: 'CTD-80G-SA', price: 22.95, cost: 14.95, margin: 34.9, unit: 'bar', weight: 80, status: 'Active' },
  { productId: 'MON-SA-007', name: 'Cadbury Bar One 55g', category: 'Chocolate', brand: 'Cadbury', sku: 'CB1-55G-SA', price: 13.50, cost: 8.75, margin: 35.2, unit: 'bar', weight: 55, status: 'Active' },
  { productId: 'MON-SA-008', name: 'Cadbury Whispers Box 120g', category: 'Chocolate', brand: 'Cadbury', sku: 'CWH-120G-SA', price: 52.95, cost: 34.50, margin: 34.8, unit: 'box', weight: 120, status: 'Active' },
  { productId: 'MON-SA-009', name: 'Cadbury Roses 225g', category: 'Chocolate', brand: 'Cadbury', sku: 'CRO-225G-SA', price: 89.95, cost: 58.50, margin: 35.0, unit: 'box', weight: 225, status: 'Active' },
  { productId: 'MON-SA-010', name: 'Cadbury Chomp 26g', category: 'Chocolate', brand: 'Cadbury', sku: 'CCH-26G-SA', price: 7.95, cost: 5.00, margin: 37.1, unit: 'bar', weight: 26, status: 'Active' },
  
  // Oreo Biscuits
  { productId: 'MON-SA-011', name: 'Oreo Original 128g', category: 'Biscuits', brand: 'Oreo', sku: 'ORE-128G-SA', price: 18.95, cost: 12.50, margin: 34.0, unit: 'pack', weight: 128, status: 'Active' },
  { productId: 'MON-SA-012', name: 'Oreo Golden 154g', category: 'Biscuits', brand: 'Oreo', sku: 'ORG-154G-SA', price: 21.50, cost: 14.00, margin: 34.9, unit: 'pack', weight: 154, status: 'Active' },
  { productId: 'MON-SA-013', name: 'Oreo Thins 95g', category: 'Biscuits', brand: 'Oreo', sku: 'ORT-95G-SA', price: 16.95, cost: 11.00, margin: 35.1, unit: 'pack', weight: 95, status: 'Active' },
  { productId: 'MON-SA-014', name: 'Oreo Ice Cream 137g', category: 'Biscuits', brand: 'Oreo', sku: 'ORI-137G-SA', price: 19.95, cost: 13.00, margin: 34.8, unit: 'pack', weight: 137, status: 'Active' },
  
  // Biscuits (BelVita, Bahlsen)
  { productId: 'MON-SA-015', name: 'BelVita Breakfast Original 225g', category: 'Biscuits', brand: 'BelVita', sku: 'BEL-225G-SA', price: 32.95, cost: 21.50, margin: 34.7, unit: 'pack', weight: 225, status: 'Active' },
  { productId: 'MON-SA-016', name: 'BelVita Breakfast Chocolate 225g', category: 'Biscuits', brand: 'BelVita', sku: 'BEC-225G-SA', price: 34.95, cost: 22.75, margin: 34.9, unit: 'pack', weight: 225, status: 'Active' },
  { productId: 'MON-SA-017', name: 'Bakers Tennis 200g', category: 'Biscuits', brand: 'Bakers', sku: 'BAK-200G-SA', price: 19.95, cost: 13.00, margin: 34.8, unit: 'pack', weight: 200, status: 'Active' },
  { productId: 'MON-SA-018', name: 'Bakers Eet-Sum-Mor 200g', category: 'Biscuits', brand: 'Bakers', sku: 'BES-200G-SA', price: 21.50, cost: 14.00, margin: 34.9, unit: 'pack', weight: 200, status: 'Active' },
  
  // Gum & Candy
  { productId: 'MON-SA-019', name: 'Halls Mentho-Lyptus 33.5g', category: 'Candy', brand: 'Halls', sku: 'HAL-33G-SA', price: 14.95, cost: 9.75, margin: 34.8, unit: 'pack', weight: 33.5, status: 'Active' },
  { productId: 'MON-SA-020', name: 'Stimorol Ice Original 14g', category: 'Gum', brand: 'Stimorol', sku: 'STI-14G-SA', price: 9.95, cost: 6.50, margin: 34.7, unit: 'pack', weight: 14, status: 'Active' },
  { productId: 'MON-SA-021', name: 'Dentyne Ice Peppermint 14g', category: 'Gum', brand: 'Dentyne', sku: 'DEN-14G-SA', price: 11.50, cost: 7.50, margin: 34.8, unit: 'pack', weight: 14, status: 'Active' },
  { productId: 'MON-SA-022', name: 'Chappies Bubblegum 500g Bag', category: 'Candy', brand: 'Chappies', sku: 'CHP-500G-SA', price: 52.95, cost: 34.50, margin: 34.8, unit: 'bag', weight: 500, status: 'Active' },
  
  // Snacks
  { productId: 'MON-SA-023', name: 'Simba Cheese Puffs 150g', category: 'Snacks', brand: 'Simba', sku: 'SIM-150G-SA', price: 24.95, cost: 16.25, margin: 34.9, unit: 'pack', weight: 150, status: 'Active' },
  { productId: 'MON-SA-024', name: 'Simba Salt & Vinegar Chips 125g', category: 'Snacks', brand: 'Simba', sku: 'SSV-125G-SA', price: 22.50, cost: 14.65, margin: 34.9, unit: 'pack', weight: 125, status: 'Active' },
  { productId: 'MON-SA-025', name: 'NikNaks Cheese 135g', category: 'Snacks', brand: 'NikNaks', sku: 'NNK-135G-SA', price: 23.95, cost: 15.60, margin: 34.9, unit: 'pack', weight: 135, status: 'Active' },
];

// South African Retail Customers
const customersData = [
  { customerId: 'CUST-SA-001', name: 'Pick n Pay Johannesburg', type: 'Modern Trade', tier: 'Premium', city: 'Johannesburg', state: 'Gauteng', country: 'South Africa', region: 'Gauteng', contactPerson: 'Thabo Mbeki', email: 'thabo.mbeki@pnp.co.za', phone: '+27-11-234-5678', creditLimit: 5000000, paymentTerms: 'Net 30', status: 'Active' },
  { customerId: 'CUST-SA-002', name: 'Checkers Cape Town', type: 'Modern Trade', tier: 'Premium', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', region: 'Western Cape', contactPerson: 'Sarah van der Merwe', email: 'sarah.vdm@checkers.co.za', phone: '+27-21-567-8910', creditLimit: 4500000, paymentTerms: 'Net 30', status: 'Active' },
  { customerId: 'CUST-SA-003', name: 'Woolworths Sandton', type: 'Modern Trade', tier: 'Premium', city: 'Sandton', state: 'Gauteng', country: 'South Africa', region: 'Gauteng', contactPerson: 'Nomsa Dlamini', email: 'nomsa.d@woolworths.co.za', phone: '+27-11-789-0123', creditLimit: 6000000, paymentTerms: 'Net 30', status: 'Active' },
  { customerId: 'CUST-SA-004', name: 'Shoprite Pretoria', type: 'Modern Trade', tier: 'Standard', city: 'Pretoria', state: 'Gauteng', country: 'South Africa', region: 'Gauteng', contactPerson: 'Pieter Kruger', email: 'pieter.k@shoprite.co.za', phone: '+27-12-345-6789', creditLimit: 3500000, paymentTerms: 'Net 45', status: 'Active' },
  { customerId: 'CUST-SA-005', name: 'Spar Durban', type: 'Modern Trade', tier: 'Standard', city: 'Durban', state: 'KwaZulu-Natal', country: 'South Africa', region: 'KwaZulu-Natal', contactPerson: 'Rajesh Patel', email: 'rajesh.p@spar.co.za', phone: '+27-31-456-7890', creditLimit: 3000000, paymentTerms: 'Net 45', status: 'Active' },
  { customerId: 'CUST-SA-006', name: 'Boxer Stores Port Elizabeth', type: 'Modern Trade', tier: 'Standard', city: 'Port Elizabeth', state: 'Eastern Cape', country: 'South Africa', region: 'Eastern Cape', contactPerson: 'Linda Ndlovu', email: 'linda.n@boxerstores.co.za', phone: '+27-41-789-0123', creditLimit: 2500000, paymentTerms: 'Net 60', status: 'Active' },
  { customerId: 'CUST-SA-007', name: 'Pick n Pay Bloemfontein', type: 'Modern Trade', tier: 'Standard', city: 'Bloemfontein', state: 'Free State', country: 'South Africa', region: 'Free State', contactPerson: 'Johannes Botha', email: 'johannes.b@pnp.co.za', phone: '+27-51-234-5678', creditLimit: 2000000, paymentTerms: 'Net 45', status: 'Active' },
  { customerId: 'CUST-SA-008', name: 'Makro Midrand', type: 'Wholesale', tier: 'Premium', city: 'Midrand', state: 'Gauteng', country: 'South Africa', region: 'Gauteng', contactPerson: 'Ahmed Hassan', email: 'ahmed.h@makro.co.za', phone: '+27-11-987-6543', creditLimit: 7500000, paymentTerms: 'Net 30', status: 'Active' },
  { customerId: 'CUST-SA-009', name: 'Cambridge Foods Nelspruit', type: 'Distributor', tier: 'Basic', city: 'Nelspruit', state: 'Mpumalanga', country: 'South Africa', region: 'Mpumalanga', contactPerson: 'Elizabeth Mokoena', email: 'elizabeth.m@cambridge.co.za', phone: '+27-13-567-8901', creditLimit: 1500000, paymentTerms: 'Net 60', status: 'Active' },
  { customerId: 'CUST-SA-010', name: 'Fruit & Veg City Stellenbosch', type: 'Modern Trade', tier: 'Basic', city: 'Stellenbosch', state: 'Western Cape', country: 'South Africa', region: 'Western Cape', contactPerson: 'Francois Du Plessis', email: 'francois.dp@fnv.co.za', phone: '+27-21-876-5432', creditLimit: 1800000, paymentTerms: 'Net 45', status: 'Active' },
];

// Generate realistic South African sales data (last 18 months)
function generateSalesData(products, customers) {
  const sales = [];
  const startDate = new Date('2023-09-01');
  const endDate = new Date('2025-02-28');
  
  let saleCounter = 1;
  
  // Generate monthly sales for each customer
  for (let customer of customers) {
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Each customer buys 10-20 different products per month
      const numProducts = Math.floor(Math.random() * 11) + 10;
      const selectedProducts = products.sort(() => 0.5 - Math.random()).slice(0, numProducts);
      
      for (let product of selectedProducts) {
        // Generate random quantity based on customer tier
        let baseQty = customer.tier === 'Premium' ? 500 : customer.tier === 'Standard' ? 300 : 150;
        const quantity = Math.floor(Math.random() * baseQty) + (baseQty / 2);
        
        const saleDate = new Date(currentDate);
        saleDate.setDate(Math.floor(Math.random() * 28) + 1);
        
        sales.push({
          saleId: `SALE-SA-${String(saleCounter).padStart(5, '0')}`,
          product: null, // Will be set after product insertion
          productName: product.name,
          productId: product.productId,
          customer: null, // Will be set after customer insertion
          customerName: customer.name,
          customerId: customer.customerId,
          quantity: quantity,
          unitPrice: product.price,
          totalAmount: quantity * product.price,
          saleDate: saleDate,
          month: saleDate.getMonth() + 1,
          year: saleDate.getFullYear(),
          quarter: Math.floor(saleDate.getMonth() / 3) + 1,
          status: 'Completed',
          paymentStatus: Math.random() > 0.1 ? 'Paid' : 'Pending',
          currency: 'ZAR',
          region: customer.region
        });
        
        saleCounter++;
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }
  
  return sales;
}

// Trading Terms Data
const tradingTermsData = [
  {
    termId: 'TT-SA-2025-001',
    customerName: 'Pick n Pay Johannesburg',
    termType: 'Volume Discount',
    description: 'Quarterly volume discount for achieving R2M revenue target',
    paymentTerms: 'Quarterly',
    value: 4.5,
    valueType: 'Percentage',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    status: 'Active',
    targetVolume: 80000,
    actualVolume: 16000,
    estimatedPayout: 360000,
    actualPayout: 72000,
    currency: 'ZAR',
    notes: 'Automatic quarterly payout based on revenue achievement',
    createdBy: 'admin@mondelez.com',
    approvedBy: 'admin@mondelez.com',
    approvedDate: new Date('2024-12-10')
  },
  {
    termId: 'TT-SA-2025-002',
    customerName: 'Checkers Cape Town',
    termType: 'Annual Rebate',
    description: 'Annual rebate for achieving R1.5M annual target',
    paymentTerms: 'Annual',
    value: 3.5,
    valueType: 'Percentage',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    status: 'Active',
    targetVolume: 75000,
    actualVolume: 12500,
    estimatedPayout: 525000,
    actualPayout: 87500,
    currency: 'ZAR',
    notes: 'Paid at year end upon achievement verification',
    createdBy: 'admin@mondelez.com',
    approvedBy: 'admin@mondelez.com',
    approvedDate: new Date('2024-12-15')
  },
  {
    termId: 'TT-SA-2025-003',
    customerName: 'Woolworths Sandton',
    termType: 'Growth Incentive',
    description: '20% YoY growth incentive for premium range',
    paymentTerms: 'Quarterly',
    value: 6.0,
    valueType: 'Percentage',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    status: 'Active',
    targetVolume: 90000,
    actualVolume: 15000,
    estimatedPayout: 540000,
    actualPayout: 90000,
    currency: 'ZAR',
    notes: 'Growth measured against 2024 baseline',
    createdBy: 'admin@mondelez.com',
    approvedBy: 'admin@mondelez.com',
    approvedDate: new Date('2024-12-18')
  },
  {
    termId: 'TT-SA-2025-004',
    customerName: 'Shoprite Pretoria',
    termType: 'Promotional Support',
    description: 'Monthly promotional fund for in-store activities',
    paymentTerms: 'Net 30',
    value: 75000,
    valueType: 'Fixed Amount',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-06-30'),
    status: 'Active',
    targetVolume: 50000,
    actualVolume: 8333,
    estimatedPayout: 450000,
    actualPayout: 150000,
    currency: 'ZAR',
    notes: 'R75k monthly allocation for promotional activities',
    createdBy: 'admin@mondelez.com',
    approvedBy: 'admin@mondelez.com',
    approvedDate: new Date('2024-12-20')
  },
  {
    termId: 'TT-SA-2025-005',
    customerName: 'Makro Midrand',
    termType: 'Marketing Fund',
    description: 'Joint marketing campaign co-funding',
    paymentTerms: 'Net 60',
    value: 5.0,
    valueType: 'Percentage',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    status: 'Active',
    targetVolume: 100000,
    actualVolume: 16667,
    estimatedPayout: 500000,
    actualPayout: 83333,
    currency: 'ZAR',
    notes: 'Shared investment in digital and traditional marketing',
    createdBy: 'admin@mondelez.com',
    approvedBy: 'admin@mondelez.com',
    approvedDate: new Date('2024-12-22')
  }
];

// Trade Spend Data
const tradeSpendsData = [
  {
    spendId: 'TS-SA-2025-001',
    customerName: 'Pick n Pay Johannesburg',
    productName: 'Cadbury Dairy Milk 80g',
    spendType: 'Trade Promotion',
    category: 'Promotional',
    amount: 185000,
    currency: 'ZAR',
    spendDate: new Date('2025-01-20'),
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-02-14'),
    status: 'Completed',
    expectedROI: 3.2,
    actualROI: 3.5,
    expectedVolume: 25000,
    actualVolume: 27500,
    description: 'Valentine\'s Day promotional campaign',
    createdBy: 'admin@mondelez.com',
    approvedBy: 'admin@mondelez.com',
    approvedDate: new Date('2025-01-05')
  },
  {
    spendId: 'TS-SA-2025-002',
    customerName: 'Checkers Cape Town',
    productName: 'Oreo Original 128g',
    spendType: 'Display Allowance',
    category: 'Promotional',
    amount: 95000,
    currency: 'ZAR',
    spendDate: new Date('2025-02-01'),
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-03-31'),
    status: 'Active',
    expectedROI: 2.8,
    actualROI: null,
    expectedVolume: 18000,
    actualVolume: 4500,
    description: 'Premium end-cap display for 2 months',
    createdBy: 'admin@mondelez.com',
    approvedBy: 'admin@mondelez.com',
    approvedDate: new Date('2025-01-20')
  },
  {
    spendId: 'TS-SA-2025-003',
    customerName: 'Woolworths Sandton',
    productName: 'Cadbury Roses 225g',
    spendType: 'Volume Discount',
    category: 'Non-Promotional',
    amount: 250000,
    currency: 'ZAR',
    spendDate: new Date('2025-02-28'),
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-03-31'),
    status: 'Active',
    expectedROI: 2.2,
    actualROI: 2.4,
    expectedVolume: 30000,
    actualVolume: 10000,
    description: 'Q1 volume achievement discount',
    createdBy: 'admin@mondelez.com',
    approvedBy: 'admin@mondelez.com',
    approvedDate: new Date('2024-12-30')
  },
  {
    spendId: 'TS-SA-2025-004',
    customerName: 'Shoprite Pretoria',
    productName: 'Simba Cheese Puffs 150g',
    spendType: 'Sample & Demo',
    category: 'Promotional',
    amount: 65000,
    currency: 'ZAR',
    spendDate: new Date('2025-02-15'),
    startDate: new Date('2025-02-15'),
    endDate: new Date('2025-02-22'),
    status: 'Completed',
    expectedROI: 4.5,
    actualROI: 4.8,
    expectedVolume: 8000,
    actualVolume: 8500,
    description: 'Weekend in-store sampling events',
    createdBy: 'admin@mondelez.com',
    approvedBy: 'admin@mondelez.com',
    approvedDate: new Date('2025-02-01')
  },
  {
    spendId: 'TS-SA-2025-005',
    customerName: 'Makro Midrand',
    productName: 'BelVita Breakfast Original 225g',
    spendType: 'Marketing Co-op',
    category: 'Promotional',
    amount: 120000,
    currency: 'ZAR',
    spendDate: new Date('2025-01-31'),
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-03-31'),
    status: 'Active',
    expectedROI: 3.0,
    actualROI: null,
    expectedVolume: 15000,
    actualVolume: 3750,
    description: 'Joint healthy living campaign',
    createdBy: 'admin@mondelez.com',
    approvedBy: 'admin@mondelez.com',
    approvedDate: new Date('2025-01-10')
  }
];

// Activity Grid Data
const activitiesData = [
  {
    activityId: 'ACT-SA-2025-001',
    activityName: 'Easter Chocolate Campaign',
    activityType: 'In-Store Promotion',
    customerName: 'Pick n Pay Johannesburg',
    startDate: new Date('2025-03-15'),
    endDate: new Date('2025-04-20'),
    status: 'Planned',
    budget: {
      allocated: 350000,
      spent: 0,
      remaining: 350000
    },
    location: {
      city: 'Johannesburg',
      state: 'Gauteng',
      stores: ['Sandton City', 'Rosebank', 'Fourways', 'Cresta']
    },
    objectives: 'Drive Easter seasonal sales across Cadbury chocolate range',
    expectedOutcome: {
      volumeIncrease: 45,
      revenueTarget: 1200000,
      roi: 3.4
    },
    performance: 'Not Started',
    owner: 'Thabo Nkosi',
    team: ['Sipho Radebe', 'Lerato Molefe'],
    description: 'Comprehensive Easter campaign with themed displays and promotions',
    milestones: [
      { name: 'Planning complete', dueDate: new Date('2025-03-01'), completed: false },
      { name: 'Materials delivered', dueDate: new Date('2025-03-10'), completed: false },
      { name: 'Launch', dueDate: new Date('2025-03-15'), completed: false }
    ]
  },
  {
    activityId: 'ACT-SA-2025-002',
    activityName: 'Oreo Sampling Roadshow',
    activityType: 'Sampling',
    customerName: 'Checkers Cape Town',
    startDate: new Date('2025-02-20'),
    endDate: new Date('2025-03-20'),
    status: 'In Progress',
    budget: {
      allocated: 180000,
      spent: 45000,
      remaining: 135000
    },
    location: {
      city: 'Cape Town',
      state: 'Western Cape',
      stores: ['V&A Waterfront', 'Canal Walk', 'Tyger Valley']
    },
    objectives: 'Increase Oreo brand awareness and trial in Western Cape',
    expectedOutcome: {
      volumeIncrease: 30,
      revenueTarget: 550000,
      roi: 3.1
    },
    actualOutcome: {
      volumeAchieved: 12,
      revenueAchieved: 180000,
      roi: null
    },
    performance: 'On Track',
    owner: 'Sarah Williams',
    team: ['David Botha', 'Zanele Khumalo'],
    description: 'Mobile sampling units visiting major stores',
    milestones: [
      { name: 'Roadshow kick-off', dueDate: new Date('2025-02-20'), completed: true, completedDate: new Date('2025-02-20') },
      { name: 'Week 2 complete', dueDate: new Date('2025-03-06'), completed: false }
    ]
  },
  {
    activityId: 'ACT-SA-2025-003',
    activityName: 'Premium Confectionery Display',
    activityType: 'Display',
    customerName: 'Woolworths Sandton',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-05-31'),
    status: 'In Progress',
    budget: {
      allocated: 280000,
      spent: 93333,
      remaining: 186667
    },
    location: {
      city: 'Sandton',
      state: 'Gauteng',
      stores: ['Nelson Mandela Square', 'Hyde Park', 'Nicolway']
    },
    objectives: 'Premium placement for Cadbury Roses and Whispers gift boxes',
    expectedOutcome: {
      volumeIncrease: 50,
      revenueTarget: 950000,
      roi: 3.4
    },
    actualOutcome: {
      volumeAchieved: 16,
      revenueAchieved: 312000,
      roi: null
    },
    performance: 'On Track',
    owner: 'Nomsa Dlamini',
    team: ['Michael Chen', 'Precious Mtshali'],
    description: 'Eye-level premium displays with digital signage',
    milestones: [
      { name: 'Display setup', dueDate: new Date('2025-02-01'), completed: true, completedDate: new Date('2025-02-01') },
      { name: 'Mid-term review', dueDate: new Date('2025-03-31'), completed: false }
    ]
  },
  {
    activityId: 'ACT-SA-2025-004',
    activityName: 'Retail Staff Training',
    activityType: 'Training',
    customerName: 'Shoprite Pretoria',
    startDate: new Date('2025-03-05'),
    endDate: new Date('2025-03-07'),
    status: 'Planned',
    budget: {
      allocated: 55000,
      spent: 0,
      remaining: 55000
    },
    location: {
      city: 'Pretoria',
      state: 'Gauteng',
      stores: ['Menlyn', 'Brooklyn']
    },
    objectives: 'Train store staff on Mondelez product portfolio and merchandising',
    expectedOutcome: {
      volumeIncrease: 15,
      revenueTarget: 200000,
      roi: 3.6
    },
    performance: 'Not Started',
    owner: 'Pieter van Zyl',
    team: ['Anna Pretorius'],
    description: '3-day comprehensive product knowledge training',
    milestones: [
      { name: 'Materials prepared', dueDate: new Date('2025-03-01'), completed: false },
      { name: 'Day 1 training', dueDate: new Date('2025-03-05'), completed: false }
    ]
  },
  {
    activityId: 'ACT-SA-2025-005',
    activityName: 'Q2 Joint Business Planning',
    activityType: 'Joint Business Planning',
    customerName: 'Makro Midrand',
    startDate: new Date('2025-03-18'),
    endDate: new Date('2025-03-20'),
    status: 'Planned',
    budget: {
      allocated: 35000,
      spent: 0,
      remaining: 35000
    },
    location: {
      city: 'Midrand',
      state: 'Gauteng',
      stores: []
    },
    objectives: 'Align Q2-Q3 strategies and promotional calendar',
    expectedOutcome: {
      revenueTarget: 3500000,
      roi: 10.0
    },
    performance: 'Not Started',
    owner: 'Ahmed Hassan',
    team: ['Linda Ngwenya', 'Jacques Marais'],
    description: 'Strategic planning session with key decision makers',
    notes: 'Focus on wholesale channel expansion'
  }
];

// Main seed function
async function seedAllData() {
  try {
    console.log('\n🚀 MONDELEZ SOUTH AFRICA - COMPREHENSIVE DATA SEEDING');
    console.log('═'.repeat(70));
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define models
    const Product = mongoose.model('Product', require('./models/Product').schema);
    const Customer = mongoose.model('Customer', require('./models/Customer').schema);
    const SalesData = mongoose.model('SalesData', require('./models/SalesData').schema);
    const TradingTerm = mongoose.model('TradingTerm', require('./models/TradingTerm').schema);
    const TradeSpend = mongoose.model('TradeSpend', require('./models/TradeSpend').schema);
    const Activity = mongoose.model('Activity', require('./models/Activity').schema);

    // STEP 1: Clear ALL existing data
    console.log('🗑️  CLEARING ALL EXISTING DATA...');
    console.log('─'.repeat(70));
    await Product.deleteMany({});
    console.log('✅ Products cleared');
    await Customer.deleteMany({});
    console.log('✅ Customers cleared');
    await SalesData.deleteMany({});
    console.log('✅ Sales data cleared');
    await TradingTerm.deleteMany({});
    console.log('✅ Trading terms cleared');
    await TradeSpend.deleteMany({});
    console.log('✅ Trade spends cleared');
    await Activity.deleteMany({});
    console.log('✅ Activities cleared');
    console.log('✅ All existing data cleared\n');

    // STEP 2: Insert Products
    console.log('📦 SEEDING PRODUCTS...');
    console.log('─'.repeat(70));
    const products = await Product.insertMany(productsData);
    console.log(`✅ Created ${products.length} Mondelez products\n`);

    // STEP 3: Insert Customers
    console.log('👥 SEEDING CUSTOMERS...');
    console.log('─'.repeat(70));
    const customers = await Customer.insertMany(customersData);
    console.log(`✅ Created ${customers.length} South African retail customers\n`);

    // STEP 4: Generate and insert Sales Data
    console.log('💰 GENERATING SALES DATA (18 months)...');
    console.log('─'.repeat(70));
    const salesData = generateSalesData(products, customers);
    
    // Map product and customer IDs
    const productMap = {};
    products.forEach(p => { productMap[p.productId] = p._id; });
    const customerMap = {};
    customers.forEach(c => { customerMap[c.customerId] = c._id; });
    
    const salesWithRefs = salesData.map(sale => ({
      ...sale,
      product: productMap[sale.productId],
      customer: customerMap[sale.customerId]
    }));
    
    const sales = await SalesData.insertMany(salesWithRefs);
    console.log(`✅ Created ${sales.length} sales transactions\n`);

    // STEP 5: Insert Trading Terms
    console.log('📝 SEEDING TRADING TERMS...');
    console.log('─'.repeat(70));
    const tradingTermsWithRefs = tradingTermsData.map(term => ({
      ...term,
      customer: customers.find(c => c.name === term.customerName)?._id || customers[0]._id
    }));
    const tradingTerms = await TradingTerm.insertMany(tradingTermsWithRefs);
    console.log(`✅ Created ${tradingTerms.length} trading terms\n`);

    // STEP 6: Insert Trade Spends
    console.log('💸 SEEDING TRADE SPENDS...');
    console.log('─'.repeat(70));
    const tradeSpendsWithRefs = tradeSpendsData.map(spend => ({
      ...spend,
      customer: customers.find(c => c.name === spend.customerName)?._id || customers[0]._id,
      product: products.find(p => p.name === spend.productName)?._id
    }));
    const tradeSpends = await TradeSpend.insertMany(tradeSpendsWithRefs);
    console.log(`✅ Created ${tradeSpends.length} trade spends\n`);

    // STEP 7: Insert Activities
    console.log('🎯 SEEDING ACTIVITIES (Activity Grid)...');
    console.log('─'.repeat(70));
    const activitiesWithRefs = activitiesData.map(activity => ({
      ...activity,
      customer: customers.find(c => c.name === activity.customerName)?._id || customers[0]._id,
      products: []
    }));
    const activities = await Activity.insertMany(activitiesWithRefs);
    console.log(`✅ Created ${activities.length} activities\n`);

    // FINAL SUMMARY
    console.log('\n🎉 SEEDING COMPLETE!');
    console.log('═'.repeat(70));
    console.log('📊 FINAL DATABASE SUMMARY:');
    console.log('─'.repeat(70));
    console.log(`✅ Products:       ${products.length} (Mondelez portfolio)`);
    console.log(`✅ Customers:      ${customers.length} (SA retail chains)`);
    console.log(`✅ Sales Records:  ${sales.length} (18 months history)`);
    console.log(`✅ Trading Terms:  ${tradingTerms.length}`);
    console.log(`✅ Trade Spends:   ${tradeSpends.length}`);
    console.log(`✅ Activities:     ${activities.length}`);
    console.log('═'.repeat(70));
    
    // Calculate totals
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalSpend = tradeSpends.reduce((sum, s) => sum + s.amount, 0);
    const totalActivityBudget = activities.reduce((sum, a) => sum + a.budget.allocated, 0);
    
    console.log('\n💵 FINANCIAL SUMMARY (ZAR):');
    console.log('─'.repeat(70));
    console.log(`Total Sales Revenue:    R ${totalRevenue.toLocaleString('en-ZA', {minimumFractionDigits: 2})}`);
    console.log(`Total Trade Spend:      R ${totalSpend.toLocaleString('en-ZA', {minimumFractionDigits: 2})}`);
    console.log(`Total Activity Budget:  R ${totalActivityBudget.toLocaleString('en-ZA', {minimumFractionDigits: 2})}`);
    console.log('═'.repeat(70));
    
    console.log('\n✅ System is now ready for customer demo!');
    console.log('🌍 Location: South Africa');
    console.log('💰 Currency: ZAR (South African Rand)');
    console.log('🏢 Brand: Mondelez International\n');

  } catch (error) {
    console.error('\n❌ ERROR SEEDING DATA:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

// Execute seeding
if (require.main === module) {
  seedAllData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedAllData };
