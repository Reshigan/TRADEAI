const mongoose = require('mongoose');
const { seedProductionData } = require('./production-seed');
const { seedEnhancedAnalyticsData } = require('./enhanced-gonxt-analytics-seed');
const connectDB = require('../config/database');

const seedCompleteProductionData = async () => {
  try {
    console.log('Starting complete production data seeding...');

    // First seed basic production data (companies, users, customers, products, campaigns)
    console.log('Step 1: Seeding basic production data...');
    await seedProductionData();

    // Then seed enhanced analytics data (trading terms, reports, AI chats, etc.)
    console.log('Step 2: Seeding enhanced analytics data...');
    await seedEnhancedAnalyticsData();

    console.log('Complete production data seeding finished successfully!');

  } catch (error) {
    console.error('Error in complete production seeding:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await seedCompleteProductionData();
    console.log('All production data seeded successfully!');
  } catch (error) {
    console.error('Production seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedCompleteProductionData };
