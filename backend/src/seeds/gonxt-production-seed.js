// const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Company = require('../models/Company');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Campaign = require('../models/Campaign');
const Budget = require('../models/Budget');
const Promotion = require('../models/Promotion');
const SalesHistory = require('../models/SalesHistory');
const TradeSpend = require('../models/TradeSpend');

/**
 * GONXT Production Data Seeding Script
 * Creates comprehensive 2-year dataset for production environment
 */

// Helper function to generate random date within range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to generate random number within range
const randomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to generate random decimal
const randomDecimal = (min, max, decimals = 2) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
};

// Helper function to generate realistic sales data with seasonality
const generateSeasonalSales = (baseAmount, month) => {
  const seasonalMultipliers = {
    1: 0.8,  // January - post-holiday dip
    2: 0.85, // February
    3: 0.95, // March - spring pickup
    4: 1.0,  // April
    5: 1.1,  // May
    6: 1.15, // June - summer peak
    7: 1.2,  // July - peak summer
    8: 1.15, // August
    9: 1.05, // September - back to school
    10: 1.1, // October
    11: 1.3, // November - holiday season
    12: 1.4  // December - peak holiday
  };

  return Math.round(baseAmount * (seasonalMultipliers[month] || 1.0));
};

const seedGONXTProductionData = async () => {
  try {
    console.log('🚀 Starting GONXT Production Data Seeding...');

    // 1. Create GONXT Company
    console.log('📊 Creating GONXT Company...');
    const gonxtCompany = new Company({
      name: 'GONXT Technologies',
      code: 'GONXT',
      domain: 'gonxt.tech',
      industry: 'fmcg',
      country: 'AU',
      currency: 'AUD',
      timezone: 'Australia/Sydney',
      address: {
        street: '123 Innovation Drive',
        city: 'Sydney',
        state: 'NSW',
        country: 'Australia',
        postalCode: '2000'
      },
      contactInfo: {
        phone: '+61-2-9876-5432',
        email: 'info@gonxt.tech',
        website: 'https://gonxt.tech'
      },
      subscription: {
        plan: 'enterprise',
        status: 'active',
        startDate: new Date('2022-01-01'),
        maxUsers: 100,
        maxCustomers: 5000,
        maxProducts: 10000
      },
      enabledModules: [
        { module: 'customers', enabled: true, permissions: ['read', 'write', 'delete'] },
        { module: 'products', enabled: true, permissions: ['read', 'write', 'delete'] },
        { module: 'campaigns', enabled: true, permissions: ['read', 'write', 'delete'] },
        { module: 'budgets', enabled: true, permissions: ['read', 'write', 'delete'] },
        { module: 'analytics', enabled: true, permissions: ['read', 'write'] },
        { module: 'ai_insights', enabled: true, permissions: ['read', 'write'] },
        { module: 'reporting', enabled: true, permissions: ['read', 'write'] },
        { module: 'integrations', enabled: true, permissions: ['read', 'write'] }
      ],
      integrations: {
        sap: { enabled: true, config: { server: 'sap.gonxt.tech', client: '100' } },
        erp: { enabled: true, config: { system: 'SAP S/4HANA' } }
      }
    });
    await gonxtCompany.save();
    console.log('✅ GONXT Company created');

    // 2. Create Test Company for comparison
    console.log('📊 Creating Test Company...');
    const testCompany = new Company({
      name: 'Test Demo Company',
      code: 'TEST',
      domain: 'test.demo',
      industry: 'retail',
      country: 'AU',
      currency: 'AUD',
      timezone: 'Australia/Sydney',
      subscription: {
        plan: 'professional',
        status: 'active',
        startDate: new Date('2023-01-01'),
        maxUsers: 25,
        maxCustomers: 500,
        maxProducts: 2000
      },
      enabledModules: [
        { module: 'customers', enabled: true, permissions: ['read', 'write'] },
        { module: 'products', enabled: true, permissions: ['read', 'write'] },
        { module: 'campaigns', enabled: true, permissions: ['read', 'write'] },
        { module: 'budgets', enabled: true, permissions: ['read', 'write'] },
        { module: 'analytics', enabled: true, permissions: ['read'] }
      ]
    });
    await testCompany.save();
    console.log('✅ Test Company created');

    // 3. Create Users for GONXT
    console.log('👥 Creating GONXT Users...');
    const gonxtUsers = [];

    // Admin user
    const adminUser = new User({
      company: gonxtCompany._id,
      employeeId: 'GONXT001',
      email: 'admin@gonxt.tech',
      password: await bcrypt.hash('Admin123!@#', 12),
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      department: 'admin',
      permissions: [
        { module: 'all', actions: ['read', 'write', 'delete', 'admin'] }
      ],
      approvalLimits: {
        marketing: 1000000,
        cashCoop: 500000,
        tradingTerms: 2000000,
        promotions: 750000
      },
      isActive: true
    });
    await adminUser.save();
    gonxtUsers.push(adminUser);

    // Sales Director
    const salesDirector = new User({
      company: gonxtCompany._id,
      employeeId: 'GONXT002',
      email: 'sales.director@gonxt.tech',
      password: await bcrypt.hash('Sales123!@#', 12),
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'director',
      department: 'sales',
      approvalLimits: {
        marketing: 500000,
        cashCoop: 250000,
        tradingTerms: 1000000,
        promotions: 400000
      },
      isActive: true
    });
    await salesDirector.save();
    gonxtUsers.push(salesDirector);

    // Key Account Managers
    const kamUsers = [
      { name: 'Michael Chen', email: 'michael.chen@gonxt.tech', empId: 'GONXT003' },
      { name: 'Emma Wilson', email: 'emma.wilson@gonxt.tech', empId: 'GONXT004' },
      { name: 'David Rodriguez', email: 'david.rodriguez@gonxt.tech', empId: 'GONXT005' },
      { name: 'Lisa Thompson', email: 'lisa.thompson@gonxt.tech', empId: 'GONXT006' }
    ];

    for (const kam of kamUsers) {
      const [firstName, lastName] = kam.name.split(' ');
      const user = new User({
        company: gonxtCompany._id,
        employeeId: kam.empId,
        email: kam.email,
        password: await bcrypt.hash('Kam123!@#', 12),
        firstName,
        lastName,
        role: 'kam',
        department: 'sales',
        manager: salesDirector._id,
        approvalLimits: {
          marketing: 100000,
          cashCoop: 50000,
          tradingTerms: 200000,
          promotions: 75000
        },
        isActive: true
      });
      await user.save();
      gonxtUsers.push(user);
    }

    // Sales Representatives
    const salesReps = [
      { name: 'James Anderson', email: 'james.anderson@gonxt.tech', empId: 'GONXT007' },
      { name: 'Sophie Martin', email: 'sophie.martin@gonxt.tech', empId: 'GONXT008' },
      { name: 'Ryan O\'Connor', email: 'ryan.oconnor@gonxt.tech', empId: 'GONXT009' },
      { name: 'Olivia Davis', email: 'olivia.davis@gonxt.tech', empId: 'GONXT010' }
    ];

    for (const rep of salesReps) {
      const [firstName, lastName] = rep.name.split(' ');
      const user = new User({
        company: gonxtCompany._id,
        employeeId: rep.empId,
        email: rep.email,
        password: await bcrypt.hash('Sales123!@#', 12),
        firstName,
        lastName,
        role: 'sales_rep',
        department: 'sales',
        manager: gonxtUsers[randomNumber(2, 5)]._id, // Random KAM as manager
        approvalLimits: {
          marketing: 25000,
          cashCoop: 15000,
          tradingTerms: 50000,
          promotions: 20000
        },
        isActive: true
      });
      await user.save();
      gonxtUsers.push(user);
    }

    console.log(`✅ Created ${gonxtUsers.length} GONXT users`);

    // 4. Create Test Company Users
    console.log('👥 Creating Test Company Users...');
    const testUsers = [];

    const testAdmin = new User({
      company: testCompany._id,
      employeeId: 'TEST001',
      email: 'admin@test.demo',
      password: await bcrypt.hash('Test123!@#', 12),
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin',
      department: 'admin',
      isActive: true
    });
    await testAdmin.save();
    testUsers.push(testAdmin);

    const testManager = new User({
      company: testCompany._id,
      employeeId: 'TEST002',
      email: 'manager@test.demo',
      password: await bcrypt.hash('Test123!@#', 12),
      firstName: 'Test',
      lastName: 'Manager',
      role: 'manager',
      department: 'sales',
      isActive: true
    });
    await testManager.save();
    testUsers.push(testManager);

    console.log(`✅ Created ${testUsers.length} Test company users`);

    // 5. Create Vendors for GONXT
    console.log('🏭 Creating GONXT Vendors...');
    const gonxtVendors = [];
    const vendorData = [
      { name: 'Premium Foods Australia', code: 'PFA', type: 'manufacturer', category: 'food' },
      { name: 'Fresh Produce Co', code: 'FPC', type: 'supplier', category: 'fresh' },
      { name: 'Beverage Solutions Ltd', code: 'BSL', type: 'manufacturer', category: 'beverages' },
      { name: 'Dairy Excellence', code: 'DEX', type: 'manufacturer', category: 'dairy' },
      { name: 'Snack Masters', code: 'SNM', type: 'manufacturer', category: 'snacks' },
      { name: 'Health & Wellness Co', code: 'HWC', type: 'supplier', category: 'health' },
      { name: 'Frozen Foods Direct', code: 'FFD', type: 'distributor', category: 'frozen' },
      { name: 'Organic Harvest', code: 'OHV', type: 'supplier', category: 'organic' }
    ];

    for (let i = 0; i < vendorData.length; i++) {
      const vendor = vendorData[i];
      const newVendor = new Vendor({
        company: gonxtCompany._id,
        name: vendor.name,
        code: vendor.code,
        sapVendorId: `V${(100000 + i).toString()}`, // Generate SAP vendor ID
        vendorType: vendor.type,
        category: vendor.category,
        status: 'active',
        contactInfo: {
          email: `contact@${vendor.code.toLowerCase()}.com.au`,
          phone: `+61-${randomNumber(2, 8)}-${randomNumber(1000, 9999)}-${randomNumber(1000, 9999)}`
        },
        paymentTerms: ['NET30', 'NET45', 'NET60'][randomNumber(0, 2)],
        currency: 'AUD'
      });
      await newVendor.save();
      gonxtVendors.push(newVendor);
    }

    console.log(`✅ Created ${gonxtVendors.length} GONXT vendors`);

    // 6. Create Products for GONXT (500+ products across categories)
    console.log('📦 Creating GONXT Products...');
    const gonxtProducts = [];
    const productCategories = [
      {
        level1: { id: 'FOOD', name: 'Food & Grocery', code: 'FOOD' },
        level2: { id: 'DAIRY', name: 'Dairy Products', code: 'DAIRY' },
        products: [
          'Premium Milk 1L', 'Organic Yogurt 500g', 'Aged Cheddar 200g', 'Greek Yogurt 1kg',
          'Butter Unsalted 500g', 'Cream Cheese 250g', 'Cottage Cheese 400g', 'Sour Cream 300ml'
        ]
      },
      {
        level1: { id: 'FOOD', name: 'Food & Grocery', code: 'FOOD' },
        level2: { id: 'SNACKS', name: 'Snacks & Confectionery', code: 'SNACKS' },
        products: [
          'Premium Potato Chips 150g', 'Chocolate Bar Dark 100g', 'Mixed Nuts 200g', 'Protein Bar 60g',
          'Crackers Whole Grain 250g', 'Popcorn Caramel 120g', 'Trail Mix 180g', 'Rice Cakes 100g'
        ]
      },
      {
        level1: { id: 'BEV', name: 'Beverages', code: 'BEV' },
        level2: { id: 'SOFT', name: 'Soft Drinks', code: 'SOFT' },
        products: [
          'Cola Classic 375ml', 'Lemon Lime 375ml', 'Orange Juice 1L', 'Apple Juice 1L',
          'Energy Drink 250ml', 'Sparkling Water 500ml', 'Iced Tea 500ml', 'Sports Drink 600ml'
        ]
      },
      {
        level1: { id: 'FRESH', name: 'Fresh Products', code: 'FRESH' },
        level2: { id: 'PRODUCE', name: 'Fresh Produce', code: 'PRODUCE' },
        products: [
          'Bananas 1kg', 'Apples Red 1kg', 'Carrots 1kg', 'Potatoes 2kg',
          'Tomatoes 500g', 'Lettuce Iceberg', 'Onions Brown 1kg', 'Broccoli 500g'
        ]
      },
      {
        level1: { id: 'FROZEN', name: 'Frozen Foods', code: 'FROZEN' },
        level2: { id: 'MEALS', name: 'Frozen Meals', code: 'MEALS' },
        products: [
          'Frozen Pizza Margherita', 'Chicken Nuggets 1kg', 'Fish Fingers 500g', 'Vegetable Mix 1kg',
          'Ice Cream Vanilla 2L', 'Frozen Berries 500g', 'Garlic Bread 400g', 'Frozen Peas 1kg'
        ]
      }
    ];

    let productCounter = 1;
    for (const category of productCategories) {
      for (let i = 0; i < category.products.length; i++) {
        const productName = category.products[i];
        const vendor = gonxtVendors[randomNumber(0, gonxtVendors.length - 1)];

        const product = new Product({
          company: gonxtCompany._id,
          sapMaterialId: `SAP${String(productCounter).padStart(6, '0')}`,
          name: productName,
          sku: `GONXT${String(productCounter).padStart(4, '0')}`,
          barcode: `93${String(randomNumber(10000000, 99999999))}${randomNumber(10, 99)}`,
          description: `Premium quality ${productName.toLowerCase()} from ${vendor.name}`,
          hierarchy: {
            level1: category.level1,
            level2: category.level2,
            level3: {
              id: `${category.level2.id}_SUB`,
              name: `${category.level2.name} Subcategory`,
              code: `${category.level2.code}_SUB`
            }
          },
          productType: 'finished_good',
          brand: {
            name: vendor.name.split(' ')[0],
            code: vendor.code
          },
          vendor: vendor._id,
          pricing: {
            costPrice: randomDecimal(1, 50),
            listPrice: randomDecimal(2, 80),
            currency: 'AUD'
          },
          inventory: {
            currentStock: randomNumber(100, 5000),
            minStock: randomNumber(50, 200),
            maxStock: randomNumber(1000, 10000),
            unit: 'EA'
          },
          status: 'active',
          isActive: true
        });

        await product.save();
        gonxtProducts.push(product);
        productCounter++;
      }
    }

    // Create additional products to reach 500+
    while (gonxtProducts.length < 500) {
      const category = productCategories[randomNumber(0, productCategories.length - 1)];
      const vendor = gonxtVendors[randomNumber(0, gonxtVendors.length - 1)];

      const product = new Product({
        company: gonxtCompany._id,
        sapMaterialId: `SAP${String(productCounter).padStart(6, '0')}`,
        name: `Product ${productCounter}`,
        sku: `GONXT${String(productCounter).padStart(4, '0')}`,
        barcode: `93${String(randomNumber(10000000, 99999999))}${randomNumber(10, 99)}`,
        hierarchy: {
          level1: category.level1,
          level2: category.level2,
          level3: {
            id: `${category.level2.id}_SUB`,
            name: `${category.level2.name} Subcategory`,
            code: `${category.level2.code}_SUB`
          }
        },
        productType: 'finished_good',
        brand: {
          name: vendor.name.split(' ')[0],
          code: vendor.code
        },
        vendor: vendor._id,
        pricing: {
          costPrice: randomDecimal(1, 50),
          listPrice: randomDecimal(2, 80),
          currency: 'AUD'
        },
        inventory: {
          currentStock: randomNumber(100, 5000),
          minStock: randomNumber(50, 200),
          maxStock: randomNumber(1000, 10000),
          unit: 'EA'
        },
        status: 'active',
        isActive: true
      });

      await product.save();
      gonxtProducts.push(product);
      productCounter++;
    }

    console.log(`✅ Created ${gonxtProducts.length} GONXT products`);

    // 7. Create Customers for GONXT (200+ customers)
    console.log('🏪 Creating GONXT Customers...');
    const gonxtCustomers = [];
    const customerTypes = [
      { type: 'chain', channel: 'modern_trade', tier: 'platinum', count: 10 },
      { type: 'retailer', channel: 'modern_trade', tier: 'gold', count: 25 },
      { type: 'wholesaler', channel: 'traditional_trade', tier: 'silver', count: 40 },
      { type: 'distributor', channel: 'b2b', tier: 'gold', count: 15 },
      { type: 'independent', channel: 'traditional_trade', tier: 'bronze', count: 60 },
      { type: 'online', channel: 'ecommerce', tier: 'silver', count: 30 },
      { type: 'retailer', channel: 'horeca', tier: 'bronze', count: 50 }
    ];

    let customerCounter = 1;
    for (const customerType of customerTypes) {
      for (let i = 0; i < customerType.count; i++) {
        const kam = gonxtUsers[randomNumber(2, 5)]; // Random KAM

        const customer = new Customer({
          company: gonxtCompany._id,
          sapCustomerId: `SAPC${String(customerCounter).padStart(6, '0')}`,
          name: `${customerType.type.charAt(0).toUpperCase() + customerType.type.slice(1)} Customer ${customerCounter}`,
          code: `CUST${String(customerCounter).padStart(4, '0')}`,
          hierarchy: {
            level1: { id: 'AU', name: 'Australia', code: 'AU' },
            level2: { id: 'NSW', name: 'New South Wales', code: 'NSW' },
            level3: { id: 'SYD', name: 'Sydney', code: 'SYD' }
          },
          customerType: customerType.type,
          channel: customerType.channel,
          tier: customerType.tier,
          contacts: [{
            name: `Contact Person ${customerCounter}`,
            position: 'Purchasing Manager',
            email: `contact${customerCounter}@customer.com.au`,
            phone: `+61-${randomNumber(2, 8)}-${randomNumber(1000, 9999)}-${randomNumber(1000, 9999)}`,
            isPrimary: true
          }],
          addresses: [{
            type: 'both',
            street: `${randomNumber(1, 999)} Business Street`,
            city: 'Sydney',
            state: 'NSW',
            country: 'Australia',
            postalCode: `20${randomNumber(10, 99)}`
          }],
          creditLimit: randomNumber(10000, 500000),
          paymentTerms: ['NET30', 'NET45', 'NET60'][randomNumber(0, 2)],
          currency: 'AUD',
          budgetAllocations: {
            marketing: {
              annual: randomNumber(50000, 500000),
              ytd: 0,
              available: randomNumber(50000, 500000)
            },
            cashCoop: {
              annual: randomNumber(25000, 250000),
              ytd: 0,
              available: randomNumber(25000, 250000)
            },
            tradingTerms: {
              annual: randomNumber(100000, 1000000),
              ytd: 0,
              available: randomNumber(100000, 1000000)
            }
          },
          performance: {
            lastYearSales: randomNumber(100000, 2000000),
            currentYearTarget: randomNumber(120000, 2400000),
            currentYearActual: 0,
            growthRate: randomDecimal(-10, 25),
            marketShare: randomDecimal(0.1, 5.0)
          },
          accountManager: kam._id,
          status: 'active'
        });

        await customer.save();
        gonxtCustomers.push(customer);
        customerCounter++;
      }
    }

    console.log(`✅ Created ${gonxtCustomers.length} GONXT customers`);

    // 8. Create 2 Years of Sales History Data
    console.log('📈 Creating 2 Years of Sales History...');
    const startDate = new Date('2022-01-01');
    const endDate = new Date('2023-12-31');
    const salesHistoryRecords = [];

    // Generate monthly sales data for each customer-product combination
    for (let month = 0; month < 24; month++) {
      const currentDate = new Date(startDate);
      currentDate.setMonth(startDate.getMonth() + month);

      console.log(`  📅 Generating sales data for ${currentDate.toISOString().slice(0, 7)}...`);

      // Each customer buys from 10-30 different products per month
      for (const customer of gonxtCustomers.slice(0, 100)) { // Limit to first 100 customers for performance
        const productsThisMonth = randomNumber(10, 30);
        const selectedProducts = [];

        // Randomly select products for this customer this month
        for (let p = 0; p < productsThisMonth; p++) {
          const product = gonxtProducts[randomNumber(0, gonxtProducts.length - 1)];
          if (!selectedProducts.find((sp) => sp._id.toString() === product._id.toString())) {
            selectedProducts.push(product);
          }
        }

        for (const product of selectedProducts) {
          const baseQuantity = randomNumber(10, 500);
          const quantity = generateSeasonalSales(baseQuantity, currentDate.getMonth() + 1);
          const unitPrice = product.pricing.listPrice * randomDecimal(0.8, 1.2); // Price variation
          const totalAmount = quantity * unitPrice;

          const salesRecord = new SalesHistory({
            company: gonxtCompany._id,
            customer: customer._id,
            product: product._id,
            transactionDate: randomDate(
              new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
              new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
            ),
            quantity,
            unitPrice,
            totalAmount,
            currency: 'AUD',
            salesRep: gonxtUsers[randomNumber(6, 9)]._id, // Random sales rep
            channel: customer.channel,
            region: 'NSW',
            status: 'completed'
          });

          salesHistoryRecords.push(salesRecord);
        }
      }
    }

    // Batch insert sales history
    console.log(`  💾 Inserting ${salesHistoryRecords.length} sales records...`);
    await SalesHistory.insertMany(salesHistoryRecords);
    console.log(`✅ Created ${salesHistoryRecords.length} sales history records`);

    // 9. Create Trade Spend Records
    console.log('💰 Creating Trade Spend Records...');
    const tradeSpendRecords = [];

    for (let month = 0; month < 24; month++) {
      const currentDate = new Date(startDate);
      currentDate.setMonth(startDate.getMonth() + month);

      // Create trade spend for top 50 customers
      for (const customer of gonxtCustomers.slice(0, 50)) {
        const spendTypes = ['marketing', 'cashCoop', 'tradingTerms', 'promotions'];

        for (const spendType of spendTypes) {
          if (Math.random() > 0.3) { // 70% chance of spend this month
            const baseAmount = randomNumber(1000, 50000);
            const amount = generateSeasonalSales(baseAmount, currentDate.getMonth() + 1);

            const tradeSpend = new TradeSpend({
              company: gonxtCompany._id,
              customer: customer._id,
              spendType,
              amount,
              currency: 'AUD',
              spendDate: randomDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
                new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
              ),
              description: `${spendType} spend for ${customer.name}`,
              approvedBy: gonxtUsers[randomNumber(1, 5)]._id,
              status: 'approved'
            });

            tradeSpendRecords.push(tradeSpend);
          }
        }
      }
    }

    await TradeSpend.insertMany(tradeSpendRecords);
    console.log(`✅ Created ${tradeSpendRecords.length} trade spend records`);

    // 10. Create Campaigns and Promotions
    console.log('🎯 Creating Campaigns and Promotions...');
    const campaigns = [];
    const promotions = [];

    // Create quarterly campaigns for 2 years
    for (let quarter = 0; quarter < 8; quarter++) {
      const quarterStart = new Date(startDate);
      quarterStart.setMonth(startDate.getMonth() + (quarter * 3));
      const quarterEnd = new Date(quarterStart);
      quarterEnd.setMonth(quarterStart.getMonth() + 3);

      const campaign = new Campaign({
        company: gonxtCompany._id,
        name: `Q${(quarter % 4) + 1} ${quarterStart.getFullYear()} Campaign`,
        description: `Quarterly campaign for ${quarterStart.getFullYear()}`,
        startDate: quarterStart,
        endDate: quarterEnd,
        budget: randomNumber(100000, 500000),
        status: quarter < 6 ? 'completed' : 'active',
        objectives: [
          'Increase market share',
          'Launch new products',
          'Strengthen customer relationships'
        ],
        targetCustomers: gonxtCustomers.slice(0, 20).map((c) => c._id),
        targetProducts: gonxtProducts.slice(0, 50).map((p) => p._id),
        createdBy: gonxtUsers[1]._id // Sales Director
      });

      await campaign.save();
      campaigns.push(campaign);

      // Create 3-5 promotions per campaign
      const promotionCount = randomNumber(3, 5);
      for (let p = 0; p < promotionCount; p++) {
        const promotion = new Promotion({
          company: gonxtCompany._id,
          campaign: campaign._id,
          name: `${campaign.name} - Promotion ${p + 1}`,
          description: `Promotional activity ${p + 1} for ${campaign.name}`,
          promotionType: ['discount', 'rebate', 'bonus', 'listing_fee'][randomNumber(0, 3)],
          startDate: randomDate(quarterStart, quarterEnd),
          endDate: randomDate(quarterStart, quarterEnd),
          budget: randomNumber(10000, 100000),
          targetCustomers: gonxtCustomers.slice(0, 10).map((c) => c._id),
          targetProducts: gonxtProducts.slice(p * 10, (p + 1) * 10).map((p) => p._id),
          status: quarter < 6 ? 'completed' : 'active',
          createdBy: gonxtUsers[randomNumber(2, 5)]._id
        });

        await promotion.save();
        promotions.push(promotion);
      }
    }

    console.log(`✅ Created ${campaigns.length} campaigns and ${promotions.length} promotions`);

    // 11. Create Budgets
    console.log('💼 Creating Budget Records...');
    const budgets = [];

    for (let year = 2022; year <= 2023; year++) {
      const yearlyBudget = new Budget({
        company: gonxtCompany._id,
        name: `${year} Annual Budget`,
        budgetType: 'annual',
        year,
        startDate: new Date(`${year}-01-01`),
        endDate: new Date(`${year}-12-31`),
        totalBudget: randomNumber(5000000, 10000000),
        allocations: {
          marketing: randomNumber(1000000, 2000000),
          cashCoop: randomNumber(500000, 1000000),
          tradingTerms: randomNumber(2000000, 4000000),
          promotions: randomNumber(800000, 1500000),
          operations: randomNumber(500000, 1000000)
        },
        status: year < 2024 ? 'approved' : 'draft',
        createdBy: gonxtUsers[1]._id,
        approvedBy: gonxtUsers[0]._id
      });

      await yearlyBudget.save();
      budgets.push(yearlyBudget);
    }

    console.log(`✅ Created ${budgets.length} budget records`);

    // Summary
    console.log('\n🎉 GONXT Production Data Seeding Complete!');
    console.log('=====================================');
    console.log('📊 Companies: 2 (GONXT + Test)');
    console.log(`👥 Users: ${gonxtUsers.length + testUsers.length}`);
    console.log(`🏭 Vendors: ${gonxtVendors.length}`);
    console.log(`📦 Products: ${gonxtProducts.length}`);
    console.log(`🏪 Customers: ${gonxtCustomers.length}`);
    console.log(`📈 Sales Records: ${salesHistoryRecords.length}`);
    console.log(`💰 Trade Spend Records: ${tradeSpendRecords.length}`);
    console.log(`🎯 Campaigns: ${campaigns.length}`);
    console.log(`🎁 Promotions: ${promotions.length}`);
    console.log(`💼 Budgets: ${budgets.length}`);
    console.log('=====================================');
    console.log('✅ Ready for production deployment!');

    return {
      success: true,
      summary: {
        companies: 2,
        users: gonxtUsers.length + testUsers.length,
        vendors: gonxtVendors.length,
        products: gonxtProducts.length,
        customers: gonxtCustomers.length,
        salesRecords: salesHistoryRecords.length,
        tradeSpendRecords: tradeSpendRecords.length,
        campaigns: campaigns.length,
        promotions: promotions.length,
        budgets: budgets.length
      }
    };

  } catch (error) {
    console.error('❌ Error seeding GONXT production data:', error);
    throw error;
  }
};

module.exports = { seedGONXTProductionData };

// Run if called directly
if (require.main === module) {
  const mongoose = require('mongoose');

  const runSeed = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai_production');
      console.log('📡 Connected to MongoDB');

      await seedGONXTProductionData();

      await mongoose.disconnect();
      console.log('📡 Disconnected from MongoDB');
      process.exit(0);
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    }
  };

  runSeed();
}
