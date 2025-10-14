const mongoose = require('mongoose');
const TradingTerm = require('../src/models/TradingTerm');
const Customer = require('../src/models/Customer');
const Product = require('../src/models/Product');
const Company = require('../src/models/Company');
const User = require('../src/models/User');

const seedTradingTermsWithValues = async () => {
  try {
    console.log('🔄 Starting Trading Terms seeding with comprehensive values...');

    // Get required references
    const company = await Company.findOne({});
    const user = await User.findOne({});
    const customers = await Customer.find({}).limit(10);
    const products = await Product.find({}).limit(10);

    if (!company || !user) {
      throw new Error('Company and User must exist before seeding trading terms');
    }

    console.log(`Found ${customers.length} customers and ${products.length} products`);

    // Clear existing trading terms
    await TradingTerm.deleteMany({});
    console.log('✅ Cleared existing trading terms');

    const tradingTermsData = [
      {
        name: "Volume Discount - Walmart Premium Tier",
        code: "VD-WAL-001",
        description: "Volume-based discount structure for Walmart premium chocolate products with quarterly rebates",
        termType: "volume_discount",
        applicability: {
          customers: customers.slice(0, 3).map(customer => ({
            customer: customer._id,
            customerTier: "platinum",
            customerType: "chain"
          })),
          products: products.slice(0, 5).map(product => ({
            product: product._id,
            productCategory: "Premium Chocolate",
            brand: "Choco Delight"
          })),
          channels: ["modern_trade", "ecommerce"],
          regions: ["Gauteng", "Western Cape", "KwaZulu-Natal"],
          minimumOrderValue: 50000,
          minimumVolume: 1000
        },
        termStructure: {
          volumeTiers: [
            {
              minVolume: 1000,
              maxVolume: 5000,
              discountType: "percentage",
              discountValue: 3.5,
              rebatePercentage: 1.0
            },
            {
              minVolume: 5001,
              maxVolume: 15000,
              discountType: "percentage",
              discountValue: 5.0,
              rebatePercentage: 1.5
            },
            {
              minVolume: 15001,
              maxVolume: null,
              discountType: "percentage",
              discountValue: 7.5,
              rebatePercentage: 2.0
            }
          ],
          paymentTerms: {
            standardDays: 30,
            earlyPaymentDays: 15,
            earlyPaymentDiscount: 2.0,
            latePaymentPenalty: 1.5
          }
        },
        financialImpact: {
          estimatedAnnualValue: 2500000,
          costToCompany: 175000,
          expectedROI: 14.3,
          breakEvenVolume: 8500,
          marginImpact: -2.1
        },
        validityPeriod: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          autoRenewal: true,
          renewalPeriod: "annually"
        },
        approvalWorkflow: {
          status: "approved",
          submittedBy: user._id,
          submittedAt: new Date('2024-12-15'),
          approvedBy: user._id,
          approvedAt: new Date('2024-12-20'),
          approvalNotes: "Approved for premium tier customers with strong performance history"
        },
        performance: {
          actualVolume: 12500,
          actualRevenue: 2100000,
          actualCost: 147000,
          actualROI: 13.3,
          utilizationRate: 78.5,
          customerAdoption: 85.0,
          lastCalculatedAt: new Date()
        },
        conditions: {
          minimumCommitment: {
            volume: 10000,
            value: 800000,
            period: "annually"
          },
          exclusivityRequired: false,
          competitorRestrictions: ["Cadbury Premium", "Lindt"],
          geographicRestrictions: []
        },
        priority: "high",
        tags: ["volume", "premium", "walmart", "chocolate"]
      },

      {
        name: "Early Payment Discount - Pick n Pay",
        code: "EPD-PNP-002",
        description: "Early payment incentive for Pick n Pay with cash flow optimization benefits",
        termType: "early_payment",
        applicability: {
          customers: customers.slice(1, 4).map(customer => ({
            customer: customer._id,
            customerTier: "gold",
            customerType: "chain"
          })),
          products: products.map(product => ({
            product: product._id,
            productCategory: "All Categories"
          })),
          channels: ["modern_trade"],
          regions: ["All Regions"],
          minimumOrderValue: 25000,
          minimumVolume: 500
        },
        termStructure: {
          paymentTerms: {
            standardDays: 45,
            earlyPaymentDays: 10,
            earlyPaymentDiscount: 3.0,
            latePaymentPenalty: 2.0
          },
          promotionalTerms: {
            supportPercentage: 2.5,
            maxSupportAmount: 100000,
            coopAdvertisingRate: 50.0
          }
        },
        financialImpact: {
          estimatedAnnualValue: 1800000,
          costToCompany: 54000,
          expectedROI: 33.3,
          breakEvenVolume: 2000,
          marginImpact: -0.8
        },
        validityPeriod: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          autoRenewal: true,
          renewalPeriod: "annually"
        },
        approvalWorkflow: {
          status: "approved",
          submittedBy: user._id,
          submittedAt: new Date('2024-11-01'),
          approvedBy: user._id,
          approvedAt: new Date('2024-11-05'),
          approvalNotes: "Approved to improve cash flow and strengthen relationship"
        },
        performance: {
          actualVolume: 8500,
          actualRevenue: 1650000,
          actualCost: 49500,
          actualROI: 33.3,
          utilizationRate: 92.0,
          customerAdoption: 95.0,
          lastCalculatedAt: new Date()
        },
        conditions: {
          minimumCommitment: {
            volume: 6000,
            value: 500000,
            period: "annually"
          },
          exclusivityRequired: false
        },
        priority: "high",
        tags: ["payment", "cash-flow", "pick-n-pay"]
      },

      {
        name: "Promotional Support - Shoprite Campaign",
        code: "PS-SRT-003",
        description: "Co-marketing and promotional support agreement for Shoprite seasonal campaigns",
        termType: "promotional_support",
        applicability: {
          customers: customers.slice(2, 5).map(customer => ({
            customer: customer._id,
            customerTier: "gold",
            customerType: "chain"
          })),
          products: products.slice(2, 8).map(product => ({
            product: product._id,
            productCategory: "Seasonal Products"
          })),
          channels: ["modern_trade"],
          regions: ["Gauteng", "Western Cape"],
          minimumOrderValue: 75000,
          minimumVolume: 2000
        },
        termStructure: {
          promotionalTerms: {
            supportPercentage: 4.0,
            maxSupportAmount: 200000,
            coopAdvertisingRate: 60.0,
            listingFeeAmount: 15000,
            slottingFeeAmount: 25000
          },
          volumeTiers: [
            {
              minVolume: 2000,
              maxVolume: 10000,
              discountType: "percentage",
              discountValue: 2.0,
              rebatePercentage: 0.5
            },
            {
              minVolume: 10001,
              maxVolume: null,
              discountType: "percentage",
              discountValue: 3.5,
              rebatePercentage: 1.0
            }
          ]
        },
        financialImpact: {
          estimatedAnnualValue: 3200000,
          costToCompany: 168000,
          expectedROI: 19.0,
          breakEvenVolume: 5500,
          marginImpact: -1.8
        },
        validityPeriod: {
          startDate: new Date('2025-03-01'),
          endDate: new Date('2025-08-31'),
          autoRenewal: false
        },
        approvalWorkflow: {
          status: "approved",
          submittedBy: user._id,
          submittedAt: new Date('2025-01-15'),
          approvedBy: user._id,
          approvedAt: new Date('2025-01-20'),
          approvalNotes: "Approved for seasonal campaign with strong ROI projections"
        },
        performance: {
          actualVolume: 15500,
          actualRevenue: 2850000,
          actualCost: 142500,
          actualROI: 20.0,
          utilizationRate: 68.5,
          customerAdoption: 75.0,
          lastCalculatedAt: new Date()
        },
        conditions: {
          minimumCommitment: {
            volume: 12000,
            value: 1200000,
            period: "campaign"
          },
          seasonalRestrictions: [
            {
              startMonth: 3,
              endMonth: 8,
              restriction: "Active campaign period only"
            }
          ]
        },
        priority: "medium",
        tags: ["promotional", "seasonal", "shoprite", "campaign"]
      },

      {
        name: "Growth Incentive - Spar Expansion",
        code: "GI-SPR-004",
        description: "Growth-based incentive program for Spar store expansion and volume increases",
        termType: "growth_incentive",
        applicability: {
          customers: customers.slice(3, 6).map(customer => ({
            customer: customer._id,
            customerTier: "silver",
            customerType: "chain"
          })),
          products: products.slice(1, 7).map(product => ({
            product: product._id,
            productCategory: "Core Range"
          })),
          channels: ["modern_trade", "traditional_trade"],
          regions: ["Eastern Cape", "Free State", "Limpopo"],
          minimumOrderValue: 30000,
          minimumVolume: 800
        },
        termStructure: {
          growthIncentives: {
            baselineVolume: 5000,
            growthThreshold: 15.0,
            incentiveRate: 2.5,
            maxIncentiveAmount: 150000,
            measurementPeriod: "quarterly"
          },
          volumeTiers: [
            {
              minVolume: 800,
              maxVolume: 3000,
              discountType: "percentage",
              discountValue: 1.5,
              rebatePercentage: 0.25
            },
            {
              minVolume: 3001,
              maxVolume: 8000,
              discountType: "percentage",
              discountValue: 2.5,
              rebatePercentage: 0.5
            },
            {
              minVolume: 8001,
              maxVolume: null,
              discountType: "percentage",
              discountValue: 4.0,
              rebatePercentage: 0.75
            }
          ]
        },
        financialImpact: {
          estimatedAnnualValue: 1950000,
          costToCompany: 97500,
          expectedROI: 20.0,
          breakEvenVolume: 4200,
          marginImpact: -1.2
        },
        validityPeriod: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2026-12-31'),
          autoRenewal: true,
          renewalPeriod: "annually"
        },
        approvalWorkflow: {
          status: "approved",
          submittedBy: user._id,
          submittedAt: new Date('2024-10-01'),
          approvedBy: user._id,
          approvedAt: new Date('2024-10-10'),
          approvalNotes: "Approved to support expansion strategy and market penetration"
        },
        performance: {
          actualVolume: 9200,
          actualRevenue: 1750000,
          actualCost: 87500,
          actualROI: 20.0,
          utilizationRate: 84.0,
          customerAdoption: 88.0,
          lastCalculatedAt: new Date()
        },
        conditions: {
          minimumCommitment: {
            volume: 6000,
            value: 600000,
            period: "annually"
          },
          exclusivityRequired: true,
          competitorRestrictions: ["Nestle", "Mondelez"]
        },
        priority: "high",
        tags: ["growth", "expansion", "spar", "incentive"]
      },

      {
        name: "Loyalty Bonus - Checkers Premium",
        code: "LB-CHK-005",
        description: "Loyalty-based bonus structure for long-term Checkers partnership with premium products",
        termType: "loyalty_bonus",
        applicability: {
          customers: customers.slice(4, 7).map(customer => ({
            customer: customer._id,
            customerTier: "platinum",
            customerType: "chain"
          })),
          products: products.slice(3, 9).map(product => ({
            product: product._id,
            productCategory: "Premium Range",
            brand: "Choco Delight Premium"
          })),
          channels: ["modern_trade"],
          regions: ["Gauteng", "Western Cape", "KwaZulu-Natal"],
          minimumOrderValue: 100000,
          minimumVolume: 3000
        },
        termStructure: {
          volumeTiers: [
            {
              minVolume: 3000,
              maxVolume: 8000,
              discountType: "percentage",
              discountValue: 2.0,
              rebatePercentage: 1.0
            },
            {
              minVolume: 8001,
              maxVolume: 20000,
              discountType: "percentage",
              discountValue: 3.5,
              rebatePercentage: 1.5
            },
            {
              minVolume: 20001,
              maxVolume: null,
              discountType: "percentage",
              discountValue: 5.0,
              rebatePercentage: 2.5
            }
          ],
          paymentTerms: {
            standardDays: 30,
            earlyPaymentDays: 14,
            earlyPaymentDiscount: 1.5,
            latePaymentPenalty: 1.0
          },
          promotionalTerms: {
            supportPercentage: 3.0,
            maxSupportAmount: 180000,
            coopAdvertisingRate: 55.0
          }
        },
        financialImpact: {
          estimatedAnnualValue: 4200000,
          costToCompany: 210000,
          expectedROI: 20.0,
          breakEvenVolume: 12000,
          marginImpact: -2.5
        },
        validityPeriod: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2027-12-31'),
          autoRenewal: true,
          renewalPeriod: "annually"
        },
        approvalWorkflow: {
          status: "approved",
          submittedBy: user._id,
          submittedAt: new Date('2024-09-01'),
          approvedBy: user._id,
          approvedAt: new Date('2024-09-15'),
          approvalNotes: "Approved for strategic long-term partnership with premium positioning"
        },
        performance: {
          actualVolume: 18500,
          actualRevenue: 3950000,
          actualCost: 197500,
          actualROI: 20.0,
          utilizationRate: 89.5,
          customerAdoption: 92.0,
          lastCalculatedAt: new Date()
        },
        conditions: {
          minimumCommitment: {
            volume: 15000,
            value: 1500000,
            period: "annually"
          },
          exclusivityRequired: true,
          competitorRestrictions: ["Cadbury", "Nestle", "Ferrero"]
        },
        priority: "critical",
        tags: ["loyalty", "premium", "checkers", "long-term"]
      },

      {
        name: "Marketing Contribution - Woolworths Co-op",
        code: "MC-WOL-006",
        description: "Marketing fund contribution agreement for Woolworths premium positioning and advertising",
        termType: "marketing_contribution",
        applicability: {
          customers: customers.slice(5, 8).map(customer => ({
            customer: customer._id,
            customerTier: "platinum",
            customerType: "chain"
          })),
          products: products.slice(4, 10).map(product => ({
            product: product._id,
            productCategory: "Artisan Range"
          })),
          channels: ["modern_trade", "ecommerce"],
          regions: ["Western Cape", "Gauteng"],
          minimumOrderValue: 80000,
          minimumVolume: 2500
        },
        termStructure: {
          promotionalTerms: {
            supportPercentage: 5.0,
            maxSupportAmount: 300000,
            coopAdvertisingRate: 70.0,
            listingFeeAmount: 25000,
            slottingFeeAmount: 35000
          },
          volumeTiers: [
            {
              minVolume: 2500,
              maxVolume: 7500,
              discountType: "percentage",
              discountValue: 1.5,
              rebatePercentage: 0.5
            },
            {
              minVolume: 7501,
              maxVolume: null,
              discountType: "percentage",
              discountValue: 2.5,
              rebatePercentage: 1.0
            }
          ]
        },
        financialImpact: {
          estimatedAnnualValue: 2800000,
          costToCompany: 200000,
          expectedROI: 14.0,
          breakEvenVolume: 8500,
          marginImpact: -3.2
        },
        validityPeriod: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          autoRenewal: false
        },
        approvalWorkflow: {
          status: "approved",
          submittedBy: user._id,
          submittedAt: new Date('2024-11-15'),
          approvedBy: user._id,
          approvedAt: new Date('2024-11-25'),
          approvalNotes: "Approved for premium brand positioning and market expansion"
        },
        performance: {
          actualVolume: 11200,
          actualRevenue: 2650000,
          actualCost: 189000,
          actualROI: 14.0,
          utilizationRate: 72.5,
          customerAdoption: 80.0,
          lastCalculatedAt: new Date()
        },
        conditions: {
          minimumCommitment: {
            volume: 10000,
            value: 1200000,
            period: "annually"
          },
          exclusivityRequired: false
        },
        priority: "high",
        tags: ["marketing", "co-op", "woolworths", "premium"]
      }
    ];

    // Create trading terms with all the comprehensive data
    const createdTerms = [];
    for (const termData of tradingTermsData) {
      const tradingTerm = new TradingTerm({
        ...termData,
        company: company._id,
        createdBy: user._id,
        updatedBy: user._id
      });

      const savedTerm = await tradingTerm.save();
      createdTerms.push(savedTerm);
      console.log(`✅ Created trading term: ${savedTerm.name}`);
    }

    console.log(`🎉 Successfully created ${createdTerms.length} comprehensive trading terms with values!`);
    
    // Display summary
    const totalEstimatedValue = createdTerms.reduce((sum, term) => sum + (term.financialImpact.estimatedAnnualValue || 0), 0);
    const totalCost = createdTerms.reduce((sum, term) => sum + (term.financialImpact.costToCompany || 0), 0);
    const avgROI = createdTerms.reduce((sum, term) => sum + (term.financialImpact.expectedROI || 0), 0) / createdTerms.length;
    
    console.log('\n📊 TRADING TERMS SUMMARY:');
    console.log(`Total Estimated Annual Value: R${totalEstimatedValue.toLocaleString()}`);
    console.log(`Total Cost to Company: R${totalCost.toLocaleString()}`);
    console.log(`Average Expected ROI: ${avgROI.toFixed(1)}%`);
    console.log(`Active Terms: ${createdTerms.filter(t => t.approvalWorkflow.status === 'approved').length}`);
    
    return createdTerms;

  } catch (error) {
    console.error('❌ Error seeding trading terms:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('📡 Connected to MongoDB');
    await seedTradingTermsWithValues();
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  });
}

module.exports = seedTradingTermsWithValues;