/**
 * Database Test Helper
 * Provides utilities for database operations in tests
 */

const mongoose = require('mongoose');

// For Jest globalSetup, we use a pre-created MongoDB instance
// For direct usage, we import MongoMemoryServer here
let mongoServer;
let mongoServerImported = false;

async function importMongoMemoryServer() {
  if (!mongoServerImported) {
    try {
      const mms = require('mongodb-memory-server');
      mongoServer = await mms.MongoMemoryServer.create();
      mongoServerImported = true;
    } catch (e) {
      // Fallback: try to use global __MONGO_URI__ if available
      if (global.__MONGO_URI__) {
        console.log('Using global MongoDB URI from globalSetup');
        return;
      }
      throw e;
    }
  }
}

/**
 * Connect to in-memory MongoDB instance
 */
async function connect() {
  try {
    // Close existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    let uri;
    
    // Try to use global MongoDB URI from globalSetup first
    if (global.__MONGO_URI__) {
      uri = global.__MONGO_URI__;
      console.log('Using global MongoDB URI');
    } else {
      // Create new in-memory server
      await importMongoMemoryServer();
      uri = mongoServer.getUri();
    }

    // Connect to in-memory database
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to in-memory test database');
  } catch (error) {
    console.error('✗ Database connection error:', error);
    throw error;
  }
}

/**
 * Disconnect and cleanup
 */
async function disconnect() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }

    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('✓ Disconnected from test database');
  } catch (error) {
    console.error('✗ Database disconnect error:', error);
    throw error;
  }
}

/**
 * Clear all collections
 */
async function clearDatabase() {
  try {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }

    console.log('✓ Database cleared');
  } catch (error) {
    console.error('✗ Database clear error:', error);
    throw error;
  }
}

/**
 * Clear specific collection
 */
async function clearCollection(collectionName) {
  try {
    const collection = mongoose.connection.collections[collectionName];
    if (collection) {
      await collection.deleteMany({});
      console.log(`✓ Collection ${collectionName} cleared`);
    }
  } catch (error) {
    console.error(`✗ Error clearing collection ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get document count for collection
 */
async function getCollectionCount(collectionName) {
  try {
    const collection = mongoose.connection.collections[collectionName];
    return collection ? await collection.countDocuments() : 0;
  } catch (error) {
    console.error(`✗ Error getting count for ${collectionName}:`, error);
    return 0;
  }
}

/**
 * Check if database is connected
 */
function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connect,
  disconnect,
  clearDatabase,
  clearCollection,
  getCollectionCount,
  isConnected
};
