#!/usr/bin/env node

/**
 * Comprehensive Seed Data Generator
 * 
 * Generates realistic business data for AI/ML testing:
 * - 1000+ customers
 * - 500+ products  
 * - 50k+ transactions
 * - Seasonal patterns
 * - Promotions & rebates
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Simple in-memory models for seeding
const customerTypes = ['Retail', 'Wholesale', 'Distributor', 'Independent'];
const territories = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State'];
const industries = ['Retail', 'Food Service', 'Convenience', 'Supermarket'];

const productCategories = [
  { name: 'Beverages', products: 100, avgMargin: 35, velocity: 'high' },
  { name: 'Snacks', products: 80, avgMargin: 40, velocity: 'high' },
  { name: 'Dairy', products: 60, avgMargin: 25, velocity: 'high' },
  { name: 'Frozen Foods', products: 70, avgMargin: 30, velocity: 'medium' },
  { name: 'Personal Care', products: 90, avgMargin: 50, velocity: 'medium' },
  { name: 'Household', products: 100, avgMargin: 45, velocity: 'low' }
];

console.log('╔══════════════════════════════════════════════════════╗');
console.log('║     Comprehensive Data Generation                    ║');
console.log('╚══════════════════════════════════════════════════════╝\n');

// Generate random data
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateCustomers(count) {
  const customers = [];
  const firstNames = ['Acme', 'Best', 'Super', 'Quick', 'Fresh', 'Prime', 'Elite', 'Global', 'Metro', 'City'];
  const lastNames = ['Stores', 'Mart', 'Market', 'Shop', 'Retail', 'Supplies', 'Wholesale', 'Traders', 'Distribution'];
  
  for (let i = 0; i < count; i++) {
    const type = randomItem(customerTypes);
    const territory = randomItem(territories);
    const name = `${randomItem(firstNames)} ${randomItem(lastNames)} ${i + 1}`;
    
    // Volume based on type
    let avgOrderSize, frequency, annualVolume;
    switch(type) {
      case 'Retail':
        avgOrderSize = randomInt(10000, 50000);
        frequency = 'weekly';
        annualVolume = avgOrderSize * 52;
        break;
      case 'Wholesale':
        avgOrderSize = randomInt(50000, 150000);
        frequency = 'bi-weekly';
        annualVolume = avgOrderSize * 26;
        break;
      case 'Distributor':
        avgOrderSize = randomInt(100000, 300000);
        frequency = 'weekly';
        annualVolume = avgOrderSize * 52;
        break;
      default:
        avgOrderSize = randomInt(2000, 10000);
        frequency = 'monthly';
        annualVolume = avgOrderSize * 12;
    }
    
    customers.push({
      name,
      type,
      territory,
      industry: randomItem(industries),
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: `+27${randomInt(10, 99)}${randomInt(1000000, 9999999)}`,
      address: `${randomInt(1, 999)} ${randomItem(['Main', 'High', 'Church', 'Market'])} Street`,
      city: territory,
      annualVolume,
      avgOrderSize,
      orderFrequency: frequency,
      creditLimit: Math.ceil(annualVolume / 12 * 1.5),
      paymentDays: randomItem([0, 7, 14, 30, 45, 60]),
      active: true,
      metadata: {
        segment: annualVolume > 2000000 ? 'Premium' : annualVolume > 500000 ? 'Standard' : 'Basic',
        riskScore: randomInt(50, 95),
        growthPotential: randomInt(60, 95)
      }
    });
  }
  
  return customers;
}

function generateProducts(categories) {
  const products = [];
  let productId = 1;
  
  for (const category of categories) {
    for (let i = 0; i < category.products; i++) {
      const basePrice = randomFloat(5, 100);
      const cogs = basePrice * (1 - category.avgMargin / 100);
      
      products.push({
        sku: `PROD-${String(productId).padStart(6, '0')}`,
        name: `${category.name} Product ${i + 1}`,
        category: category.name,
        brand: randomItem(['Premium Brand', 'Value Brand', 'House Brand']),
        basePrice: parseFloat(basePrice.toFixed(2)),
        cogs: parseFloat(cogs.toFixed(2)),
        margin: category.avgMargin,
        velocity: category.velocity,
        active: true,
        inventory: {
          minLevel: randomInt(50, 200),
          maxLevel: randomInt(500, 2000),
          reorderPoint: randomInt(100, 300)
        }
      });
      productId++;
    }
  }
  
  return products;
}

function generateTransactions(customers, products, count) {
  const transactions = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date();
  const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i < count; i++) {
    const customer = randomItem(customers);
    const product = randomItem(products);
    const transactionDate = new Date(startDate.getTime() + randomInt(0, daysDiff) * 24 * 60 * 60 * 1000);
    
    // Seasonal factor (higher in summer)
    const month = transactionDate.getMonth();
    const seasonalFactor = month >= 10 || month <= 2 ? 1.3 : month >= 5 && month <= 8 ? 0.8 : 1.0;
    
    const quantity = Math.ceil(randomInt(10, 100) * seasonalFactor);
    const grossAmount = product.basePrice * quantity;
    
    // Random promotions (30% chance)
    const hasPromotion = Math.random() < 0.3;
    const promotionDiscount = hasPromotion ? grossAmount * randomFloat(0.05, 0.15) : 0;
    
    const netAmount = grossAmount - promotionDiscount;
    const cogTotal = product.cogs * quantity;
    const grossMargin = netAmount - cogTotal;
    const grossMarginPercent = (grossMargin / netAmount * 100).toFixed(2);
    
    transactions.push({
      customer: {
        name: customer.name,
        type: customer.type,
        territory: customer.territory
      },
      product: {
        sku: product.sku,
        name: product.name,
        category: product.category
      },
      date: transactionDate,
      quantity,
      basePrice: product.basePrice,
      grossAmount: parseFloat(grossAmount.toFixed(2)),
      promotionDiscount: parseFloat(promotionDiscount.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2)),
      cogs: parseFloat(cogTotal.toFixed(2)),
      grossMargin: parseFloat(grossMargin.toFixed(2)),
      grossMarginPercent: parseFloat(grossMarginPercent),
      hasPromotion,
      promotionType: hasPromotion ? randomItem(['Off-Invoice', 'Scan', 'Display']) : null
    });
  }
  
  return transactions.sort((a, b) => a.date - b.date);
}

// Generate data
console.log('🔄 Generating data...\n');

const customers = generateCustomers(1000);
console.log(`✅ Generated ${customers.length} customers`);

const products = generateProducts(productCategories);
console.log(`✅ Generated ${products.length} products`);

const transactions = generateTransactions(customers, products, 50000);
console.log(`✅ Generated ${transactions.length} transactions\n`);

// Calculate statistics
const totalRevenue = transactions.reduce((sum, t) => sum + t.netAmount, 0);
const totalCOGS = transactions.reduce((sum, t) => sum + t.cogs, 0);
const totalMargin = totalRevenue - totalCOGS;
const avgMarginPercent = (totalMargin / totalRevenue * 100).toFixed(2);

console.log('📊 Data Statistics:');
console.log(`   Total Revenue: R${totalRevenue.toLocaleString('en-ZA', {maximumFractionDigits: 0})}`);
console.log(`   Total COGS: R${totalCOGS.toLocaleString('en-ZA', {maximumFractionDigits: 0})}`);
console.log(`   Total Margin: R${totalMargin.toLocaleString('en-ZA', {maximumFractionDigits: 0})} (${avgMarginPercent}%)`);
console.log(`   Avg Transaction: R${(totalRevenue / transactions.length).toLocaleString('en-ZA', {maximumFractionDigits: 0})}`);
console.log(`   Promotions: ${transactions.filter(t => t.hasPromotion).length} (${(transactions.filter(t => t.hasPromotion).length / transactions.length * 100).toFixed(1)}%)\n`);

// Save to files
const fs = require('fs');
const outputDir = './backend/seed-data';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(`${outputDir}/customers.json`, JSON.stringify(customers, null, 2));
fs.writeFileSync(`${outputDir}/products.json`, JSON.stringify(products, null, 2));
fs.writeFileSync(`${outputDir}/transactions.json`, JSON.stringify(transactions, null, 2));

console.log('💾 Data saved to:');
console.log(`   ${outputDir}/customers.json (${(fs.statSync(`${outputDir}/customers.json`).size / 1024).toFixed(1)} KB)`);
console.log(`   ${outputDir}/products.json (${(fs.statSync(`${outputDir}/products.json`).size / 1024).toFixed(1)} KB)`);
console.log(`   ${outputDir}/transactions.json (${(fs.statSync(`${outputDir}/transactions.json`).size / 1024 / 1024).toFixed(1)} MB)\n`);

console.log('✅ Data generation complete!');
console.log('📝 Use this data for:');
console.log('   - AI/ML model training');
console.log('   - Performance testing');
console.log('   - Demo scenarios');
console.log('   - Analytics validation\n');

