require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');

async function dropTradingTermsIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('tradingterms');
    
    try {
      await collection.dropIndex('company_1_code_1');
      console.log('✅ Dropped index: company_1_code_1');
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

dropTradingTermsIndex();
