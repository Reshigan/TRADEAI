// TRADEAI v2.0 - Global Test Teardown

const mongoose = require('mongoose');

module.exports = async () => {
  console.log('🧹 Cleaning up global test environment...');
  
  try {
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('✅ Database connection closed');
    }
    
    // Stop MongoDB Memory Server
    if (global.__MONGO_SERVER__) {
      await global.__MONGO_SERVER__.stop();
      console.log('✅ MongoDB Memory Server stopped');
    }
    
    // Close Redis connection
    if (global.__REDIS_CLIENT__) {
      global.__REDIS_CLIENT__.disconnect();
      console.log('✅ Redis Mock disconnected');
    }
    
    console.log('✅ Global test environment cleanup complete');
  } catch (error) {
    console.error('❌ Error during global teardown:', error);
  }
};