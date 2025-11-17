const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import all models
const Company = require('../models/Company');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const SalesHistory = require('../models/SalesHistory');
const Campaign = require('../models/Campaign');
const Promotion = require('../models/Promotion');
const Budget = require('../models/Budget');
const TradeSpend = require('../models/TradeSpend');
const TradingTerm = require('../models/TradingTerm');
const Report = require('../models/Report');
const AIChat = require('../models/AIChat');
const PromotionAnalysis = require('../models/PromotionAnalysis');
const MarketingBudgetAllocation = require('../models/MarketingBudgetAllocation');
const CombinationAnalysis = require('../models/CombinationAnalysis');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trade-ai');
    console.log('MongoDB connected for enhanced analytics seeding...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Utility functions
const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const generateRandomValue = (min, max, decimals = 0) => {
  const value = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.floor(value);
};

// Enhanced seeding function
const seedEnhancedAnalyticsData = async () => {
  try {
    console.log('Starting enhanced analytics data seeding...');

    // Get GONXT company
    const gonxtCompany = await Company.findOne({ code: 'GONXT' });
    if (!gonxtCompany) {
      console.error('GONXT company not found. Please run the main seed first.');
      return;
    }

    // Get existing data for reference
    const users = await User.find({ company: gonxtCompany._id });
    let customers = await Customer.find({ company: gonxtCompany._id });
    let products = await Product.find({ company: gonxtCompany._id });
    let campaigns = await Campaign.find({ company: gonxtCompany._id });
    const promotions = await Promotion.find({ company: gonxtCompany._id });
    const budgets = await Budget.find({ company: gonxtCompany._id });

    console.log(`Found ${users.length} users, ${customers.length} customers, ${products.length} products`);

    // Create basic data if it doesn't exist
    if (customers.length === 0) {
      console.log('Creating basic customers...');
      const customerData = [
        { name: 'Woolworths', code: 'WOW', customerType: 'retailer', channel: 'modern_trade', tier: 'platinum', sapCustomerId: 'SAP001' },
        { name: 'Coles', code: 'COL', customerType: 'retailer', channel: 'modern_trade', tier: 'platinum', sapCustomerId: 'SAP002' },
        { name: 'IGA', code: 'IGA', customerType: 'retailer', channel: 'traditional_trade', tier: 'gold', sapCustomerId: 'SAP003' },
        { name: 'Metcash', code: 'MET', customerType: 'wholesaler', channel: 'b2b', tier: 'gold', sapCustomerId: 'SAP004' },
        { name: 'ALDI', code: 'ALD', customerType: 'retailer', channel: 'modern_trade', tier: 'platinum', sapCustomerId: 'SAP005' }
      ];

      customers = await Customer.insertMany(customerData.map((c) => ({
        ...c,
        company: gonxtCompany._id,
        status: 'active',
        contacts: [{
          name: 'Contact Person',
          email: `contact@${c.code.toLowerCase()}.com`,
          phone: '+61-2-9999-0000',
          isPrimary: true
        }],
        addresses: [{
          type: 'billing',
          city: 'Sydney',
          state: 'NSW',
          country: 'Australia',
          postalCode: '2000'
        }]
      })));
    }

    if (products.length === 0) {
      console.log('Creating basic products...');
      const productData = [
        { name: 'Premium Snacks Mix', sku: 'PSM001', productType: 'own_brand', sapMaterialId: 'MAT001' },
        { name: 'Organic Crackers', sku: 'OC002', productType: 'own_brand', sapMaterialId: 'MAT002' },
        { name: 'Energy Bars', sku: 'EB003', productType: 'own_brand', sapMaterialId: 'MAT003' },
        { name: 'Trail Mix Deluxe', sku: 'TMD004', productType: 'own_brand', sapMaterialId: 'MAT004' },
        { name: 'Protein Chips', sku: 'PC005', productType: 'own_brand', sapMaterialId: 'MAT005' }
      ];

      products = await Product.insertMany(productData.map((p) => ({
        ...p,
        company: gonxtCompany._id,
        status: 'active',
        pricing: {
          listPrice: generateRandomValue(5, 25, 2),
          currency: 'AUD',
          costPrice: generateRandomValue(2, 15, 2)
        },
        category: { primary: 'snacks' },
        brand: { name: 'GONXT Premium', owner: 'company' },
        attributes: {
          weight: generateRandomValue(100, 500),
          unit: 'g',
          packSize: generateRandomValue(12, 48)
        }
      })));
    }

    if (campaigns.length === 0) {
      console.log('Creating basic campaigns...');
      const campaignData = [
        { name: 'Summer Promotion 2023', campaignType: 'seasonal', campaignId: 'CAMP001' },
        { name: 'Back to School 2024', campaignType: 'seasonal', campaignId: 'CAMP002' },
        { name: 'Holiday Special 2023', campaignType: 'seasonal', campaignId: 'CAMP003' }
      ];

      campaigns = await Campaign.insertMany(campaignData.map((c, index) => ({
        ...c,
        company: gonxtCompany._id,
        createdBy: users[0]._id,
        period: {
          startDate: getRandomDate(new Date('2023-01-01'), new Date('2024-06-01')),
          endDate: getRandomDate(new Date('2024-06-01'), new Date('2024-12-31'))
        },
        budget: {
          total: generateRandomValue(50000, 200000, 2),
          allocated: 0,
          spent: 0
        },
        status: index < 2 ? 'completed' : 'active'
      })));
    }

    // 1. Create Trading Terms
    console.log('Creating trading terms...');
    const existingTradingTerms = await TradingTerm.find({ company: gonxtCompany._id });
    if (existingTradingTerms.length > 0) {
      console.log(`Trading terms already exist (${existingTradingTerms.length}), skipping creation...`);
    } else {
      const tradingTermsData = [
        {
          name: 'Volume Discount Tier 1',
          code: 'VDT1',
          description: 'Volume discount for orders above 1000 units',
          termType: 'volume_discount',
          termStructure: {
            volumeTiers: [
              { minVolume: 1000, maxVolume: 5000, discountType: 'percentage', discountValue: 5, rebatePercentage: 2 },
              { minVolume: 5001, maxVolume: 10000, discountType: 'percentage', discountValue: 8, rebatePercentage: 3 },
              { minVolume: 10001, discountType: 'percentage', discountValue: 12, rebatePercentage: 5 }
            ],
            paymentTerms: {
              standardDays: 30,
              earlyPaymentDays: 15,
              earlyPaymentDiscount: 2,
              latePaymentPenalty: 1.5
            }
          },
          validityPeriod: {
            startDate: new Date('2022-01-01'),
            endDate: new Date('2024-12-31')
          },
          approvalWorkflow: {
            status: 'approved',
            approvedBy: users[0]._id,
            approvedAt: new Date('2022-01-01')
          },
          financialImpact: {
            estimatedAnnualValue: 250000,
            costToCompany: 180000,
            expectedROI: 138,
            marginImpact: -3.5
          }
        },
        {
          name: 'Early Payment Discount',
          code: 'EPD',
          description: 'Discount for payments within 10 days',
          termType: 'early_payment',
          termStructure: {
            paymentTerms: {
              standardDays: 30,
              earlyPaymentDays: 10,
              earlyPaymentDiscount: 3,
              latePaymentPenalty: 2
            }
          },
          validityPeriod: {
            startDate: new Date('2022-01-01'),
            endDate: new Date('2024-12-31')
          },
          approvalWorkflow: {
            status: 'approved',
            approvedBy: users[0]._id,
            approvedAt: new Date('2022-01-01')
          },
          financialImpact: {
            estimatedAnnualValue: 150000,
            costToCompany: 120000,
            expectedROI: 125,
            marginImpact: -2.1
          }
        },
        {
          name: 'Promotional Support Fund',
          code: 'PSF',
          description: 'Marketing support for key customers',
          termType: 'promotional_support',
          termStructure: {
            promotionalTerms: {
              supportPercentage: 15,
              maxSupportAmount: 50000,
              coopAdvertisingRate: 50,
              listingFeeAmount: 5000
            }
          },
          validityPeriod: {
            startDate: new Date('2022-01-01'),
            endDate: new Date('2024-12-31')
          },
          approvalWorkflow: {
            status: 'approved',
            approvedBy: users[0]._id,
            approvedAt: new Date('2022-01-01')
          },
          financialImpact: {
            estimatedAnnualValue: 400000,
            costToCompany: 320000,
            expectedROI: 125,
            marginImpact: -4.2
          }
        }
      ];

      const tradingTerms = [];
      for (const termData of tradingTermsData) {
        const tradingTerm = new TradingTerm({
          ...termData,
          company: gonxtCompany._id,
          createdBy: users[0]._id,
          applicability: {
            customers: customers.slice(0, 10).map((c) => ({ customer: c._id, customerTier: 'all' })),
            products: products.slice(0, 20).map((p) => ({ product: p._id })),
            channels: ['modern_trade', 'traditional_trade'],
            minimumOrderValue: 10000
          }
        });
        await tradingTerm.save();
        tradingTerms.push(tradingTerm);
      }
    }

    // 2. Create Reports
    console.log('Creating reports...');
    const existingReports = await Report.find({ company: gonxtCompany._id });
    if (existingReports.length > 0) {
      console.log(`Reports already exist (${existingReports.length}), skipping creation...`);
    } else {
      const reportsData = [
        {
          name: 'Monthly Sales Performance Report',
          description: 'Comprehensive monthly sales analysis',
          reportType: 'sales_performance',
          configuration: {
            dataSources: ['sales_history', 'customers', 'products'],
            filters: {
              dateRange: {
                period: 'monthly'
              }
            },
            groupBy: ['customer', 'product', 'month'],
            metrics: [
              { name: 'Total Revenue', type: 'sum', field: 'revenue' },
              { name: 'Total Volume', type: 'sum', field: 'volume' },
              { name: 'Average Order Value', type: 'average', field: 'orderValue' },
              { name: 'Growth Rate', type: 'percentage', field: 'growth' }
            ],
            visualization: {
              chartType: 'bar',
              showTrends: true,
              showComparisons: true
            }
          },
          schedule: {
            isScheduled: true,
            frequency: 'monthly',
            dayOfMonth: 5,
            time: '09:00',
            recipients: [
              { email: 'admin@gonxt.tech', name: 'Admin User', role: 'admin' },
              { email: 'sales.director@gonxt.tech', name: 'Sales Director', role: 'director' }
            ]
          },
          status: 'active'
        },
        {
          name: 'Customer Profitability Analysis',
          description: 'Analysis of customer profitability and lifetime value',
          reportType: 'customer_analysis',
          configuration: {
            dataSources: ['sales_history', 'customers', 'trading_terms'],
            filters: {
              dateRange: {
                period: 'quarterly'
              }
            },
            groupBy: ['customer', 'quarter'],
            metrics: [
              { name: 'Customer Revenue', type: 'sum', field: 'revenue' },
              { name: 'Customer Profit', type: 'sum', field: 'profit' },
              { name: 'Customer ROI', type: 'ratio', field: 'roi' },
              { name: 'Lifetime Value', type: 'sum', field: 'ltv' }
            ],
            visualization: {
              chartType: 'scatter',
              showTrends: true
            }
          },
          status: 'active'
        },
        {
          name: 'Promotion Effectiveness Dashboard',
          description: 'Real-time promotion performance tracking',
          reportType: 'promotion_effectiveness',
          configuration: {
            dataSources: ['promotions', 'sales_history', 'campaigns'],
            filters: {
              dateRange: {
                period: 'weekly'
              }
            },
            groupBy: ['product', 'month'],
            metrics: [
              { name: 'Volume Lift', type: 'percentage', field: 'volumeLift' },
              { name: 'Revenue Lift', type: 'percentage', field: 'revenueLift' },
              { name: 'ROI', type: 'ratio', field: 'roi' },
              { name: 'Participation Rate', type: 'percentage', field: 'participation' }
            ],
            visualization: {
              chartType: 'line',
              showTrends: true,
              showComparisons: true
            }
          },
          schedule: {
            isScheduled: true,
            frequency: 'weekly',
            dayOfWeek: 1,
            time: '08:00',
            recipients: [
              { email: 'marketing.manager@gonxt.tech', name: 'Marketing Manager', role: 'manager' }
            ]
          },
          status: 'active'
        }
      ];

      const reports = [];
      for (const reportData of reportsData) {
        const report = new Report({
          ...reportData,
          company: gonxtCompany._id,
          createdBy: users[0]._id,
          reportData: {
            generatedAt: new Date(),
            dataFreshness: new Date(),
            summary: {
              totalRecords: generateRandomValue(1000, 5000),
              totalValue: generateRandomValue(100000, 500000, 2),
              averageValue: generateRandomValue(100, 500, 2),
              growthRate: generateRandomValue(-10, 25, 1)
            }
          },
          performance: {
            viewCount: generateRandomValue(10, 100),
            exportCount: generateRandomValue(5, 50),
            lastViewed: getRandomDate(new Date('2023-01-01'), new Date()),
            averageLoadTime: generateRandomValue(1000, 5000),
            popularityScore: generateRandomValue(10, 100, 1)
          }
        });
        await report.save();
        reports.push(report);
      }
    }

    // 3. Create AI Chat Sessions
    console.log('Creating AI chat sessions...');
    const existingAIChats = await AIChat.find({ company: gonxtCompany._id });
    if (existingAIChats.length > 0) {
      console.log(`AI Chat sessions already exist (${existingAIChats.length}), skipping creation...`);
    } else {
      const aiChatSessions = [];
      for (let i = 0; i < 15; i++) {
        const user = getRandomElement(users);
        const sessionId = `session_${Date.now()}_${i}`;

        const aiChat = new AIChat({
          company: gonxtCompany._id,
          sessionId,
          user: user._id,
          chatType: getRandomElement(['general_insights', 'sales_analysis', 'customer_insights', 'product_performance']),
          context: {
            dataScope: {
              dateRange: {
                startDate: new Date('2023-01-01'),
                endDate: new Date('2023-12-31')
              }
            },
            availableDataSources: [
              { source: 'sales_history', recordCount: 15000, lastUpdated: new Date(), dataQuality: 'excellent' },
              { source: 'customers', recordCount: 200, lastUpdated: new Date(), dataQuality: 'good' },
              { source: 'products', recordCount: 500, lastUpdated: new Date(), dataQuality: 'excellent' }
            ],
            businessContext: {
              primaryKPIs: ['Revenue Growth', 'Market Share', 'Customer Retention'],
              businessGoals: ['Increase market penetration', 'Improve profitability', 'Launch new products'],
              seasonalPatterns: ['Q4 peak', 'Summer slowdown', 'Back-to-school boost']
            }
          },
          messages: [
            {
              messageId: `msg_${Date.now()}_1`,
              role: 'user',
              content: 'What are our top performing products this quarter?',
              timestamp: getRandomDate(new Date('2023-01-01'), new Date())
            },
            {
              messageId: `msg_${Date.now()}_2`,
              role: 'assistant',
              content: 'Based on your Q4 2023 data, here are your top 5 performing products by revenue...',
              timestamp: getRandomDate(new Date('2023-01-01'), new Date()),
              analysis: {
                queriesExecuted: [
                  { collection: 'sales_history', resultCount: 1250, executionTime: 150 },
                  { collection: 'products', resultCount: 500, executionTime: 50 }
                ],
                insights: [
                  {
                    type: 'trend',
                    title: 'Strong Q4 Performance',
                    description: 'Premium products showing 25% growth vs last quarter',
                    confidence: 85,
                    actionable: true
                  },
                  {
                    type: 'opportunity',
                    title: 'Seasonal Product Opportunity',
                    description: 'Holiday-themed products outperforming by 40%',
                    confidence: 92,
                    actionable: true
                  }
                ],
                processingTime: 200,
                confidenceScore: 88
              }
            }
          ],
          analytics: {
            totalMessages: 2,
            userMessages: 1,
            assistantMessages: 1,
            averageResponseTime: 2500,
            insightsGenerated: 2,
            actionableInsights: 2,
            dataPointsAnalyzed: 1750,
            averageConfidenceScore: 88
          },
          status: getRandomElement(['active', 'completed']),
          quality: {
            overallRating: generateRandomValue(3.5, 5.0, 1),
            responseAccuracy: generateRandomValue(80, 95),
            insightRelevance: generateRandomValue(75, 95),
            userSatisfaction: generateRandomValue(3.5, 5.0, 1)
          }
        });

        await aiChat.save();
        aiChatSessions.push(aiChat);
      }
    }

    // 4. Create Promotion Analyses
    console.log('Creating promotion analyses...');
    const existingPromotionAnalyses = await PromotionAnalysis.find({ company: gonxtCompany._id });
    if (existingPromotionAnalyses.length > 0) {
      console.log(`Promotion analyses already exist (${existingPromotionAnalyses.length}), skipping creation...`);
    } else {
      const promotionAnalyses = [];
      for (const promotion of promotions.slice(0, 10)) {
        const analysis = new PromotionAnalysis({
          company: gonxtCompany._id,
          promotion: promotion._id,
          analysisType: getRandomElement(['pre_launch_prediction', 'post_campaign_evaluation']),
          prediction: {
            successProbability: generateRandomValue(45, 85),
            predictedMetrics: {
              volumeLift: {
                percentage: generateRandomValue(10, 35, 1),
                units: generateRandomValue(5000, 25000),
                confidence: generateRandomValue(70, 90)
              },
              revenueLift: {
                percentage: generateRandomValue(8, 30, 1),
                amount: generateRandomValue(50000, 200000, 2),
                confidence: generateRandomValue(75, 90)
              },
              profitabilityImpact: {
                marginChange: generateRandomValue(-2, 5, 1),
                totalProfit: generateRandomValue(20000, 100000, 2),
                roi: generateRandomValue(110, 250),
                confidence: generateRandomValue(65, 85)
              },
              customerEngagement: {
                participationRate: generateRandomValue(15, 45, 1),
                newCustomerAcquisition: generateRandomValue(50, 200),
                customerRetention: generateRandomValue(80, 95, 1),
                confidence: generateRandomValue(70, 85)
              }
            },
            riskFactors: [
              {
                factor: 'Competitive Response',
                severity: 'medium',
                impact: 'May reduce effectiveness by 15-20%',
                mitigation: 'Monitor competitor activity and adjust timing',
                probability: 0.3
              },
              {
                factor: 'Inventory Constraints',
                severity: 'low',
                impact: 'Potential stockouts in high-demand periods',
                mitigation: 'Increase safety stock levels',
                probability: 0.15
              }
            ],
            modelConfidence: {
              overall: generateRandomValue(75, 90),
              dataQuality: generateRandomValue(80, 95),
              historicalAccuracy: generateRandomValue(70, 85),
              featureImportance: generateRandomValue(75, 90)
            }
          },
          recommendations: [
            {
              category: 'discount_optimization',
              title: 'Optimize Discount Depth',
              description: 'Current 20% discount may be too aggressive. Consider 15% for better profitability.',
              current: { discountPercentage: 20 },
              recommended: { discountPercentage: 15 },
              expectedImpact: {
                volumeLift: -2,
                revenueLift: -1,
                profitImprovement: 8,
                riskReduction: 15
              },
              priority: 'high',
              confidence: 82
            },
            {
              category: 'timing_optimization',
              title: 'Adjust Launch Timing',
              description: 'Launch 2 weeks earlier to capture pre-holiday shopping',
              current: { launchDate: '2023-11-15' },
              recommended: { launchDate: '2023-11-01' },
              expectedImpact: {
                volumeLift: 5,
                revenueLift: 6,
                profitImprovement: 3,
                riskReduction: 5
              },
              priority: 'medium',
              confidence: 75
            }
          ],
          alternatives: [
            {
              name: 'Bundle Promotion Alternative',
              description: 'Buy 2 get 1 free instead of percentage discount',
              structure: {
                discountType: 'bundle',
                discountValue: 'buy_2_get_1_free',
                duration: 30,
                timing: 'Q4_2023'
              },
              predictedPerformance: {
                successProbability: 78,
                volumeLift: 28,
                revenueLift: 18,
                roi: 165,
                profitability: 12
              },
              advantages: ['Higher volume movement', 'Better inventory turnover', 'Customer trial opportunity'],
              disadvantages: ['Complex execution', 'Higher operational costs'],
              riskLevel: 'medium',
              complexity: 'moderate'
            }
          ],
          modelInfo: {
            modelVersion: 'v2.1',
            algorithmUsed: 'ensemble_method',
            trainingDataSize: 2500,
            trainingDataPeriod: {
              startDate: new Date('2021-01-01'),
              endDate: new Date('2023-06-30')
            },
            featureCount: 45,
            crossValidationScore: 0.82,
            lastTrainingDate: new Date('2023-07-01'),
            modelAccuracy: 0.78
          },
          quality: {
            dataCompleteness: generateRandomValue(85, 95),
            dataAccuracy: generateRandomValue(80, 90),
            modelReliability: generateRandomValue(75, 85),
            predictionStability: generateRandomValue(70, 85),
            overallQuality: generateRandomValue(75, 88)
          },
          status: 'completed',
          createdBy: users[0]._id
        });

        await analysis.save();
        promotionAnalyses.push(analysis);
      }
    }

    // 5. Create Marketing Budget Allocations
    console.log('Creating marketing budget allocations...');
    const existingBudgetAllocations = await MarketingBudgetAllocation.find({ company: gonxtCompany._id });
    if (existingBudgetAllocations.length > 0) {
      console.log(`Marketing budget allocations already exist (${existingBudgetAllocations.length}), skipping creation...`);
    } else {
      const budgetAllocations = [];
      for (const budget of budgets.slice(0, 3)) {
        const allocation = new MarketingBudgetAllocation({
          company: gonxtCompany._id,
          parentBudget: budget._id,
          name: `${budget.name} - Detailed Allocation`,
          description: `Detailed allocation breakdown for ${budget.name}`,
          allocationCode: `ALLOC_${budget.code}`,
          allocationType: getRandomElement(['brand_based', 'customer_based', 'channel_based']),
          allocationLevel: 'tactical',
          allocationMethod: {
            primaryMethod: 'revenue_based',
            revenueAllocation: {
              basePeriod: {
                startDate: new Date('2022-01-01'),
                endDate: new Date('2022-12-31')
              },
              revenueMetric: 'net_revenue',
              minimumThreshold: 50000,
              weightingFactor: 1.2
            },
            adjustmentFactors: [
              {
                factor: 'Strategic Priority',
                type: 'multiplier',
                value: 1.15,
                condition: 'High priority customers',
                rationale: 'Strategic account focus'
              }
            ]
          },
          budgetDistribution: {
            totalBudget: budget.totalBudget * 0.8, // 80% of parent budget
            currency: 'AUD',
            calculatedAllocations: customers.slice(0, 15).map((customer, _index) => ({
              targetId: customer._id.toString(),
              targetType: 'customer',
              targetName: customer.name,
              baseAllocation: generateRandomValue(10000, 50000, 2),
              adjustedAllocation: generateRandomValue(12000, 55000, 2),
              finalAllocation: generateRandomValue(15000, 60000, 2),
              percentage: generateRandomValue(2, 12, 1),
              calculationBasis: {
                revenue: generateRandomValue(100000, 500000, 2),
                volume: generateRandomValue(5000, 25000),
                historicalSpend: generateRandomValue(8000, 40000, 2),
                strategicWeight: generateRandomValue(0.8, 1.5, 2)
              },
              expectedOutcomes: {
                volumeTarget: generateRandomValue(6000, 30000),
                revenueTarget: generateRandomValue(120000, 600000, 2),
                profitTarget: generateRandomValue(20000, 100000, 2),
                roiTarget: generateRandomValue(120, 200),
                marketShareTarget: generateRandomValue(5, 15, 1)
              }
            })),
            reserves: {
              contingencyReserve: {
                amount: budget.totalBudget * 0.05,
                percentage: 5,
                purpose: 'Unexpected opportunities and risks'
              },
              opportunityReserve: {
                amount: budget.totalBudget * 0.1,
                percentage: 10,
                purpose: 'Strategic initiatives and new launches'
              }
            }
          },
          proportionalRules: {
            volumeProportions: {
              enabled: true,
              basePeriod: {
                startDate: new Date('2022-01-01'),
                endDate: new Date('2022-12-31')
              },
              minimumAllocation: 5000,
              maximumAllocation: 100000,
              smoothingFactor: 0.2
            },
            revenueProportions: {
              enabled: true,
              basePeriod: {
                startDate: new Date('2022-01-01'),
                endDate: new Date('2022-12-31')
              },
              minimumAllocation: 8000,
              maximumAllocation: 150000,
              smoothingFactor: 0.15
            }
          },
          validityPeriod: {
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-12-31'),
            fiscalYear: '2023',
            quarter: 'FY23'
          },
          approvalWorkflow: {
            status: 'approved',
            approvedBy: users[0]._id,
            approvedAt: new Date('2022-12-15')
          },
          performance: {
            overallPerformance: {
              totalSpent: generateRandomValue(200000, 400000, 2),
              totalRemaining: generateRandomValue(50000, 150000, 2),
              averageUtilization: generateRandomValue(70, 90, 1),
              averageROI: generateRandomValue(130, 180, 1),
              budgetVarianceTotal: generateRandomValue(-20000, 10000, 2),
              efficiencyScore: generateRandomValue(70, 90, 1),
              lastCalculated: new Date()
            }
          },
          createdBy: users[0]._id
        });

        await allocation.save();
        budgetAllocations.push(allocation);
      }
    }

    // 6. Create Combination Analyses
    console.log('Creating combination analyses...');
    const existingCombinationAnalyses = await CombinationAnalysis.find({ company: gonxtCompany._id });
    if (existingCombinationAnalyses.length > 0) {
      console.log(`Combination analyses already exist (${existingCombinationAnalyses.length}), skipping creation...`);
    } else {
      const combinationAnalyses = [];
      for (let i = 0; i < 5; i++) {
        const analysis = new CombinationAnalysis({
          company: gonxtCompany._id,
          name: `Promotional Combination Analysis ${i + 1}`,
          description: `Analysis of promotional combinations for Q${i + 1} 2023`,
          analysisCode: `COMBO_Q${i + 1}_2023`,
          analysisType: 'promotional_combinations',
          analysisScope: 'brand_level',
          analysisPeriod: {
            startDate: new Date(2023, (i * 3), 1),
            endDate: new Date(2023, (i * 3) + 2, 31),
            baselinePeriod: {
              startDate: new Date(2022, (i * 3), 1),
              endDate: new Date(2022, (i * 3) + 2, 31)
            }
          },
          combinationElements: {
            promotionalElements: [
              {
                elementType: 'discount_depth',
                values: [10, 15, 20, 25, 30],
                weight: 0.3,
                importance: 'critical'
              },
              {
                elementType: 'promotion_duration',
                values: [7, 14, 21, 30],
                weight: 0.2,
                importance: 'high'
              },
              {
                elementType: 'promotion_timing',
                values: ['start_of_month', 'mid_month', 'end_of_month', 'holiday_period'],
                weight: 0.25,
                importance: 'high'
              }
            ],
            marketingElements: [
              {
                elementType: 'advertising_spend',
                values: [5000, 10000, 15000, 20000, 25000],
                weight: 0.15,
                importance: 'medium'
              },
              {
                elementType: 'media_mix',
                values: ['digital_only', 'traditional_only', 'mixed_media'],
                weight: 0.1,
                importance: 'medium'
              }
            ]
          },
          combinationResults: Array.from({ length: 20 }, (_, index) => ({
            combinationId: `combo_${i}_${index}`,
            combinationName: `Combination ${index + 1}`,
            elements: [
              { elementType: 'discount_depth', elementValue: getRandomElement([10, 15, 20, 25, 30]), elementWeight: 0.3 },
              { elementType: 'promotion_duration', elementValue: getRandomElement([7, 14, 21, 30]), elementWeight: 0.2 },
              { elementType: 'advertising_spend', elementValue: getRandomElement([5000, 10000, 15000, 20000]), elementWeight: 0.15 }
            ],
            performance: {
              volumeMetrics: {
                totalVolume: generateRandomValue(10000, 50000),
                volumeLift: generateRandomValue(5, 35, 1),
                volumeLiftPercentage: generateRandomValue(10, 40, 1),
                sustainedVolume: generateRandomValue(8000, 40000),
                incrementalVolume: generateRandomValue(2000, 15000),
                baselineVolume: generateRandomValue(8000, 35000)
              },
              revenueMetrics: {
                totalRevenue: generateRandomValue(100000, 500000, 2),
                revenueLift: generateRandomValue(8, 30, 1),
                revenueLiftPercentage: generateRandomValue(12, 35, 1),
                incrementalRevenue: generateRandomValue(15000, 150000, 2),
                revenuePerUnit: generateRandomValue(8, 15, 2),
                priceRealization: generateRandomValue(85, 98, 1)
              },
              profitabilityMetrics: {
                grossProfit: generateRandomValue(30000, 150000, 2),
                netProfit: generateRandomValue(20000, 100000, 2),
                marginImpact: generateRandomValue(-5, 8, 1),
                roi: generateRandomValue(110, 250),
                paybackPeriod: generateRandomValue(2, 8, 1),
                profitPerUnit: generateRandomValue(2, 8, 2)
              },
              longTermImpact: {
                volumeSustainability: [
                  { monthsAfter: 1, volumeRetention: generateRandomValue(70, 95, 1), baselineComparison: generateRandomValue(105, 120, 1) },
                  { monthsAfter: 3, volumeRetention: generateRandomValue(60, 85, 1), baselineComparison: generateRandomValue(100, 115, 1) },
                  { monthsAfter: 6, volumeRetention: generateRandomValue(50, 75, 1), baselineComparison: generateRandomValue(95, 110, 1) }
                ],
                customerBehaviorImpact: {
                  newCustomerAcquisition: generateRandomValue(50, 200),
                  customerRetentionRate: generateRandomValue(80, 95, 1),
                  purchaseFrequencyChange: generateRandomValue(-5, 15, 1),
                  basketSizeChange: generateRandomValue(-2, 12, 1),
                  brandLoyaltyImpact: generateRandomValue(0, 8, 1)
                },
                marketShareImpact: {
                  immediateGain: generateRandomValue(0.5, 3.0, 1),
                  sustainedGain: generateRandomValue(0.2, 1.5, 1),
                  competitiveResponse: getRandomElement(['none', 'mild', 'aggressive']),
                  categoryGrowthContribution: generateRandomValue(1, 5, 1)
                }
              },
              efficiencyMetrics: {
                costPerIncrementalUnit: generateRandomValue(2, 8, 2),
                costPerIncrementalRevenue: generateRandomValue(0.1, 0.4, 2),
                marketingEfficiency: generateRandomValue(60, 90, 1),
                promotionalEfficiency: generateRandomValue(65, 95, 1),
                overallEfficiency: generateRandomValue(70, 88, 1)
              }
            },
            statisticalAnalysis: {
              sampleSize: generateRandomValue(500, 2000),
              confidenceLevel: 95,
              pValue: generateRandomValue(0.01, 0.15, 3),
              correlationCoefficient: generateRandomValue(0.3, 0.8, 2),
              rSquared: generateRandomValue(0.4, 0.85, 2),
              standardError: generateRandomValue(0.05, 0.2, 3),
              significanceLevel: generateRandomValue(0.01, 0.05, 3) < 0.05 ? 'significant' : 'not_significant'
            },
            successClassification: {
              overallSuccess: getRandomElement(['highly_successful', 'successful', 'moderately_successful', 'unsuccessful']),
              volumeSuccess: getRandomElement(['excellent', 'good', 'fair', 'poor']),
              profitabilitySuccess: getRandomElement(['excellent', 'good', 'fair', 'poor']),
              sustainabilitySuccess: getRandomElement(['excellent', 'good', 'fair', 'poor']),
              successScore: generateRandomValue(30, 90, 1)
            },
            riskAssessment: {
              overallRisk: getRandomElement(['low', 'medium', 'high']),
              riskFactors: [
                {
                  factor: 'Market Competition',
                  severity: 'medium',
                  probability: 0.3,
                  impact: 'May reduce effectiveness by 10-15%'
                }
              ]
            }
          })),
          patternAnalysis: {
            successfulPatterns: [
              {
                patternName: 'High Discount + Short Duration',
                patternDescription: 'Promotions with 25%+ discount for 7-14 days show strong performance',
                characteristics: [
                  { element: 'discount_depth', value: 25, importance: 0.8 },
                  { element: 'promotion_duration', value: 14, importance: 0.6 }
                ],
                averagePerformance: {
                  volumeLift: 28,
                  revenueLift: 22,
                  roi: 165,
                  sustainability: 72
                },
                frequency: 8,
                consistency: 85,
                reliability: 78
              }
            ],
            optimalCombinations: [
              {
                combinationName: 'Optimal High Performance',
                description: 'Best performing combination for volume and profitability',
                optimalElements: [
                  { element: 'discount_depth', optimalValue: 20, tolerance: '±2%', criticality: 'high' },
                  { element: 'promotion_duration', optimalValue: 14, tolerance: '±3 days', criticality: 'medium' },
                  { element: 'advertising_spend', optimalValue: 15000, tolerance: '±20%', criticality: 'medium' }
                ],
                expectedPerformance: {
                  volumeLift: { min: 22, max: 32, expected: 27 },
                  roi: { min: 140, max: 180, expected: 160 },
                  sustainability: { min: 65, max: 80, expected: 72 }
                }
              }
            ]
          },
          recommendations: [
            {
              category: 'immediate_action',
              priority: 'high',
              title: 'Implement Optimal Discount Strategy',
              description: 'Focus on 20% discount with 14-day duration for maximum ROI',
              specificRecommendations: [
                {
                  element: 'discount_depth',
                  currentApproach: 'Variable discounts 15-30%',
                  recommendedApproach: 'Standardize at 20% for most promotions',
                  rationale: 'Sweet spot for volume lift and profitability',
                  expectedImpact: '15% improvement in ROI'
                }
              ],
              implementation: {
                timeframe: '30 days',
                resources: ['Marketing team', 'Pricing analyst'],
                dependencies: ['Approval from commercial director'],
                risks: ['Customer expectation management'],
                successMetrics: ['ROI improvement', 'Volume lift consistency']
              }
            }
          ],
          modelInfo: {
            analysisMethod: 'random_forest',
            modelVersion: 'v1.3',
            trainingDataSize: 5000,
            validationScore: 0.82,
            featureImportance: [
              { feature: 'discount_depth', importance: 0.35, rank: 1 },
              { feature: 'promotion_duration', importance: 0.25, rank: 2 },
              { feature: 'timing', importance: 0.20, rank: 3 },
              { feature: 'advertising_spend', importance: 0.15, rank: 4 },
              { feature: 'media_mix', importance: 0.05, rank: 5 }
            ],
            lastTrainingDate: new Date('2023-06-01'),
            modelAccuracy: 0.78,
            crossValidationScore: 0.75
          },
          analysisQuality: {
            dataQuality: {
              completeness: generateRandomValue(85, 95),
              accuracy: generateRandomValue(80, 90),
              consistency: generateRandomValue(82, 92),
              timeliness: generateRandomValue(88, 95)
            },
            statisticalRigor: {
              sampleSize: generateRandomValue(80, 95),
              powerAnalysis: generateRandomValue(75, 90),
              biasAssessment: generateRandomValue(70, 85),
              validityChecks: generateRandomValue(85, 95)
            },
            businessRelevance: {
              actionability: generateRandomValue(80, 95),
              strategicAlignment: generateRandomValue(85, 95),
              practicalApplicability: generateRandomValue(75, 90),
              stakeholderRelevance: generateRandomValue(80, 90)
            },
            overallQuality: generateRandomValue(78, 88)
          },
          status: 'completed',
          analysisMetadata: {
            analysisStartDate: new Date(2023, (i * 3), 1),
            analysisCompletionDate: new Date(2023, (i * 3), 15),
            processingTime: generateRandomValue(120, 480), // minutes
            dataPointsAnalyzed: generateRandomValue(10000, 50000),
            combinationsTested: 20,
            reviewStatus: 'approved',
            reviewedBy: users[0]._id,
            reviewDate: new Date(2023, (i * 3), 20)
          },
          createdBy: users[0]._id
        });

        await analysis.save();
        combinationAnalyses.push(analysis);
      }
    }

    console.log('Enhanced analytics data seeding completed successfully!');

    // Get final counts
    const finalTradingTerms = await TradingTerm.countDocuments({ company: gonxtCompany._id });
    const finalReports = await Report.countDocuments({ company: gonxtCompany._id });
    const finalAIChats = await AIChat.countDocuments({ company: gonxtCompany._id });
    const finalPromotionAnalyses = await PromotionAnalysis.countDocuments({ company: gonxtCompany._id });
    const finalBudgetAllocations = await MarketingBudgetAllocation.countDocuments({ company: gonxtCompany._id });
    const finalCombinationAnalyses = await CombinationAnalysis.countDocuments({ company: gonxtCompany._id });

    console.log(`Final counts:
    - ${finalTradingTerms} Trading Terms
    - ${finalReports} Reports
    - ${finalAIChats} AI Chat Sessions
    - ${finalPromotionAnalyses} Promotion Analyses
    - ${finalBudgetAllocations} Marketing Budget Allocations
    - ${finalCombinationAnalyses} Combination Analyses`);

  } catch (error) {
    console.error('Error seeding enhanced analytics data:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await seedEnhancedAnalyticsData();
  await mongoose.connection.close();
  console.log('Database connection closed.');
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedEnhancedAnalyticsData };
