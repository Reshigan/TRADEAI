const mongoose = require('mongoose');
const config = require('../config');

// Import all models to ensure they're registered
require('../models');

async function runMigrations() {
    try {
        console.log('🔄 Starting database migrations...');
        
        // Connect to MongoDB
        await mongoose.connect(config.database.mongodb.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Check if database is accessible
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📊 Found ${collections.length} existing collections`);
        
        // Create indexes for better performance
        console.log('🔍 Creating database indexes...');
        
        // User collection indexes
        const User = mongoose.model('User');
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ companyId: 1 });
        await User.collection.createIndex({ role: 1 });
        
        // Company collection indexes
        const Company = mongoose.model('Company');
        await Company.collection.createIndex({ name: 1 }, { unique: true });
        await Company.collection.createIndex({ status: 1 });
        
        // TradeSpend collection indexes
        const TradeSpend = mongoose.model('TradeSpend');
        await TradeSpend.collection.createIndex({ companyId: 1 });
        await TradeSpend.collection.createIndex({ customerId: 1 });
        await TradeSpend.collection.createIndex({ date: -1 });
        
        // Budget collection indexes
        const Budget = mongoose.model('Budget');
        await Budget.collection.createIndex({ companyId: 1 });
        await Budget.collection.createIndex({ year: 1 });
        
        // Promotion collection indexes
        const Promotion = mongoose.model('Promotion');
        await Promotion.collection.createIndex({ companyId: 1 });
        await Promotion.collection.createIndex({ status: 1 });
        await Promotion.collection.createIndex({ startDate: 1, endDate: 1 });
        
        console.log('✅ Database indexes created successfully');
        
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