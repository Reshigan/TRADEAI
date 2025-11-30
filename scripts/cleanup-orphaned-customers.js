require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');

async function cleanupOrphanedCustomers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const customersCollection = db.collection('customers');
    
    // Find customers with company: null or companyId: null
    const orphanedCustomers = await customersCollection.find({
      $or: [
        { company: null },
        { companyId: null },
        { company: { $exists: false } },
        { companyId: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`\n📊 Found ${orphanedCustomers.length} orphaned customers`);
    
    if (orphanedCustomers.length > 0) {
      // Delete orphaned customers
      const result = await customersCollection.deleteMany({
        $or: [
          { company: null },
          { companyId: null },
          { company: { $exists: false } },
          { companyId: { $exists: false } }
        ]
      });
      
      console.log(`✅ Deleted ${result.deletedCount} orphaned customers`);
    }
    
    // Also drop the problematic index
    try {
      await customersCollection.dropIndex('company_1_sapCustomerId_1');
      console.log('✅ Dropped index: company_1_sapCustomerId_1');
    } catch (err) {
      console.log(`⚠️  Could not drop index: ${err.message}`);
    }
    
    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupOrphanedCustomers();
