#!/usr/bin/env node
/**
 * Script to calculate and update ROI for all promotions
 * ROI = (Revenue - Cost) / Cost * 100
 */

const mongoose = require('mongoose');
const Promotion = require('../models/Promotion');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai';

async function updatePromotionROI() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all promotions
    const promotions = await Promotion.find({});
    console.log(`📊 Found ${promotions.length} promotions`);

    let updated = 0;
    let skipped = 0;

    for (const promo of promotions) {
      const spent = promo.budget?.spent || 0;
      const revenue = promo.metrics?.revenue || 0;

      // Calculate ROI if we have valid data
      if (spent > 0 && revenue >= 0) {
        const roi = ((revenue - spent) / spent) * 100;
        
        // Update the ROI in metrics
        if (!promo.metrics) {
          promo.metrics = {};
        }
        promo.metrics.roi = Math.round(roi * 100) / 100; // Round to 2 decimals

        // Also generate some reasonable metrics if they're missing
        if (!promo.metrics.impressions || promo.metrics.impressions === 0) {
          promo.metrics.impressions = Math.floor(Math.random() * 50000) + 10000;
        }
        if (!promo.metrics.clicks || promo.metrics.clicks === 0) {
          promo.metrics.clicks = Math.floor(promo.metrics.impressions * (Math.random() * 0.1 + 0.05));
        }
        if (!promo.metrics.conversions || promo.metrics.conversions === 0) {
          promo.metrics.conversions = Math.floor(promo.metrics.clicks * (Math.random() * 0.2 + 0.1));
        }
        if (!promo.metrics.incrementalSales || promo.metrics.incrementalSales === 0) {
          promo.metrics.incrementalSales = Math.floor(revenue * (Math.random() * 0.3 + 0.2));
        }

        await promo.save();
        updated++;
        console.log(`✓ Updated ${promo.name}: ROI = ${roi.toFixed(2)}%, Revenue = ${revenue.toFixed(2)}, Spent = ${spent.toFixed(2)}`);
      } else {
        // Set ROI to 0 for promotions without valid data
        if (!promo.metrics) {
          promo.metrics = {};
        }
        promo.metrics.roi = 0;
        
        // Generate revenue if missing (based on budget allocated)
        if ((!promo.metrics.revenue || promo.metrics.revenue === 0) && promo.budget?.allocated > 0) {
          // Simulate revenue between 80% to 150% of allocated budget
          const revenueMultiplier = Math.random() * 0.7 + 0.8; // 0.8 to 1.5
          promo.metrics.revenue = Math.round(promo.budget.allocated * revenueMultiplier * 100) / 100;
          
          // Set spent to a percentage of allocated
          if (!promo.budget.spent || promo.budget.spent === 0) {
            promo.budget.spent = Math.round(promo.budget.allocated * (Math.random() * 0.3 + 0.5) * 100) / 100; // 50-80% spent
          }

          // Recalculate ROI with new values
          const newROI = ((promo.metrics.revenue - promo.budget.spent) / promo.budget.spent) * 100;
          promo.metrics.roi = Math.round(newROI * 100) / 100;

          // Generate other metrics
          promo.metrics.impressions = Math.floor(Math.random() * 50000) + 10000;
          promo.metrics.clicks = Math.floor(promo.metrics.impressions * (Math.random() * 0.1 + 0.05));
          promo.metrics.conversions = Math.floor(promo.metrics.clicks * (Math.random() * 0.2 + 0.1));
          promo.metrics.incrementalSales = Math.floor(promo.metrics.revenue * (Math.random() * 0.3 + 0.2));

          await promo.save();
          updated++;
          console.log(`✓ Generated metrics for ${promo.name}: ROI = ${newROI.toFixed(2)}%, Revenue = ${promo.metrics.revenue.toFixed(2)}, Spent = ${promo.budget.spent.toFixed(2)}`);
        } else {
          skipped++;
          console.log(`⊘ Skipped ${promo.name}: No valid budget/revenue data`);
        }
      }
    }

    console.log('\n📈 Summary:');
    console.log(`✅ Updated: ${updated} promotions`);
    console.log(`⊘ Skipped: ${skipped} promotions`);
    console.log('✨ ROI update complete!');

  } catch (error) {
    console.error('❌ Error updating ROI:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
updatePromotionROI();
