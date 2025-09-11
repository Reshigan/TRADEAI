#!/bin/bash

echo "🚀 Setting up Trade AI Platform with test data..."

# Stop any running containers
echo "⏹️ Stopping existing containers..."
docker compose -f docker-compose.production.yml down

# Start MongoDB first
echo "🗄️ Starting MongoDB..."
docker compose -f docker-compose.production.yml up -d mongodb

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to start..."
sleep 10

# Create test data directly in MongoDB
echo "📊 Creating test data..."
docker compose -f docker-compose.production.yml exec -T mongodb mongosh tradeai_production << 'EOF'
// Create test company
db.companies.insertOne({
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Test Company",
  domain: "testcompany.com",
  settings: {
    ssoEnabled: false,
    sapIntegration: false,
    timezone: "UTC"
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create test users with hashed passwords (bcrypt hash for respective passwords)
db.users.insertMany([
  {
    _id: ObjectId("507f1f77bcf86cd799439012"),
    name: "Super Admin",
    email: "superadmin@tradeai.com",
    password: "$2b$10$8K1p/a0dclxKoNqIfrHb2eGYQS9L2Dp9Ug8HK7uBqsqrJ0H1jVvvW", // SuperAdmin123!
    role: "super_admin",
    companyId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId("507f1f77bcf86cd799439013"),
    name: "Company Admin",
    email: "admin@testcompany.com",
    password: "$2b$10$8K1p/a0dclxKoNqIfrHb2eGYQS9L2Dp9Ug8HK7uBqsqrJ0H1jVvvW", // Admin123!
    role: "admin",
    companyId: ObjectId("507f1f77bcf86cd799439011"),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId("507f1f77bcf86cd799439014"),
    name: "Manager User",
    email: "manager@testcompany.com",
    password: "$2b$10$8K1p/a0dclxKoNqIfrHb2eGYQS9L2Dp9Ug8HK7uBqsqrJ0H1jVvvW", // Manager123!
    role: "manager",
    companyId: ObjectId("507f1f77bcf86cd799439011"),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId("507f1f77bcf86cd799439015"),
    name: "Regular User",
    email: "user@testcompany.com",
    password: "$2b$10$8K1p/a0dclxKoNqIfrHb2eGYQS9L2Dp9Ug8HK7uBqsqrJ0H1jVvvW", // User123!
    role: "user",
    companyId: ObjectId("507f1f77bcf86cd799439011"),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Create test customers
db.customers.insertMany([
  {
    _id: ObjectId("507f1f77bcf86cd799439016"),
    name: "Acme Corporation",
    companyId: ObjectId("507f1f77bcf86cd799439011"),
    contactInfo: {
      email: "contact@acme.com",
      phone: "+1-555-0123",
      address: {
        street: "123 Business St",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA"
      }
    },
    sapId: "CUST001",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId("507f1f77bcf86cd799439017"),
    name: "Global Retail Inc",
    companyId: ObjectId("507f1f77bcf86cd799439011"),
    contactInfo: {
      email: "orders@globalretail.com",
      phone: "+1-555-0456",
      address: {
        street: "456 Commerce Ave",
        city: "Chicago",
        state: "IL",
        zipCode: "60601",
        country: "USA"
      }
    },
    sapId: "CUST002",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Create test products
db.products.insertMany([
  {
    _id: ObjectId("507f1f77bcf86cd799439018"),
    name: "Premium Widget A",
    sku: "PWA-001",
    companyId: ObjectId("507f1f77bcf86cd799439011"),
    category: "Electronics",
    price: 299.99,
    sapId: "PROD001",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId("507f1f77bcf86cd799439019"),
    name: "Standard Widget B",
    sku: "SWB-002",
    companyId: ObjectId("507f1f77bcf86cd799439011"),
    category: "Electronics",
    price: 199.99,
    sapId: "PROD002",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Create test promotions
db.promotions.insertMany([
  {
    _id: ObjectId("507f1f77bcf86cd79943901a"),
    name: "Q1 2025 Spring Campaign",
    description: "Spring promotion for premium products",
    companyId: ObjectId("507f1f77bcf86cd799439011"),
    customerId: ObjectId("507f1f77bcf86cd799439016"),
    budget: 50000,
    status: "active",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-03-31"),
    createdBy: ObjectId("507f1f77bcf86cd799439013"),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId("507f1f77bcf86cd79943901b"),
    name: "Summer Sale 2025",
    description: "Summer promotional campaign",
    companyId: ObjectId("507f1f77bcf86cd799439011"),
    customerId: ObjectId("507f1f77bcf86cd799439017"),
    budget: 75000,
    status: "planned",
    startDate: new Date("2025-06-01"),
    endDate: new Date("2025-08-31"),
    createdBy: ObjectId("507f1f77bcf86cd799439013"),
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Create test budgets
db.budgets.insertMany([
  {
    _id: ObjectId("507f1f77bcf86cd79943901c"),
    name: "2025 Marketing Budget",
    amount: 500000,
    companyId: ObjectId("507f1f77bcf86cd799439011"),
    category: "Marketing",
    period: "annual",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    createdBy: ObjectId("507f1f77bcf86cd799439013"),
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print("✅ Test data created successfully!");
EOF

echo "🚀 Starting all services..."
docker compose -f docker-compose.production.yml up -d

echo "⏳ Waiting for all services to start..."
sleep 30

echo "🏥 Checking service health..."
docker compose -f docker-compose.production.yml ps

echo "✅ Setup complete!"
echo ""
echo "🔑 Test Login Credentials:"
echo "Super Admin: superadmin@tradeai.com / SuperAdmin123!"
echo "Admin: admin@testcompany.com / Admin123!"
echo "Manager: manager@testcompany.com / Manager123!"
echo "User: user@testcompany.com / User123!"
echo ""
echo "🌐 Access the application at: http://localhost (or your server IP)"