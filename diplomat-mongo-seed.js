// Direct MongoDB seeding script for Diplomat SA data
const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://admin:TradeAI_Mongo_2024!@mongodb:27017/tradeai?authSource=admin';

// Mondelez products for Diplomat SA
const mondelezProducts = [
  {
    _id: new ObjectId(),
    name: 'Oreo Original 154g',
    sku: 'ORE001',
    companyId: new ObjectId('68c929e89c2fb5db9ecfde44'),
    category: 'Biscuits',
    brand: 'Oreo',
    subCategory: 'Sandwich Cookies',
    status: 'active',
    pricing: {
      cost: 18.50,
      listPrice: 24.99,
      wholesalePrice: 22.50,
      retailPrice: 24.99,
      margin: 26
    },
    inventory: {
      currentStock: 2500,
      reorderLevel: 500,
      maxStock: 5000
    },
    specifications: {
      packSize: '154g',
      unitOfMeasure: 'EA',
      barcode: '7622210951045'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Cadbury Dairy Milk 80g',
    sku: 'CAD001',
    companyId: new ObjectId('68c929e89c2fb5db9ecfde44'),
    category: 'Chocolate',
    brand: 'Cadbury',
    subCategory: 'Milk Chocolate',
    status: 'active',
    pricing: {
      cost: 16.50,
      listPrice: 22.99,
      wholesalePrice: 20.50,
      retailPrice: 22.99,
      margin: 28
    },
    inventory: {
      currentStock: 3200,
      reorderLevel: 600,
      maxStock: 6000
    },
    specifications: {
      packSize: '80g',
      unitOfMeasure: 'EA',
      barcode: '7622210123456'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Toblerone Original 100g',
    sku: 'TOB001',
    companyId: new ObjectId('68c929e89c2fb5db9ecfde44'),
    category: 'Chocolate',
    brand: 'Toblerone',
    subCategory: 'Premium Chocolate',
    status: 'active',
    pricing: {
      cost: 35.60,
      listPrice: 49.99,
      wholesalePrice: 45.00,
      retailPrice: 49.99,
      margin: 29
    },
    inventory: {
      currentStock: 800,
      reorderLevel: 150,
      maxStock: 1500
    },
    specifications: {
      packSize: '100g',
      unitOfMeasure: 'EA',
      barcode: '7622210789012'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Belvita Breakfast Original 300g',
    sku: 'BEL001',
    companyId: new ObjectId('68c929e89c2fb5db9ecfde44'),
    category: 'Biscuits',
    brand: 'Belvita',
    subCategory: 'Breakfast Biscuits',
    status: 'active',
    pricing: {
      cost: 28.50,
      listPrice: 39.99,
      wholesalePrice: 36.00,
      retailPrice: 39.99,
      margin: 29
    },
    inventory: {
      currentStock: 1200,
      reorderLevel: 200,
      maxStock: 2500
    },
    specifications: {
      packSize: '300g',
      unitOfMeasure: 'EA',
      barcode: '7622210345678'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Philadelphia Cream Cheese 230g',
    sku: 'PHI001',
    companyId: new ObjectId('68c929e89c2fb5db9ecfde44'),
    category: 'Cheese',
    brand: 'Philadelphia',
    subCategory: 'Cream Cheese',
    status: 'active',
    pricing: {
      cost: 28.90,
      listPrice: 39.99,
      wholesalePrice: 36.50,
      retailPrice: 39.99,
      margin: 28
    },
    inventory: {
      currentStock: 950,
      reorderLevel: 180,
      maxStock: 2000
    },
    specifications: {
      packSize: '230g',
      unitOfMeasure: 'EA',
      barcode: '7622210567890'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// South African retail customers
const southAfricanCustomers = [
  {
    _id: new ObjectId(),
    name: 'Shoprite Holdings',
    customerCode: 'SH001',
    companyId: new ObjectId('68c929e89c2fb5db9ecfde44'),
    type: 'Retail Chain',
    category: 'Hypermarket',
    status: 'active',
    contactInfo: {
      primaryContact: 'John Smith',
      email: 'procurement@shoprite.co.za',
      phone: '+27 21 980 4000',
      address: {
        street: '1 Shoprite Way',
        city: 'Cape Town',
        province: 'Western Cape',
        country: 'South Africa',
        postalCode: '7405'
      }
    },
    businessInfo: {
      region: 'National',
      paymentTerms: '30 days',
      creditLimit: 50000000,
      taxNumber: 'VAT123456789'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Pick n Pay',
    customerCode: 'PNP001',
    companyId: new ObjectId('68c929e89c2fb5db9ecfde44'),
    type: 'Retail Chain',
    category: 'Supermarket',
    status: 'active',
    contactInfo: {
      primaryContact: 'Sarah Johnson',
      email: 'buyers@pnp.co.za',
      phone: '+27 21 658 1000',
      address: {
        street: '101 Rosmead Avenue',
        city: 'Cape Town',
        province: 'Western Cape',
        country: 'South Africa',
        postalCode: '7700'
      }
    },
    businessInfo: {
      region: 'National',
      paymentTerms: '30 days',
      creditLimit: 40000000,
      taxNumber: 'VAT987654321'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Woolworths Food',
    customerCode: 'WW001',
    companyId: new ObjectId('68c929e89c2fb5db9ecfde44'),
    type: 'Retail Chain',
    category: 'Premium Supermarket',
    status: 'active',
    contactInfo: {
      primaryContact: 'Michael Brown',
      email: 'food.buyers@woolworths.co.za',
      phone: '+27 21 407 9111',
      address: {
        street: '93 Longmarket Street',
        city: 'Cape Town',
        province: 'Western Cape',
        country: 'South Africa',
        postalCode: '8001'
      }
    },
    businessInfo: {
      region: 'National',
      paymentTerms: '45 days',
      creditLimit: 25000000,
      taxNumber: 'VAT456789123'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'SPAR Group',
    customerCode: 'SP001',
    companyId: new ObjectId('68c929e89c2fb5db9ecfde44'),
    type: 'Retail Chain',
    category: 'Supermarket',
    status: 'active',
    contactInfo: {
      primaryContact: 'David Wilson',
      email: 'procurement@spar.co.za',
      phone: '+27 31 719 8000',
      address: {
        street: '22 Adcock Ingram Drive',
        city: 'Pinetown',
        province: 'KwaZulu-Natal',
        country: 'South Africa',
        postalCode: '3610'
      }
    },
    businessInfo: {
      region: 'National',
      paymentTerms: '30 days',
      creditLimit: 35000000,
      taxNumber: 'VAT789123456'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Makro',
    customerCode: 'MK001',
    companyId: new ObjectId('68c929e89c2fb5db9ecfde44'),
    type: 'Retail Chain',
    category: 'Wholesale',
    status: 'active',
    contactInfo: {
      primaryContact: 'Lisa Davis',
      email: 'buyers@makro.co.za',
      phone: '+27 11 929 3000',
      address: {
        street: '1 Makro Way',
        city: 'Johannesburg',
        province: 'Gauteng',
        country: 'South Africa',
        postalCode: '2001'
      }
    },
    businessInfo: {
      region: 'National',
      paymentTerms: '21 days',
      creditLimit: 60000000,
      taxNumber: 'VAT321654987'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Marketing budgets for Diplomat SA
const marketingBudgets = [
  {
    _id: new ObjectId(),
    name: 'Diplomat SA - Biscuits Marketing Budget 2024',
    budgetCode: 'DMB2024-001',
    companyId: new ObjectId('68c929e89c2fb5db9ecfde44'),
    year: 2024,
    quarter: 'Q1-Q4',
    category: 'Biscuits',
    type: 'Marketing',
    status: 'active',
    budget: {
      totalBudget: 250000000, // R250M
      allocatedBudget: 200000000, // R200M allocated
      spentAmount: 125000000,  // R125M spent
      remainingAmount: 125000000, // R125M remaining
      currency: 'ZAR'
    },
    period: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    },
    approvals: {
      status: 'approved',
      approvedBy: 'Finance Director',
      approvedDate: new Date('2023-12-15')
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Diplomat SA - Chocolate Marketing Budget 2024',
    budgetCode: 'DMB2024-002',
    companyId: new ObjectId('68c929e89c2fb5db9ecfde44'),
    year: 2024,
    quarter: 'Q1-Q4',
    category: 'Chocolate',
    type: 'Marketing',
    status: 'active',
    budget: {
      totalBudget: 300000000, // R300M
      allocatedBudget: 280000000, // R280M allocated
      spentAmount: 180000000,  // R180M spent
      remainingAmount: 120000000, // R120M remaining
      currency: 'ZAR'
    },
    period: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    },
    approvals: {
      status: 'approved',
      approvedBy: 'Finance Director',
      approvedDate: new Date('2023-12-15')
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Diplomat SA - Trade Marketing Budget 2024',
    budgetCode: 'DMB2024-003',
    companyId: new ObjectId('68c929e89c2fb5db9ecfde44'),
    year: 2024,
    quarter: 'Q1-Q4',
    category: 'Trade Marketing',
    type: 'Trade',
    status: 'active',
    budget: {
      totalBudget: 400000000, // R400M
      allocatedBudget: 350000000, // R350M allocated
      spentAmount: 210000000,  // R210M spent
      remainingAmount: 190000000, // R190M remaining
      currency: 'ZAR'
    },
    period: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    },
    approvals: {
      status: 'approved',
      approvedBy: 'Finance Director',
      approvedDate: new Date('2023-12-15')
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedDiplomatData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('tradeai');
    
    // Clear existing data
    console.log('Clearing existing data...');
    await db.collection('customers').deleteMany({});
    await db.collection('products').deleteMany({});
    await db.collection('budgets').deleteMany({});
    
    // Insert customers
    console.log('Inserting South African customers...');
    await db.collection('customers').insertMany(southAfricanCustomers);
    console.log(`${southAfricanCustomers.length} customers inserted`);
    
    // Insert products
    console.log('Inserting Mondelez products...');
    await db.collection('products').insertMany(mondelezProducts);
    console.log(`${mondelezProducts.length} products inserted`);
    
    // Insert budgets
    console.log('Inserting marketing budgets...');
    await db.collection('budgets').insertMany(marketingBudgets);
    console.log(`${marketingBudgets.length} budgets inserted`);
    
    // Calculate totals
    const totalBudget = marketingBudgets.reduce((sum, budget) => sum + budget.budget.totalBudget, 0);
    
    console.log('\n=== DIPLOMAT SA SEEDING COMPLETED ===');
    console.log(`Customers: ${southAfricanCustomers.length} (Major SA retailers)`);
    console.log(`Products: ${mondelezProducts.length} (Mondelez portfolio)`);
    console.log(`Budgets: ${marketingBudgets.length} (Total: R${(totalBudget / 1000000).toFixed(0)}M)`);
    console.log('Database ready for AI/ML testing with realistic SA FMCG data');
    
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await client.close();
  }
}

seedDiplomatData();