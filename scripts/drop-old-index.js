require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');

async function dropIndex() {
  try {
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('products');
    
    // List all indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes on products collection:');
    indexes.forEach(idx => console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`));
    
    // Drop the problematic index
    try {
      await collection.dropIndex('company_1_sapMaterialId_1');
      console.log('\n✅ Dropped index: company_1_sapMaterialId_1');
    } catch (err) {
      console.log(`\n⚠️  Could not drop index: ${err.message}`);
    }
    
    // List indexes after drop
    const indexesAfter = await collection.indexes();
    console.log('\n📋 Indexes after drop:');
    indexesAfter.forEach(idx => console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`));
    
    await mongoose.connection.close();
    console.log('\n✅ Disconnected from MongoDB\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropIndex();
