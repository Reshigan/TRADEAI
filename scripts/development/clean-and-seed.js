// Clean and Seed Production Data Script for TRADEAI
// This script cleans existing data and creates fresh production data

// Switch to the tradeai database
db = db.getSiblingDB('tradeai');

print('Starting clean and seed process...');

// Clean existing data
print('Cleaning existing data...');
try {
    db.companies.deleteMany({});
    db.users.deleteMany({});
    db.customers.deleteMany({});
    db.products.deleteMany({});
    db.budgets.deleteMany({});
    db.promotions.deleteMany({});
    db.tradeSpends.deleteMany({});
    db.salesData.deleteMany({});
    print('Existing data cleaned successfully');
} catch (e) {
    print('Error cleaning data: ' + e);
}

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
    code: 'TRADEAI',
    domain: 'tradeai.com',
    industry: 'fmcg',
    country: 'US',
    currency: 'USD',
    timezone: 'America/New_York',
    status: 'active',
    fiscalYearStart: 'January',
    features: {
        aiPredictions: true,
        realTimeAnalytics: true,
        multiCurrency: true,
        advancedReporting: true
    },
    address: {
        street: '123 Trade Street',
        city: 'New York',
        state: 'NY',
        postcode: '10001',
        country: 'USA'
    },
    contactEmail: 'admin@tradeai.com',
    contactPhone: '+1 555 123 4567',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
});

// Create TRADEAI users
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
    }
];

tradeaiUsers.forEach((user, index) => {
    const userId = new ObjectId();
    db.users.insertOne({
        _id: userId,
        ...user,
        companyId: user.role === 'super_admin' ? null : tradeaiCompanyId,
        employeeId: `EMP${String(index + 1).padStart(3, '0')}`,
        department: user.role === 'super_admin' ? 'IT' : 'Sales',
        phone: '+1 555 ' + randomInt(1000000, 9999999),
        permissions: user.role === 'super_admin' ? ['all'] : ['read', 'write', 'approve'],
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
    code: 'TESTCO',
    domain: 'testcompany.demo',
    industry: 'fmcg',
    country: 'US',
    currency: 'USD',
    timezone: 'America/New_York',
    status: 'active',
    fiscalYearStart: 'January',
    features: {
        aiPredictions: true,
        realTimeAnalytics: true,
        multiCurrency: true,
        advancedReporting: true
    },
    address: {
        street: '456 Demo Street',
        city: 'New York',
        state: 'NY',
        postcode: '10001',
        country: 'USA'
    },
    contactEmail: 'admin@testcompany.demo',
    contactPhone: '+1 555 123 4567',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
});

// Create test users
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
    }
];

const testUserIds = [];
testUsers.forEach((user, index) => {
    const userId = new ObjectId();
    testUserIds.push(userId);
    db.users.insertOne({
        _id: userId,
        ...user,
        companyId: testCompanyId,
        employeeId: `TEST${String(index + 1).padStart(3, '0')}`,
        department: user.role === 'admin' ? 'IT' : user.role === 'manager' ? 'Sales' : 'Key Accounts',
        phone: '+1 555 ' + randomInt(1000000, 9999999),
        permissions: user.role === 'admin' ? ['all'] : user.role === 'manager' ? ['read', 'write', 'approve'] : ['read', 'write'],
        lastLogin: randomDate(new Date('2024-08-01'), new Date()),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
    });
});

// Create sample customers for Test Company
const testCustomerIds = [];
const customerNames = ['Walmart', 'Target', 'Amazon', 'Costco', 'Home Depot'];
for (let i = 0; i < 5; i++) {
    const customerId = new ObjectId();
    testCustomerIds.push(customerId);
    
    db.customers.insertOne({
        _id: customerId,
        company: testCompanyId,
        sapCustomerId: `SAP${String(i + 1).padStart(6, '0')}`,
        name: customerNames[i],
        code: `CUST${String(i + 1).padStart(3, '0')}`,
        type: randomChoice(['retail', 'wholesale', 'distributor']),
        status: 'active',
        contact: {
            email: `contact@${customerNames[i].toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            phone: '+1 555 ' + randomInt(1000000, 9999999),
            primaryContact: `Contact Person ${i + 1}`
        },
        address: {
            street: `${randomInt(1, 999)} Main Street`,
            city: 'New York',
            state: 'NY',
            postcode: String(randomInt(10000, 99999)),
            country: 'USA'
        },
        salesData: {
            totalRevenue: randomFloat(100000, 2000000),
            averageOrderValue: randomFloat(500, 5000),
            lastOrderDate: randomDate(new Date('2024-01-01'), new Date()),
            creditLimit: randomFloat(50000, 500000),
            paymentTerms: 'Net 30'
        },
        createdAt: randomDate(new Date('2024-01-01'), new Date('2024-06-01')),
        updatedAt: new Date()
    });
}

// Create sample products for Test Company
const testProductIds = [];
const categories = ['Electronics', 'Home & Garden', 'Sports'];
const brands = ['Samsung', 'Apple', 'Sony'];

for (let i = 0; i < 10; i++) {
    const productId = new ObjectId();
    testProductIds.push(productId);
    const category = randomChoice(categories);
    const brand = randomChoice(brands);
    
    db.products.insertOne({
        _id: productId,
        company: testCompanyId,
        sapMaterialId: `MAT${String(i + 1).padStart(6, '0')}`,
        name: `${brand} ${category} Product ${i + 1}`,
        sku: `SKU${String(i + 1).padStart(4, '0')}`,
        barcode: `${String(Math.floor(Math.random() * 1000000000000)).padStart(12, '0')}`,
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
    company: testCompanyId,
    name: 'Test Company Annual Budget 2025',
    code: 'BUDGET2025',
    year: 2025,
    totalAmount: 1000000,
    allocatedAmount: 850000,
    spentAmount: 450000,
    status: 'active',
    categories: [
        { name: 'Trade Marketing', budgetAmount: 400000, spentAmount: 180000, remainingAmount: 220000 },
        { name: 'Consumer Promotions', budgetAmount: 250000, spentAmount: 120000, remainingAmount: 130000 },
        { name: 'Retailer Support', budgetAmount: 200000, spentAmount: 90000, remainingAmount: 110000 }
    ],
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date()
});

print('Production data seeding completed successfully!');
print('');
print('TRADEAI Company Users:');
print('- admin@tradeai.com (Super Admin) - Password: admin123');
print('- manager@tradeai.com (Manager) - Password: admin123');
print('');
print('Test Company Users:');
print('- admin@testcompany.demo (Admin) - Password: admin123');
print('- manager@testcompany.demo (Manager) - Password: admin123');
print('- kam@testcompany.demo (Key Account Manager) - Password: admin123');
print('');
print('Sample data created for Test Company:');
print('- 5 customers');
print('- 10 products');
print('- 1 budget with categories');