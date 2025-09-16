const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:TradeAI_Mongo_2024!@localhost:27017/tradeai?authSource=admin';

// Connect to MongoDB
mongoose.connect(MONGODB_URI);

// Define schemas
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, required: true },
  employeeId: String,
  department: String,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  industry: String,
  country: String,
  currency: String,
  fiscalYearStart: String,
  settings: {
    timezone: String,
    dateFormat: String,
    numberFormat: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sapCustomerId: { type: String, unique: true },
  type: String,
  category: String,
  region: String,
  city: String,
  province: String,
  country: String,
  contactPerson: String,
  email: String,
  phone: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sapMaterialId: { type: String, unique: true },
  brand: String,
  category: String,
  subCategory: String,
  packSize: String,
  unitOfMeasure: String,
  costPrice: Number,
  listPrice: Number,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const budgetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  year: { type: Number, required: true },
  quarter: String,
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  category: String,
  totalBudget: { type: Number, required: true },
  spentAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  status: { type: String, default: 'active' },
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const salesDataSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalValue: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  netValue: { type: Number, required: true },
  region: String,
  salesRep: String,
  channel: String,
  createdAt: { type: Date, default: Date.now }
});

const promotionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  type: String,
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  budget: { type: Number, required: true },
  spentAmount: { type: Number, default: 0 },
  discountPercentage: Number,
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const Company = mongoose.model('Company', companySchema);
const Customer = mongoose.model('Customer', customerSchema);
const Product = mongoose.model('Product', productSchema);
const Budget = mongoose.model('Budget', budgetSchema);
const SalesData = mongoose.model('SalesData', salesDataSchema);
const Promotion = mongoose.model('Promotion', promotionSchema);

// Mondelez product categories and brands
const mondelezProducts = [
  // Biscuits
  { name: 'Oreo Original 154g', brand: 'Oreo', category: 'Biscuits', subCategory: 'Sandwich Cookies', packSize: '154g', costPrice: 18.50, listPrice: 24.99 },
  { name: 'Oreo Golden 154g', brand: 'Oreo', category: 'Biscuits', subCategory: 'Sandwich Cookies', packSize: '154g', costPrice: 18.50, listPrice: 24.99 },
  { name: 'Oreo Thins Original 95g', brand: 'Oreo', category: 'Biscuits', subCategory: 'Thin Cookies', packSize: '95g', costPrice: 16.20, listPrice: 21.99 },
  { name: 'Chips Ahoy! Original 300g', brand: 'Chips Ahoy!', category: 'Biscuits', subCategory: 'Chocolate Chip Cookies', packSize: '300g', costPrice: 22.80, listPrice: 32.99 },
  { name: 'Belvita Breakfast Original 300g', brand: 'Belvita', category: 'Biscuits', subCategory: 'Breakfast Biscuits', packSize: '300g', costPrice: 28.50, listPrice: 39.99 },
  { name: 'Belvita Breakfast Honey & Nuts 300g', brand: 'Belvita', category: 'Biscuits', subCategory: 'Breakfast Biscuits', packSize: '300g', costPrice: 29.80, listPrice: 42.99 },
  
  // Chocolate
  { name: 'Cadbury Dairy Milk 80g', brand: 'Cadbury', category: 'Chocolate', subCategory: 'Milk Chocolate', packSize: '80g', costPrice: 16.50, listPrice: 22.99 },
  { name: 'Cadbury Dairy Milk Oreo 110g', brand: 'Cadbury', category: 'Chocolate', subCategory: 'Flavored Chocolate', packSize: '110g', costPrice: 22.80, listPrice: 32.99 },
  { name: 'Toblerone Original 100g', brand: 'Toblerone', category: 'Chocolate', subCategory: 'Premium Chocolate', packSize: '100g', costPrice: 35.60, listPrice: 49.99 },
  { name: 'Milka Alpine Milk 100g', brand: 'Milka', category: 'Chocolate', subCategory: 'Milk Chocolate', packSize: '100g', costPrice: 24.50, listPrice: 34.99 },
  
  // Gum & Candy
  { name: 'Trident White Peppermint 14s', brand: 'Trident', category: 'Gum', subCategory: 'Sugar-free Gum', packSize: '14 pieces', costPrice: 8.90, listPrice: 12.99 },
  { name: 'Halls Mentho-Lyptus 33.5g', brand: 'Halls', category: 'Candy', subCategory: 'Throat Lozenges', packSize: '33.5g', costPrice: 12.50, listPrice: 17.99 },
  { name: 'Sour Patch Kids Original 141g', brand: 'Sour Patch Kids', category: 'Candy', subCategory: 'Sour Candy', packSize: '141g', costPrice: 18.90, listPrice: 26.99 },
  
  // Coffee
  { name: 'Jacobs Kronung Ground Coffee 250g', brand: 'Jacobs', category: 'Coffee', subCategory: 'Ground Coffee', packSize: '250g', costPrice: 45.80, listPrice: 64.99 },
  { name: 'Tassimo Jacobs Kronung T-Discs', brand: 'Tassimo', category: 'Coffee', subCategory: 'Coffee Pods', packSize: '16 pods', costPrice: 52.90, listPrice: 74.99 },
  
  // Cheese & Crackers
  { name: 'Philadelphia Original Cream Cheese 230g', brand: 'Philadelphia', category: 'Cheese', subCategory: 'Cream Cheese', packSize: '230g', costPrice: 28.90, listPrice: 39.99 },
  { name: 'Ritz Original Crackers 200g', brand: 'Ritz', category: 'Crackers', subCategory: 'Round Crackers', packSize: '200g', costPrice: 19.80, listPrice: 27.99 },
  { name: 'TUC Original Crackers 150g', brand: 'TUC', category: 'Crackers', subCategory: 'Savory Crackers', packSize: '150g', costPrice: 16.50, listPrice: 23.99 }
];

// South African retail customers (Diplomat's key accounts)
const southAfricanCustomers = [
  // Major Retail Chains
  { name: 'Shoprite Holdings', type: 'Retail Chain', category: 'Hypermarket', region: 'National', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Pick n Pay', type: 'Retail Chain', category: 'Supermarket', region: 'National', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Woolworths Food', type: 'Retail Chain', category: 'Premium Supermarket', region: 'National', city: 'Cape Town', province: 'Western Cape' },
  { name: 'SPAR Group', type: 'Retail Chain', category: 'Supermarket', region: 'National', city: 'Pinetown', province: 'KwaZulu-Natal' },
  { name: 'Checkers', type: 'Retail Chain', category: 'Supermarket', region: 'National', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Makro', type: 'Retail Chain', category: 'Wholesale', region: 'National', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Game Stores', type: 'Retail Chain', category: 'General Merchandise', region: 'National', city: 'Johannesburg', province: 'Gauteng' },
  
  // Regional Chains
  { name: 'Food Lovers Market', type: 'Retail Chain', category: 'Fresh Market', region: 'Regional', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Fruit & Veg City', type: 'Retail Chain', category: 'Fresh Market', region: 'Regional', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Boxer Superstores', type: 'Retail Chain', category: 'Discount Store', region: 'Regional', city: 'Cape Town', province: 'Western Cape' },
  
  // Convenience Stores
  { name: 'Engen Quickshop', type: 'Convenience', category: 'Fuel Station', region: 'National', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Shell Select', type: 'Convenience', category: 'Fuel Station', region: 'National', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'BP Shop', type: 'Convenience', category: 'Fuel Station', region: 'National', city: 'Durban', province: 'KwaZulu-Natal' },
  
  // Cash & Carry
  { name: 'Massmart Cash & Carry', type: 'Wholesale', category: 'Cash & Carry', region: 'National', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Jumbo Cash & Carry', type: 'Wholesale', category: 'Cash & Carry', region: 'Regional', city: 'Cape Town', province: 'Western Cape' }
];

// Generate random date within range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate random number within range
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// Generate seasonal multiplier (higher sales in Dec, lower in Jan-Feb)
function getSeasonalMultiplier(month) {
  const seasonalFactors = {
    0: 0.8,  // January
    1: 0.7,  // February
    2: 0.9,  // March
    3: 1.0,  // April
    4: 1.0,  // May
    5: 1.1,  // June
    6: 1.1,  // July
    7: 1.0,  // August
    8: 1.0,  // September
    9: 1.1,  // October
    10: 1.2, // November
    11: 1.4  // December
  };
  return seasonalFactors[month] || 1.0;
}

async function seedDatabase() {
  try {
    console.log('Connected to MongoDB');
    
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Company.deleteMany({});
    await Customer.deleteMany({});
    await Product.deleteMany({});
    await Budget.deleteMany({});
    await SalesData.deleteMany({});
    await Promotion.deleteMany({});
    
    // Create company
    console.log('Creating company...');
    const company = await Company.create({
      name: 'Diplomat South Africa',
      description: 'Leading FMCG distributor in South Africa, specializing in Mondelez International products',
      industry: 'FMCG Distribution',
      country: 'South Africa',
      currency: 'ZAR',
      fiscalYearStart: 'January',
      settings: {
        timezone: 'Africa/Johannesburg',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: 'en-ZA'
      }
    });
    
    // Create users with proper password hashing
    console.log('Creating users...');
    const users = [
      {
        email: 'admin@tradeai.com',
        password: await bcrypt.hash('Admin123!', 12),
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        employeeId: 'SA001',
        department: 'admin'
      },
      {
        email: 'demo@tradeai.com',
        password: await bcrypt.hash('Demo123!', 12),
        firstName: 'Demo',
        lastName: 'User',
        role: 'admin',
        employeeId: 'SA002',
        department: 'sales'
      },
      {
        email: 'user@tradeai.com',
        password: await bcrypt.hash('User123!', 12),
        firstName: 'Regular',
        lastName: 'User',
        role: 'user',
        employeeId: 'SA003',
        department: 'sales'
      }
    ];
    
    await User.insertMany(users);
    console.log('Users created successfully');
    
    // Create customers
    console.log('Creating customers...');
    const customers = [];
    southAfricanCustomers.forEach((customerData, index) => {
      customers.push({
        ...customerData,
        sapCustomerId: `CU${String(index + 1).padStart(6, '0')}`,
        country: 'South Africa',
        contactPerson: `Contact Person ${index + 1}`,
        email: `contact${index + 1}@${customerData.name.toLowerCase().replace(/\s+/g, '')}.co.za`,
        phone: `+27 ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`
      });
    });
    
    const createdCustomers = await Customer.insertMany(customers);
    console.log(`${createdCustomers.length} customers created`);
    
    // Create products
    console.log('Creating products...');
    const products = [];
    mondelezProducts.forEach((productData, index) => {
      products.push({
        ...productData,
        sapMaterialId: `MAT${String(index + 1).padStart(6, '0')}`,
        unitOfMeasure: 'EA'
      });
    });
    
    const createdProducts = await Product.insertMany(products);
    console.log(`${createdProducts.length} products created`);
    
    // Generate 2 years of sales data (2023-2024)
    console.log('Generating sales data for 2023-2024...');
    const salesData = [];
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2024-12-31');
    
    // Target: 5 billion ZAR over 2 years = 2.5 billion per year
    const targetAnnualSales = 2500000000; // 2.5 billion ZAR
    const dailyTarget = targetAnnualSales / 365;
    
    // Generate daily sales for each customer-product combination
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date);
      const seasonalMultiplier = getSeasonalMultiplier(currentDate.getMonth());
      const dailyTargetAdjusted = dailyTarget * seasonalMultiplier;
      
      // Distribute sales across customers and products
      const numTransactions = Math.floor(randomBetween(50, 150)); // 50-150 transactions per day
      const avgTransactionValue = dailyTargetAdjusted / numTransactions;
      
      for (let i = 0; i < numTransactions; i++) {
        const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
        const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        
        // Generate realistic quantities based on product type
        let baseQuantity;
        if (product.category === 'Chocolate' || product.category === 'Biscuits') {
          baseQuantity = Math.floor(randomBetween(20, 200)); // Higher volume for popular items
        } else if (product.category === 'Coffee') {
          baseQuantity = Math.floor(randomBetween(10, 80)); // Lower volume for premium items
        } else {
          baseQuantity = Math.floor(randomBetween(15, 120));
        }
        
        // Adjust quantity based on customer type
        let quantity = baseQuantity;
        if (customer.category === 'Hypermarket') {
          quantity *= randomBetween(2, 4); // Large orders
        } else if (customer.category === 'Convenience') {
          quantity *= randomBetween(0.3, 0.8); // Smaller orders
        }
        
        quantity = Math.floor(quantity);
        const unitPrice = product.listPrice * randomBetween(0.85, 0.95); // Wholesale pricing
        const totalValue = quantity * unitPrice;
        const discount = totalValue * randomBetween(0, 0.15); // 0-15% discount
        const netValue = totalValue - discount;
        
        salesData.push({
          date: currentDate,
          customer: customer._id,
          product: product._id,
          quantity: quantity,
          unitPrice: Math.round(unitPrice * 100) / 100,
          totalValue: Math.round(totalValue * 100) / 100,
          discount: Math.round(discount * 100) / 100,
          netValue: Math.round(netValue * 100) / 100,
          region: customer.province,
          salesRep: `Rep ${Math.floor(Math.random() * 20) + 1}`,
          channel: customer.type
        });
      }
      
      // Log progress every 30 days
      if (currentDate.getDate() === 1) {
        console.log(`Generated sales data for ${currentDate.toISOString().substring(0, 7)}`);
      }
    }
    
    // Insert sales data in batches
    console.log('Inserting sales data...');
    const batchSize = 1000;
    for (let i = 0; i < salesData.length; i += batchSize) {
      const batch = salesData.slice(i, i + batchSize);
      await SalesData.insertMany(batch);
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(salesData.length / batchSize)}`);
    }
    
    // Calculate total sales value
    const totalSales = salesData.reduce((sum, sale) => sum + sale.netValue, 0);
    console.log(`Total sales generated: R${(totalSales / 1000000).toFixed(2)} million`);
    
    // Create budgets for 2024
    console.log('Creating budgets...');
    const budgets = [];
    
    // Create category budgets
    const categories = ['Biscuits', 'Chocolate', 'Gum', 'Coffee', 'Cheese', 'Crackers'];
    categories.forEach((category, index) => {
      const categoryProducts = createdProducts.filter(p => p.category === category);
      const categoryBudget = 200000000 + (index * 50000000); // 200M - 450M per category
      
      budgets.push({
        name: `${category} Marketing Budget 2024`,
        year: 2024,
        category: category,
        totalBudget: categoryBudget,
        remainingAmount: categoryBudget * randomBetween(0.3, 0.8),
        spentAmount: categoryBudget * randomBetween(0.2, 0.7),
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      });
    });
    
    // Create customer-specific budgets
    const majorCustomers = createdCustomers.filter(c => c.category === 'Hypermarket' || c.category === 'Supermarket');
    majorCustomers.slice(0, 8).forEach((customer, index) => {
      const customerBudget = 50000000 + (index * 10000000); // 50M - 120M per major customer
      
      budgets.push({
        name: `${customer.name} Trade Marketing 2024`,
        year: 2024,
        customer: customer._id,
        category: 'Trade Marketing',
        totalBudget: customerBudget,
        remainingAmount: customerBudget * randomBetween(0.4, 0.9),
        spentAmount: customerBudget * randomBetween(0.1, 0.6),
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      });
    });
    
    await Budget.insertMany(budgets);
    console.log(`${budgets.length} budgets created`);
    
    // Create promotions
    console.log('Creating promotions...');
    const promotions = [];
    
    // Generate promotions throughout 2024
    for (let month = 0; month < 12; month++) {
      const numPromotions = Math.floor(randomBetween(8, 15));
      
      for (let i = 0; i < numPromotions; i++) {
        const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
        const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        
        const startDate = new Date(2024, month, Math.floor(randomBetween(1, 15)));
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + Math.floor(randomBetween(14, 45)));
        
        const budget = randomBetween(100000, 2000000); // 100K - 2M ZAR per promotion
        
        promotions.push({
          name: `${product.name} - ${customer.name} Promotion`,
          description: `Trade promotion for ${product.name} at ${customer.name}`,
          type: Math.random() > 0.5 ? 'Trade Promotion' : 'Consumer Promotion',
          customer: customer._id,
          product: product._id,
          startDate: startDate,
          endDate: endDate,
          budget: budget,
          spentAmount: budget * randomBetween(0.1, 0.9),
          discountPercentage: randomBetween(5, 25),
          status: endDate < new Date() ? 'completed' : 'active'
        });
      }
    }
    
    await Promotion.insertMany(promotions);
    console.log(`${promotions.length} promotions created`);
    
    // Summary
    console.log('\n=== SEEDING COMPLETED ===');
    console.log(`Company: ${company.name}`);
    console.log(`Users: ${users.length}`);
    console.log(`Customers: ${createdCustomers.length}`);
    console.log(`Products: ${createdProducts.length}`);
    console.log(`Sales Records: ${salesData.length}`);
    console.log(`Budgets: ${budgets.length}`);
    console.log(`Promotions: ${promotions.length}`);
    console.log(`Total Sales Value: R${(totalSales / 1000000).toFixed(2)} million over 2 years`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();