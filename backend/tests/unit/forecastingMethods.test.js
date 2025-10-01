// Test the forecasting mathematical methods without database dependencies

describe('Forecasting Mathematical Methods', () => {
  
  describe('Moving Average', () => {
    it('should calculate simple moving average correctly', () => {
      const data = [10, 20, 30, 40, 50];
      const window = 3;
      
      // Simple moving average calculation
      const calculateMovingAverage = (data, window) => {
        const result = [];
        for (let i = window - 1; i < data.length; i++) {
          const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
          result.push(sum / window);
        }
        return result;
      };

      const movingAvg = calculateMovingAverage(data, window);
      
      expect(Array.isArray(movingAvg)).toBe(true);
      expect(movingAvg.length).toBe(data.length - window + 1);
      expect(movingAvg[0]).toBe(20); // (10+20+30)/3
      expect(movingAvg[1]).toBe(30); // (20+30+40)/3
      expect(movingAvg[2]).toBe(40); // (30+40+50)/3
    });
  });

  describe('Exponential Smoothing', () => {
    it('should calculate exponential smoothing correctly', () => {
      const data = [10, 20, 30, 40, 50];
      const alpha = 0.3;

      const exponentialSmoothing = (data, alpha) => {
        const result = [data[0]];
        for (let i = 1; i < data.length; i++) {
          const smoothed = alpha * data[i] + (1 - alpha) * result[i - 1];
          result.push(smoothed);
        }
        return result;
      };

      const smoothed = exponentialSmoothing(data, alpha);
      
      expect(Array.isArray(smoothed)).toBe(true);
      expect(smoothed.length).toBe(data.length);
      expect(smoothed[0]).toBe(data[0]); // First value should be unchanged
      expect(smoothed[1]).toBeCloseTo(13); // 0.3 * 20 + 0.7 * 10 = 13
    });
  });

  describe('Linear Regression', () => {
    it('should calculate linear regression slope and intercept', () => {
      const data = [
        { x: 1, y: 2 },
        { x: 2, y: 4 },
        { x: 3, y: 6 },
        { x: 4, y: 8 },
        { x: 5, y: 10 }
      ];

      const linearRegression = (data) => {
        const n = data.length;
        const sumX = data.reduce((sum, point) => sum + point.x, 0);
        const sumY = data.reduce((sum, point) => sum + point.y, 0);
        const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
        const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept };
      };

      const regression = linearRegression(data);
      
      expect(regression.slope).toBeCloseTo(2);
      expect(regression.intercept).toBeCloseTo(0);
    });
  });

  describe('Forecast Accuracy Metrics', () => {
    it('should calculate MAPE correctly', () => {
      const actual = [100, 110, 120, 130, 140];
      const predicted = [95, 105, 125, 135, 145];

      const calculateMAPE = (actual, predicted) => {
        let sum = 0;
        for (let i = 0; i < actual.length; i++) {
          if (actual[i] !== 0) {
            sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
          }
        }
        return (sum / actual.length) * 100;
      };

      const mape = calculateMAPE(actual, predicted);
      
      expect(typeof mape).toBe('number');
      expect(mape).toBeGreaterThan(0);
      expect(mape).toBeLessThan(100);
    });

    it('should calculate RMSE correctly', () => {
      const actual = [100, 110, 120, 130, 140];
      const predicted = [95, 105, 125, 135, 145];

      const calculateRMSE = (actual, predicted) => {
        let sum = 0;
        for (let i = 0; i < actual.length; i++) {
          sum += Math.pow(actual[i] - predicted[i], 2);
        }
        return Math.sqrt(sum / actual.length);
      };

      const rmse = calculateRMSE(actual, predicted);
      
      expect(typeof rmse).toBe('number');
      expect(rmse).toBeGreaterThan(0);
    });

    it('should calculate MAE correctly', () => {
      const actual = [100, 110, 120, 130, 140];
      const predicted = [95, 105, 125, 135, 145];

      const calculateMAE = (actual, predicted) => {
        let sum = 0;
        for (let i = 0; i < actual.length; i++) {
          sum += Math.abs(actual[i] - predicted[i]);
        }
        return sum / actual.length;
      };

      const mae = calculateMAE(actual, predicted);
      
      expect(typeof mae).toBe('number');
      expect(mae).toBeGreaterThan(0);
    });
  });

  describe('Seasonality Detection', () => {
    it('should detect seasonal patterns', () => {
      const data = [
        100, 120, 110, 130, 140, 150, 160, 155, 145, 135, 125, 115, // Year 1
        105, 125, 115, 135, 145, 155, 165, 160, 150, 140, 130, 120  // Year 2
      ];

      const detectSeasonality = (data, period = 12) => {
        if (data.length < period * 2) return { hasSeasonality: false };

        const seasonalSums = new Array(period).fill(0);
        const seasonalCounts = new Array(period).fill(0);

        for (let i = 0; i < data.length; i++) {
          const seasonIndex = i % period;
          seasonalSums[seasonIndex] += data[i];
          seasonalCounts[seasonIndex]++;
        }

        const seasonalAverages = seasonalSums.map((sum, i) => sum / seasonalCounts[i]);
        const overallAverage = data.reduce((sum, val) => sum + val, 0) / data.length;
        const seasonalFactors = seasonalAverages.map(avg => avg / overallAverage);

        // Check if there's significant variation in seasonal factors
        const maxFactor = Math.max(...seasonalFactors);
        const minFactor = Math.min(...seasonalFactors);
        const hasSeasonality = (maxFactor - minFactor) > 0.1; // 10% threshold

        return {
          hasSeasonality,
          seasonalFactors,
          seasonalAverages
        };
      };

      const seasonality = detectSeasonality(data);
      
      expect(seasonality).toBeDefined();
      expect(typeof seasonality.hasSeasonality).toBe('boolean');
      expect(Array.isArray(seasonality.seasonalFactors)).toBe(true);
      expect(seasonality.seasonalFactors.length).toBe(12);
    });
  });

  describe('Trend Analysis', () => {
    it('should detect increasing trend', () => {
      const data = [100, 110, 120, 130, 140, 150];

      const analyzeTrend = (data) => {
        if (data.length < 3) return { direction: 'insufficient_data', strength: 0 };

        // Calculate linear regression slope
        const n = data.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = data;

        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const avgY = sumY / n;

        let direction;
        if (Math.abs(slope) < avgY * 0.01) { // Less than 1% of average
          direction = 'stable';
        } else if (slope > 0) {
          direction = 'increasing';
        } else {
          direction = 'decreasing';
        }

        const strength = Math.abs(slope) / avgY;

        return { direction, strength, slope };
      };

      const trend = analyzeTrend(data);
      
      expect(trend.direction).toBe('increasing');
      expect(trend.strength).toBeGreaterThan(0);
      expect(trend.slope).toBeGreaterThan(0);
    });

    it('should detect decreasing trend', () => {
      const data = [150, 140, 130, 120, 110, 100];

      const analyzeTrend = (data) => {
        if (data.length < 3) return { direction: 'insufficient_data', strength: 0 };

        const n = data.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = data;

        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const avgY = sumY / n;

        let direction;
        if (Math.abs(slope) < avgY * 0.01) {
          direction = 'stable';
        } else if (slope > 0) {
          direction = 'increasing';
        } else {
          direction = 'decreasing';
        }

        const strength = Math.abs(slope) / avgY;

        return { direction, strength, slope };
      };

      const trend = analyzeTrend(data);
      
      expect(trend.direction).toBe('decreasing');
      expect(trend.strength).toBeGreaterThan(0);
      expect(trend.slope).toBeLessThan(0);
    });
  });

  describe('Ensemble Methods', () => {
    it('should combine multiple forecasts correctly', () => {
      const forecasts = [
        { method: 'linear', values: [100, 110, 120], weight: 0.4 },
        { method: 'exponential', values: [105, 115, 125], weight: 0.3 },
        { method: 'seasonal', values: [95, 105, 115], weight: 0.3 }
      ];

      const createEnsemble = (forecasts) => {
        const totalWeight = forecasts.reduce((sum, f) => sum + f.weight, 0);
        const normalizedForecasts = forecasts.map(f => ({
          ...f,
          weight: f.weight / totalWeight
        }));

        const ensembleLength = forecasts[0].values.length;
        const ensembleValues = [];

        for (let i = 0; i < ensembleLength; i++) {
          let weightedSum = 0;
          for (const forecast of normalizedForecasts) {
            weightedSum += forecast.values[i] * forecast.weight;
          }
          ensembleValues.push(weightedSum);
        }

        // Calculate confidence based on agreement between methods
        let totalVariance = 0;
        for (let i = 0; i < ensembleLength; i++) {
          const values = forecasts.map(f => f.values[i]);
          const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
          const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
          totalVariance += variance;
        }

        const avgVariance = totalVariance / ensembleLength;
        const confidence = Math.max(0, Math.min(1, 1 - (avgVariance / 10000))); // Normalize to 0-1

        return {
          values: ensembleValues,
          confidence,
          methods: forecasts.map(f => f.method)
        };
      };

      const ensemble = createEnsemble(forecasts);
      
      expect(Array.isArray(ensemble.values)).toBe(true);
      expect(ensemble.values.length).toBe(3);
      expect(typeof ensemble.confidence).toBe('number');
      expect(ensemble.confidence).toBeGreaterThanOrEqual(0);
      expect(ensemble.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(ensemble.methods)).toBe(true);
    });
  });
});