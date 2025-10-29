const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai';

// South African Cities
const SA_CITIES = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Polokwane', 'Nelspruit', 'Kimberley'];

// Mondelez Products for South Africa
const productsData = [
  // Cadbury Chocolate Range
  { name: 'Cadbury Dairy Milk 80g', category: 'Chocolate', brand: 'Cadbury', sku: 'CDM-080', unitPrice: 18.95, unitCost: 9.50, stockLevel: 5000, reorderLevel: 500, unit: 'bar' },
  { name: 'Cadbury Dairy Milk 150g', category: 'Chocolate', brand: 'Cadbury', sku: 'CDM-150', unitPrice: 32.95, unitCost: 16.50, stockLevel: 3500, reorderLevel: 400, unit: 'bar' },
  { name: 'Cadbury Dairy Milk Caramel 80g', category: 'Chocolate', brand: 'Cadbury', sku: 'CDMC-080', unitPrice: 19.95, unitCost: 10.00, stockLevel: 2800, reorderLevel: 300, unit: 'bar' },
  { name: 'Cadbury Dairy Milk Whole Nut 80g', category: 'Chocolate', brand: 'Cadbury', sku: 'CDMWN-080', unitPrice: 21.95, unitCost: 11.00, stockLevel: 2500, reorderLevel: 300, unit: 'bar' },
  { name: 'Cadbury Dairy Milk Bubbly 87g', category: 'Chocolate', brand: 'Cadbury', sku: 'CDMB-087', unitPrice: 19.95, unitCost: 10.00, stockLevel: 3200, reorderLevel: 350, unit: 'bar' },
  { name: 'Cadbury Lunch Bar 48g', category: 'Chocolate', brand: 'Cadbury', sku: 'CLB-048', unitPrice: 12.95, unitCost: 6.50, stockLevel: 4500, reorderLevel: 500, unit: 'bar' },
  { name: 'Cadbury PS 52g', category: 'Chocolate', brand: 'Cadbury', sku: 'CPS-052', unitPrice: 13.95, unitCost: 7.00, stockLevel: 4000, reorderLevel: 450, unit: 'bar' },
  { name: 'Cadbury Crunchie 40g', category: 'Chocolate', brand: 'Cadbury', sku: 'CCR-040', unitPrice: 10.95, unitCost: 5.50, stockLevel: 3800, reorderLevel: 400, unit: 'bar' },
  { name: 'Cadbury Flake 32g', category: 'Chocolate', brand: 'Cadbury', sku: 'CFL-032', unitPrice: 9.95, unitCost: 5.00, stockLevel: 3500, reorderLevel: 400, unit: 'bar' },
  { name: 'Cadbury Top Deck 80g', category: 'Chocolate', brand: 'Cadbury', sku: 'CTD-080', unitPrice: 22.95, unitCost: 11.50, stockLevel: 2200, reorderLevel: 250, unit: 'bar' },
  { name: 'Cadbury Roses 225g', category: 'Chocolate', brand: 'Cadbury', sku: 'CR-225', unitPrice: 89.95, unitCost: 45.00, stockLevel: 1500, reorderLevel: 200, unit: 'box' },
  { name: 'Cadbury Heroes 185g', category: 'Chocolate', brand: 'Cadbury', sku: 'CH-185', unitPrice: 79.95, unitCost: 40.00, stockLevel: 1800, reorderLevel: 200, unit: 'box' },
  
  // Oreo Range
  { name: 'Oreo Original 133g', category: 'Biscuits', brand: 'Oreo', sku: 'ORO-133', unitPrice: 24.95, unitCost: 12.50, stockLevel: 4200, reorderLevel: 450, unit: 'pack' },
  { name: 'Oreo Golden 154g', category: 'Biscuits', brand: 'Oreo', sku: 'ORG-154', unitPrice: 26.95, unitCost: 13.50, stockLevel: 3500, reorderLevel: 400, unit: 'pack' },
  { name: 'Oreo Double Stuf 157g', category: 'Biscuits', brand: 'Oreo', sku: 'ORDS-157', unitPrice: 28.95, unitCost: 14.50, stockLevel: 3200, reorderLevel: 350, unit: 'pack' },
  { name: 'Oreo Thins Original 192g', category: 'Biscuits', brand: 'Oreo', sku: 'ORT-192', unitPrice: 32.95, unitCost: 16.50, stockLevel: 2800, reorderLevel: 300, unit: 'pack' },
  { name: 'Oreo Mini 115g', category: 'Biscuits', brand: 'Oreo', sku: 'ORM-115', unitPrice: 22.95, unitCost: 11.50, stockLevel: 3600, reorderLevel: 400, unit: 'pack' },
  
  // Biscuits Range
  { name: 'Bakers Tennis 200g', category: 'Biscuits', brand: 'Bakers', sku: 'BTN-200', unitPrice: 18.95, unitCost: 9.50, stockLevel: 4500, reorderLevel: 500, unit: 'pack' },
  { name: 'Bakers Eet-Sum-Mor 200g', category: 'Biscuits', brand: 'Bakers', sku: 'BESM-200', unitPrice: 19.95, unitCost: 10.00, stockLevel: 4200, reorderLevel: 450, unit: 'pack' },
  { name: 'Bakers Romany Creams 200g', category: 'Biscuits', brand: 'Bakers', sku: 'BRC-200', unitPrice: 22.95, unitCost: 11.50, stockLevel: 3800, reorderLevel: 400, unit: 'pack' },
  { name: 'Bakers Choc-Kits 200g', category: 'Biscuits', brand: 'Bakers', sku: 'BCK-200', unitPrice: 21.95, unitCost: 11.00, stockLevel: 3500, reorderLevel: 380, unit: 'pack' },
  { name: 'Bakers Chocolate Fingers 125g', category: 'Biscuits', brand: 'Bakers', sku: 'BCF-125', unitPrice: 16.95, unitCost: 8.50, stockLevel: 3200, reorderLevel: 350, unit: 'pack' },
  
  // Chewing Gum & Confectionery
  { name: 'Stimorol Spearmint 14g', category: 'Confectionery', brand: 'Stimorol', sku: 'STM-014', unitPrice: 7.95, unitCost: 4.00, stockLevel: 6000, reorderLevel: 600, unit: 'pack' },
  { name: 'Stimorol Peppermint 14g', category: 'Confectionery', brand: 'Stimorol', sku: 'STP-014', unitPrice: 7.95, unitCost: 4.00, stockLevel: 5800, reorderLevel: 600, unit: 'pack' },
  { name: 'Dentyne Ice 14g', category: 'Confectionery', brand: 'Dentyne', sku: 'DEN-014', unitPrice: 8.95, unitCost: 4.50, stockLevel: 4500, reorderLevel: 500, unit: 'pack' },
  { name: 'Halls Mentho-Lyptus 33.5g', category: 'Confectionery', brand: 'Halls', sku: 'HAL-033', unitPrice: 11.95, unitCost: 6.00, stockLevel: 4200, reorderLevel: 450, unit: 'pack' },
  
  // Snacking Range
  { name: 'Cadbury Snack 28g', category: 'Snacks', brand: 'Cadbury', sku: 'CSN-028', unitPrice: 8.95, unitCost: 4.50, stockLevel: 5500, reorderLevel: 600, unit: 'bar' },
  { name: 'Cadbury Bitsa Wispa 110g', category: 'Snacks', brand: 'Cadbury', sku: 'CBW-110', unitPrice: 28.95, unitCost: 14.50, stockLevel: 2500, reorderLevel: 300, unit: 'bag' },
  { name: 'Maynards Wine Gums 125g', category: 'Confectionery', brand: 'Maynards', sku: 'MWG-125', unitPrice: 18.95, unitCost: 9.50, stockLevel: 3500, reorderLevel: 400, unit: 'bag' },
  { name: 'Maynards Jelly Babies 125g', category: 'Confectionery', brand: 'Maynards', sku: 'MJB-125', unitPrice: 18.95, unitCost: 9.50, stockLevel: 3200, reorderLevel: 350, unit: 'bag' },
  
  // Seasonal & Gifting
  { name: 'Cadbury Chocolate Eggs 140g', category: 'Chocolate', brand: 'Cadbury', sku: 'CCE-140', unitPrice: 45.95, unitCost: 23.00, stockLevel: 2000, reorderLevel: 250, unit: 'box' },
  { name: 'Cadbury Miniatures 200g', category: 'Chocolate', brand: 'Cadbury', sku: 'CMIN-200', unitPrice: 65.95, unitCost: 33.00, stockLevel: 1800, reorderLevel: 200, unit: 'bag' },
  { name: 'Cadbury Selection Box 180g', category: 'Chocolate', brand: 'Cadbury', sku: 'CSB-180', unitPrice: 59.95, unitCost: 30.00, stockLevel: 1500, reorderLevel: 200, unit: 'box' },
  
  // Value Packs
  { name: 'Cadbury Dairy Milk 6-Pack 300g', category: 'Chocolate', brand: 'Cadbury', sku: 'CDM-6PK', unitPrice: 95.95, unitCost: 48.00, stockLevel: 1200, reorderLevel: 150, unit: 'pack' },
  { name: 'Oreo Family Pack 352g', category: 'Biscuits', brand: 'Oreo', sku: 'ORO-FP', unitPrice: 54.95, unitCost: 27.50, stockLevel: 2200, reorderLevel: 250, unit: 'pack' },
  { name: 'Bakers Mixed Biscuits 400g', category: 'Biscuits', brand: 'Bakers', sku: 'BMB-400', unitPrice: 38.95, unitCost: 19.50, stockLevel: 2800, reorderLevel: 300, unit: 'pack' },
];

// South African Retailers (Customers)
const customersData = [
  { name: 'Pick n Pay Sandton City', code: 'PNP-001', sapCustomerId: 'SAP-PNP-001', city: 'Johannesburg', tier: 'Premium', type: 'Hypermarket', company: 'Mondelez SA', tenant: 'mondelez' },
  { name: 'Pick n Pay Canal Walk', code: 'PNP-002', sapCustomerId: 'SAP-PNP-002', city: 'Cape Town', tier: 'Premium', type: 'Hypermarket', company: 'Mondelez SA', tenant: 'mondelez' },
  { name: 'Pick n Pay Gateway', code: 'PNP-003', sapCustomerId: 'SAP-PNP-003', city: 'Durban', tier: 'Premium', type: 'Hypermarket', company: 'Mondelez SA', tenant: 'mondelez' },
  
  { name: 'Checkers Menlyn Park', code: 'CHK-001', sapCustomerId: 'SAP-CHK-001', city: 'Pretoria', tier: 'Premium', type: 'Supermarket', company: 'Mondelez SA', tenant: 'mondelez' },
  { name: 'Checkers Hyper Tygervalley', code: 'CHK-002', sapCustomerId: 'SAP-CHK-002', city: 'Cape Town', tier: 'Premium', type: 'Hypermarket', company: 'Mondelez SA', tenant: 'mondelez' },
  { name: 'Checkers Blue Route Mall', code: 'CHK-003', sapCustomerId: 'SAP-CHK-003', city: 'Cape Town', tier: 'Standard', type: 'Supermarket', company: 'Mondelez SA', tenant: 'mondelez' },
  
  { name: 'Woolworths Mall of Africa', code: 'WOL-001', sapCustomerId: 'SAP-WOL-001', city: 'Johannesburg', tier: 'Premium', type: 'Supermarket', company: 'Mondelez SA', tenant: 'mondelez' },
  { name: 'Woolworths V&A Waterfront', code: 'WOL-002', sapCustomerId: 'SAP-WOL-002', city: 'Cape Town', tier: 'Premium', type: 'Supermarket', company: 'Mondelez SA', tenant: 'mondelez' },
  
  { name: 'Shoprite Rosebank', code: 'SHP-001', sapCustomerId: 'SAP-SHP-001', city: 'Johannesburg', tier: 'Standard', type: 'Supermarket', company: 'Mondelez SA', tenant: 'mondelez' },
  { name: 'Shoprite Cape Gate', code: 'SHP-002', sapCustomerId: 'SAP-SHP-002', city: 'Cape Town', tier: 'Standard', type: 'Supermarket', company: 'Mondelez SA', tenant: 'mondelez' },
  { name: 'Shoprite La Lucia', code: 'SHP-003', sapCustomerId: 'SAP-SHP-003', city: 'Durban', tier: 'Standard', type: 'Supermarket', company: 'Mondelez SA', tenant: 'mondelez' },
  
  { name: 'Spar Centurion Mall', code: 'SPR-001', sapCustomerId: 'SAP-SPR-001', city: 'Pretoria', tier: 'Basic', type: 'Supermarket', company: 'Mondelez SA', tenant: 'mondelez' },
  { name: 'Spar Boardwalk', code: 'SPR-002', sapCustomerId: 'SAP-SPR-002', city: 'Port Elizabeth', tier: 'Basic', type: 'Supermarket', company: 'Mondelez SA', tenant: 'mondelez' },
  
  { name: 'Makro Woodmead', code: 'MAK-001', sapCustomerId: 'SAP-MAK-001', city: 'Johannesburg', tier: 'Premium', type: 'Wholesale', company: 'Mondelez SA', tenant: 'mondelez' },
  { name: 'Makro Carnival City', code: 'MAK-002', sapCustomerId: 'SAP-MAK-002', city: 'Johannesburg', tier: 'Premium', type: 'Wholesale', company: 'Mondelez SA', tenant: 'mondelez' },
  
  { name: 'Game Cresta', code: 'GAM-001', sapCustomerId: 'SAP-GAM-001', city: 'Johannesburg', tier: 'Standard', type: 'Hypermarket', company: 'Mondelez SA', tenant: 'mondelez' },
  { name: 'Game Pavilion', code: 'GAM-002', sapCustomerId: 'SAP-GAM-002', city: 'Durban', tier: 'Standard', type: 'Hypermarket', company: 'Mondelez SA', tenant: 'mondelez' },
  
  { name: 'Boxer Maponya Mall', code: 'BOX-001', sapCustomerId: 'SAP-BOX-001', city: 'Johannesburg', tier: 'Basic', type: 'Discount Store', company: 'Mondelez SA', tenant: 'mondelez' },
  { name: 'Boxer Mthatha Plaza', code: 'BOX-002', sapCustomerId: 'SAP-BOX-002', city: 'East London', tier: 'Basic', type: 'Discount Store', company: 'Mondelez SA', tenant: 'mondelez' },
  
  { name: 'Cambridge Food Hyde Park', code: 'CAM-001', sapCustomerId: 'SAP-CAM-001', city: 'Johannesburg', tier: 'Premium', type: 'Specialty Store', company: 'Mondelez SA', tenant: 'mondelez' },
];

// Generate Sales Data (Last 18 months)
function generateSalesData(products, customers) {
  const salesData = [];
  const startDate = new Date('2023-09-01');
  const endDate = new Date('2025-02-28');
  
  let saleId = 1000;
  
  // Generate daily sales for each customer
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    customers.forEach(customer => {
      // Each customer orders random products each day (not all days)
      const ordersToday = Math.random() > 0.3; // 70% chance of ordering each day
      
      if (ordersToday) {
        const numProducts = Math.floor(Math.random() * 8) + 3; // 3-10 products per order
        const selectedProducts = [];
        
        for (let i = 0; i < numProducts; i++) {
          const product = products[Math.floor(Math.random() * products.length)];
          if (!selectedProducts.find(p => p.sku === product.sku)) {
            selectedProducts.push(product);
          }
        }
        
        selectedProducts.forEach(product => {
          // Quantity varies by product and customer tier
          let baseQuantity = Math.floor(Math.random() * 100) + 20;
          if (customer.tier === 'Premium') baseQuantity *= 2;
          if (customer.type === 'Wholesale') baseQuantity *= 3;
          
          // Seasonal variations
          const month = d.getMonth();
          if ([11, 3].includes(month)) baseQuantity *= 1.5; // Dec & April (holidays)
          if ([0, 6].includes(month)) baseQuantity *= 0.8; // Jan & July (slower)
          
          const quantity = Math.floor(baseQuantity);
          const unitPrice = product.unitPrice;
          const discount = Math.random() > 0.7 ? (Math.random() * 0.15) : 0; // 30% chance of discount
          const totalAmount = quantity * unitPrice * (1 - discount);
          
          salesData.push({
            saleId: `SA-${saleId++}`,
            customer: customer.name,
            product: product.name,
            productSKU: product.sku,
            quantity,
            unitPrice,
            discount: discount * 100,
            totalAmount,
            saleDate: new Date(d),
            status: d < new Date('2025-02-20') ? 'Completed' : 'Pending',
            paymentStatus: d < new Date('2025-02-15') ? 'Paid' : 'Pending',
            currency: 'ZAR'
          });
        });
      }
    });
  }
  
  return salesData;
}

// Trading Terms Data for South Africa
function generateTradingTerms(customers) {
  const terms = [];
  const termTypes = ['Volume Discount', 'Growth Incentive', 'Annual Rebate', 'Promotional Support', 'Marketing Fund', 'Distribution Support'];
  
  customers.forEach((customer, idx) => {
    const numTerms = customer.tier === 'Premium' ? 3 : (customer.tier === 'Standard' ? 2 : 1);
    
    for (let i = 0; i < numTerms; i++) {
      const termType = termTypes[Math.floor(Math.random() * termTypes.length)];
      const value = termType.includes('Support') || termType.includes('Fund') ? 
        Math.floor(Math.random() * 100000) + 50000 : 
        Math.floor(Math.random() * 5) + 3;
      
      terms.push({
        termId: `TT-SA-${2024 + Math.floor(i/2)}-${String(idx * 10 + i + 1).padStart(3, '0')}`,
        customerName: customer.name,
        termType,
        description: `${termType} agreement for ${customer.name}`,
        paymentTerms: customer.paymentTerms === 30 ? 'Quarterly' : 'Net 60',
        value,
        valueType: termType.includes('Support') || termType.includes('Fund') ? 'Fixed Amount' : 'Percentage',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
        status: 'Active',
        targetVolume: Math.floor(Math.random() * 100000) + 50000,
        actualVolume: Math.floor(Math.random() * 60000) + 15000,
        estimatedPayout: Math.floor(Math.random() * 500000) + 200000,
        actualPayout: Math.floor(Math.random() * 150000) + 50000,
        currency: 'ZAR',
        notes: `Active trading term for fiscal year 2024-2025`,
        createdBy: 'admin@trade-ai.com',
        approvedBy: 'admin@trade-ai.com',
        approvedDate: new Date('2024-06-15')
      });
    }
  });
  
  return terms;
}

// Trade Spends Data
function generateTradeSpends(customers, products) {
  const spends = [];
  const spendTypes = ['Trade Promotion', 'Volume Discount', 'Display Allowance', 'Marketing Co-op', 'Rebate', 'Sample & Demo'];
  
  let spendId = 1;
  
  // Generate spends for last 6 months
  for (let month = 0; month < 6; month++) {
    customers.forEach(customer => {
      const numSpends = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numSpends; i++) {
        const spendDate = new Date(2024, 8 + month, Math.floor(Math.random() * 28) + 1);
        const spendType = spendTypes[Math.floor(Math.random() * spendTypes.length)];
        const product = products[Math.floor(Math.random() * products.length)];
        
        let amount = Math.floor(Math.random() * 150000) + 50000;
        if (customer.tier === 'Premium') amount *= 1.5;
        
        spends.push({
          spendId: `TS-SA-${String(spendId++).padStart(4, '0')}`,
          customerName: customer.name,
          productName: product.name,
          spendType,
          category: spendType.includes('Promotion') || spendType.includes('Display') ? 'Promotional' : 'Non-Promotional',
          amount,
          currency: 'ZAR',
          spendDate,
          startDate: spendDate,
          endDate: new Date(spendDate.getTime() + (30 * 24 * 60 * 60 * 1000)),
          status: spendDate < new Date('2025-02-01') ? 'Completed' : 'Active',
          expectedROI: (Math.random() * 2) + 2,
          actualROI: spendDate < new Date('2025-02-01') ? (Math.random() * 2.5) + 1.8 : null,
          expectedVolume: Math.floor(Math.random() * 20000) + 5000,
          actualVolume: spendDate < new Date('2025-02-01') ? Math.floor(Math.random() * 18000) + 6000 : Math.floor(Math.random() * 5000),
          description: `${spendType} for ${product.name} at ${customer.name}`,
          createdBy: 'admin@trade-ai.com',
          approvedBy: 'admin@trade-ai.com',
          approvedDate: new Date(spendDate.getTime() - (7 * 24 * 60 * 60 * 1000))
        });
      }
    });
  }
  
  return spends;
}

// Activities Data
function generateActivities(customers, products) {
  const activities = [];
  const activityTypes = ['In-Store Promotion', 'Display', 'Sampling', 'Demo', 'Trade Show', 'Training', 'Price Promotion', 'Volume Incentive'];
  const statuses = ['Completed', 'In Progress', 'Planned'];
  
  let actId = 1;
  
  customers.slice(0, 15).forEach(customer => {
    const numActivities = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < numActivities; i++) {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const monthsAgo = Math.floor(Math.random() * 4);
      const startDate = new Date(2025, 1 - monthsAgo, Math.floor(Math.random() * 28) + 1);
      const endDate = new Date(startDate.getTime() + (Math.floor(Math.random() * 30) + 15) * 24 * 60 * 60 * 1000);
      
      let status;
      if (endDate < new Date()) status = 'Completed';
      else if (startDate <= new Date()) status = 'In Progress';
      else status = 'Planned';
      
      const allocated = Math.floor(Math.random() * 250000) + 100000;
      const spent = status === 'Completed' ? allocated * 0.95 : (status === 'In Progress' ? allocated * 0.4 : 0);
      
      const expectedVolume = Math.floor(Math.random() * 30) + 20;
      const actualVolume = status === 'Completed' ? expectedVolume * (0.8 + Math.random() * 0.4) : (status === 'In Progress' ? expectedVolume * 0.3 : 0);
      
      activities.push({
        activityId: `ACT-SA-${String(actId++).padStart(3, '0')}`,
        activityName: `${activityType} - ${customer.name.split(' ')[0]}`,
        activityType,
        customerName: customer.name,
        products: [products[Math.floor(Math.random() * products.length)].name],
        startDate,
        endDate,
        status,
        budget: {
          allocated,
          spent: Math.floor(spent),
          remaining: Math.floor(allocated - spent)
        },
        location: {
          city: customer.city,
          state: customer.city,
          stores: [customer.name]
        },
        objectives: `Drive sales through ${activityType.toLowerCase()} at ${customer.name}`,
        expectedOutcome: {
          volumeIncrease: expectedVolume,
          revenueTarget: Math.floor(allocated * 3.5),
          roi: 3.5
        },
        actualOutcome: {
          volumeAchieved: status !== 'Planned' ? Math.floor(actualVolume) : 0,
          revenueAchieved: status === 'Completed' ? Math.floor(allocated * 3.8) : (status === 'In Progress' ? Math.floor(allocated * 1.2) : 0),
          roi: status === 'Completed' ? 3.8 : null
        },
        performance: status === 'Completed' ? 'Completed' : (status === 'In Progress' ? 'On Track' : 'Not Started'),
        owner: customer.contactPerson,
        team: ['Regional Manager', 'Trade Marketing Specialist'],
        description: `${activityType} campaign for key Mondelez brands`
      });
    }
  });
  
  return activities;
}

// Promotions Data
function generatePromotions(customers, products) {
  const promotions = [];
  const promoTypes = ['Discount', 'Bundle', 'BOGO', 'Gift with Purchase', 'Seasonal Special'];
  
  let promoId = 1;
  
  for (let month = 0; month < 6; month++) {
    const numPromos = Math.floor(Math.random() * 5) + 3;
    
    for (let i = 0; i < numPromos; i++) {
      const startDate = new Date(2024, 8 + month, Math.floor(Math.random() * 28) + 1);
      const endDate = new Date(startDate.getTime() + (Math.floor(Math.random() * 21) + 10) * 24 * 60 * 60 * 1000);
      const product = products[Math.floor(Math.random() * products.length)];
      const promoType = promoTypes[Math.floor(Math.random() * promoTypes.length)];
      
      let discountValue = 0;
      if (promoType === 'Discount') discountValue = Math.floor(Math.random() * 20) + 10;
      else if (promoType === 'BOGO') discountValue = 50;
      else if (promoType === 'Bundle') discountValue = Math.floor(Math.random() * 15) + 15;
      
      promotions.push({
        promotionId: `PROMO-SA-${String(promoId++).padStart(3, '0')}`,
        name: `${promoType} - ${product.name.substring(0, 20)}`,
        description: `${promoType} promotion on ${product.name}`,
        promotionType: promoType,
        startDate,
        endDate,
        status: endDate < new Date() ? 'Completed' : (startDate <= new Date() ? 'Active' : 'Scheduled'),
        products: [product.name],
        discountType: promoType === 'Discount' || promoType === 'Bundle' ? 'Percentage' : 'Fixed',
        discountValue,
        targetCustomers: customers.slice(0, Math.floor(Math.random() * 10) + 5).map(c => c.name),
        expectedSales: Math.floor(Math.random() * 500000) + 200000,
        actualSales: endDate < new Date() ? Math.floor(Math.random() * 550000) + 250000 : Math.floor(Math.random() * 100000),
        budget: Math.floor(Math.random() * 150000) + 50000,
        actualSpend: endDate < new Date() ? Math.floor(Math.random() * 140000) + 48000 : Math.floor(Math.random() * 30000),
        roi: endDate < new Date() ? (Math.random() * 2) + 2.5 : null,
        currency: 'ZAR'
      });
    }
  }
  
  return promotions;
}

// Budgets Data
function generateBudgets() {
  const budgets = [];
  const categories = ['Trade Marketing', 'Consumer Promotions', 'Trade Shows', 'In-Store Activities', 'Digital Marketing', 'Sampling Programs'];
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  
  let budgetId = 1;
  
  quarters.forEach((quarter, qIdx) => {
    categories.forEach(category => {
      const allocated = Math.floor(Math.random() * 3000000) + 1000000;
      const spent = qIdx < 1 ? allocated * 0.92 : (qIdx === 1 ? allocated * 0.45 : 0);
      
      budgets.push({
        budgetId: `BUD-SA-2025-${String(budgetId++).padStart(2, '0')}`,
        name: `${quarter} 2025 - ${category}`,
        category,
        fiscalYear: 2025,
        quarter,
        startDate: new Date(2025, qIdx * 3, 1),
        endDate: new Date(2025, (qIdx + 1) * 3, 0),
        allocated,
        spent: Math.floor(spent),
        committed: Math.floor(allocated * 0.15),
        available: Math.floor(allocated - spent - (allocated * 0.15)),
        currency: 'ZAR',
        status: qIdx < 1 ? 'Completed' : (qIdx === 1 ? 'Active' : 'Planned'),
        owner: 'Trade Marketing Director',
        approvedBy: 'CFO',
        approvedDate: new Date(2024, 11, 15)
      });
    });
  });
  
  return budgets;
}

// Users Data
async function generateUsers() {
  const hashedPassword = await bcrypt.hash('Demo@123456', 10);
  
  return [
    {
      email: 'admin@trade-ai.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      company: 'Mondelez South Africa',
      isActive: true,
      permissions: ['all']
    },
    {
      email: 'demo@trade-ai.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: 'user',
      company: 'Mondelez South Africa',
      isActive: true,
      permissions: ['read', 'write']
    },
    {
      email: 'manager@trade-ai.com',
      password: hashedPassword,
      firstName: 'Trade',
      lastName: 'Manager',
      role: 'manager',
      company: 'Mondelez South Africa',
      isActive: true,
      permissions: ['read', 'write', 'approve']
    }
  ];
}

// Main seeding function
async function seedSouthAfricaData() {
  try {
    console.log('🌍 MONDELEZ SOUTH AFRICA DATA SEEDING');
    console.log('═'.repeat(60));
    console.log('');
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear ALL existing data
    console.log('🗑️  CLEARING ALL EXISTING DATA...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      await mongoose.connection.db.collection(collection.name).deleteMany({});
      console.log(`   ✓ Cleared ${collection.name}`);
    }
    console.log('✅ All existing data cleared\n');

    // Define models
    const Product = mongoose.model('Product', new mongoose.Schema({
      name: String, category: String, brand: String, sku: String,
      unitPrice: Number, unitCost: Number, stockLevel: Number,
      reorderLevel: Number, unit: String, description: String
    }));

    const Customer = mongoose.model('Customer', new mongoose.Schema({
      name: String, code: String, sapCustomerId: String, city: String, tier: String, 
      type: String, company: String, tenant: { type: String, required: true }
    }));

    const SalesData = mongoose.model('SalesData', new mongoose.Schema({
      saleId: String, customer: String, product: String, productSKU: String,
      quantity: Number, unitPrice: Number, discount: Number, totalAmount: Number,
      saleDate: Date, status: String, paymentStatus: String, currency: String
    }));

    const TradingTerm = mongoose.model('TradingTerm', new mongoose.Schema({
      termId: String, customerName: String, termType: String, description: String,
      paymentTerms: String, value: Number, valueType: String, startDate: Date,
      endDate: Date, status: String, targetVolume: Number, actualVolume: Number,
      estimatedPayout: Number, actualPayout: Number, currency: String, notes: String,
      createdBy: String, approvedBy: String, approvedDate: Date
    }, { timestamps: true }));

    const TradeSpend = mongoose.model('TradeSpend', new mongoose.Schema({
      spendId: String, customerName: String, productName: String, spendType: String,
      category: String, amount: Number, currency: String, spendDate: Date,
      startDate: Date, endDate: Date, status: String, expectedROI: Number,
      actualROI: Number, expectedVolume: Number, actualVolume: Number,
      description: String, createdBy: String, approvedBy: String, approvedDate: Date
    }, { timestamps: true }));

    const Activity = mongoose.model('Activity', new mongoose.Schema({
      activityId: String, activityName: String, activityType: String,
      customerName: String, products: [String], startDate: Date, endDate: Date,
      status: String, budget: Object, location: Object, objectives: String,
      expectedOutcome: Object, actualOutcome: Object, performance: String,
      owner: String, team: [String], description: String
    }, { timestamps: true }));

    const Promotion = mongoose.model('Promotion', new mongoose.Schema({
      promotionId: String, name: String, description: String, promotionType: String,
      startDate: Date, endDate: Date, status: String, products: [String],
      discountType: String, discountValue: Number, targetCustomers: [String],
      expectedSales: Number, actualSales: Number, budget: Number,
      actualSpend: Number, roi: Number, currency: String
    }, { timestamps: true }));

    const Budget = mongoose.model('Budget', new mongoose.Schema({
      budgetId: String, name: String, category: String, fiscalYear: Number,
      quarter: String, startDate: Date, endDate: Date, allocated: Number,
      spent: Number, committed: Number, available: Number, currency: String,
      status: String, owner: String, approvedBy: String, approvedDate: Date
    }, { timestamps: true }));

    const User = mongoose.model('User', new mongoose.Schema({
      email: String, password: String, firstName: String, lastName: String,
      role: String, company: String, isActive: Boolean, permissions: [String]
    }, { timestamps: true }));

    // Insert data
    console.log('📦 SEEDING DATA...\n');

    console.log('👥 Creating users...');
    const users = await generateUsers();
    await User.insertMany(users);
    console.log(`✅ Created ${users.length} users\n`);

    console.log('📦 Creating products...');
    const products = await Product.insertMany(productsData);
    console.log(`✅ Created ${products.length} Mondelez products\n`);

    console.log('🏪 Creating customers...');
    const customers = await Customer.insertMany(customersData);
    console.log(`✅ Created ${customers.length} South African retailers\n`);

    console.log('💰 Generating sales data (this may take a minute)...');
    const salesData = generateSalesData(productsData, customersData);
    await SalesData.insertMany(salesData);
    console.log(`✅ Created ${salesData.length} sales transactions (18 months of data)\n`);

    console.log('📄 Creating trading terms...');
    const tradingTerms = generateTradingTerms(customersData);
    await TradingTerm.insertMany(tradingTerms);
    console.log(`✅ Created ${tradingTerms.length} trading terms\n`);

    console.log('💸 Creating trade spends...');
    const tradeSpends = generateTradeSpends(customersData, productsData);
    await TradeSpend.insertMany(tradeSpends);
    console.log(`✅ Created ${tradeSpends.length} trade spends\n`);

    console.log('🎯 Creating activities...');
    const activities = generateActivities(customersData, productsData);
    await Activity.insertMany(activities);
    console.log(`✅ Created ${activities.length} activities\n`);

    console.log('🎁 Creating promotions...');
    const promotions = generatePromotions(customersData, productsData);
    await Promotion.insertMany(promotions);
    console.log(`✅ Created ${promotions.length} promotions\n`);

    console.log('💵 Creating budgets...');
    const budgets = generateBudgets();
    await Budget.insertMany(budgets);
    console.log(`✅ Created ${budgets.length} budgets\n`);

    // Summary
    console.log('═'.repeat(60));
    console.log('📊 SEEDING COMPLETE - SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Users:          ${users.length}`);
    console.log(`✅ Products:       ${products.length} (Mondelez South Africa)`);
    console.log(`✅ Customers:      ${customers.length} (SA Retailers)`);
    console.log(`✅ Sales Records:  ${salesData.length} (18 months)`);
    console.log(`✅ Trading Terms:  ${tradingTerms.length}`);
    console.log(`✅ Trade Spends:   ${tradeSpends.length}`);
    console.log(`✅ Activities:     ${activities.length}`);
    console.log(`✅ Promotions:     ${promotions.length}`);
    console.log(`✅ Budgets:        ${budgets.length}`);
    console.log('═'.repeat(60));

    // Calculate totals
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalSpend = tradeSpends.reduce((sum, spend) => sum + spend.amount, 0);
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.allocated, 0);

    console.log('\n💰 FINANCIAL SUMMARY:');
    console.log('─'.repeat(60));
    console.log(`Total Sales Revenue:  R ${(totalRevenue / 1000000).toFixed(2)}M`);
    console.log(`Total Trade Spend:    R ${(totalSpend / 1000000).toFixed(2)}M`);
    console.log(`Total Budget:         R ${(totalBudget / 1000000).toFixed(2)}M`);
    console.log(`Average Transaction:  R ${(totalRevenue / salesData.length).toFixed(2)}`);
    console.log('─'.repeat(60));

    console.log('\n🎯 DATA QUALITY FOR AI/ML:');
    console.log('─'.repeat(60));
    console.log(`✅ 18 months of historical sales data`);
    console.log(`✅ ${productsData.length} products across ${new Set(productsData.map(p => p.category)).size} categories`);
    console.log(`✅ ${customersData.length} customers across ${new Set(customersData.map(c => c.city)).size} cities`);
    console.log(`✅ ${tradingTerms.length} trading agreements for forecasting`);
    console.log(`✅ ${activities.length} activities for pattern recognition`);
    console.log(`✅ ${promotions.length} promotions for effectiveness analysis`);
    console.log(`✅ Sufficient data for accurate ML predictions`);
    console.log('─'.repeat(60));

    console.log('\n🌍 GEOGRAPHIC COVERAGE:');
    console.log('─'.repeat(60));
    const cities = [...new Set(customersData.map(c => c.city))];
    cities.forEach(city => {
      const count = customersData.filter(c => c.city === city).length;
      console.log(`   ${city}: ${count} customers`);
    });
    console.log('─'.repeat(60));

    console.log('\n✅ South Africa Mondelez data seeding completed successfully!');
    console.log('🎉 System ready for demo with comprehensive data\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

// Run the seed function
if (require.main === module) {
  seedSouthAfricaData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedSouthAfricaData };
