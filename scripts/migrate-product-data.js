/**
 * Data Migration Script: Normalize Product Category and Brand Fields
 * 
 * Purpose: Fix 31 products with malformed category/brand data
 * Issue: Products have {secondary: []} structure instead of string values
 * 
 * Usage:
 *   node scripts/migrate-product-data.js --dry-run  # Preview changes
 *   node scripts/migrate-product-data.js            # Execute migration
 */

const mongoose = require('mongoose');
const Product = require('../backend/src/models/Product');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai';
const DRY_RUN = process.argv.includes('--dry-run');

// Connect to MongoDB
async function connect() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function findMalformedProducts() {
  console.log('\n🔍 Searching for products with malformed category/brand fields...\n');
  
  const products = await Product.find({
    $or: [
      { category: { $type: 'object' } },
      { brand: { $type: 'object' } }
    ]
  });
  
  return products;
}

function normalizeField(value, fieldName, defaultValue = 'Unknown') {
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'object' && value !== null) {
    if (value.primary) {
      return value.primary;
    }
    if (value.name) {
      return value.name;
    }
    return defaultValue;
  }
  
  return defaultValue;
}

async function migrateProducts(products) {
  console.log(`📊 Found ${products.length} products with malformed data\n`);
  
  if (products.length === 0) {
    console.log('✅ No products need migration!');
    return;
  }
  
  let migratedCount = 0;
  let errorCount = 0;
  
  for (const product of products) {
    try {
      const originalCategory = product.category;
      const originalBrand = product.brand;
      
      const newCategory = normalizeField(originalCategory, 'category', 'Uncategorized');
      const newBrand = normalizeField(originalBrand, 'brand', 'Unknown');
      
      console.log(`Product: ${product.name} (SKU: ${product.sku})`);
      console.log(`  Category: ${JSON.stringify(originalCategory)} → "${newCategory}"`);
      console.log(`  Brand: ${JSON.stringify(originalBrand)} → "${newBrand}"`);
      
      if (!DRY_RUN) {
        product.category = newCategory;
        product.brand = newBrand;
        await product.save();
        console.log(`  ✅ Migrated\n`);
      } else {
        console.log(`  🔍 DRY RUN - No changes made\n`);
      }
      
      migratedCount++;
    } catch (error) {
      console.error(`  ❌ Error migrating product ${product.sku}:`, error.message);
      errorCount++;
    }
  }
  
  return { migratedCount, errorCount };
}

async function main() {
  console.log('🚀 Product Data Migration Script');
  console.log('================================\n');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('⚠️  LIVE MODE - Changes will be saved to database\n');
  }
  
  await connect();
  
  const products = await findMalformedProducts();
  const results = await migrateProducts(products);
  
  if (results) {
    console.log('\n📊 Migration Summary');
    console.log('===================');
    console.log(`Total products found: ${products.length}`);
    console.log(`Successfully migrated: ${results.migratedCount}`);
    console.log(`Errors: ${results.errorCount}`);
    
    if (DRY_RUN) {
      console.log('\n💡 Run without --dry-run flag to apply changes');
    } else {
      console.log('\n✅ Migration complete!');
    }
  }
  
  await mongoose.connection.close();
  console.log('\n👋 Disconnected from MongoDB');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
