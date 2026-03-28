/**
 * AI/ML Service Routes
 * API endpoints for AI suggestions, predictions, and optimization
 * 
 * Endpoints:
 * POST   /api/ai/suggestions          - Get AI suggestions for step
 * GET    /api/ai/recommendations/:processId - Get recommendations
 * GET    /api/ml/predict/:processId/completion - Predict completion
 * GET    /api/ml/predict/:processId/success - Predict success rate
 * GET    /api/ml/predict/:processId/bottlenecks - Predict bottlenecks
 * POST   /api/ai/optimize/:processId  - Optimize process
 * POST   /api/ai/analyze/:processId/bottlenecks - Analyze bottlenecks
 * POST   /api/ml/scenario/:processId  - Run scenario analysis
 */

import { Router } from 'itty-router';
import { createResponse, handleError } from '../utils/response.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ============================================================================
// Helper Functions
// ============================================================================

function getDB(env) {
  return env.TRADEAI_DB || env.DB;
}

/**
 * Generate AI suggestions based on process data
 * In production, this would call actual ML models
 * For now, uses rule-based heuristics
 */
async function generateAISuggestions(db, processId, stepId, context) {
  // Get process and step data
  const process = await db.prepare(`
    SELECT * FROM processes WHERE process_id = ?
  `).bind(processId).first();

  const steps = await db.prepare(`
    SELECT * FROM process_steps WHERE process_id = ? ORDER BY step_order
  `).bind(processId).all();

  const recommendations = [];
  
  // Rule 1: Check for bottlenecks
  const inProgressSteps = steps.results?.filter(s => s.status === 'in_progress') || [];
  for (const step of inProgressSteps) {
    if (step.actual_minutes && step.estimated_minutes) {
      const ratio = step.actual_minutes / step.estimated_minutes;
      if (ratio > 1.5) {
        recommendations.push({
          id: `bottleneck-${step.step_id}`,
          type: 'warning',
          title: 'Potential Bottleneck Detected',
          description: `${step.step_name} is taking ${Math.round(ratio * 100)}% of estimated time. Consider adding resources or reviewing scope.`,
          confidence: Math.min(95, 60 + ratio * 10),
          impact: 'high',
          action: 'Review resource allocation',
          relatedSteps: [step.step_id],
        });
      }
    }
  }

  // Rule 2: Check for parallelization opportunities
  const pendingSteps = steps.results?.filter(s => s.status === 'pending') || [];
  if (pendingSteps.length >= 2) {
    recommendations.push({
      id: 'parallel-opportunity',
      type: 'optimization',
      title: 'Parallelization Opportunity',
      description: `${pendingSteps.length} pending steps could potentially run in parallel, saving an estimated ${pendingSteps.length * 2} hours.`,
      confidence: 75,
      impact: 'medium',
      action: 'Review step dependencies',
    });
  }

  // Rule 3: Historical insights
  const similarProcesses = await db.prepare(`
    SELECT * FROM processes 
    WHERE type = ? AND status = 'completed'
    ORDER BY completed_at DESC
    LIMIT 5
  `).bind(process.type).all();

  if (similarProcesses.results?.length > 0) {
    const avgTime = similarProcesses.results.reduce((sum, p) => {
      const metrics = JSON.parse(p.metadata || '{}');
      return sum + (metrics.totalDuration || 0);
    }, 0) / similarProcesses.results.length;

    if (avgTime > 0) {
      recommendations.push({
        id: 'historical-insight',
        type: 'insight',
        title: 'Historical Performance',
        description: `Similar processes completed in an average of ${Math.round(avgTime / 60)} hours. Current estimate is ${process.estimated_hours || 'unknown'} hours.`,
        confidence: 80,
        impact: 'low',
      });
    }
  }

  // Rule 4: Resource optimization
  if (context?.formData?.budget) {
    const budgetUtilization = context.formData.budget.utilized / context.formData.budget.total;
    if (budgetUtilization < 0.5) {
      recommendations.push({
        id: 'budget-optimization',
        type: 'suggestion',
        title: 'Budget Underutilization',
        description: `Only ${Math.round(budgetUtilization * 100)}% of budget utilized. Consider reallocating or requesting reduction.`,
        confidence: 85,
        impact: 'medium',
        action: 'Review budget allocation',
      });
    }
  }

  // If no recommendations generated, provide generic helpful tips
  if (recommendations.length === 0) {
    recommendations.push(
      {
        id: 'generic-1',
        type: 'suggestion',
        title: 'Review Step Requirements',
        description: 'Ensure all prerequisites are met before proceeding to next steps.',
        confidence: 50,
        impact: 'low',
        action: 'Review checklist',
      },
      {
        id: 'generic-2',
        type: 'insight',
        title: 'Consider Automation',
        description: 'Manual steps could potentially be automated to save time and reduce errors.',
        confidence: 40,
        impact: 'low',
        action: 'Explore automation options',
      }
    );
  }

  return {
    success: true,
    recommendations,
    overallConfidence: recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length,
  };
}

/**
 * Predict process completion time
 * Uses historical data and current progress
 */
async function predictCompletion(db, processId) {
  const process = await db.prepare(`
    SELECT * FROM processes WHERE process_id = ?
  `).bind(processId).first();

  const steps = await db.prepare(`
    SELECT * FROM process_steps WHERE process_id = ? ORDER BY step_order
  `).bind(processId).all();

  if (!process || !steps.results?.length) {
    return {
      type: 'completion_time',
      value: 'Unable to predict',
      confidence: 0,
      factors: ['Insufficient data'],
    };
  }

  // Calculate remaining time
  const completedSteps = steps.results.filter(s => s.status === 'completed');
  const remainingSteps = steps.results.filter(s => s.status !== 'completed');

  // Average time per completed step
  const avgTimePerStep = completedSteps.reduce((sum, s) => sum + (s.actual_minutes || s.estimated_minutes || 0), 0) / 
    (completedSteps.length || 1);

  // Estimated remaining time
  const estimatedRemaining = remainingSteps.reduce((sum, s) => {
    return sum + (s.estimated_minutes || avgTimePerStep);
  }, 0);

  // Adjust based on performance
  const performanceRatio = completedSteps.length > 0 
    ? completedSteps.reduce((sum, s) => sum + ((s.actual_minutes || 0) / (s.estimated_minutes || 1)), 0) / completedSteps.length
    : 1;

  const adjustedRemaining = estimatedRemaining * performanceRatio;

  // Calculate completion date
  const completionDate = new Date();
  completionDate.setMinutes(completionDate.getMinutes() + adjustedRemaining);

  return {
    type: 'completion_time',
    value: completionDate.toISOString(),
    confidence: Math.min(95, 50 + completedSteps.length * 10),
    dateRange: {
      start: new Date(),
      end: completionDate,
    },
    factors: [
      `${completedSteps.length} of ${steps.results.length} steps completed`,
      `Average step time: ${Math.round(avgTimePerStep)} minutes`,
      `Performance ratio: ${performanceRatio.toFixed(2)}x`,
      `${remainingSteps.length} steps remaining`,
    ],
    scenarios: [
      {
        name: 'Optimistic',
        value: new Date(Date.now() + adjustedRemaining * 0.8 * 60000).toISOString(),
        probability: 25,
      },
      {
        name: 'Most Likely',
        value: completionDate.toISOString(),
        probability: 50,
      },
      {
        name: 'Pessimistic',
        value: new Date(Date.now() + adjustedRemaining * 1.5 * 60000).toISOString(),
        probability: 25,
      },
    ],
  };
}

/**
 * Predict success probability
 */
async function predictSuccess(db, processId) {
  const metrics = await db.prepare(`
    SELECT * FROM process_metrics WHERE process_id = ?
  `).bind(processId).first();

  if (!metrics) {
    return {
      type: 'success_rate',
      value: 75,
      confidence: 50,
      factors: ['Based on industry average'],
    };
  }

  // Calculate success probability based on various factors
  let probability = metrics.health_score || 75;
  const factors = [];

  // Factor 1: Progress
  if (metrics.progress > 50) {
    probability += 10;
    factors.push('Good progress (>50%)');
  }

  // Factor 2: Bottlenecks
  if (metrics.bottleneck_count > 0) {
    probability -= metrics.bottleneck_count * 5;
    factors.push(`${metrics.bottleneck_count} bottleneck(s) detected`);
  }

  // Factor 3: Error rate
  if (metrics.errors > 0) {
    probability -= metrics.errors * 10;
    factors.push(`${metrics.errors} error(s) in process`);
  }

  probability = Math.max(0, Math.min(100, probability));

  return {
    type: 'success_rate',
    value: probability,
    confidence: 70 + (metrics.total_steps > 0 ? metrics.completed_steps / metrics.total_steps * 20 : 0),
    factors: factors.length > 0 ? factors : ['No significant risk factors'],
  };
}

/**
 * Predict bottlenecks
 */
async function predictBottlenecks(db, processId) {
  const steps = await db.prepare(`
    SELECT * FROM process_steps 
    WHERE process_id = ? AND status = 'in_progress'
    ORDER BY step_order
  `).bind(processId).all();

  const bottlenecks = [];

  for (const step of steps.results || []) {
    if (step.actual_minutes && step.estimated_minutes) {
      const ratio = step.actual_minutes / step.estimated_minutes;
      if (ratio > 1.3) {
        bottlenecks.push({
          stepId: step.step_id,
          stepName: step.step_name,
          severity: ratio > 2 ? 'high' : ratio > 1.5 ? 'medium' : 'low',
          actualTime: step.actual_minutes,
          estimatedTime: step.estimated_minutes,
          variance: Math.round((ratio - 1) * 100),
        });
      }
    }
  }

  return {
    type: 'bottleneck',
    value: bottlenecks,
    confidence: bottlenecks.length > 0 ? 80 : 50,
    factors: bottlenecks.map(b => `${b.stepName}: ${b.variance}% over estimate`),
  };
}

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/ai/suggestions
 * Get AI suggestions for a process step
 */
router.post('/ai/suggestions', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const body = await request.json();
    
    const { processId, stepId, context } = body;
    
    if (!processId) {
      return createResponse({
        success: false,
        error: 'processId is required',
      }, 400);
    }

    const suggestions = await generateAISuggestions(db, processId, stepId, context);
    
    // Cache recommendations
    for (const rec of suggestions.recommendations) {
      await db.prepare(`
        INSERT OR REPLACE INTO ai_recommendations 
        (recommendation_id, process_id, step_id, recommendation_type, title, description, confidence_score, impact_level, suggested_action)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        rec.id,
        processId,
        stepId || null,
        rec.type,
        rec.title,
        rec.description,
        rec.confidence,
        rec.impact,
        rec.action || null
      ).run();
    }
    
    return createResponse(suggestions);
  } catch (error) {
    return handleError(error, 'Failed to get AI suggestions');
  }
});

/**
 * GET /api/ai/recommendations/:processId
 * Get AI recommendations for a process
 */
router.get('/ai/recommendations/:processId', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const { processId } = request.params;
    const { type } = request.query;
    
    let query = `
      SELECT * FROM ai_recommendations
      WHERE process_id = ?
    `;
    
    const params = [processId];
    
    if (type) {
      query += ' AND recommendation_type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY confidence_score DESC, created_at DESC';
    
    const result = await db.prepare(query).bind(...params).all();
    
    return createResponse({
      success: true,
      data: result.results || [],
    });
  } catch (error) {
    return handleError(error, 'Failed to get recommendations');
  }
});

/**
 * GET /api/ml/predict/:processId/completion
 * Predict process completion time
 */
router.get('/ml/predict/:processId/completion', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const { processId } = request.params;
    
    const prediction = await predictCompletion(db, processId);
    
    // Cache prediction
    await db.prepare(`
      INSERT OR REPLACE INTO predictions 
      (prediction_id, process_id, prediction_type, predicted_value, confidence_score, factors, valid_until)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      processId,
      prediction.type,
      prediction.value,
      prediction.confidence,
      JSON.stringify(prediction.factors),
      new Date(Date.now() + 60 * 60 * 1000) // Valid for 1 hour
    ).run();
    
    return createResponse({
      success: true,
      data: prediction,
    });
  } catch (error) {
    return handleError(error, 'Failed to predict completion');
  }
});

/**
 * GET /api/ml/predict/:processId/success
 * Predict success rate
 */
router.get('/ml/predict/:processId/success', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const { processId } = request.params;
    
    const prediction = await predictSuccess(db, processId);
    
    return createResponse({
      success: true,
      data: prediction,
    });
  } catch (error) {
    return handleError(error, 'Failed to predict success rate');
  }
});

/**
 * GET /api/ml/predict/:processId/bottlenecks
 * Predict bottlenecks
 */
router.get('/ml/predict/:processId/bottlenecks', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const { processId } = request.params;
    
    const prediction = await predictBottlenecks(db, processId);
    
    return createResponse({
      success: true,
      data: prediction,
    });
  } catch (error) {
    return handleError(error, 'Failed to predict bottlenecks');
  }
});

/**
 * POST /api/ai/optimize/:processId
 * Optimize process flow
 */
router.post('/ai/optimize/:processId', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const { processId } = request.params;
    
    const steps = await db.prepare(`
      SELECT * FROM process_steps WHERE process_id = ? ORDER BY step_order
    `).bind(processId).all();

    const originalDuration = steps.results?.reduce((sum, s) => sum + (s.estimated_minutes || 0), 0) || 0;
    
    // Simple optimization: identify parallelization opportunities
    const recommendations = [];
    let timeSavings = 0;

    // Check for parallelizable steps
    const manualSteps = steps.results?.filter(s => s.step_type === 'manual') || [];
    if (manualSteps.length >= 2) {
      recommendations.push({
        type: 'parallelize',
        description: 'Run manual steps in parallel where dependencies allow',
        impact: Math.round(manualSteps.length * 30),
        effort: 'medium',
        steps: manualSteps.map(s => s.step_name),
      });
      timeSavings += manualSteps.length * 30;
    }

    // Check for automation opportunities
    const repetitiveSteps = steps.results?.filter(s => 
      s.step_name.toLowerCase().includes('review') || 
      s.step_name.toLowerCase().includes('approval')
    ) || [];
    if (repetitiveSteps.length > 0) {
      recommendations.push({
        type: 'automate',
        description: 'Automate repetitive review/approval steps',
        impact: Math.round(repetitiveSteps.length * 60),
        effort: 'high',
        steps: repetitiveSteps.map(s => s.step_name),
      });
      timeSavings += repetitiveSteps.length * 60;
    }

    return createResponse({
      success: true,
      data: {
        originalDuration,
        optimizedDuration: originalDuration - timeSavings,
        timeSavings,
        recommendations,
      },
    });
  } catch (error) {
    return handleError(error, 'Failed to optimize process');
  }
});

/**
 * POST /api/ai/analyze/:processId/bottlenecks
 * Analyze process for bottlenecks
 */
router.post('/ai/analyze/:processId/bottlenecks', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const { processId } = request.params;
    
    const prediction = await predictBottlenecks(db, processId);
    
    const severity = prediction.value.length > 2 ? 'high' : prediction.value.length > 0 ? 'medium' : 'low';
    
    const recommendations = [];
    for (const bottleneck of prediction.value) {
      recommendations.push(`Review ${bottleneck.stepName} - currently ${bottleneck.variance}% over estimate`);
    }

    if (recommendations.length === 0) {
      recommendations.push('No significant bottlenecks detected. Continue monitoring.');
    }
    
    return createResponse({
      success: true,
      data: {
        bottlenecks: prediction.value.map(b => b.stepId),
        severity,
        recommendations,
      },
    });
  } catch (error) {
    return handleError(error, 'Failed to analyze bottlenecks');
  }
});

/**
 * POST /api/ml/scenario/:processId
 * Run scenario analysis
 */
router.post('/ml/scenario/:processId', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const { processId } = request.params;
    const { parameters } = await request.json();
    
    // Get baseline metrics
    const metrics = await db.prepare(`
      SELECT * FROM process_metrics WHERE process_id = ?
    `).bind(processId).first();

    // Simulate scenario (simplified)
    const baseline = {
      completionTime: metrics?.avg_completion_time || 1000,
      successRate: metrics?.health_score || 75,
      cost: 10000,
      quality: 80,
    };

    // Apply parameter adjustments
    const scenario = {
      completionTime: baseline.completionTime * (parameters.timeMultiplier || 1),
      successRate: Math.min(100, baseline.successRate + (parameters.qualityBoost || 0)),
      cost: baseline.cost * (parameters.budgetMultiplier || 1),
      quality: Math.min(100, baseline.quality + (parameters.qualityBoost || 0)),
    };

    const comparison = {
      timeChange: Math.round(((scenario.completionTime - baseline.completionTime) / baseline.completionTime) * 100),
      costChange: Math.round(((scenario.cost - baseline.cost) / baseline.cost) * 100),
      successChange: Math.round(scenario.successRate - baseline.successRate),
    };

    const isRecommended = 
      comparison.timeChange < 0 || 
      comparison.successChange > 0 || 
      comparison.costChange < 0;

    return createResponse({
      success: true,
      data: {
        name: parameters.name || 'Custom Scenario',
        description: parameters.description || 'Scenario analysis',
        parameters,
        outcome: scenario,
        comparison,
        riskLevel: comparison.successChange < -10 ? 'high' : comparison.successChange < 0 ? 'medium' : 'low',
        recommended: isRecommended,
      },
    });
  } catch (error) {
    return handleError(error, 'Failed to run scenario analysis');
  }
});

/**
 * POST /api/ai/feedback
 * Submit feedback on AI recommendation
 */
router.post('/ai/feedback', authenticate, async (request, env) => {
  try {
    const { recommendationId, helpful, feedback } = await request.json();
    
    // In production, this would update ML model training data
    console.log(`Feedback received for ${recommendationId}: helpful=${helpful}, feedback="${feedback}"`);
    
    return createResponse({
      success: true,
      message: 'Feedback recorded',
    });
  } catch (error) {
    return handleError(error, 'Failed to submit feedback');
  }
});

/**
 * GET /api/ml/metrics
 * Get ML model performance metrics
 */
router.get('/ml/metrics', authenticate, async (request, env) => {
  try {
    // In production, this would query actual ML model metrics
    // For now, return placeholder data
    return createResponse({
      success: true,
      data: {
        accuracy: 87.5,
        precision: 85.2,
        recall: 89.1,
        lastTrained: new Date().toISOString(),
        trainingSamples: 10000,
      },
    });
  } catch (error) {
    return handleError(error, 'Failed to get model metrics');
  }
});

export default router;
