const config = require('./config');
const logger = require('./utils/logger');
const { initializeDatabase } = require('./config/database');
const { server } = require('./app');
const { initializeJobs } = require('./jobs');
const { initializeCache } = require('./services/cacheService');
const { validateOrExit } = require('./utils/validateEnv');

// Validate environment variables before starting
console.log('🔍 Validating environment configuration...\n');
validateOrExit();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Initialize database
    logger.info('Initializing database...');
    await initializeDatabase();
    
    // Initialize cache
    const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true';
    if (!USE_MOCK_DB) {
      logger.info('Initializing cache...');
      await initializeCache();
      
      // Initialize background jobs
      logger.info('Initializing background jobs...');
      await initializeJobs();
    } else {
      logger.info('Skipping cache and background jobs in mock mode');
    }
    
    // Start listening
    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode`);
      logger.info(`API Documentation available at http://localhost:${config.port}/api/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();