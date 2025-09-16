const mongoose = require('mongoose');

// Connect to existing database
mongoose.connect('mongodb://admin:TradeAI_Mongo_2024!@mongodb:27017/tradeai?authSource=admin');

// Use existing models
const Customer = mongoose.model('Customer');
const Product = mongoose.model('Product');
const Budget = mongoose.model('Budget');

// Mondelez products for Diplomat SA
const mondelezProducts = [
  { name: 'Oreo Original 154g', brand: 'Oreo', category: 'Biscuits', subCategory: 'Sandwich Cookies', packSize: '154g', costPrice: 18.50, listPrice: 24.99, sapMaterialId: 'MAT000001' },
  { name: 'Oreo Golden 154g', brand: 'Oreo', category: 'Biscuits', subCategory: 'Sandwich Cookies', packSize: '154g', costPrice: 18.50, listPrice: 24.99, sapMaterialId: 'MAT000002' },
  { name: 'Cadbury Dairy Milk 80g', brand: 'Cadbury', category: 'Chocolate', subCategory: 'Milk Chocolate', packSize: '80g', costPrice: 16.50, listPrice: 22.99, sapMaterialId: 'MAT000003' },
  { name: 'Cadbury Dairy Milk Oreo 110g', brand: 'Cadbury', category: 'Chocolate', subCategory: 'Flavored Chocolate', packSize: '110g', costPrice: 22.80, listPrice: 32.99, sapMaterialId: 'MAT000004' },
  { name: 'Toblerone Original 100g', brand: 'Toblerone', category: 'Chocolate', subCategory: 'Premium Chocolate', packSize: '100g', costPrice: 35.60, listPrice: 49.99, sapMaterialId: 'MAT000005' },
  { name: 'Belvita Breakfast Original 300g', brand: 'Belvita', category: 'Biscuits', subCategory: 'Breakfast Biscuits', packSize: '300g', costPrice: 28.50, listPrice: 39.99, sapMaterialId: 'MAT000006' },
  { name: 'Trident White Peppermint 14s', brand: 'Trident', category: 'Gum', subCategory: 'Sugar-free Gum', packSize: '14 pieces', costPrice: 8.90, listPrice: 12.99, sapMaterialId: 'MAT000007' },
  { name: 'Philadelphia Original Cream Cheese 230g', brand: 'Philadelphia', category: 'Cheese', subCategory: 'Cream Cheese', packSize: '230g', costPrice: 28.90, listPrice: 39.99, sapMaterialId: 'MAT000008' },
  { name: 'Jacobs Kronung Ground Coffee 250g', brand: 'Jacobs', category: 'Coffee', subCategory: 'Ground Coffee', packSize: '250g', costPrice: 45.80, listPrice: 64.99, sapMaterialId: 'MAT000009' },
  { name: 'Ritz Original Crackers 200g', brand: 'Ritz', category: 'Crackers', subCategory: 'Round Crackers', packSize: '200g', costPrice: 19.80, listPrice: 27.99, sapMaterialId: 'MAT000010' }
];

// South African retail customers
const southAfricanCustomers = [
  { name: 'Shoprite Holdings', type: 'Retail Chain', category: 'Hypermarket', region: 'National', city: 'Cape Town', province: 'Western Cape', sapCustomerId: 'CU000001' },
  { name: 'Pick n Pay', type: 'Retail Chain', category: 'Supermarket', region: 'National', city: 'Cape Town', province: 'Western Cape', sapCustomerId: 'CU000002' },
  { name: 'Woolworths Food', type: 'Retail Chain', category: 'Premium Supermarket', region: 'National', city: 'Cape Town', province: 'Western Cape', sapCustomerId: 'CU000003' },
  { name: 'SPAR Group', type: 'Retail Chain', category: 'Supermarket', region: 'National', city: 'Pinetown', province: 'KwaZulu-Natal', sapCustomerId: 'CU000004' },
  { name: 'Checkers', type: 'Retail Chain', category: 'Supermarket', region: 'National', city: 'Cape Town', province: 'Western Cape', sapCustomerId: 'CU000005' },
  { name: 'Makro', type: 'Retail Chain', category: 'Wholesale', region: 'National', city: 'Johannesburg', province: 'Gauteng', sapCustomerId: 'CU000006' },
  { name: 'Game Stores', type: 'Retail Chain', category: 'General Merchandise', region: 'National', city: 'Johannesburg', province: 'Gauteng', sapCustomerId: 'CU000007' },
  { name: 'Food Lovers Market', type: 'Retail Chain', category: 'Fresh Market', region: 'Regional', city: 'Cape Town', province: 'Western Cape', sapCustomerId: 'CU000008' },
  { name: 'Engen Quickshop', type: 'Convenience', category: 'Fuel Station', region: 'National', city: 'Cape Town', province: 'Western Cape', sapCustomerId: 'CU000009' },
  { name: 'Shell Select', type: 'Convenience', category: 'Fuel Station', region: 'National', city: 'Johannesburg', province: 'Gauteng', sapCustomerId: 'CU000010' }
];

async function quickSeed() {
  try {
    console.log('Connected to MongoDB');
    
    // Clear existing data
    console.log('Clearing existing customers, products, and budgets...');
    await Customer.deleteMany({});
    await Product.deleteMany({});
    await Budget.deleteMany({});
    
    // Add customers
    console.log('Adding South African customers...');
    const customers = southAfricanCustomers.map(customer => ({
      ...customer,
      country: 'South Africa',
      contactPerson: `Contact Person`,
      email: `contact@${customer.name.toLowerCase().replace(/\s+/g, '')}.co.za`,
      phone: `+27 11 123 4567`,
      isActive: true
    }));
    
    const createdCustomers = await Customer.insertMany(customers);
    console.log(`${createdCustomers.length} customers created`);
    
    // Add products
    console.log('Adding Mondelez products...');
    const products = mondelezProducts.map(product => ({
      ...product,
      unitOfMeasure: 'EA',
      isActive: true
    }));
    
    const createdProducts = await Product.insertMany(products);
    console.log(`${createdProducts.length} products created`);
    
    // Add budgets
    console.log('Adding marketing budgets...');
    const budgets = [
      {
        name: 'Diplomat SA - Biscuits Marketing Budget 2024',
        year: 2024,
        category: 'Biscuits',
        totalBudget: 250000000, // R250M
        spentAmount: 125000000,  // R125M spent
        remainingAmount: 125000000, // R125M remaining
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      },
      {
        name: 'Diplomat SA - Chocolate Marketing Budget 2024',
        year: 2024,
        category: 'Chocolate',
        totalBudget: 300000000, // R300M
        spentAmount: 180000000,  // R180M spent
        remainingAmount: 120000000, // R120M remaining
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      },
      {
        name: 'Diplomat SA - Shoprite Trade Marketing 2024',
        year: 2024,
        customer: createdCustomers[0]._id, // Shoprite
        category: 'Trade Marketing',
        totalBudget: 75000000, // R75M
        spentAmount: 45000000,  // R45M spent
        remainingAmount: 30000000, // R30M remaining
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      },
      {
        name: 'Diplomat SA - Pick n Pay Trade Marketing 2024',
        year: 2024,
        customer: createdCustomers[1]._id, // Pick n Pay
        category: 'Trade Marketing',
        totalBudget: 65000000, // R65M
        spentAmount: 32000000,  // R32M spent
        remainingAmount: 33000000, // R33M remaining
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      },
      {
        name: 'Diplomat SA - Premium Products Budget 2024',
        year: 2024,
        product: createdProducts.find(p => p.brand === 'Toblerone')._id,
        category: 'Premium Marketing',
        totalBudget: 50000000, // R50M
        spentAmount: 28000000,  // R28M spent
        remainingAmount: 22000000, // R22M remaining
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      }
    ];
    
    const createdBudgets = await Budget.insertMany(budgets);
    console.log(`${createdBudgets.length} budgets created`);
    
    // Summary
    console.log('\n=== DIPLOMAT SA SEEDING COMPLETED ===');
    console.log(`Customers: ${createdCustomers.length} (Major SA retailers)`);
    console.log(`Products: ${createdProducts.length} (Mondelez portfolio)`);
    console.log(`Budgets: ${createdBudgets.length} (Total: R${(budgets.reduce((sum, b) => sum + b.totalBudget, 0) / 1000000).toFixed(0)}M)`);
    console.log('Ready for AI/ML testing with realistic SA FMCG data');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

quickSeed();