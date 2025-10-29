#!/bin/bash

###############################################################################
# WEEK 5: Business Simulation & AI/ML Integration
# 
# Create comprehensive business simulation engine with:
# - 30-day positive scenario
# - 30-day negative scenario  
# - AI/ML forecasting
# - Performance reports
###############################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      WEEK 5: Business Simulation & AI/ML             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"

BACKEND_DIR="./backend"
FRONTEND_DIR="./frontend/src"
COMPLETED=0

update_progress() {
    COMPLETED=$((COMPLETED + 1))
    echo -e "${BLUE}[$COMPLETED] $1${NC}"
}

mkdir -p ${BACKEND_DIR}/src/simulation
mkdir -p ${FRONTEND_DIR}/pages/simulation
mkdir -p ${FRONTEND_DIR}/components/simulation

update_progress "Created simulation directory structure"

# ============================================================================
# BUSINESS SIMULATION ENGINE
# ============================================================================

cat > ${BACKEND_DIR}/src/simulation/simulationEngine.js << 'EOF'
/**
 * Business Simulation Engine
 * 
 * Simulates business scenarios over 30-day periods with:
 * - Revenue modeling
 * - Cost dynamics
 * - Margin impact
 * - Rebate effects
 * - Market conditions
 */

const rebateCalculationService = require('../services/rebateCalculationService');

class SimulationEngine {
  constructor() {
    this.scenarios = {
      positive: {
        name: 'Positive Growth Scenario',
        description: '30-day period with strong growth and healthy margins',
        parameters: {
          dailyGrowthRate: 0.015,        // 1.5% daily growth
          volumeIncrease: 0.20,          // 20% volume increase
          marginImprovement: 0.05,       // 5% margin improvement
          promotionEfficiency: 1.3,      // 30% better promo efficiency
          rebateOptimization: 0.85,      // 15% rebate optimization
          churnRate: 0.02,               // 2% customer churn
          marketCondition: 'bull'
        }
      },
      negative: {
        name: 'Negative Pressure Scenario',
        description: '30-day period with margin pressure and market challenges',
        parameters: {
          dailyGrowthRate: -0.01,        // -1% daily decline
          volumeIncrease: -0.15,         // 15% volume decrease
          marginImprovement: -0.10,      // 10% margin erosion
          promotionEfficiency: 0.7,      // 30% worse promo efficiency
          rebateOptimization: 1.15,      // 15% more rebate spending
          churnRate: 0.08,               // 8% customer churn
          marketCondition: 'bear'
        }
      },
      baseline: {
        name: 'Baseline Scenario',
        description: 'Current state with no changes',
        parameters: {
          dailyGrowthRate: 0,
          volumeIncrease: 0,
          marginImprovement: 0,
          promotionEfficiency: 1.0,
          rebateOptimization: 1.0,
          churnRate: 0.05,
          marketCondition: 'neutral'
        }
      }
    };
  }

  /**
   * Run simulation for specified scenario
   * @param {String} scenarioType - 'positive', 'negative', or 'baseline'
   * @param {Object} baseData - Starting business data
   * @param {Number} days - Number of days to simulate (default 30)
   * @returns {Object} - Simulation results
   */
  async runSimulation(scenarioType, baseData, days = 30) {
    const scenario = this.scenarios[scenarioType];
    if (!scenario) {
      throw new Error(`Invalid scenario type: ${scenarioType}`);
    }

    const params = scenario.parameters;
    const results = {
      scenario: scenarioType,
      scenarioName: scenario.name,
      description: scenario.description,
      parameters: params,
      dailyResults: [],
      summary: {},
      recommendations: []
    };

    // Initialize starting values
    let currentRevenue = baseData.dailyRevenue || 100000;
    let currentVolume = baseData.dailyVolume || 5000;
    let currentMargin = baseData.marginPercent || 35;
    let cumulativeRevenue = 0;
    let cumulativeProfit = 0;
    let cumulativeRebates = 0;

    // Simulate each day
    for (let day = 1; day <= days; day++) {
      // Apply growth rate
      currentRevenue *= (1 + params.dailyGrowthRate);
      currentVolume *= (1 + params.dailyGrowthRate);

      // Apply volume change (gradual)
      const volumeAdjustment = 1 + (params.volumeIncrease * (day / days));
      const adjustedVolume = currentVolume * volumeAdjustment;

      // Apply margin changes
      const adjustedMargin = currentMargin + (params.marginImprovement * 100 * (day / days));

      // Calculate revenue
      const dayRevenue = currentRevenue * volumeAdjustment;

      // Calculate COGS
      const dayCOGS = dayRevenue * ((100 - adjustedMargin) / 100);

      // Calculate gross profit
      const dayGrossProfit = dayRevenue - dayCOGS;

      // Calculate promotions (5% of revenue)
      const dayPromotions = dayRevenue * 0.05 * params.promotionEfficiency;

      // Calculate rebates (3% of revenue)
      const dayRebates = dayRevenue * 0.03 * params.rebateOptimization;

      // Calculate net profit
      const dayNetProfit = dayGrossProfit - dayPromotions - dayRebates;
      const dayNetMargin = (dayNetProfit / dayRevenue * 100);

      // Add market volatility (±2%)
      const volatility = (Math.random() - 0.5) * 0.04;
      const volatileRevenue = dayRevenue * (1 + volatility);

      // Store daily result
      results.dailyResults.push({
        day,
        date: new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue: parseFloat(volatileRevenue.toFixed(2)),
        volume: parseFloat(adjustedVolume.toFixed(0)),
        cogs: parseFloat(dayCOGS.toFixed(2)),
        grossProfit: parseFloat(dayGrossProfit.toFixed(2)),
        grossMargin: parseFloat(adjustedMargin.toFixed(2)),
        promotions: parseFloat(dayPromotions.toFixed(2)),
        rebates: parseFloat(dayRebates.toFixed(2)),
        netProfit: parseFloat(dayNetProfit.toFixed(2)),
        netMargin: parseFloat(dayNetMargin.toFixed(2))
      });

      // Accumulate totals
      cumulativeRevenue += volatileRevenue;
      cumulativeProfit += dayNetProfit;
      cumulativeRebates += dayRebates;
    }

    // Calculate summary statistics
    const avgDailyRevenue = cumulativeRevenue / days;
    const avgDailyProfit = cumulativeProfit / days;
    const finalDay = results.dailyResults[days - 1];
    const firstDay = results.dailyResults[0];

    results.summary = {
      totalRevenue: parseFloat(cumulativeRevenue.toFixed(2)),
      totalProfit: parseFloat(cumulativeProfit.toFixed(2)),
      totalRebates: parseFloat(cumulativeRebates.toFixed(2)),
      avgDailyRevenue: parseFloat(avgDailyRevenue.toFixed(2)),
      avgDailyProfit: parseFloat(avgDailyProfit.toFixed(2)),
      avgNetMargin: parseFloat((cumulativeProfit / cumulativeRevenue * 100).toFixed(2)),
      revenueGrowth: parseFloat(((finalDay.revenue - firstDay.revenue) / firstDay.revenue * 100).toFixed(2)),
      marginChange: parseFloat((finalDay.netMargin - firstDay.netMargin).toFixed(2)),
      roi: parseFloat((cumulativeProfit / cumulativeRevenue * 100).toFixed(2))
    };

    // Generate recommendations based on scenario
    results.recommendations = this.generateRecommendations(scenarioType, results.summary);

    return results;
  }

  /**
   * Generate AI-powered recommendations based on simulation results
   */
  generateRecommendations(scenarioType, summary) {
    const recommendations = [];

    if (scenarioType === 'positive') {
      recommendations.push({
        type: 'insight',
        priority: 'high',
        title: 'Strong Growth Momentum',
        message: `Revenue growing at ${summary.revenueGrowth.toFixed(1)}%. Consider increasing inventory to meet demand.`,
        action: 'Increase safety stock by 20%'
      });

      recommendations.push({
        type: 'suggestion',
        priority: 'medium',
        title: 'Margin Optimization Opportunity',
        message: 'Healthy margins allow for strategic investments. Consider expanding product portfolio.',
        action: 'Launch 3-5 new SKUs in high-performing categories'
      });

      recommendations.push({
        type: 'best-practice',
        priority: 'medium',
        title: 'Rebate Program Expansion',
        message: 'Strong performance enables enhanced rebate programs to drive loyalty.',
        action: 'Increase volume rebate tiers by 15%'
      });
    } else if (scenarioType === 'negative') {
      recommendations.push({
        type: 'warning',
        priority: 'high',
        title: 'Margin Pressure Alert',
        message: `Net margin declined by ${Math.abs(summary.marginChange).toFixed(1)}%. Immediate action required.`,
        action: 'Review pricing strategy and reduce low-margin SKUs'
      });

      recommendations.push({
        type: 'suggestion',
        priority: 'high',
        title: 'Cost Reduction Initiative',
        message: 'Revenue decline requires cost optimization. Focus on high-impact areas.',
        action: 'Reduce promotional spending by 10-15%'
      });

      recommendations.push({
        type: 'warning',
        priority: 'medium',
        title: 'Rebate Program Review',
        message: 'Rebate spending may be too aggressive given market conditions.',
        action: 'Tighten rebate eligibility criteria'
      });

      recommendations.push({
        type: 'suggestion',
        priority: 'medium',
        title: 'Customer Retention Focus',
        message: 'Higher churn rate requires enhanced customer engagement.',
        action: 'Launch customer retention campaign'
      });
    } else {
      recommendations.push({
        type: 'insight',
        priority: 'low',
        title: 'Steady State Performance',
        message: 'Business maintaining baseline performance. Opportunities for optimization exist.',
        action: 'Review quarterly goals and KPIs'
      });
    }

    return recommendations;
  }

  /**
   * Compare multiple scenarios
   */
  async compareScenarios(baseData) {
    const positive = await this.runSimulation('positive', baseData);
    const negative = await this.runSimulation('negative', baseData);
    const baseline = await this.runSimulation('baseline', baseData);

    return {
      comparison: {
        revenue: {
          positive: positive.summary.totalRevenue,
          baseline: baseline.summary.totalRevenue,
          negative: negative.summary.totalRevenue,
          bestCase: positive.summary.totalRevenue,
          worstCase: negative.summary.totalRevenue,
          variance: positive.summary.totalRevenue - negative.summary.totalRevenue
        },
        profit: {
          positive: positive.summary.totalProfit,
          baseline: baseline.summary.totalProfit,
          negative: negative.summary.totalProfit,
          bestCase: positive.summary.totalProfit,
          worstCase: negative.summary.totalProfit,
          variance: positive.summary.totalProfit - negative.summary.totalProfit
        },
        margin: {
          positive: positive.summary.avgNetMargin,
          baseline: baseline.summary.avgNetMargin,
          negative: negative.summary.avgNetMargin
        }
      },
      scenarios: {
        positive,
        baseline,
        negative
      }
    };
  }
}

module.exports = new SimulationEngine();
EOF

update_progress "simulationEngine.js created"

# ============================================================================
# AI/ML FORECASTING SERVICE
# ============================================================================

cat > ${BACKEND_DIR}/src/simulation/forecastingService.js << 'EOF'
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
    const values = data.map(d => d.value);
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
EOF

update_progress "forecastingService.js created"

# ============================================================================
# SIMULATION ENDPOINTS
# ============================================================================

cat >> ${BACKEND_DIR}/server-production.js << 'EOBE'

// ============================================================================
// SIMULATION ENDPOINTS
// ============================================================================

const simulationEngine = require('./src/simulation/simulationEngine');
const forecastingService = require('./src/simulation/forecastingService');

// Run business simulation
app.post('/api/simulation/run', protect, catchAsync(async (req, res) => {
  const { scenarioType, baseData, days } = req.body;
  
  const defaultBaseData = {
    dailyRevenue: 100000,
    dailyVolume: 5000,
    marginPercent: 35
  };
  
  const results = await simulationEngine.runSimulation(
    scenarioType || 'baseline',
    baseData || defaultBaseData,
    days || 30
  );
  
  res.json({
    success: true,
    data: results
  });
}));

// Compare all scenarios
app.post('/api/simulation/compare', protect, catchAsync(async (req, res) => {
  const { baseData } = req.body;
  
  const defaultBaseData = {
    dailyRevenue: 100000,
    dailyVolume: 5000,
    marginPercent: 35
  };
  
  const comparison = await simulationEngine.compareScenarios(baseData || defaultBaseData);
  
  res.json({
    success: true,
    data: comparison
  });
}));

// Generate revenue forecast
app.post('/api/simulation/forecast', protect, catchAsync(async (req, res) => {
  const { historicalData, days } = req.body;
  
  // Mock historical data if not provided
  const mockData = [];
  for (let i = 0; i < 60; i++) {
    mockData.push({
      day: i + 1,
      value: 90000 + Math.random() * 20000 + (i * 100)
    });
  }
  
  const forecast = forecastingService.forecastRevenue(
    historicalData || mockData,
    days || 30
  );
  
  const trend = forecastingService.analyzeTrend(historicalData || mockData);
  const anomalies = forecastingService.detectAnomalies(historicalData || mockData);
  
  res.json({
    success: true,
    data: {
      forecast,
      trend,
      anomalies
    }
  });
}));

EOBE

update_progress "Simulation endpoints added"

# ============================================================================
# FRONTEND: SIMULATION DASHBOARD
# ============================================================================

cat > ${FRONTEND_DIR}/pages/simulation/SimulationDashboard.jsx << 'EOF'
import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert
} from '@mui/material';
import { PlayArrow, CompareArrows, TrendingUp, Assessment } from '@mui/icons-material';
import api from '../../services/api';

const SimulationDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [simulationResults, setSimulationResults] = useState(null);
  const [comparisonResults, setComparisonResults] = useState(null);

  const runSimulation = async (scenarioType) => {
    setLoading(true);
    try {
      const response = await api.post('/simulation/run', {
        scenarioType,
        baseData: {
          dailyRevenue: 100000,
          dailyVolume: 5000,
          marginPercent: 35
        },
        days: 30
      });
      
      if (response.data.success) {
        setSimulationResults(response.data.data);
      }
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runComparison = async () => {
    setLoading(true);
    try {
      const response = await api.post('/simulation/compare', {
        baseData: {
          dailyRevenue: 100000,
          dailyVolume: 5000,
          marginPercent: 35
        }
      });
      
      if (response.data.success) {
        setComparisonResults(response.data.data);
      }
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Business Simulation & Forecasting
        </Typography>
        <Typography variant="body1" color="text.secondary">
          30-day scenario modeling and AI-powered forecasts
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            startIcon={<TrendingUp />}
            onClick={() => runSimulation('positive')}
            disabled={loading}
          >
            Positive Scenario
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="contained"
            color="error"
            startIcon={<TrendingUp />}
            onClick={() => runSimulation('negative')}
            disabled={loading}
          >
            Negative Scenario
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<PlayArrow />}
            onClick={() => runSimulation('baseline')}
            disabled={loading}
          >
            Baseline Scenario
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CompareArrows />}
            onClick={runComparison}
            disabled={loading}
          >
            Compare All
          </Button>
        </Grid>
      </Grid>

      {/* Results */}
      {simulationResults && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {simulationResults.scenarioName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {simulationResults.description}
              </Typography>
              
              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Total Revenue
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(simulationResults.summary.totalRevenue)}
                      </Typography>
                      <Chip
                        label={`${simulationResults.summary.revenueGrowth.toFixed(1)}%`}
                        color={simulationResults.summary.revenueGrowth > 0 ? 'success' : 'error'}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Total Profit
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(simulationResults.summary.totalProfit)}
                      </Typography>
                      <Typography variant="caption">
                        ROI: {simulationResults.summary.roi}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Avg Net Margin
                      </Typography>
                      <Typography variant="h5">
                        {simulationResults.summary.avgNetMargin}%
                      </Typography>
                      <Chip
                        label={`${simulationResults.summary.marginChange > 0 ? '+' : ''}${simulationResults.summary.marginChange.toFixed(1)}%`}
                        color={simulationResults.summary.marginChange > 0 ? 'success' : 'error'}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Total Rebates
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(simulationResults.summary.totalRebates)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Recommendations */}
              {simulationResults.recommendations && simulationResults.recommendations.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    AI Recommendations
                  </Typography>
                  {simulationResults.recommendations.map((rec, index) => (
                    <Alert
                      key={index}
                      severity={
                        rec.type === 'warning' ? 'warning' :
                        rec.type === 'insight' ? 'info' :
                        rec.type === 'suggestion' ? 'success' : 'info'
                      }
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="subtitle2">{rec.title}</Typography>
                      <Typography variant="body2">{rec.message}</Typography>
                      {rec.action && (
                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                          <strong>Action:</strong> {rec.action}
                        </Typography>
                      )}
                    </Alert>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Daily Results Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Breakdown (Last 7 Days)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Day</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Gross Profit</TableCell>
                      <TableCell align="right">Net Profit</TableCell>
                      <TableCell align="right">Net Margin</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {simulationResults.dailyResults.slice(-7).map((day) => (
                      <TableRow key={day.day}>
                        <TableCell>{day.day}</TableCell>
                        <TableCell>{day.date}</TableCell>
                        <TableCell align="right">{formatCurrency(day.revenue)}</TableCell>
                        <TableCell align="right">{formatCurrency(day.grossProfit)}</TableCell>
                        <TableCell align="right">{formatCurrency(day.netProfit)}</TableCell>
                        <TableCell align="right">{day.netMargin.toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Comparison Results */}
      {comparisonResults && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Scenario Comparison
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell align="right">Positive</TableCell>
                    <TableCell align="right">Baseline</TableCell>
                    <TableCell align="right">Negative</TableCell>
                    <TableCell align="right">Variance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Total Revenue</TableCell>
                    <TableCell align="right">
                      {formatCurrency(comparisonResults.comparison.revenue.positive)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(comparisonResults.comparison.revenue.baseline)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(comparisonResults.comparison.revenue.negative)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(comparisonResults.comparison.revenue.variance)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Profit</TableCell>
                    <TableCell align="right">
                      {formatCurrency(comparisonResults.comparison.profit.positive)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(comparisonResults.comparison.profit.baseline)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(comparisonResults.comparison.profit.negative)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(comparisonResults.comparison.profit.variance)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Avg Net Margin</TableCell>
                    <TableCell align="right">
                      {comparisonResults.comparison.margin.positive.toFixed(2)}%
                    </TableCell>
                    <TableCell align="right">
                      {comparisonResults.comparison.margin.baseline.toFixed(2)}%
                    </TableCell>
                    <TableCell align="right">
                      {comparisonResults.comparison.margin.negative.toFixed(2)}%
                    </TableCell>
                    <TableCell align="right">
                      {(comparisonResults.comparison.margin.positive - 
                        comparisonResults.comparison.margin.negative).toFixed(2)}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default SimulationDashboard;
EOF

update_progress "SimulationDashboard.jsx created"

# ============================================================================
# TESTS
# ============================================================================

cat > ${FRONTEND_DIR}/__tests__/simulation/SimulationDashboard.test.jsx << 'EOF'
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SimulationDashboard from '../../pages/simulation/SimulationDashboard';

jest.mock('../../services/api');

describe('SimulationDashboard', () => {
  it('should render simulation dashboard', () => {
    render(
      <BrowserRouter>
        <SimulationDashboard />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Business Simulation/i)).toBeInTheDocument();
    expect(screen.getByText(/Positive Scenario/i)).toBeInTheDocument();
    expect(screen.getByText(/Negative Scenario/i)).toBeInTheDocument();
  });
});
EOF

update_progress "Simulation tests created"

echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           WEEK 5: COMPLETE ✅                        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Components Created:${NC}"
echo "  ✅ simulationEngine.js (30-day simulation)"
echo "  ✅ forecastingService.js (AI/ML forecasting)"
echo "  ✅ SimulationDashboard.jsx (frontend UI)"
echo "  ✅ 3 simulation endpoints"
echo "  ✅ Test files"
echo ""
echo -e "${YELLOW}Features:${NC}"
echo "  ✅ Positive scenario (growth + strong margins)"
echo "  ✅ Negative scenario (decline + margin pressure)"
echo "  ✅ Baseline scenario (steady state)"
echo "  ✅ Scenario comparison"
echo "  ✅ AI recommendations"
echo "  ✅ Revenue forecasting"
echo "  ✅ Trend analysis"
echo "  ✅ Anomaly detection"
echo ""
echo -e "${YELLOW}Total Files: $COMPLETED${NC}"
echo ""
echo -e "${BLUE}Next: Test and deploy Week 5${NC}"
