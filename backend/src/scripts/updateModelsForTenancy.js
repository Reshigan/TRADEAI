#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../models');

// Models to update (excluding Tenant.js, BaseTenantModel.js, and already updated ones)
const modelsToUpdate = [
  'Product.js',
  'Promotion.js',
  'TradeSpend.js',
  'Campaign.js',
  'Budget.js',
  'Report.js',
  'SalesHistory.js',
  'ActivityGrid.js',
  'AIChat.js',
  'CombinationAnalysis.js',
  'MarketingBudgetAllocation.js',
  'MasterData.js',
  'PromotionAnalysis.js',
  'TradingTerm.js',
  'Vendor.js'
];

// Models that should not be updated (system models)
const excludeModels = [
  'Tenant.js',
  'BaseTenantModel.js',
  'TestUser.js',
  'UserMinimal.js',
  'index.js'
];

function updateModelFile(filePath) {
  console.log(`Updating ${path.basename(filePath)}...`);

  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already updated
  if (content.includes('addTenantSupport') || content.includes('BaseTenantModel')) {
    console.log('  - Already updated, skipping');
    return;
  }

  // Add import for BaseTenantModel
  if (!content.includes("require('./BaseTenantModel')")) {
    content = content.replace(
      /const mongoose = require\('mongoose'\);/,
      'const mongoose = require(\'mongoose\');\nconst { addTenantSupport } = require(\'./BaseTenantModel\');'
    );
  }

  // Find the model export line and add tenant support before it
  const modelExportRegex = /const (\w+) = mongoose\.model\('(\w+)', (\w+Schema)\);/;
  const match = content.match(modelExportRegex);

  if (match) {
    const [fullMatch, modelName, modelString, schemaName] = match;

    // Add tenant support before model creation
    const replacement = `// Add tenant support to the schema
addTenantSupport(${schemaName});

${fullMatch}`;

    content = content.replace(fullMatch, replacement);

    // Update company references to be optional (legacy support)
    content = content.replace(
      /company: \{[\s\S]*?required: true,[\s\S]*?\}/g,
      (match) => match.replace('required: true', 'required: false // Legacy support, tenantId is now primary')
    );

    // Add comment about tenant association
    content = content.replace(
      /company: \{[\s\S]*?ref: 'Company',[\s\S]*?\}/g,
      (match) => `// Tenant Association - CRITICAL for multi-tenant isolation
  // Note: tenantId will be added by addTenantSupport()
  
  // Legacy company support (will be migrated to tenant)
  ${match}`
    );

    fs.writeFileSync(filePath, content);
    console.log('  - Updated successfully');
  } else {
    console.log('  - Could not find model export pattern, skipping');
  }
}

function main() {
  console.log('Updating models for multi-tenancy...\n');

  // Get all JavaScript files in models directory
  const files = fs.readdirSync(modelsDir)
    .filter((file) => file.endsWith('.js'))
    .filter((file) => !excludeModels.includes(file));

  console.log(`Found ${files.length} models to update:\n`);

  files.forEach((file) => {
    const filePath = path.join(modelsDir, file);
    try {
      updateModelFile(filePath);
    } catch (error) {
      console.error(`  - Error updating ${file}:`, error.message);
    }
  });

  console.log('\nModel update completed!');
  console.log('\nNext steps:');
  console.log('1. Review the updated models');
  console.log('2. Update controllers to use tenant-aware queries');
  console.log('3. Run data migration scripts');
  console.log('4. Test tenant isolation');
}

if (require.main === module) {
  main();
}

module.exports = { updateModelFile };
