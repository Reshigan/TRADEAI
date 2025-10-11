// TRADEAI v2.0 - Global Test Setup for 100% Coverage Testing

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const Redis = require('ioredis-mock');

let mongoServer;
let redisClient;

module.exports = async () => {
  console.log('🚀 Setting up global test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';
  process.env.REDIS_URL = 'redis://localhost:6379';
  
  // Start MongoDB Memory Server
  try {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'tradeai_test'
      }
    });
    
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    process.env.MONGODB_TEST_URI = mongoUri;
    
    console.log('✅ MongoDB Memory Server started');
  } catch (error) {
    console.error('❌ Failed to start MongoDB Memory Server:', error);
    throw error;
  }
  
  // Start Redis Mock
  try {
    redisClient = new Redis();
    global.__REDIS_CLIENT__ = redisClient;
    console.log('✅ Redis Mock started');
  } catch (error) {
    console.error('❌ Failed to start Redis Mock:', error);
    throw error;
  }
  
  // Set up test database connection
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
  
  // Store global references
  global.__MONGO_SERVER__ = mongoServer;
  global.__REDIS_CLIENT__ = redisClient;
  
  // Set up test data
  await setupTestData();
  
  console.log('✅ Global test environment setup complete');
};

async function setupTestData() {
  console.log('📊 Setting up test data...');
  
  // Create test collections and indexes
  const collections = [
    'users',
    'companies',
    'tradespends',
    'budgets',
    'products',
    'customers',
    'promotions',
    'activities',
    'reports',
    'auditlogs'
  ];
  
  for (const collectionName of collections) {
    try {
      await mongoose.connection.db.createCollection(collectionName);
      console.log(`✅ Created collection: ${collectionName}`);
    } catch (error) {
      // Collection might already exist
      console.log(`ℹ️  Collection ${collectionName} already exists`);
    }
  }
  
  // Create test indexes for performance
  const db = mongoose.connection.db;
  
  // User indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ companyId: 1 });
  
  // Company indexes
  await db.collection('companies').createIndex({ name: 1 }, { unique: true });
  
  // Trade spend indexes
  await db.collection('tradespends').createIndex({ companyId: 1 });
  await db.collection('tradespends').createIndex({ createdAt: -1 });
  
  // Budget indexes
  await db.collection('budgets').createIndex({ companyId: 1 });
  await db.collection('budgets').createIndex({ year: 1 });
  
  console.log('✅ Test data setup complete');
}