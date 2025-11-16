const mongoose = require('mongoose');
const config = require('../config');

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...');

    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);

    console.log('✅ Connected to MongoDB');

    // Check if database is accessible
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} existing collections`);

    // Create basic indexes for collections that might exist
    console.log('🔍 Creating database indexes...');

    const db = mongoose.connection.db;

    // Create indexes for common collections (if they exist)
    try {
      // Users collection indexes
      await db.collection('users').createIndex({ email: 1 }, { unique: true, background: true });
      await db.collection('users').createIndex({ companyId: 1 }, { background: true });
      await db.collection('users').createIndex({ role: 1 }, { background: true });
      console.log('✅ User indexes created');
    } catch (error) {
      console.log('ℹ️  User collection indexes skipped (collection may not exist yet)');
    }

    try {
      // Companies collection indexes
      await db.collection('companies').createIndex({ name: 1 }, { unique: true, background: true });
      await db.collection('companies').createIndex({ status: 1 }, { background: true });
      console.log('✅ Company indexes created');
    } catch (error) {
      console.log('ℹ️  Company collection indexes skipped (collection may not exist yet)');
    }

    try {
      // TradeSpends collection indexes
      await db.collection('tradespends').createIndex({ companyId: 1 }, { background: true });
      await db.collection('tradespends').createIndex({ customerId: 1 }, { background: true });
      await db.collection('tradespends').createIndex({ date: -1 }, { background: true });
      console.log('✅ TradeSpend indexes created');
    } catch (error) {
      console.log('ℹ️  TradeSpend collection indexes skipped (collection may not exist yet)');
    }

    try {
      // Budgets collection indexes
      await db.collection('budgets').createIndex({ companyId: 1 }, { background: true });
      await db.collection('budgets').createIndex({ year: 1 }, { background: true });
      console.log('✅ Budget indexes created');
    } catch (error) {
      console.log('ℹ️  Budget collection indexes skipped (collection may not exist yet)');
    }

    try {
      // Promotions collection indexes
      await db.collection('promotions').createIndex({ companyId: 1 }, { background: true });
      await db.collection('promotions').createIndex({ status: 1 }, { background: true });
      await db.collection('promotions').createIndex({ startDate: 1, endDate: 1 }, { background: true });
      console.log('✅ Promotion indexes created');
    } catch (error) {
      console.log('ℹ️  Promotion collection indexes skipped (collection may not exist yet)');
    }

    console.log('✅ Database index creation completed');

    // Verify collections exist
    const finalCollections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Database now has ${finalCollections.length} collections`);

    console.log('✅ Database migrations completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
