const mongoose = require('mongoose');
const TradingTerm = require('./models/TradingTerm');
const TradeSpend = require('./models/TradeSpend');
const Activity = require('./models/Activity');
const Budget = require('./models/Budget');
const Promotion = require('./models/Promotion');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai';

const tradingTermsData = [
  {
    termId: 'TT-2025-001',
    customerName: 'Big Bazaar Mumbai',
    termType: 'Volume Discount',
    description: 'Tiered volume discount based on monthly purchase',
    paymentTerms: 'Quarterly',
    value: 5,
    valueType: 'Percentage',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    status: 'Active',
    targetVolume: 50000,
    actualVolume: 12500,
    estimatedPayout: 250000,
    actualPayout: 62500,
    currency: 'INR',
    notes: 'Automatic quarterly payout based on achievement',
    createdBy: 'admin@trade-ai.com',
    approvedBy: 'admin@trade-ai.com',
    approvedDate: new Date('2024-12-15')
  },
  {
    termId: 'TT-2025-002',
    customerName: 'D-Mart Bangalore',
    termType: 'Annual Rebate',
    description: 'Annual rebate for achieving 1 Cr revenue target',
    paymentTerms: 'Annual',
    value: 3,
    valueType: 'Percentage',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    status: 'Active',
    targetVolume: 75000,
    actualVolume: 18750,
    estimatedPayout: 300000,
    actualPayout: 75000,
    currency: 'INR',
    notes: 'Paid at year end upon achievement',
    createdBy: 'admin@trade-ai.com',
    approvedBy: 'admin@trade-ai.com',
    approvedDate: new Date('2024-12-20')
  },
  {
    termId: 'TT-2025-003',
    customerName: 'Reliance Fresh Delhi',
    termType: 'Growth Incentive',
    description: '15% YoY growth incentive program',
    paymentTerms: 'Quarterly',
    value: 7,
    valueType: 'Percentage',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    status: 'Active',
    targetVolume: 60000,
    actualVolume: 15000,
    estimatedPayout: 420000,
    actualPayout: 105000,
    currency: 'INR',
    notes: 'Based on quarterly growth vs 2024',
    createdBy: 'admin@trade-ai.com',
    approvedBy: 'admin@trade-ai.com',
    approvedDate: new Date('2024-12-18')
  },
  {
    termId: 'TT-2025-004',
    customerName: 'Star Supermarket Pune',
    termType: 'Promotional Support',
    description: 'Monthly promotional fund allocation',
    paymentTerms: 'Net 30',
    value: 50000,
    valueType: 'Fixed Amount',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-06-30'),
    status: 'Active',
    targetVolume: 25000,
    actualVolume: 6250,
    estimatedPayout: 300000,
    actualPayout: 100000,
    currency: 'INR',
    notes: 'For in-store promotional activities',
    createdBy: 'admin@trade-ai.com',
    approvedBy: 'admin@trade-ai.com',
    approvedDate: new Date('2024-12-10')
  },
  {
    termId: 'TT-2025-005',
    customerName: 'More Supermarket Kolkata',
    termType: 'Listing Fee',
    description: 'New SKU listing fee arrangement',
    paymentTerms: 'Immediate',
    value: 25000,
    valueType: 'Fixed Amount',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2026-01-31'),
    status: 'Active',
    targetVolume: 30000,
    actualVolume: 5000,
    estimatedPayout: 25000,
    actualPayout: 25000,
    currency: 'INR',
    notes: 'One-time payment for 5 new SKUs',
    createdBy: 'admin@trade-ai.com',
    approvedBy: 'admin@trade-ai.com',
    approvedDate: new Date('2025-01-15')
  },
  {
    termId: 'TT-2025-006',
    customerName: 'Spencer\'s Retail Chennai',
    termType: 'Marketing Fund',
    description: 'Joint marketing campaign support',
    paymentTerms: 'Net 60',
    value: 4,
    valueType: 'Percentage',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    status: 'Active',
    targetVolume: 40000,
    actualVolume: 10000,
    estimatedPayout: 160000,
    actualPayout: 40000,
    currency: 'INR',
    notes: 'Digital and print marketing campaigns',
    createdBy: 'admin@trade-ai.com',
    approvedBy: 'admin@trade-ai.com',
    approvedDate: new Date('2024-12-22')
  },
  {
    termId: 'TT-2024-101',
    customerName: 'Big Bazaar Mumbai',
    termType: 'Volume Discount',
    description: '2024 volume discount program',
    paymentTerms: 'Quarterly',
    value: 4.5,
    valueType: 'Percentage',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    status: 'Expired',
    targetVolume: 45000,
    actualVolume: 48000,
    estimatedPayout: 202500,
    actualPayout: 216000,
    currency: 'INR',
    notes: 'Successfully completed with 106% achievement',
    createdBy: 'admin@trade-ai.com',
    approvedBy: 'admin@trade-ai.com',
    approvedDate: new Date('2023-12-15')
  },
  {
    termId: 'TT-2025-007',
    customerName: 'Hypercity Hyderabad',
    termType: 'Distribution Support',
    description: 'Warehouse and distribution support',
    paymentTerms: 'Net 90',
    value: 75000,
    valueType: 'Fixed Amount',
    startDate: new Date('2025-03-01'),
    endDate: new Date('2025-08-31'),
    status: 'Pending',
    targetVolume: 20000,
    actualVolume: 0,
    estimatedPayout: 75000,
    actualPayout: 0,
    currency: 'INR',
    notes: 'Pending final approval',
    createdBy: 'admin@trade-ai.com'
  }
];

const tradeSpendsData = [
  {
    spendId: 'TS-2025-001',
    customerName: 'Big Bazaar Mumbai',
    productName: 'Choco Delight Bar 50g',
    spendType: 'Trade Promotion',
    category: 'Promotional',
    amount: 125000,
    currency: 'INR',
    spendDate: new Date('2025-01-15'),
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-01-31'),
    status: 'Completed',
    expectedROI: 2.5,
    actualROI: 2.8,
    expectedVolume: 15000,
    actualVolume: 16500,
    description: 'Republic Day promotional campaign',
    createdBy: 'admin@trade-ai.com',
    approvedBy: 'admin@trade-ai.com',
    approvedDate: new Date('2025-01-05')
  },
  {
    spendId: 'TS-2025-002',
    customerName: 'D-Mart Bangalore',
    productName: 'Premium Wafer Pack 100g',
    spendType: 'Display Allowance',
    category: 'Promotional',
    amount: 75000,
    currency: 'INR',
    spendDate: new Date('2025-02-01'),
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-02-28'),
    status: 'Active',
    expectedROI: 3.0,
    actualROI: null,
    expectedVolume: 12000,
    actualVolume: 3000,
    description: 'Premium end-cap display placement',
    createdBy: 'admin@trade-ai.com',
    approvedBy: 'admin@trade-ai.com',
    approvedDate: new Date('2025-01-20')
  },
  {
    spendId: 'TS-2025-003',
    customerName: 'Reliance Fresh Delhi',
    productName: 'Creamy Cookies 200g',
    spendType: 'Volume Discount',
    category: 'Non-Promotional',
    amount: 200000,
    currency: 'INR',
    spendDate: new Date('2025-01-31'),
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-03-31'),
    status: 'Active',
    expectedROI: 1.8,
    actualROI: 1.9,
    expectedVolume: 25000,
    actualVolume: 8500,
    description: 'Q1 volume discount incentive',
    createdBy: 'admin@trade-ai.com',
    approvedBy: 'admin@trade-ai.com',
    approvedDate: new Date('2024-12-20')
  },
  {
    spendId: 'TS-2025-004',
    customerName: 'Star Supermarket Pune',
    productName: 'Fruit Fusion Drink 250ml',
    spendType: 'Sample & Demo',
    category: 'Promotional',
    amount: 45000,
    currency: 'INR',
    spendDate: new Date('2025-02-10'),
    startDate: new Date('2025-02-10'),
    endDate: new Date('2025-02-12'),
    status: 'Approved',
    expectedROI: 4.0,
    expectedVolume: 5000,
    actualVolume: 0,
    description: 'Weekend sampling event',
    createdBy: 'admin@trade-ai.com',
    approvedBy: 'admin@trade-ai.com',
    approvedDate: new Date('2025-02-01')
  },
  {
    spendId: 'TS-2025-005',
    customerName: 'More Supermarket Kolkata',
    productName: 'Healthy Snack Mix 150g',
    spendType: 'Marketing Co-op',
    category: 'Promotional',
    amount: 90000,
    currency: 'INR',
    spendDate: new Date('2025-01-20'),
    startDate: new Date('2025-01-20'),
    endDate: new Date('2025-03-20'),
    status: 'Active',
    expectedROI: 2.2,
    actualROI: 2.4,
    expectedVolume: 10000,
    actualVolume: 2800,
    description: 'Joint digital marketing campaign',
    createdBy: 'admin@trade-ai.com',
    approvedBy: 'admin@trade-ai.com',
    approvedDate: new Date('2025-01-10')
  },
  {
    spendId: 'TS-2025-006',
    customerName: 'Spencer\'s Retail Chennai',
    productName: 'Crispy Chips Family Pack 250g',
    spendType: 'Slotting Fee',
    category: 'Fixed',
    amount: 50000,
    currency: 'INR',
    spendDate: new Date('2025-02-01'),
    status: 'Completed',
    description: 'New SKU slotting fee',
    createdBy: 'admin@trade-ai.com',
    approvedBy: 'admin@trade-ai.com',
    approvedDate: new Date('2025-01-25')
  },
  {
    spendId: 'TS-2025-007',
    customerName: 'Big Bazaar Mumbai',
    productName: 'Milk Chocolate Bar 100g',
    spendType: 'Rebate',
    category: 'Non-Promotional',
    amount: 150000,
    currency: 'INR',
    spendDate: new Date('2025-01-31'),
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-03-31'),
    status: 'Active',
    expectedROI: 1.5,
    actualROI: 1.6,
    expectedVolume: 20000,
    actualVolume: 7000,
    description: 'Q1 performance rebate',
    createdBy: 'admin@trade-ai.com',
    approvedBy: 'admin@trade-ai.com',
    approvedDate: new Date('2024-12-30')
  },
  {
    spendId: 'TS-2025-008',
    customerName: 'D-Mart Bangalore',
    productName: 'Energy Drink 500ml',
    spendType: 'Trade Promotion',
    category: 'Promotional',
    amount: 180000,
    currency: 'INR',
    spendDate: new Date('2025-03-01'),
    startDate: new Date('2025-03-01'),
    endDate: new Date('2025-03-15'),
    status: 'Planned',
    expectedROI: 3.5,
    expectedVolume: 18000,
    description: 'March Madness promotional campaign',
    createdBy: 'admin@trade-ai.com',
    approvedDate: new Date('2025-02-15')
  },
  {
    spendId: 'TS-2025-009',
    customerName: 'Reliance Fresh Delhi',
    productName: 'Butter Cookies 300g',
    spendType: 'Freight Allowance',
    category: 'Variable',
    amount: 35000,
    currency: 'INR',
    spendDate: new Date('2025-02-05'),
    status: 'Completed',
    description: 'Freight support for bulk order',
    createdBy: 'admin@trade-ai.com',
    approvedBy: 'admin@trade-ai.com',
    approvedDate: new Date('2025-01-30')
  },
  {
    spendId: 'TS-2025-010',
    customerName: 'Hypercity Hyderabad',
    productName: 'Protein Bar 50g',
    spendType: 'Display Allowance',
    category: 'Promotional',
    amount: 60000,
    currency: 'INR',
    spendDate: new Date('2025-02-15'),
    startDate: new Date('2025-02-15'),
    endDate: new Date('2025-03-15'),
    status: 'Active',
    expectedROI: 2.8,
    actualROI: null,
    expectedVolume: 8000,
    actualVolume: 1500,
    description: 'Health & wellness section display',
    createdBy: 'admin@trade-ai.com',
    approvedBy: 'admin@trade-ai.com',
    approvedDate: new Date('2025-02-05')
  }
];

const activitiesData = [
  {
    activityId: 'ACT-2025-001',
    activityName: 'Valentine\'s Day In-Store Campaign',
    activityType: 'In-Store Promotion',
    customerName: 'Big Bazaar Mumbai',
    startDate: new Date('2025-02-07'),
    endDate: new Date('2025-02-14'),
    status: 'Completed',
    budget: {
      allocated: 150000,
      spent: 142000,
      remaining: 8000
    },
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      stores: ['Andheri', 'Malad', 'Thane']
    },
    objectives: 'Drive chocolate and confectionery sales during Valentine\'s week',
    expectedOutcome: {
      volumeIncrease: 35,
      revenueTarget: 500000,
      roi: 3.5
    },
    actualOutcome: {
      volumeAchieved: 38,
      revenueAchieved: 535000,
      roi: 3.8
    },
    performance: 'Completed',
    owner: 'Rajesh Kumar',
    team: ['Priya Singh', 'Amit Patel'],
    description: 'Multi-brand chocolate promotion with special packaging',
    notes: 'Exceeded targets by 8%. Strong customer response.'
  },
  {
    activityId: 'ACT-2025-002',
    activityName: 'Summer Beverage Demo Days',
    activityType: 'Demo',
    customerName: 'D-Mart Bangalore',
    startDate: new Date('2025-03-01'),
    endDate: new Date('2025-03-31'),
    status: 'In Progress',
    budget: {
      allocated: 80000,
      spent: 25000,
      remaining: 55000
    },
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      stores: ['Whitefield', 'Koramangala', 'Jayanagar']
    },
    objectives: 'Launch new energy drink with in-store demos',
    expectedOutcome: {
      volumeIncrease: 25,
      revenueTarget: 300000,
      roi: 3.8
    },
    actualOutcome: {
      volumeAchieved: 8,
      revenueAchieved: 95000,
      roi: null
    },
    performance: 'On Track',
    owner: 'Sneha Reddy',
    team: ['Karthik M', 'Lakshmi N'],
    description: 'Weekend sampling and demo across 3 stores',
    milestones: [
      {
        name: 'Store setup complete',
        dueDate: new Date('2025-03-01'),
        completed: true,
        completedDate: new Date('2025-03-01')
      },
      {
        name: 'Week 2 demos',
        dueDate: new Date('2025-03-15'),
        completed: false
      }
    ]
  },
  {
    activityId: 'ACT-2025-003',
    activityName: 'Premium Display End-Cap Setup',
    activityType: 'Display',
    customerName: 'Reliance Fresh Delhi',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-04-30'),
    status: 'In Progress',
    budget: {
      allocated: 200000,
      spent: 80000,
      remaining: 120000
    },
    location: {
      city: 'Delhi',
      state: 'Delhi',
      stores: ['Lajpat Nagar', 'Saket', 'Dwarka', 'Rohini']
    },
    objectives: 'Increase visibility and sales of premium product range',
    expectedOutcome: {
      volumeIncrease: 40,
      revenueTarget: 800000,
      roi: 4.0
    },
    actualOutcome: {
      volumeAchieved: 15,
      revenueAchieved: 280000,
      roi: null
    },
    performance: 'On Track',
    owner: 'Vikram Sharma',
    team: ['Neha Gupta', 'Rahul Verma'],
    description: 'Premium end-cap displays with digital signage',
    milestones: [
      {
        name: 'Display materials delivered',
        dueDate: new Date('2025-01-25'),
        completed: true,
        completedDate: new Date('2025-01-24')
      },
      {
        name: 'All stores setup',
        dueDate: new Date('2025-02-05'),
        completed: true,
        completedDate: new Date('2025-02-04')
      },
      {
        name: 'Mid-term review',
        dueDate: new Date('2025-03-15'),
        completed: false
      }
    ]
  },
  {
    activityId: 'ACT-2025-004',
    activityName: 'Store Staff Training Program',
    activityType: 'Training',
    customerName: 'Star Supermarket Pune',
    startDate: new Date('2025-03-10'),
    endDate: new Date('2025-03-12'),
    status: 'Planned',
    budget: {
      allocated: 45000,
      spent: 0,
      remaining: 45000
    },
    location: {
      city: 'Pune',
      state: 'Maharashtra',
      stores: ['Koregaon Park', 'Viman Nagar']
    },
    objectives: 'Train store staff on new product features and upselling techniques',
    expectedOutcome: {
      volumeIncrease: 15,
      revenueTarget: 150000,
      roi: 3.3
    },
    performance: 'Not Started',
    owner: 'Pooja Deshmukh',
    team: ['Sanjay Patil'],
    description: '3-day comprehensive training on product knowledge',
    milestones: [
      {
        name: 'Training materials prepared',
        dueDate: new Date('2025-03-05'),
        completed: false
      },
      {
        name: 'Day 1 training',
        dueDate: new Date('2025-03-10'),
        completed: false
      }
    ]
  },
  {
    activityId: 'ACT-2025-005',
    activityName: 'Q1 Joint Business Planning',
    activityType: 'Joint Business Planning',
    customerName: 'More Supermarket Kolkata',
    startDate: new Date('2025-02-20'),
    endDate: new Date('2025-02-22'),
    status: 'Completed',
    budget: {
      allocated: 25000,
      spent: 22000,
      remaining: 3000
    },
    location: {
      city: 'Kolkata',
      state: 'West Bengal',
      stores: []
    },
    objectives: 'Align Q2 strategies and promotional calendar',
    expectedOutcome: {
      revenueTarget: 2000000,
      roi: 8.0
    },
    actualOutcome: {
      revenueAchieved: null,
      roi: null
    },
    performance: 'Completed',
    owner: 'Arjun Banerjee',
    team: ['Ritika Das', 'Subhash Chatterjee'],
    description: 'Strategic planning session with key stakeholders',
    notes: 'Successful alignment on Q2 calendar and investment'
  },
  {
    activityId: 'ACT-2025-006',
    activityName: 'Food Expo Participation',
    activityType: 'Trade Show',
    customerName: 'Spencer\'s Retail Chennai',
    startDate: new Date('2025-04-15'),
    endDate: new Date('2025-04-17'),
    status: 'Planned',
    budget: {
      allocated: 350000,
      spent: 50000,
      remaining: 300000
    },
    location: {
      city: 'Chennai',
      state: 'Tamil Nadu',
      stores: []
    },
    objectives: 'Launch 5 new SKUs and generate B2B leads',
    expectedOutcome: {
      volumeIncrease: 50,
      revenueTarget: 1500000,
      roi: 4.3
    },
    performance: 'Not Started',
    owner: 'Ramesh Iyer',
    team: ['Divya S', 'Kumar P', 'Anu M'],
    description: 'Major food industry expo with product launches',
    milestones: [
      {
        name: 'Booth booking confirmed',
        dueDate: new Date('2025-02-28'),
        completed: true,
        completedDate: new Date('2025-02-25')
      },
      {
        name: 'Marketing materials ready',
        dueDate: new Date('2025-04-01'),
        completed: false
      }
    ]
  },
  {
    activityId: 'ACT-2025-007',
    activityName: 'Holi Festive Promotion',
    activityType: 'Price Promotion',
    customerName: 'Big Bazaar Mumbai',
    startDate: new Date('2025-03-10'),
    endDate: new Date('2025-03-14'),
    status: 'Planned',
    budget: {
      allocated: 180000,
      spent: 0,
      remaining: 180000
    },
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      stores: ['All Mumbai locations']
    },
    objectives: 'Drive snack and beverage sales during Holi',
    expectedOutcome: {
      volumeIncrease: 45,
      revenueTarget: 650000,
      roi: 3.6
    },
    performance: 'Not Started',
    owner: 'Rajesh Kumar',
    team: ['Priya Singh', 'Manish Joshi'],
    description: 'Festival special pricing and bundled offers',
    milestones: [
      {
        name: 'Pricing approved',
        dueDate: new Date('2025-03-01'),
        completed: false
      },
      {
        name: 'Stock positioned',
        dueDate: new Date('2025-03-08'),
        completed: false
      }
    ]
  },
  {
    activityId: 'ACT-2025-008',
    activityName: 'Mega Volume Push Campaign',
    activityType: 'Volume Incentive',
    customerName: 'D-Mart Bangalore',
    startDate: new Date('2025-03-15'),
    endDate: new Date('2025-03-31'),
    status: 'Approved',
    budget: {
      allocated: 220000,
      spent: 0,
      remaining: 220000
    },
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      stores: ['All Bangalore stores']
    },
    objectives: 'Achieve 30% volume increase for Q1 closing',
    expectedOutcome: {
      volumeIncrease: 30,
      revenueTarget: 900000,
      roi: 4.1
    },
    performance: 'Not Started',
    owner: 'Sneha Reddy',
    team: ['Karthik M', 'Pradeep K'],
    description: 'Aggressive volume incentive for all product categories',
    milestones: [
      {
        name: 'Terms finalized',
        dueDate: new Date('2025-03-10'),
        completed: false
      }
    ]
  }
];

async function seedTradeData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get customer IDs for reference
    const Customer = mongoose.model('Customer');
    const customers = await Customer.find({});
    const customerMap = {};
    customers.forEach(c => {
      customerMap[c.name] = c._id;
    });

    console.log(`\n📦 Found ${customers.length} customers in database`);

    // Get product IDs for reference
    const Product = mongoose.model('Product');
    const products = await Product.find({});
    const productMap = {};
    products.forEach(p => {
      productMap[p.name] = p._id;
    });

    console.log(`📦 Found ${products.length} products in database\n`);

    // Clear existing data
    console.log('🗑️  Clearing existing trade data...');
    await TradingTerm.deleteMany({});
    await TradeSpend.deleteMany({});
    await Activity.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Seed Trading Terms
    console.log('📝 Seeding Trading Terms...');
    const tradingTermsToInsert = tradingTermsData.map(term => ({
      ...term,
      customer: customerMap[term.customerName] || customers[0]._id
    }));
    const tradingTerms = await TradingTerm.insertMany(tradingTermsToInsert);
    console.log(`✅ Created ${tradingTerms.length} trading terms\n`);

    // Seed Trade Spends
    console.log('💰 Seeding Trade Spends...');
    const tradeSpendsToInsert = tradeSpendsData.map(spend => ({
      ...spend,
      customer: customerMap[spend.customerName] || customers[0]._id,
      product: spend.productName ? (productMap[spend.productName] || products[0]._id) : undefined
    }));
    const tradeSpends = await TradeSpend.insertMany(tradeSpendsToInsert);
    console.log(`✅ Created ${tradeSpends.length} trade spends\n`);

    // Seed Activities
    console.log('🎯 Seeding Activities...');
    const activitiesToInsert = activitiesData.map(activity => ({
      ...activity,
      customer: customerMap[activity.customerName] || customers[0]._id,
      products: activity.products || []
    }));
    const activities = await Activity.insertMany(activitiesToInsert);
    console.log(`✅ Created ${activities.length} activities\n`);

    // Print summary
    console.log('📊 SEEDING SUMMARY:');
    console.log('═'.repeat(50));
    console.log(`✅ Trading Terms: ${tradingTerms.length}`);
    console.log(`✅ Trade Spends:  ${tradeSpends.length}`);
    console.log(`✅ Activities:    ${activities.length}`);
    console.log('═'.repeat(50));

    // Print some statistics
    console.log('\n📈 STATISTICS:');
    console.log('─'.repeat(50));
    
    const activeTerms = tradingTerms.filter(t => t.status === 'Active').length;
    console.log(`Active Trading Terms: ${activeTerms}/${tradingTerms.length}`);
    
    const totalSpendPlanned = tradeSpends.reduce((sum, s) => sum + s.amount, 0);
    console.log(`Total Trade Spend: ₹${totalSpendPlanned.toLocaleString('en-IN')}`);
    
    const inProgressActivities = activities.filter(a => a.status === 'In Progress').length;
    console.log(`In Progress Activities: ${inProgressActivities}/${activities.length}`);
    
    const totalActivityBudget = activities.reduce((sum, a) => sum + a.budget.allocated, 0);
    console.log(`Total Activity Budget: ₹${totalActivityBudget.toLocaleString('en-IN')}`);
    
    console.log('─'.repeat(50));
    console.log('\n🎉 Trade data seeding completed successfully!\n');

  } catch (error) {
    console.error('❌ Error seeding trade data:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
if (require.main === module) {
  seedTradeData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedTradeData };
