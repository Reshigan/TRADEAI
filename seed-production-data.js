// Production Data Seeding Script for TRADEAI
// This script creates the necessary companies and users for production use

// Switch to the tradeai database
db = db.getSiblingDB('tradeai');

print('Starting production data seeding...');

// Helper functions for seed data
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomFloat(min, max, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Create TRADEAI Company (main production company)
print('Creating TRADEAI Company...');
const tradeaiCompanyId = new ObjectId();
db.companies.insertOne({
    _id: tradeaiCompanyId,
    name: 'TRADEAI',
    domain: 'tradeai.com',
    status: 'active',
    settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        fiscalYearStart: 'January',
        features: {
            aiPredictions: true,
            realTimeAnalytics: true,
            multiCurrency: true,
            advancedReporting: true
        },
        integrations: {
            sap: {
                enabled: false,
                server: '',
                client: '',
                username: '',
                systemNumber: ''
            },
            sso: {
                enabled: false,
                provider: 'azure',
                clientId: '',
                tenantId: '',
                redirectUri: ''
            }
        }
    },
    contact: {
        email: 'admin@tradeai.com',
        phone: '+1 555 123 4567',
        address: {
            street: '123 Trade Street',
            city: 'New York',
            state: 'NY',
            postcode: '10001',
            country: 'USA'
        }
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
});

// Create TRADEAI users with different roles
const tradeaiUsers = [
    {
        email: 'admin@tradeai.com',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // admin123
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        status: 'active'
    },
    {
        email: 'manager@tradeai.com',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // admin123
        firstName: 'Trade',
        lastName: 'Manager',
        role: 'manager',
        status: 'active'
    },
    {
        email: 'kam@tradeai.com',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // admin123
        firstName: 'Key Account',
        lastName: 'Manager',
        role: 'kam',
        status: 'active'
    }
];

const tradeaiUserIds = [];
tradeaiUsers.forEach(user => {
    const userId = new ObjectId();
    tradeaiUserIds.push(userId);
    db.users.insertOne({
        _id: userId,
        ...user,
        companyId: tradeaiCompanyId,
        profile: {
            firstName: user.firstName,
            lastName: user.lastName,
            department: user.role === 'super_admin' ? 'IT' : user.role === 'manager' ? 'Sales' : 'Key Accounts',
            phone: '+1 555 ' + randomInt(1000000, 9999999)
        },
        permissions: user.role === 'super_admin' ? ['all'] : user.role === 'manager' ? ['read', 'write', 'approve'] : ['read', 'write'],
        lastLogin: new Date(),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
    });
});

// Create Test Company for demos
print('Creating Test Company for demos...');
const testCompanyId = new ObjectId();
db.companies.insertOne({
    _id: testCompanyId,
    name: 'Test Company',
    domain: 'testcompany.demo',
    status: 'active',
    settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        fiscalYearStart: 'January',
        features: {
            aiPredictions: true,
            realTimeAnalytics: true,
            multiCurrency: true,
            advancedReporting: true
        },
        integrations: {
            sap: {
                enabled: false,
                server: '',
                client: '',
                username: '',
                systemNumber: ''
            },
            sso: {
                enabled: false,
                provider: 'azure',
                clientId: '',
                tenantId: '',
                redirectUri: ''
            }
        }
    },
    contact: {
        email: 'admin@testcompany.demo',
        phone: '+1 555 123 4567',
        address: {
            street: '456 Demo Street',
            city: 'New York',
            state: 'NY',
            postcode: '10001',
            country: 'USA'
        }
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
});

// Create test users with different roles
const testUsers = [
    {
        email: 'admin@testcompany.demo',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // admin123
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        status: 'active'
    },
    {
        email: 'manager@testcompany.demo',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm',
        firstName: 'Manager',
        lastName: 'Smith',
        role: 'manager',
        status: 'active'
    },
    {
        email: 'kam@testcompany.demo',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm',
        firstName: 'Key Account',
        lastName: 'Manager',
        role: 'kam',
        status: 'active'
    },
    {
        email: 'analyst@testcompany.demo',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm',
        firstName: 'Data',
        lastName: 'Analyst',
        role: 'analyst',
        status: 'active'
    },
    {
        email: 'sales@testcompany.demo',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm',
        firstName: 'Sales',
        lastName: 'Rep',
        role: 'sales',
        status: 'active'
    }
];

const testUserIds = [];
testUsers.forEach(user => {
    const userId = new ObjectId();
    testUserIds.push(userId);
    db.users.insertOne({
        _id: userId,
        ...user,
        companyId: testCompanyId,
        profile: {
            firstName: user.firstName,
            lastName: user.lastName,
            department: user.role === 'admin' ? 'IT' : user.role === 'manager' ? 'Sales' : user.role === 'kam' ? 'Key Accounts' : 'Operations',
            phone: '+1 555 ' + randomInt(1000000, 9999999)
        },
        permissions: user.role === 'admin' ? ['all'] : user.role === 'manager' ? ['read', 'write', 'approve'] : ['read', 'write'],
        lastLogin: randomDate(new Date('2024-08-01'), new Date()),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
    });
});

// Create sample customers for Test Company
const testCustomerIds = [];
const customerNames = ['Walmart', 'Target', 'Amazon', 'Costco', 'Home Depot', 'Best Buy', 'CVS', 'Walgreens', 'Kroger', 'Safeway'];
for (let i = 0; i < 10; i++) {
    const customerId = new ObjectId();
    testCustomerIds.push(customerId);
    
    db.customers.insertOne({
        _id: customerId,
        name: customerNames[i],
        code: `CUST${String(i + 1).padStart(3, '0')}`,
        companyId: testCompanyId,
        type: randomChoice(['retail', 'wholesale', 'distributor', 'online']),
        status: 'active',
        contact: {
            email: `contact@${customerNames[i].toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            phone: '+1 555 ' + randomInt(1000000, 9999999),
            primaryContact: `${randomChoice(['John', 'Sarah', 'Mike', 'Emma', 'David'])} ${randomChoice(['Smith', 'Johnson', 'Brown', 'Wilson'])}`
        },
        address: {
            street: `${randomInt(1, 999)} Main Street`,
            city: randomChoice(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']),
            state: randomChoice(['NY', 'CA', 'IL', 'TX', 'AZ']),
            postcode: String(randomInt(10000, 99999)),
            country: 'USA'
        },
        salesData: {
            totalRevenue: randomFloat(100000, 2000000),
            averageOrderValue: randomFloat(500, 5000),
            lastOrderDate: randomDate(new Date('2024-01-01'), new Date()),
            creditLimit: randomFloat(50000, 500000),
            paymentTerms: randomChoice(['Net 30', 'Net 60', 'COD', '2/10 Net 30'])
        },
        createdAt: randomDate(new Date('2024-01-01'), new Date('2024-06-01')),
        updatedAt: new Date()
    });
}

// Create sample products for Test Company
const testProductIds = [];
const categories = ['Electronics', 'Home & Garden', 'Sports', 'Health & Beauty', 'Automotive'];
const brands = ['Samsung', 'Apple', 'Sony', 'Nike', 'Adidas'];

for (let i = 0; i < 20; i++) {
    const productId = new ObjectId();
    testProductIds.push(productId);
    const category = randomChoice(categories);
    const brand = randomChoice(brands);
    
    db.products.insertOne({
        _id: productId,
        name: `${brand} ${category} Product ${i + 1}`,
        sku: `SKU${String(i + 1).padStart(4, '0')}`,
        companyId: testCompanyId,
        category: category,
        brand: brand,
        status: 'active',
        pricing: {
            cost: randomFloat(10, 200),
            listPrice: randomFloat(20, 400),
            wholesalePrice: randomFloat(15, 300),
            retailPrice: randomFloat(25, 500),
            margin: randomFloat(20, 60)
        },
        inventory: {
            currentStock: randomInt(50, 500),
            reorderLevel: randomInt(10, 50),
            maxStock: randomInt(200, 1000)
        },
        createdAt: randomDate(new Date('2024-01-01'), new Date('2024-06-01')),
        updatedAt: new Date()
    });
}

// Create sample budget for Test Company
const budgetId = new ObjectId();
db.budgets.insertOne({
    _id: budgetId,
    name: 'Test Company Annual Budget 2025',
    companyId: testCompanyId,
    year: 2025,
    totalAmount: 1000000,
    allocatedAmount: 850000,
    spentAmount: 450000,
    status: 'active',
    categories: [
        { name: 'Trade Marketing', budgetAmount: 400000, spentAmount: 180000, remainingAmount: 220000 },
        { name: 'Consumer Promotions', budgetAmount: 250000, spentAmount: 120000, remainingAmount: 130000 },
        { name: 'Retailer Support', budgetAmount: 200000, spentAmount: 90000, remainingAmount: 110000 },
        { name: 'Digital Marketing', budgetAmount: 100000, spentAmount: 45000, remainingAmount: 55000 },
        { name: 'Events & Sponsorship', budgetAmount: 50000, spentAmount: 15000, remainingAmount: 35000 }
    ],
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date()
});

// Create sample promotions for Test Company
const testPromotionIds = [];
for (let i = 0; i < 10; i++) {
    const promotionId = new ObjectId();
    testPromotionIds.push(promotionId);
    
    const startDate = randomDate(new Date('2024-01-01'), new Date('2024-10-01'));
    const endDate = new Date(startDate.getTime() + randomInt(7, 60) * 24 * 60 * 60 * 1000);
    const budget = randomFloat(5000, 50000);
    
    db.promotions.insertOne({
        _id: promotionId,
        name: `Test Promotion ${i + 1} - ${randomChoice(['Summer Sale', 'Back to School', 'Holiday Special', 'New Product Launch'])}`,
        companyId: testCompanyId,
        type: randomChoice(['discount', 'rebate', 'volume', 'display']),
        startDate: startDate,
        endDate: endDate,
        status: endDate < new Date() ? 'completed' : 'active',
        budget: budget,
        spent: budget * randomFloat(0.2, 0.8),
        customers: testCustomerIds.slice(0, randomInt(3, 8)),
        products: testProductIds.slice(0, randomInt(3, 10)),
        terms: {
            discountPercentage: randomFloat(5, 25),
            minimumQuantity: randomInt(10, 100),
            maximumDiscount: randomFloat(1000, 5000),
            paymentTerms: 'Net 30'
        },
        performance: {
            participatingCustomers: randomInt(3, 8),
            totalSales: randomFloat(25000, 200000),
            incrementalSales: randomFloat(5000, 50000),
            roi: randomFloat(1.2, 3.5)
        },
        createdAt: randomDate(new Date(startDate.getTime() - 14 * 24 * 60 * 60 * 1000), startDate),
        updatedAt: new Date()
    });
}

// Create sample trade spends for Test Company
for (let i = 0; i < 100; i++) {
    const customerId = randomChoice(testCustomerIds);
    const promotionId = randomChoice(testPromotionIds);
    const date = randomDate(new Date('2024-01-01'), new Date('2024-11-01'));
    
    db.tradeSpends.insertOne({
        companyId: testCompanyId,
        customerId: customerId,
        promotionId: promotionId,
        budgetId: budgetId,
        amount: randomFloat(100, 5000),
        date: date,
        status: randomChoice(['approved', 'paid', 'pending']),
        type: randomChoice(['accrual', 'payment', 'adjustment']),
        description: `Trade spend for ${randomChoice(['volume discount', 'display allowance', 'promotional support', 'listing fee'])}`,
        metadata: {
            invoiceNumber: `INV${String(i + 1).padStart(6, '0')}`,
            approvedBy: randomChoice(testUserIds),
            approvalDate: new Date(date.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000),
            paymentMethod: randomChoice(['Bank Transfer', 'Credit Note', 'Check']),
            reference: `REF${String(i + 1).padStart(6, '0')}`
        },
        createdAt: date,
        updatedAt: new Date()
    });
}

// Create sample sales data for Test Company
for (let i = 0; i < 500; i++) {
    const customerId = randomChoice(testCustomerIds);
    const productId = randomChoice(testProductIds);
    const date = randomDate(new Date('2024-01-01'), new Date('2024-11-01'));
    const quantity = randomInt(1, 100);
    const unitPrice = randomFloat(20, 500);
    const revenue = quantity * unitPrice;
    const cost = revenue * randomFloat(0.4, 0.7);
    
    db.salesData.insertOne({
        companyId: testCompanyId,
        customerId: customerId,
        productId: productId,
        date: date,
        quantity: quantity,
        revenue: revenue,
        unitPrice: unitPrice,
        cost: cost,
        margin: ((revenue - cost) / revenue) * 100,
        channel: randomChoice(['Retail', 'Online', 'Wholesale', 'Direct']),
        region: randomChoice(['Northeast', 'Southeast', 'Midwest', 'West', 'Southwest']),
        salesRep: randomChoice(testUserIds),
        orderNumber: `ORD${String(i + 1).padStart(8, '0')}`,
        createdAt: date,
        updatedAt: new Date()
    });
}

print('Production data seeding completed successfully!');
print('');
print('TRADEAI Company Users:');
print('- admin@tradeai.com (Super Admin) - Password: admin123');
print('- manager@tradeai.com (Manager) - Password: admin123');
print('- kam@tradeai.com (Key Account Manager) - Password: admin123');
print('');
print('Test Company Users:');
print('- admin@testcompany.demo (Admin) - Password: admin123');
print('- manager@testcompany.demo (Manager) - Password: admin123');
print('- kam@testcompany.demo (Key Account Manager) - Password: admin123');
print('- analyst@testcompany.demo (Analyst) - Password: admin123');
print('- sales@testcompany.demo (Sales Rep) - Password: admin123');
print('');
print('Sample data created for Test Company:');
print('- 10 customers');
print('- 20 products');
print('- 1 budget with categories');
print('- 10 promotions');
print('- 100 trade spend records');
print('- 500 sales records');