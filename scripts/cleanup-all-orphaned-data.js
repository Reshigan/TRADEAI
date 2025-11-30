require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');

async function cleanupAllOrphanedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    const collections = ['promotions', 'transactions', 'tradeterms'];
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      
      try {
        const indexes = await collection.indexes();
        console.log(`\n📋 Indexes on ${collectionName}:`);
        for (const idx of indexes) {
          console.log(`   - ${idx.name}`);
          
          if (idx.name.includes('promotionId') || idx.name.includes('transactionId') || idx.name.includes('termId')) {
            try {
              await collection.dropIndex(idx.name);
              console.log(`   ✅ Dropped index: ${idx.name}`);
            } catch (err) {
              console.log(`   ⚠️  Could not drop index ${idx.name}: ${err.message}`);
            }
          }
        }
      } catch (err) {
        console.log(`⚠️  Could not process collection ${collectionName}: ${err.message}`);
      }
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Disconnected from MongoDB\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupAllOrphanedData();
