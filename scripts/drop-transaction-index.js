require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');

async function dropTransactionIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('transactions');
    
    try {
      await collection.dropIndex('transactionNumber_1');
      console.log('✅ Dropped index: transactionNumber_1');
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

dropTransactionIndex();
