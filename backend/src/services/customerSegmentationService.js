/**
 * Customer Segmentation Service
 * 
 * Features:
 * - ABC Analysis (revenue contribution)
 * - RFM Segmentation (Recency, Frequency, Monetary)
 * - Customer lifetime value calculation
 * - Churn prediction
 * - Segment-based recommendations
 */

const Customer = require('../models/Customer');
const SalesTransaction = require('../models/SalesTransaction');
const logger = require('../../utils/logger');
const { safeNumber, calculatePercentage } = require('../../utils/safeNumbers');

class CustomerSegmentationService {
  
  /**
   * Perform ABC Analysis
   * A = Top 20% of customers by revenue (80% of revenue - Pareto principle)
   * B = Next 30% of customers (15% of revenue)
   * C = Bottom 50% of customers (5% of revenue)
   */
  async performABCAnalysis(params) {
    const { tenant, startDate, endDate } = params;
    
    try {
      logger.info('Starting ABC analysis', { tenant, startDate, endDate });
      
      // Get customer revenue data
      const customerRevenue = await SalesTransaction.aggregate([
        {
          $match: {
            tenant,
            transactionDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
          }
        },
        {
          $group: {
            _id: '$customerId',
            totalRevenue: { $sum: '$totalAmount' },
            transactionCount: { $sum: 1 },
            avgTransactionValue: { $avg: '$totalAmount' },
            totalQuantity: { $sum: '$quantity' }
          }
        },
        {
          $sort: { totalRevenue: -1 }
        }
      ]);
      
      // Get customer details
      const customerIds = customerRevenue.map(c => c._id);
      const customers = await Customer.find({ _id: { $in: customerIds } });
      const customerMap = new Map(customers.map(c => [c._id.toString(), c]));
      
      // Calculate totals
      const totalRevenue = customerRevenue.reduce((sum, c) => sum + c.totalRevenue, 0);
      const totalCustomers = customerRevenue.length;
      
      // Assign segments
      let cumulativeRevenue = 0;
      let cumulativePercent = 0;
      const segmentedCustomers = [];
      
      customerRevenue.forEach((data, index) => {
        cumulativeRevenue += data.totalRevenue;
        cumulativePercent = (cumulativeRevenue / totalRevenue) * 100;
        
        let segment;
        if (cumulativePercent <= 80) {
          segment = 'A';
        } else if (cumulativePercent <= 95) {
          segment = 'B';
        } else {
          segment = 'C';
        }
        
        const customer = customerMap.get(data._id.toString());
        
        segmentedCustomers.push({
          customerId: data._id,
          customerName: customer?.name || 'Unknown',
          customerCode: customer?.customerCode,
          segment,
          rank: index + 1,
          revenue: data.totalRevenue,
          revenuePercent: (data.totalRevenue / totalRevenue) * 100,
          cumulativePercent: cumulativePercent,
          transactionCount: data.transactionCount,
          avgTransactionValue: data.avgTransactionValue,
          totalQuantity: data.totalQuantity
        });
      });
      
      // Calculate segment summaries
      const segments = {
        A: segmentedCustomers.filter(c => c.segment === 'A'),
        B: segmentedCustomers.filter(c => c.segment === 'B'),
        C: segmentedCustomers.filter(c => c.segment === 'C')
      };
      
      const summary = {
        A: {
          customerCount: segments.A.length,
          customerPercent: (segments.A.length / totalCustomers) * 100,
          revenue: segments.A.reduce((sum, c) => sum + c.revenue, 0),
          revenuePercent: (segments.A.reduce((sum, c) => sum + c.revenue, 0) / totalRevenue) * 100
        },
        B: {
          customerCount: segments.B.length,
          customerPercent: (segments.B.length / totalCustomers) * 100,
          revenue: segments.B.reduce((sum, c) => sum + c.revenue, 0),
          revenuePercent: (segments.B.reduce((sum, c) => sum + c.revenue, 0) / totalRevenue) * 100
        },
        C: {
          customerCount: segments.C.length,
          customerPercent: (segments.C.length / totalCustomers) * 100,
          revenue: segments.C.reduce((sum, c) => sum + c.revenue, 0),
          revenuePercent: (segments.C.reduce((sum, c) => sum + c.revenue, 0) / totalRevenue) * 100
        }
      };
      
      const result = {
        period: { startDate, endDate },
        totalCustomers,
        totalRevenue,
        segments: summary,
        customers: segmentedCustomers,
        insights: this.generateABCInsights(summary, segmentedCustomers)
      };
      
      logger.info('ABC analysis complete', {
        totalCustomers,
        segmentA: summary.A.customerCount,
        segmentB: summary.B.customerCount,
        segmentC: summary.C.customerCount
      });
      
      return result;
      
    } catch (error) {
      logger.error('Error performing ABC analysis', { error: error.message, params });
      throw error;
    }
  }
  
  /**
   * Generate insights from ABC analysis
   */
  generateABCInsights(summary, customers) {
    const insights = [];
    
    // Pareto validation
    if (summary.A.revenuePercent >= 70) {
      insights.push({
        type: 'success',
        title: 'Strong Pareto Distribution',
        message: `Top ${summary.A.customerPercent.toFixed(1)}% of customers generate ${summary.A.revenuePercent.toFixed(1)}% of revenue`,
        recommendation: 'Focus retention and growth strategies on Segment A customers'
      });
    }
    
    // Concentration risk
    if (summary.A.customerCount < 10) {
      insights.push({
        type: 'warning',
        title: 'High Concentration Risk',
        message: `Only ${summary.A.customerCount} customers in Segment A`,
        recommendation: 'Develop strategies to grow Segment B customers into Segment A'
      });
    }
    
    // Segment C opportunity
    if (summary.C.customerCount > summary.A.customerCount * 3) {
      insights.push({
        type: 'info',
        title: 'Large Segment C',
        message: `${summary.C.customerCount} customers in Segment C with ${summary.C.revenuePercent.toFixed(1)}% of revenue`,
        recommendation: 'Evaluate profitability and consider targeted growth campaigns or rationalization'
      });
    }
    
    return insights;
  }
  
  /**
   * Perform RFM Segmentation
   * Recency: How recently did the customer purchase?
   * Frequency: How often do they purchase?
   * Monetary: How much do they spend?
   */
  async performRFMAnalysis(params) {
    const { tenant, asOfDate = new Date() } = params;
    
    try {
      logger.info('Starting RFM analysis', { tenant, asOfDate });
      
      // Calculate RFM metrics for each customer
      const rfmData = await SalesTransaction.aggregate([
        {
          $match: {
            tenant,
            transactionDate: { $lte: new Date(asOfDate) }
          }
        },
        {
          $group: {
            _id: '$customerId',
            lastPurchaseDate: { $max: '$transactionDate' },
            purchaseCount: { $sum: 1 },
            totalSpend: { $sum: '$totalAmount' }
          }
        }
      ]);
      
      // Calculate recency in days
      const analysisDate = new Date(asOfDate);
      rfmData.forEach(data => {
        data.recency = Math.floor((analysisDate - new Date(data.lastPurchaseDate)) / (1000 * 60 * 60 * 24));
      });
      
      // Calculate quartiles for scoring
      const recencies = rfmData.map(d => d.recency).sort((a, b) => a - b);
      const frequencies = rfmData.map(d => d.purchaseCount).sort((a, b) => a - b);
      const monetaries = rfmData.map(d => d.totalSpend).sort((a, b) => a - b);
      
      const getQuartile = (value, sortedArray) => {
        const q1 = sortedArray[Math.floor(sortedArray.length * 0.25)];
        const q2 = sortedArray[Math.floor(sortedArray.length * 0.50)];
        const q3 = sortedArray[Math.floor(sortedArray.length * 0.75)];
        
        if (value <= q1) return 1;
        if (value <= q2) return 2;
        if (value <= q3) return 3;
        return 4;
      };
      
      // Score each customer (1-4, where 4 is best)
      const customerIds = rfmData.map(d => d._id);
      const customers = await Customer.find({ _id: { $in: customerIds } });
      const customerMap = new Map(customers.map(c => [c._id.toString(), c]));
      
      const scoredCustomers = rfmData.map(data => {
        // For recency, lower is better, so invert the score
        const rScore = 5 - getQuartile(data.recency, recencies);
        const fScore = getQuartile(data.purchaseCount, frequencies);
        const mScore = getQuartile(data.totalSpend, monetaries);
        const rfmScore = `${rScore}${fScore}${mScore}`;
        
        const customer = customerMap.get(data._id.toString());
        
        return {
          customerId: data._id,
          customerName: customer?.name || 'Unknown',
          customerCode: customer?.customerCode,
          recency: data.recency,
          frequency: data.purchaseCount,
          monetary: data.totalSpend,
          rScore,
          fScore,
          mScore,
          rfmScore,
          segment: this.getRFMSegment(rScore, fScore, mScore)
        };
      });
      
      // Group by segment
      const segments = {};
      scoredCustomers.forEach(customer => {
        const segment = customer.segment;
        if (!segments[segment]) {
          segments[segment] = [];
        }
        segments[segment].push(customer);
      });
      
      // Calculate segment summaries
      const segmentSummaries = Object.entries(segments).map(([name, customers]) => ({
        name,
        customerCount: customers.length,
        totalRevenue: customers.reduce((sum, c) => sum + c.monetary, 0),
        avgRecency: customers.reduce((sum, c) => sum + c.recency, 0) / customers.length,
        avgFrequency: customers.reduce((sum, c) => sum + c.frequency, 0) / customers.length,
        avgMonetary: customers.reduce((sum, c) => sum + c.monetary, 0) / customers.length
      })).sort((a, b) => b.totalRevenue - a.totalRevenue);
      
      const result = {
        asOfDate: analysisDate,
        totalCustomers: scoredCustomers.length,
        segments: segmentSummaries,
        customers: scoredCustomers,
        insights: this.generateRFMInsights(segmentSummaries),
        recommendations: this.generateRFMRecommendations(segments)
      };
      
      logger.info('RFM analysis complete', {
        totalCustomers: scoredCustomers.length,
        segmentCount: Object.keys(segments).length
      });
      
      return result;
      
    } catch (error) {
      logger.error('Error performing RFM analysis', { error: error.message, params });
      throw error;
    }
  }
  
  /**
   * Map RFM scores to business segments
   */
  getRFMSegment(r, f, m) {
    // Champions: High R, F, M
    if (r >= 4 && f >= 4 && m >= 4) return 'Champions';
    
    // Loyal Customers: High F, M but moderate R
    if (f >= 4 && m >= 4) return 'Loyal Customers';
    
    // Potential Loyalists: Recent customers with good F, M
    if (r >= 3 && f >= 2 && m >= 2) return 'Potential Loyalists';
    
    // Recent Customers: High R but low F, M
    if (r >= 4 && f <= 2) return 'Recent Customers';
    
    // At Risk: High F, M but low R
    if (r <= 2 && f >= 3 && m >= 3) return 'At Risk';
    
    // Can't Lose Them: Low R but historically high F, M
    if (r === 1 && f >= 4 && m >= 4) return 'Can\'t Lose Them';
    
    // Hibernating: Low R, moderate F, M
    if (r <= 2 && f >= 2 && m >= 2) return 'Hibernating';
    
    // Lost: Very low R, F, M
    if (r <= 2 && f <= 2 && m <= 2) return 'Lost';
    
    // About to Sleep: Moderate R, low F, M
    if (r === 3 && f <= 2 && m <= 2) return 'About to Sleep';
    
    // Need Attention: Moderate scores
    return 'Need Attention';
  }
  
  /**
   * Generate RFM insights
   */
  generateRFMInsights(segments) {
    const insights = [];
    
    // Champions
    const champions = segments.find(s => s.name === 'Champions');
    if (champions && champions.customerCount > 0) {
      insights.push({
        type: 'success',
        title: 'Champion Customers',
        message: `${champions.customerCount} champion customers generating ZAR ${champions.totalRevenue.toLocaleString()}`,
        metric: champions.totalRevenue
      });
    }
    
    // At Risk
    const atRisk = segments.find(s => s.name === 'At Risk');
    if (atRisk && atRisk.customerCount > 0) {
      insights.push({
        type: 'warning',
        title: 'Customers At Risk',
        message: `${atRisk.customerCount} high-value customers haven't purchased recently`,
        metric: atRisk.totalRevenue
      });
    }
    
    // Lost
    const lost = segments.find(s => s.name === 'Lost');
    if (lost && lost.customerCount > 0) {
      insights.push({
        type: 'critical',
        title: 'Lost Customers',
        message: `${lost.customerCount} customers appear to be lost`,
        metric: lost.totalRevenue
      });
    }
    
    return insights;
  }
  
  /**
   * Generate segment-specific recommendations
   */
  generateRFMRecommendations(segments) {
    const recommendations = [];
    
    Object.entries(segments).forEach(([segmentName, customers]) => {
      let action;
      
      switch (segmentName) {
        case 'Champions':
          action = 'Reward and retain. Offer exclusive benefits, early access, VIP programs.';
          break;
        case 'Loyal Customers':
          action = 'Upsell higher value products. Ask for reviews and referrals.';
          break;
        case 'Potential Loyalists':
          action = 'Offer membership programs, loyalty rewards to increase frequency.';
          break;
        case 'Recent Customers':
          action = 'Build relationships. Provide onboarding support and product education.';
          break;
        case 'At Risk':
          action = 'Send win-back campaigns. Offer personalized discounts or incentives.';
          break;
        case 'Can\'t Lose Them':
          action = 'URGENT: Re-engage immediately with special offers and personal outreach.';
          break;
        case 'Hibernating':
          action = 'Re-activate with compelling offers and product updates.';
          break;
        case 'Lost':
          action = 'Win-back campaign or let go. Survey for feedback.';
          break;
        case 'About to Sleep':
          action = 'Engage proactively before they slip away. Special promotions.';
          break;
        default:
          action = 'Monitor and engage based on behavior changes.';
      }
      
      recommendations.push({
        segment: segmentName,
        customerCount: customers.length,
        totalValue: customers.reduce((sum, c) => sum + c.monetary, 0),
        action
      });
    });
    
    return recommendations.sort((a, b) => b.totalValue - a.totalValue);
  }
  
  /**
   * Calculate Customer Lifetime Value
   */
  async calculateCustomerLTV(customerId) {
    try {
      const transactions = await SalesTransaction.find({ customerId })
        .sort({ transactionDate: 1 });
      
      if (transactions.length === 0) {
        return {
          customerId,
          ltv: 0,
          avgOrderValue: 0,
          purchaseFrequency: 0,
          customerLifespan: 0
        };
      }
      
      const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
      const avgOrderValue = totalRevenue / transactions.length;
      
      const firstPurchase = new Date(transactions[0].transactionDate);
      const lastPurchase = new Date(transactions[transactions.length - 1].transactionDate);
      const lifespanDays = Math.ceil((lastPurchase - firstPurchase) / (1000 * 60 * 60 * 24));
      const lifespanYears = lifespanDays / 365;
      
      const purchaseFrequency = lifespanYears > 0 ? transactions.length / lifespanYears : transactions.length;
      
      // Assume 40% gross margin and 3 year average customer lifespan
      const grossMargin = 0.40;
      const avgCustomerLifespan = 3;
      const ltv = avgOrderValue * purchaseFrequency * avgCustomerLifespan * grossMargin;
      
      return {
        customerId,
        ltv,
        avgOrderValue,
        purchaseFrequency,
        customerLifespan: lifespanYears,
        totalRevenue,
        transactionCount: transactions.length,
        firstPurchase,
        lastPurchase
      };
      
    } catch (error) {
      logger.error('Error calculating customer LTV', { customerId, error: error.message });
      throw error;
    }
  }
  
  /**
   * Predict churn probability
   */
  async predictChurn(tenant) {
    try {
      // Get all customers with their last purchase date
      const customers = await SalesTransaction.aggregate([
        { $match: { tenant } },
        {
          $group: {
            _id: '$customerId',
            lastPurchase: { $max: '$transactionDate' },
            purchaseCount: { $sum: 1 },
            avgDaysBetweenPurchases: { $avg: '$daysSinceLastPurchase' }
          }
        }
      ]);
      
      const today = new Date();
      const churnPredictions = [];
      
      customers.forEach(customer => {
        const daysSinceLastPurchase = Math.floor((today - new Date(customer.lastPurchase)) / (1000 * 60 * 60 * 24));
        const avgPurchaseInterval = customer.avgDaysBetweenPurchases || 30;
        
        // Churn probability based on how overdue they are
        let churnProbability = 0;
        if (daysSinceLastPurchase > avgPurchaseInterval * 2) {
          churnProbability = 90;
        } else if (daysSinceLastPurchase > avgPurchaseInterval * 1.5) {
          churnProbability = 60;
        } else if (daysSinceLastPurchase > avgPurchaseInterval) {
          churnProbability = 30;
        } else {
          churnProbability = 10;
        }
        
        churnPredictions.push({
          customerId: customer._id,
          daysSinceLastPurchase,
          avgPurchaseInterval,
          churnProbability,
          churnRisk: churnProbability >= 60 ? 'high' : churnProbability >= 30 ? 'medium' : 'low'
        });
      });
      
      // Sort by churn probability
      churnPredictions.sort((a, b) => b.churnProbability - a.churnProbability);
      
      return {
        asOfDate: today,
        totalCustomers: churnPredictions.length,
        highRisk: churnPredictions.filter(c => c.churnRisk === 'high').length,
        mediumRisk: churnPredictions.filter(c => c.churnRisk === 'medium').length,
        lowRisk: churnPredictions.filter(c => c.churnRisk === 'low').length,
        predictions: churnPredictions
      };
      
    } catch (error) {
      logger.error('Error predicting churn', { tenant, error: error.message });
      throw error;
    }
  }
}

module.exports = new CustomerSegmentationService();
