/**
 * PREDICTIVE ANALYTICS SERVICE
 * AI-powered forecasting and insights for transaction processing
 *
 * Features:
 * - Accrual forecasting
 * - Dispute prediction
 * - Settlement timing optimization
 * - Cash flow forecasting
 * - Anomaly detection
 * - Trend analysis
 */

class PredictiveAnalyticsService {
  constructor() {
    this.models = {
      accrual: null,
      dispute: null,
      settlement: null,
      cashflow: null
    };
    this.historicalData = {
      accruals: [],
      disputes: [],
      settlements: [],
      payments: []
    };
  }

  /**
   * Forecast accruals for upcoming period
   */
  async forecastAccruals(customerId, period) {
    // Get historical accruals
    const historicalAccruals = await this.getHistoricalAccruals(customerId, 12); // 12 months

    // Calculate trend
    const trend = this.calculateTrend(historicalAccruals.map((a) => a.amount));

    // Calculate seasonality
    const seasonality = this.calculateSeasonality(historicalAccruals, period);

    // Forecast base amount
    const lastAmount = historicalAccruals[historicalAccruals.length - 1]?.amount || 0;
    const baseForecast = lastAmount * (1 + trend);

    // Apply seasonality
    const forecast = baseForecast * seasonality;

    // Calculate confidence interval
    const variance = this.calculateVariance(historicalAccruals.map((a) => a.amount));
    const stdDev = Math.sqrt(variance);

    return {
      period,
      forecast,
      trend: trend * 100, // as percentage
      seasonalityFactor: seasonality,
      confidenceInterval: {
        low: forecast - (1.96 * stdDev), // 95% confidence
        high: forecast + (1.96 * stdDev)
      },
      factors: {
        historicalAverage: this.average(historicalAccruals.map((a) => a.amount)),
        trendDirection: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
        volatility: this.calculateVolatility(historicalAccruals.map((a) => a.amount))
      }
    };
  }

  /**
   * Predict dispute probability
   */
  async predictDisputeProbability(invoice) {
    const features = {
      amountVariance: this.calculateAmountVariance(invoice),
      historicalDisputeRate: await this.getHistoricalDisputeRate(invoice.customerId),
      matchingConfidence: invoice.matchConfidence || 0,
      daysToInvoice: this.calculateDaysToInvoice(invoice),
      vendorRiskScore: await this.getVendorRiskScore(invoice.customerId),
      lineItemComplexity: invoice.lines?.length || 0
    };

    // Simple logistic regression model
    // In production, use a trained ML model
    const weights = {
      amountVariance: 0.25,
      historicalDisputeRate: 0.30,
      matchingConfidence: -0.20, // negative because higher confidence = lower dispute risk
      daysToInvoice: 0.10,
      vendorRiskScore: 0.10,
      lineItemComplexity: 0.05
    };

    let score = 0;
    for (const [feature, weight] of Object.entries(weights)) {
      score += (features[feature] || 0) * weight;
    }

    // Convert to probability (0-1)
    const probability = 1 / (1 + Math.exp(-score));

    // Determine risk level
    let riskLevel = 'low';
    if (probability > 0.7) riskLevel = 'high';
    else if (probability > 0.4) riskLevel = 'medium';

    return {
      probability,
      riskLevel,
      features,
      recommendations: this.generateDisputeRecommendations(probability, features)
    };
  }

  /**
   * Optimize settlement timing
   */
  async optimizeSettlementTiming(customerId) {
    // Get historical settlement data
    const settlements = await this.getHistoricalSettlements(customerId);

    // Analyze payment patterns
    const paymentPatterns = this.analyzePaymentPatterns(settlements);

    // Calculate optimal frequency
    const optimalFrequency = this.calculateOptimalFrequency(settlements);

    // Predict best settlement days
    const bestDays = this.predictBestSettlementDays(paymentPatterns);

    // Calculate expected savings
    const expectedSavings = this.calculateExpectedSavings(
      settlements,
      optimalFrequency
    );

    return {
      currentFrequency: paymentPatterns.averageFrequency,
      recommendedFrequency: optimalFrequency,
      bestDaysOfMonth: bestDays,
      expectedSavings: {
        amount: expectedSavings,
        percentImprovement: (expectedSavings / paymentPatterns.totalVolume) * 100
      },
      reasoning: this.generateSettlementRecommendations(
        paymentPatterns,
        optimalFrequency
      )
    };
  }

  /**
   * Forecast cash flow
   */
  async forecastCashFlow(customerId, daysAhead = 30) {
    // Get pending transactions
    const pendingInvoices = await this.getPendingInvoices(customerId);
    const pendingPayments = await this.getPendingPayments(customerId);

    // Get historical payment timing
    const paymentTiming = await this.getHistoricalPaymentTiming(customerId);

    // Forecast daily cash flow
    const forecast = [];
    const today = new Date();

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      // Expected inflows
      const expectedInflows = this.predictInflows(
        pendingInvoices,
        paymentTiming,
        date
      );

      // Expected outflows
      const expectedOutflows = this.predictOutflows(
        pendingPayments,
        date
      );

      forecast.push({
        date,
        expectedInflows,
        expectedOutflows,
        netCashFlow: expectedInflows - expectedOutflows,
        confidence: this.calculateForecastConfidence(i, paymentTiming)
      });
    }

    // Calculate cumulative cash position
    let cumulative = 0;
    forecast.forEach((day) => {
      cumulative += day.netCashFlow;
      day.cumulativeCashFlow = cumulative;
    });

    // Identify potential cash crunches
    const cashCrunches = forecast.filter((day) => day.cumulativeCashFlow < 0);

    return {
      forecast,
      summary: {
        totalExpectedInflows: forecast.reduce((sum, d) => sum + d.expectedInflows, 0),
        totalExpectedOutflows: forecast.reduce((sum, d) => sum + d.expectedOutflows, 0),
        netPosition: forecast[forecast.length - 1].cumulativeCashFlow,
        potentialCashCrunches: cashCrunches.length,
        worstCashPosition: Math.min(...forecast.map((d) => d.cumulativeCashFlow))
      },
      alerts: this.generateCashFlowAlerts(forecast, cashCrunches)
    };
  }

  /**
   * Detect anomalies in transactions
   */
  detectAnomalies(transactions, _type = 'all') {
    const anomalies = [];

    // Calculate baseline statistics
    const amounts = transactions.map((t) => t.amount);
    const mean = this.average(amounts);
    const stdDev = Math.sqrt(this.calculateVariance(amounts));

    // Z-score method for outlier detection
    for (const transaction of transactions) {
      const zScore = Math.abs((transaction.amount - mean) / stdDev);

      if (zScore > 3) { // 3 standard deviations
        anomalies.push({
          transaction,
          type: 'amount_outlier',
          severity: zScore > 4 ? 'high' : 'medium',
          zScore,
          description: `Amount ${transaction.amount} is ${zScore.toFixed(2)} standard deviations from mean`
        });
      }
    }

    // Time-based anomalies
    const timeAnomalies = this.detectTimeAnomalies(transactions);
    anomalies.push(...timeAnomalies);

    // Pattern-based anomalies
    const patternAnomalies = this.detectPatternAnomalies(transactions);
    anomalies.push(...patternAnomalies);

    return {
      totalAnomalies: anomalies.length,
      highSeverity: anomalies.filter((a) => a.severity === 'high').length,
      mediumSeverity: anomalies.filter((a) => a.severity === 'medium').length,
      lowSeverity: anomalies.filter((a) => a.severity === 'low').length,
      anomalies: anomalies.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
    };
  }

  /**
   * Analyze trends
   */
  async analyzeTrends(customerId, metric, period = 'monthly') {
    const data = await this.getMetricData(customerId, metric, period);

    // Calculate trend line (linear regression)
    const trend = this.calculateLinearRegression(data);

    // Identify patterns
    const patterns = this.identifyPatterns(data);

    // Calculate momentum
    const momentum = this.calculateMomentum(data);

    // Forecast next period
    const forecast = this.forecastNextPeriod(data, trend);

    return {
      metric,
      period,
      dataPoints: data.length,
      trend: {
        direction: trend.slope > 0 ? 'increasing' : trend.slope < 0 ? 'decreasing' : 'stable',
        slope: trend.slope,
        rSquared: trend.rSquared,
        strength: trend.rSquared > 0.7 ? 'strong' : trend.rSquared > 0.4 ? 'moderate' : 'weak'
      },
      patterns,
      momentum: {
        value: momentum,
        interpretation: momentum > 0.5 ? 'accelerating' : momentum > -0.5 ? 'steady' : 'decelerating'
      },
      forecast,
      insights: this.generateTrendInsights(data, trend, patterns)
    };
  }

  // Helper methods

  calculateTrend(values) {
    if (values.length < 2) return 0;

    const regression = this.calculateLinearRegression(
      values.map((v, i) => ({ x: i, y: v }))
    );

    return regression.slope / this.average(values);
  }

  calculateSeasonality(data, period) {
    // Simple seasonality: compare same period in previous years
    const samePeriods = data.filter((d) => d.period === period);
    if (samePeriods.length === 0) return 1;

    const average = this.average(samePeriods.map((d) => d.amount));
    const overall = this.average(data.map((d) => d.amount));

    return average / overall;
  }

  calculateVariance(values) {
    const mean = this.average(values);
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return this.average(squaredDiffs);
  }

  calculateVolatility(values) {
    return Math.sqrt(this.calculateVariance(values)) / this.average(values);
  }

  average(values) {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  calculateLinearRegression(data) {
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.x, 0);
    const sumY = data.reduce((sum, d) => sum + d.y, 0);
    const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);
    const _sumY2 = data.reduce((sum, d) => sum + d.y * d.y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const meanY = sumY / n;
    const ssTotal = data.reduce((sum, d) => sum + Math.pow(d.y - meanY, 2), 0);
    const ssResidual = data.reduce((sum, d) => {
      const predicted = slope * d.x + intercept;
      return sum + Math.pow(d.y - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    return { slope, intercept, rSquared };
  }

  calculateAmountVariance(invoice) {
    if (!invoice.purchaseOrderId || !invoice.expectedAmount) return 0;
    return Math.abs(invoice.totalAmount - invoice.expectedAmount) / invoice.expectedAmount;
  }

  calculateDaysToInvoice(invoice) {
    if (!invoice.poDate) return 0;
    return (new Date(invoice.invoiceDate) - new Date(invoice.poDate)) / (1000 * 60 * 60 * 24);
  }

  generateDisputeRecommendations(probability, features) {
    const recommendations = [];

    if (probability > 0.5) {
      recommendations.push('High dispute risk - recommend manual review before approval');
    }

    if (features.matchingConfidence < 0.7) {
      recommendations.push('Low matching confidence - verify line items manually');
    }

    if (features.amountVariance > 0.1) {
      recommendations.push('Significant amount variance - verify pricing with vendor');
    }

    return recommendations;
  }

  calculateMomentum(data) {
    if (data.length < 3) return 0;

    const recent = data.slice(-3).map((d) => d.y);
    const previous = data.slice(-6, -3).map((d) => d.y);

    const recentAvg = this.average(recent);
    const previousAvg = this.average(previous);

    return (recentAvg - previousAvg) / previousAvg;
  }

  forecastNextPeriod(data, trend) {
    const nextX = data.length;
    const predicted = trend.slope * nextX + trend.intercept;
    const stdDev = Math.sqrt(this.calculateVariance(data.map((d) => d.y)));

    return {
      predicted,
      confidenceInterval: {
        low: predicted - (1.96 * stdDev),
        high: predicted + (1.96 * stdDev)
      }
    };
  }

  identifyPatterns(data) {
    // Simple pattern identification
    return {
      cyclical: this.detectCyclicalPattern(data),
      seasonal: this.detectSeasonalPattern(data),
      stepChange: this.detectStepChange(data)
    };
  }

  detectCyclicalPattern(_data) {
    // Simplified - check for regular ups and downs
    return false;
  }

  detectSeasonalPattern(_data) {
    // Simplified - would need more sophisticated analysis
    return false;
  }

  detectStepChange(data) {
    // Detect sudden shifts in level
    if (data.length < 6) return false;

    const firstHalf = data.slice(0, Math.floor(data.length / 2)).map((d) => d.y);
    const secondHalf = data.slice(Math.floor(data.length / 2)).map((d) => d.y);

    const diff = Math.abs(this.average(secondHalf) - this.average(firstHalf));
    const overall = this.average(data.map((d) => d.y));

    return diff / overall > 0.3; // 30% shift
  }

  detectTimeAnomalies(_transactions) {
    // Detect unusual transaction times or patterns
    return [];
  }

  detectPatternAnomalies(_transactions) {
    // Detect unusual patterns (e.g., round numbers, duplicates)
    return [];
  }

  generateTrendInsights(data, trend, patterns) {
    const insights = [];

    if (Math.abs(trend.slope) > 0.1) {
      insights.push(`Strong ${trend.direction} trend detected`);
    }

    if (patterns.stepChange) {
      insights.push('Significant change in baseline detected');
    }

    return insights;
  }

  generateCashFlowAlerts(forecast, cashCrunches) {
    const alerts = [];

    if (cashCrunches.length > 0) {
      alerts.push({
        severity: 'high',
        message: `Potential cash shortfall in ${cashCrunches.length} days`,
        dates: cashCrunches.map((c) => c.date)
      });
    }

    return alerts;
  }

  // Data retrieval methods (would connect to database in production)

  getHistoricalAccruals(_customerId, _months) {
    return [];
  }

  getHistoricalDisputeRate(_customerId) {
    return 0.1; // 10% default
  }

  getVendorRiskScore(_customerId) {
    return 0.5; // Medium risk default
  }

  getHistoricalSettlements(_customerId) {
    return [];
  }

  getPendingInvoices(_customerId) {
    return [];
  }

  getPendingPayments(_customerId) {
    return [];
  }

  getHistoricalPaymentTiming(_customerId) {
    return { averageDays: 30, variance: 5 };
  }

  getMetricData(_customerId, _metric, _period) {
    return [];
  }

  analyzePaymentPatterns(_settlements) {
    return {
      averageFrequency: 30,
      totalVolume: 100000
    };
  }

  calculateOptimalFrequency(_settlements) {
    return 15; // Bi-weekly
  }

  predictBestSettlementDays(_patterns) {
    return [1, 15]; // 1st and 15th of month
  }

  calculateExpectedSavings(_settlements, _newFrequency) {
    return 5000; // $5K savings
  }

  generateSettlementRecommendations(_patterns, _optimalFrequency) {
    return ['Switch to bi-weekly settlements for optimal cash flow'];
  }

  predictInflows(_invoices, _timing, _date) {
    return 0;
  }

  predictOutflows(_payments, _date) {
    return 0;
  }

  calculateForecastConfidence(daysAhead, _timing) {
    return Math.max(0.5, 1 - (daysAhead / 100));
  }
}

module.exports = new PredictiveAnalyticsService();
