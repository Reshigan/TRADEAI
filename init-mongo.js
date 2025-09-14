// MongoDB Initialization Script for TRADEAI
// This script creates the initial database structure and admin user

// Switch to the tradeai database
db = db.getSiblingDB('tradeai');

// Create admin user for the application
db.createUser({
  user: 'admin',
  pwd: 'TradeAI_Mongo_2024!',
  roles: [
    {
      role: 'readWrite',
      db: 'tradeai'
    }
  ]
});

// Create collections with initial structure
db.createCollection('users');
db.createCollection('companies');
db.createCollection('budgets');
db.createCollection('tradespends');
db.createCollection('promotions');
db.createCollection('analytics');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "companyId": 1 });
db.companies.createIndex({ "domain": 1 }, { unique: true });
db.budgets.createIndex({ "companyId": 1, "year": 1 });
db.tradespends.createIndex({ "companyId": 1, "createdAt": -1 });
db.promotions.createIndex({ "companyId": 1, "startDate": 1, "endDate": 1 });

print('MongoDB initialization completed successfully');
print('Database: tradeai');
print('Collections created: users, companies, budgets, tradespends, promotions, analytics');
print('Indexes created for optimal performance');