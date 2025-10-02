const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

// Import models
const Customer = require('./src/models/Customer');
const Product = require('./src/models/Product');
const SalesHistory = require('./src/models/SalesHistory');
const Promotion = require('./src/models/Promotion');
const TradeSpend = require('./src/models/TradeSpend');
const Campaign = require('./src/models/Campaign');
const Budget = require('./src/models/Budget');
const Company = require('./src/models/Company');
const Tenant = require('./src/models/Tenant');

// Configuration
const TENANT_ID = '68dd553701eea238df8c1a8a'; // TRADEAI tenant
const COMPANY_ID = '68dd553701eea238df8c1a91'; // TRADEAI company

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tradeai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Generate customers
async function createCustomers() {
  console.log('Creating customers...');
  const customers = [];
  
  const customerTypes = ['Supermarket', 'Convenience Store', 'Pharmacy', 'Hypermarket', 'Spaza Shop'];
  const regions = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'];
  const saRetailers = ['Pick n Pay', 'Shoprite', 'Checkers', 'Spar', 'Woolworths', 'OK Foods', 'Food Lover\'s Market', 'Cambridge Food'];
  
  for (let i = 0; i < 50; i++) {
    const customerType = faker.helpers.arrayElement(customerTypes);
    const region = faker.helpers.arrayElement(regions);
    const retailerBase = faker.helpers.arrayElement(saRetailers);
    
    const customerTypeMapping = {
      'Supermarket': 'retailer',
      'Convenience Store': 'retailer', 
      'Pharmacy': 'retailer',
      'Hypermarket': 'chain',
      'Spaza Shop': 'independent'
    };
    
    const channelMapping = {
      'Supermarket': 'modern_trade',
      'Convenience Store': 'traditional_trade',
      'Pharmacy': 'modern_trade',
      'Hypermarket': 'modern_trade',
      'Spaza Shop': 'traditional_trade'
    };
    
    customers.push({
      tenantId: TENANT_ID,
      company: COMPANY_ID,
      sapCustomerId: `SAP-CUST-${String(i + 1).padStart(6, '0')}`,
      name: `${retailerBase} ${customerType} - ${region}`,
      code: `CUST${String(i + 1).padStart(3, '0')}`,
      customerType: customerTypeMapping[customerType],
      channel: channelMapping[customerType],
      tier: faker.helpers.arrayElement(['platinum', 'gold', 'silver', 'bronze', 'standard']),
      hierarchy: {
        level1: {
          id: `L1-${region.replace(' ', '')}`,
          name: `${region} Province`,
          code: region.replace(' ', '').toUpperCase()
        },
        level2: {
          id: `L2-${customerType.replace(' ', '')}`,
          name: customerType,
          code: customerType.replace(' ', '').toUpperCase()
        }
      },
      addresses: [{
        type: 'both',
        street: faker.location.streetAddress(),
        city: faker.helpers.arrayElement(['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'Polokwane', 'Nelspruit', 'Kimberley']),
        state: region,
        postalCode: faker.string.numeric(4),
        country: 'South Africa'
      }],
      contacts: [{
        name: faker.person.fullName(),
        position: 'Store Manager',
        email: faker.internet.email(),
        phone: `+27 ${faker.string.numeric(2)} ${faker.string.numeric(3)} ${faker.string.numeric(4)}`,
        isPrimary: true
      }],
      businessMetrics: {
        annualRevenue: faker.number.int({ min: 5000000, max: 200000000 }), // ZAR
        storeCount: faker.number.int({ min: 1, max: 50 }),
        employeeCount: faker.number.int({ min: 5, max: 500 })
      },
      status: 'active',
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: new Date()
    });
  }
  
  const createdCustomers = await Customer.insertMany(customers);
  console.log(`Created ${createdCustomers.length} customers`);
  return createdCustomers;
}

// Generate products
async function createProducts() {
  console.log('Creating products...');
  const products = [];
  
  // Mondelez product categories and brands in South Africa
  const mondelezProducts = [
    // Biscuits
    { category: 'Biscuits', brand: 'Oreo', products: ['Oreo Original', 'Oreo Golden', 'Oreo Thins', 'Oreo Mini', 'Oreo Double Stuff'] },
    { category: 'Biscuits', brand: 'Bakers', products: ['Tennis Biscuits', 'Marie Biscuits', 'Romany Creams', 'Choc-Kits', 'Eet-Sum-Mor'] },
    { category: 'Biscuits', brand: 'Belvita', products: ['Breakfast Biscuits Honey & Nuts', 'Breakfast Biscuits Milk & Cereals', 'Breakfast Biscuits Choc Chip'] },
    
    // Chocolate
    { category: 'Chocolate', brand: 'Cadbury', products: ['Dairy Milk', 'Lunch Bar', 'PS', 'Top Deck', 'Flake', 'Crunchie', 'Whispers', 'Astros'] },
    { category: 'Chocolate', brand: 'Toblerone', products: ['Toblerone Milk', 'Toblerone Dark', 'Toblerone White'] },
    
    // Gum & Candy
    { category: 'Gum & Candy', brand: 'Trident', products: ['Trident Spearmint', 'Trident Peppermint', 'Trident Tropical Twist'] },
    { category: 'Gum & Candy', brand: 'Halls', products: ['Halls Mentho-Lyptus', 'Halls Extra Strong', 'Halls Honey-Lemon'] },
    { category: 'Gum & Candy', brand: 'Sour Patch Kids', products: ['Sour Patch Kids Original', 'Sour Patch Kids Watermelon'] },
    
    // Cheese & Dairy
    { category: 'Cheese & Dairy', brand: 'Philadelphia', products: ['Philadelphia Original', 'Philadelphia Light', 'Philadelphia with Herbs'] },
    
    // Coffee
    { category: 'Coffee', brand: 'Jacobs', products: ['Jacobs Kronung', 'Jacobs Millicano', 'Jacobs 3in1'] },
    
    // Snacks
    { category: 'Snacks', brand: 'Chips Ahoy!', products: ['Chips Ahoy! Original', 'Chips Ahoy! Chunky'] }
  ];
  
  let productIndex = 0;
  
  for (const categoryData of mondelezProducts) {
    for (const productName of categoryData.products) {
      productIndex++;
      
      // Different pack sizes for variety
      const packSizes = ['50g', '100g', '150g', '200g', '250g', '300g', '500g'];
      const packSize = faker.helpers.arrayElement(packSizes);
      
      const listPrice = parseFloat(faker.number.float({ min: 8.99, max: 89.99, fractionDigits: 2 }));
      
      products.push({
        tenantId: TENANT_ID,
        company: COMPANY_ID,
        sapMaterialId: `SAP-MAT-${String(productIndex).padStart(6, '0')}`,
        name: `${productName} ${packSize}`,
        sku: `MDZ${String(productIndex).padStart(6, '0')}`,
        barcode: `6001${faker.string.numeric(9)}`, // South African barcode format
        description: `${categoryData.brand} ${productName} - ${packSize} pack`,
        productType: faker.helpers.arrayElement(['own_brand', 'distributed', 'private_label']),
        hierarchy: {
          level1: {
            id: `CAT-${categoryData.category.replace(' ', '')}`,
            name: categoryData.category,
            code: categoryData.category.replace(' ', '').toUpperCase()
          },
          level2: {
            id: `BRAND-${categoryData.brand.replace(' ', '')}`,
            name: categoryData.brand,
            code: categoryData.brand.replace(' ', '').toUpperCase()
          }
        },
        brand: {
          id: `BRAND-${categoryData.brand.replace(' ', '')}`,
          name: categoryData.brand,
          owner: 'company'
        },
        category: {
          primary: categoryData.category,
          secondary: [categoryData.brand]
        },
        pricing: {
          listPrice: listPrice,
          currency: 'ZAR',
          costPrice: listPrice * 0.7, // 30% margin
          marginPercentage: 30
        },
        attributes: {
          weight: parseFloat(packSize.replace('g', '')) / 1000, // Convert to kg
          weightUnit: 'kg',
          packaging: `${packSize} pack`,
          unitsPerCase: faker.number.int({ min: 6, max: 24 })
        },
        inventory: {
          minStock: faker.number.int({ min: 10, max: 50 }),
          maxStock: faker.number.int({ min: 100, max: 500 }),
          reorderPoint: faker.number.int({ min: 20, max: 100 }),
          leadTimeDays: faker.number.int({ min: 7, max: 30 })
        },
        status: 'active',
        createdAt: faker.date.past({ years: 2 }),
        updatedAt: new Date()
      });
    }
  }
  
  const createdProducts = await Product.insertMany(products);
  console.log(`Created ${createdProducts.length} Mondelez products`);
  return createdProducts;
}

// Generate promotions
async function createPromotions(products) {
  console.log('Creating promotions...');
  const promotions = [];
  
  const promotionTypes = ['price_discount', 'volume_discount', 'bogo', 'bundle', 'display'];
  
  for (let i = 0; i < 20; i++) {
    const promotionType = faker.helpers.arrayElement(promotionTypes);
    const startDate = faker.date.between({ from: '2024-01-01', to: '2025-06-01' });
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + faker.number.int({ min: 7, max: 90 }));
    
    const promotion = {
      tenantId: TENANT_ID,
      company: COMPANY_ID,
      promotionId: `PROMO-${String(i + 1).padStart(4, '0')}`,
      name: `${faker.commerce.productAdjective()} ${promotionType.replace('_', ' ')} Promotion`,
      description: faker.lorem.sentence(),
      promotionType: promotionType,
      mechanics: {
        discountType: 'percentage',
        discountValue: faker.number.float({ min: 5, max: 30, fractionDigits: 1 })
      },
      period: {
        startDate: startDate,
        endDate: endDate
      },
      applicableProducts: faker.helpers.arrayElements(products, { min: 1, max: 5 }).map(p => p._id),
      budget: {
        totalBudget: faker.number.int({ min: 50000, max: 1000000 }), // ZAR amounts
        spentAmount: 0,
        currency: 'ZAR'
      },
      status: endDate > new Date() ? 'active' : 'completed',
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: new Date()
    };
    
    // Set mechanics based on promotion type
    switch (promotionType) {
      case 'price_discount':
        promotion.mechanics = {
          discountType: 'percentage',
          discountValue: faker.number.int({ min: 10, max: 50 })
        };
        break;
      case 'volume_discount':
        promotion.mechanics = {
          discountType: 'percentage',
          discountValue: faker.number.int({ min: 15, max: 30 }),
          minimumQuantity: faker.number.int({ min: 2, max: 10 })
        };
        break;
      case 'bogo':
        promotion.mechanics = {
          buyQuantity: 1,
          getQuantity: 1
        };
        break;
    }
    
    promotions.push(promotion);
  }
  
  const createdPromotions = await Promotion.insertMany(promotions);
  console.log(`Created ${createdPromotions.length} promotions`);
  return createdPromotions;
}

// Generate sales history
async function createSalesHistory(customers, products, promotions) {
  console.log('Creating sales history...');
  console.log(`Received ${customers.length} customers, ${products.length} products, ${promotions.length} promotions`);
  const salesData = [];
  
  // Generate sales for the last 2 years
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2025-12-31');
  
  for (let i = 0; i < 5000; i++) {
    const saleDate = faker.date.between({ from: startDate, to: endDate });
    const customer = faker.helpers.arrayElement(customers);
    const product = faker.helpers.arrayElement(products);
    const promotion = faker.datatype.boolean() ? faker.helpers.arrayElement(promotions) : null;
    
    if (i === 0) {
      console.log('Sample customer:', customer ? customer._id : 'undefined');
      console.log('Sample product:', product ? product._id : 'undefined');
    }
    
    const quantity = faker.number.int({ min: 1, max: 100 });
    const unitPrice = product.pricing.listPrice;
    const grossSales = quantity * unitPrice;
    const discount = promotion ? grossSales * 0.1 : 0;
    const netSales = grossSales - discount;
    
    salesData.push({
      tenantId: TENANT_ID,
      company: COMPANY_ID,
      transactionId: `TXN-${String(i + 1).padStart(8, '0')}`,
      sapDocumentNumber: `SAP-DOC-${String(i + 1).padStart(8, '0')}`,
      date: saleDate,
      year: saleDate.getFullYear(),
      month: saleDate.getMonth() + 1,
      week: Math.ceil(saleDate.getDate() / 7),
      dayOfWeek: saleDate.getDay(),
      quarter: Math.ceil((saleDate.getMonth() + 1) / 3),
      customer: customer._id,
      customerHierarchy: {
        level1: { id: customer.hierarchy.level1.id, name: customer.hierarchy.level1.name },
        level2: { id: customer.hierarchy.level2.id, name: customer.hierarchy.level2.name }
      },
      channel: customer.channel,
      region: customer.hierarchy.level1.name,
      product: product._id,
      productHierarchy: {
        level1: { id: product.hierarchy.level1.id, name: product.hierarchy.level1.name },
        level2: { id: product.hierarchy.level2.id, name: product.hierarchy.level2.name }
      },
      brand: product.brand.name,
      category: product.category.primary,
      quantity: quantity,
      unitOfMeasure: 'EA',
      revenue: {
        gross: grossSales,
        net: netSales,
        currency: 'ZAR'
      },
      pricing: {
        unitPrice: unitPrice,
        listPrice: unitPrice,
        discountAmount: discount,
        discountPercent: promotion ? 10 : 0
      },
      costs: {
        unitCost: unitPrice * 0.7,
        totalCost: netSales * 0.7,
        margin: netSales * 0.3,
        marginPercent: 30
      },
      promotion: promotion ? promotion._id : null,
      createdAt: saleDate,
      updatedAt: saleDate
    });
  }
  
  await SalesHistory.insertMany(salesData);
  console.log(`Created ${salesData.length} sales records`);
  return salesData;
}

// Generate trade spend data
async function createTradeSpend(customers, products) {
  console.log('Creating trade spend data...');
  const tradeSpendData = [];
  
  const spendTypes = ['marketing', 'cash_coop', 'trading_terms', 'rebate', 'promotion'];
  const categories = ['Advertising', 'Display', 'Rebates', 'Coop', 'Promotional'];
  
  // Create a dummy user ID for createdBy field
  const dummyUserId = new mongoose.Types.ObjectId();
  
  for (let i = 0; i < 200; i++) {
    const startDate = faker.date.between({ from: '2024-01-01', to: '2025-06-01' });
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + faker.number.int({ min: 30, max: 90 }));
    
    const customer = faker.helpers.arrayElement(customers);
    const product = faker.helpers.arrayElement(products);
    const spendType = faker.helpers.arrayElement(spendTypes);
    const requestedAmount = faker.number.int({ min: 5000, max: 500000 }); // ZAR amounts
    
    tradeSpendData.push({
      tenantId: TENANT_ID,
      company: COMPANY_ID,
      spendId: `SPEND-${String(i + 1).padStart(6, '0')}`,
      spendType: spendType,
      category: faker.helpers.arrayElement(categories),
      amount: {
        requested: requestedAmount,
        approved: requestedAmount * 0.9, // 90% approval rate
        spent: requestedAmount * 0.8, // 80% utilization
        currency: 'ZAR'
      },
      period: {
        startDate: startDate,
        endDate: endDate
      },
      customer: customer._id,
      products: [product._id],
      status: faker.helpers.arrayElement(['approved', 'completed', 'active']),
      createdBy: dummyUserId,
      notes: faker.lorem.sentence(),
      financial: {
        glAccount: `GL-${faker.number.int({ min: 1000, max: 9999 })}`,
        costCenter: `CC-${faker.number.int({ min: 100, max: 999 })}`,
        profitCenter: `PC-${faker.number.int({ min: 100, max: 999 })}`
      }
    });
  }
  
  await TradeSpend.insertMany(tradeSpendData);
  console.log(`Created ${tradeSpendData.length} trade spend records`);
  return tradeSpendData;
}

// Generate campaigns
async function createCampaigns(products, promotions) {
  console.log('Creating campaigns...');
  const campaigns = [];
  
  // Create a dummy user ID for createdBy field
  const dummyUserId = new mongoose.Types.ObjectId();
  
  for (let i = 0; i < 15; i++) {
    const startDate = faker.date.between({ from: '2024-01-01', to: '2025-06-01' });
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + faker.number.int({ min: 30, max: 120 }));
    const totalBudget = faker.number.int({ min: 500000, max: 5000000 }); // ZAR amounts
    const spentAmount = faker.number.int({ min: 100000, max: totalBudget * 0.8 });
    
    campaigns.push({
      tenantId: TENANT_ID,
      company: COMPANY_ID,
      campaignId: `CAMP-${String(i + 1).padStart(4, '0')}`,
      name: `${faker.commerce.productAdjective()} Campaign ${i + 1}`,
      description: faker.lorem.paragraph(),
      objective: faker.lorem.sentence(),
      campaignType: faker.helpers.arrayElement(['product_launch', 'seasonal', 'brand_awareness', 'tactical']),
      period: {
        startDate: startDate,
        endDate: endDate
      },
      budget: {
        total: totalBudget,
        allocated: totalBudget * 0.9,
        spent: spentAmount,
        breakdown: {
          advertising: totalBudget * 0.4,
          inStore: totalBudget * 0.2,
          digital: totalBudget * 0.2,
          trade: totalBudget * 0.15,
          other: totalBudget * 0.05
        }
      },
      scope: {
        national: faker.datatype.boolean(),
        regions: faker.helpers.arrayElements(['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape'], { min: 1, max: 3 }),
        products: faker.helpers.arrayElements(products, { min: 2, max: 8 }).map(p => p._id),
        channels: faker.helpers.arrayElements(['Retail', 'Wholesale', 'Online', 'Direct'], { min: 1, max: 3 })
      },
      promotions: faker.helpers.arrayElements(promotions, { min: 1, max: 3 }).map(p => p._id),
      status: endDate > new Date() ? 'active' : 'completed',
      createdBy: dummyUserId
    });
  }
  
  await Campaign.insertMany(campaigns);
  console.log(`Created ${campaigns.length} campaigns`);
  return campaigns;
}

// Main seeding function
async function seedDatabase() {
  try {
    await connectDB();
    
    console.log('Starting database seeding...');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await Customer.deleteMany({ tenantId: TENANT_ID });
    await Product.deleteMany({ tenantId: TENANT_ID });
    await SalesHistory.deleteMany({ company: COMPANY_ID });
    await Promotion.deleteMany({ tenantId: TENANT_ID });
    await TradeSpend.deleteMany({ company: COMPANY_ID });
    await Campaign.deleteMany({ tenantId: TENANT_ID });
    
    // Create data in order (due to dependencies)
    const customers = await createCustomers();
    const products = await createProducts();
    const promotions = await createPromotions(products);
    const salesHistory = await createSalesHistory(customers, products, promotions);
    const tradeSpend = await createTradeSpend(customers, products);
    const campaigns = await createCampaigns(products, promotions);
    
    console.log('Database seeding completed successfully!');
    console.log('Summary:');
    console.log(`- Customers: ${customers.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Promotions: ${promotions.length}`);
    console.log(`- Sales Records: ${salesHistory.length}`);
    console.log(`- Trade Spend Records: ${tradeSpend.length}`);
    console.log(`- Campaigns: ${campaigns.length}`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };