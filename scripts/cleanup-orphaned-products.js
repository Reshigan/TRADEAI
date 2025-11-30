require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');

async function cleanupOrphanedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    // Find products with company: null or companyId: null
    const orphanedProducts = await productsCollection.find({
      $or: [
        { company: null },
        { companyId: null },
        { company: { $exists: false } },
        { companyId: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`\n📊 Found ${orphanedProducts.length} orphaned products`);
    
    if (orphanedProducts.length > 0) {
      // Delete orphaned products
      const result = await productsCollection.deleteMany({
        $or: [
          { company: null },
          { companyId: null },
          { company: { $exists: false } },
          { companyId: { $exists: false } }
        ]
      });
      
      console.log(`✅ Deleted ${result.deletedCount} orphaned products`);
    }
    
    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupOrphanedProducts();
