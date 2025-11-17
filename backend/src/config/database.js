const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

// MongoDB connection with retry logic
const connectDB = async () => {
  // Check if we should use mock mode
  const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'mock';

  if (USE_MOCK_DB) {
    logger.warn('🚨 Running in MOCK DATABASE mode - no real database connection');
    logger.info('To use a real database:');
    logger.info('1. Install and start MongoDB locally, or');
    logger.info('2. Use MongoDB Atlas (free tier at mongodb.com/cloud/atlas)');
    logger.info('3. Update MONGODB_URI in .env file');
    logger.info('4. Set USE_MOCK_DB=false in .env file');
    return;
  }

  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(config.mongodb.uri, config.mongodb.options);

      logger.info('MongoDB connected successfully', {
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        readyState: mongoose.connection.readyState
      });

      // Connection event handlers
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      });

      break;
    } catch (error) {
      retries++;
      logger.error(`MongoDB connection attempt ${retries} failed:`, error);

      if (retries === maxRetries) {
        logger.error('Max retries reached. Could not connect to MongoDB');
        process.exit(1);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

// Create indexes
const createIndexes = async () => {
  // Skip index creation in mock mode
  const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'mock';
  if (USE_MOCK_DB) {
    logger.info('Skipping index creation in mock database mode');
    return;
  }

  try {
    logger.info('Creating database indexes...');

    // Import all models to ensure indexes are created
    require('../models/Company');
    require('../models/User');
    require('../models/Customer');
    require('../models/Product');
    require('../models/Budget');
    require('../models/Promotion');
    require('../models/TradeSpend');
    require('../models/TradingTerm');
    require('../models/ActivityGrid');
    require('../models/Report');

    await mongoose.connection.syncIndexes();
    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
  }
};

// Initialize database
const initializeDatabase = async () => {
  await connectDB();
  await createIndexes();

  // Run any initialization scripts
  if (process.env.NODE_ENV === 'development') {
    // In development, you might want to seed some data
    logger.info('Database initialization complete');
  }
};

module.exports = {
  connectDB,
  createIndexes,
  initializeDatabase
};
