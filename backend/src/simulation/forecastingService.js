/**
 * AI/ML Forecasting Service
 *
 * Provides predictive analytics using historical data
 */

class ForecastingService {
  /**
   * Simple linear regression for trend prediction
   */
  linearRegression(data) {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    data.forEach((point, index) => {
      const x = index + 1;
      const y = point.value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Generate forecast for next N days
   */
  forecastRevenue(historicalData, days = 30) {
    const { slope, intercept } = this.linearRegression(historicalData);
    const forecast = [];
    const startIndex = historicalData.length;

    for (let i = 0; i < days; i++) {
      const x = startIndex + i + 1;
      const predicted = slope * x + intercept;

      // Add seasonal factor (±10%)
      const seasonalFactor = 1 + (Math.sin((x / 30) * 2 * Math.PI) * 0.1);
      const adjustedPredicted = predicted * seasonalFactor;

      forecast.push({
        day: i + 1,
        predictedRevenue: parseFloat(adjustedPredicted.toFixed(2)),
        confidence: this.calculateConfidence(i, days)
      });
    }

    return forecast;
  }

  /**
   * Calculate confidence level (decreases over time)
   */
  calculateConfidence(day, totalDays) {
    // Confidence decreases from 95% to 60% over forecast period
    const baseConfidence = 95;
    const decay = (35 * day) / totalDays;
    return parseFloat((baseConfidence - decay).toFixed(1));
  }

  /**
   * Detect anomalies in data
   */
  detectAnomalies(data) {
    const values = data.map((d) => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
    );

    const anomalies = [];
    data.forEach((point, index) => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      if (zScore > 2) {  // 2 standard deviations
        anomalies.push({
          day: index + 1,
          value: point.value,
          severity: zScore > 3 ? 'high' : 'medium',
          deviation: parseFloat(((point.value - mean) / mean * 100).toFixed(2))
        });
      }
    });

    return anomalies;
  }

  /**
   * Calculate trend analysis
   */
  analyzeTrend(data) {
    const { slope, intercept } = this.linearRegression(data);
    const avgValue = data.reduce((sum, d) => sum + d.value, 0) / data.length;
    const trendPercent = (slope / avgValue * 100 * 30);  // 30-day trend

    return {
      direction: slope > 0 ? 'upward' : slope < 0 ? 'downward' : 'flat',
      strength: Math.abs(trendPercent) > 10 ? 'strong' : Math.abs(trendPercent) > 5 ? 'moderate' : 'weak',
      monthlyChange: parseFloat(trendPercent.toFixed(2)),
      slope,
      intercept
    };
  }
}

module.exports = new ForecastingService();
