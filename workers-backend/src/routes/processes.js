/**
 * Process Management Routes
 * API endpoints for process tracking, workflow management, and analytics
 * 
 * Endpoints:
 * GET    /api/processes              - List all processes
 * GET    /api/processes/:id          - Get process by ID
 * POST   /api/processes              - Create new process
 * PUT    /api/processes/:id          - Update process
 * DELETE /api/processes/:id          - Delete process
 * POST   /api/processes/:id/advance  - Advance to next step
 * POST   /api/processes/:id/retreat  - Go back to previous step
 * GET    /api/processes/:id/metrics  - Get process metrics
 * GET    /api/processes/:id/history  - Get process history
 * PATCH  /api/processes/:id/steps/:stepId/status - Update step status
 */

import { Router } from 'itty-router';
import { createResponse, handleError, validateRequest } from '../utils/response.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get D1 database connection
 */
function getDB(env) {
  return env.TRADEAI_DB || env.DB;
}

/**
 * Validate process data
 */
function validateProcessData(data) {
  const errors = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Process name is required');
  }
  
  if (!data.type || !['trade_spend', 'promotion', 'budget', 'claim'].includes(data.type)) {
    errors.push('Valid process type is required');
  }
  
  return errors;
}

/**
 * Calculate process metrics
 */
async function calculateProcessMetrics(db, processId) {
  try {
    // Get step counts by status
    const stepCounts = await db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM process_steps
      WHERE process_id = ?
      GROUP BY status
    `).bind(processId).first();

    // Get average completion time
    const avgTime = await db.prepare(`
      SELECT AVG(actual_minutes) as avg_time
      FROM process_steps
      WHERE process_id = ? AND status = 'completed'
    `).bind(processId).first();

    // Get bottleneck steps (taking longer than estimated)
    const bottlenecks = await db.prepare(`
      SELECT step_id, step_name, actual_minutes, estimated_minutes
      FROM process_steps
      WHERE process_id = ? 
        AND status = 'in_progress'
        AND actual_minutes > (estimated_minutes * 1.5)
    `).bind(processId).all();

    // Calculate overall progress
    const totalSteps = await db.prepare(`
      SELECT COUNT(*) as total
      FROM process_steps
      WHERE process_id = ?
    `).bind(processId).first();

    const completedSteps = await db.prepare(`
      SELECT COUNT(*) as completed
      FROM process_steps
      WHERE process_id = ? AND status = 'completed'
    `).bind(processId).first();

    const progress = totalSteps.total > 0 
      ? Math.round((completedSteps.completed / totalSteps.total) * 100) 
      : 0;

    return {
      progress,
      completed: completedSteps.completed || 0,
      inProgress: stepCounts?.in_progress || 0,
      pending: stepCounts?.pending || 0,
      blocked: stepCounts?.blocked || 0,
      errors: stepCounts?.error || 0,
      estimatedTimeRemaining: 0, // TODO: Calculate
      actualTimeElapsed: avgTime?.avg_time || 0,
      bottlenecks: bottlenecks.results?.map(b => b.step_id) || [],
      healthScore: calculateHealthScore(progress, stepCounts),
    };
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return {
      progress: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      blocked: 0,
      errors: 0,
      bottlenecks: [],
      healthScore: 0,
    };
  }
}

/**
 * Calculate health score (0-100)
 */
function calculateHealthScore(progress, stepCounts) {
  let score = progress;
  
  // Deduct for errors
  if (stepCounts?.error > 0) {
    score -= stepCounts.error * 10;
  }
  
  // Deduct for blocked steps
  if (stepCounts?.blocked > 0) {
    score -= stepCounts.blocked * 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/processes
 * List all processes with optional filtering
 */
router.get('/processes', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const { type, status, limit = 50, offset = 0 } = request.query;
    
    let query = `
      SELECT 
        p.*,
        COUNT(ps.step_id) as step_count,
        SUM(CASE WHEN ps.status = 'completed' THEN 1 ELSE 0 END) as completed_steps
      FROM processes p
      LEFT JOIN process_steps ps ON p.process_id = ps.process_id
      WHERE p.tenant_id = ?
    `;
    
    const params = [request.user.tenantId];
    
    if (type) {
      query += ' AND p.type = ?';
      params.push(type);
    }
    
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }
    
    query += `
      GROUP BY p.process_id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.prepare(query).bind(...params).all();
    
    return createResponse({
      success: true,
      data: result.results || [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.results?.length || 0,
      },
    });
  } catch (error) {
    return handleError(error, 'Failed to list processes');
  }
});

/**
 * GET /api/processes/:id
 * Get single process with steps
 */
router.get('/processes/:id', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const { id } = request.params;
    
    // Get process details
    const process = await db.prepare(`
      SELECT * FROM processes
      WHERE process_id = ? AND tenant_id = ?
    `).bind(id, request.user.tenantId).first();
    
    if (!process) {
      return createResponse({
        success: false,
        error: 'Process not found',
      }, 404);
    }
    
    // Get steps
    const steps = await db.prepare(`
      SELECT * FROM process_steps
      WHERE process_id = ?
      ORDER BY step_order ASC
    `).bind(id).all();
    
    // Calculate metrics
    const metrics = await calculateProcessMetrics(db, id);
    
    return createResponse({
      success: true,
      data: {
        ...process,
        steps: steps.results || [],
        metrics,
      },
    });
  } catch (error) {
    return handleError(error, 'Failed to get process');
  }
});

/**
 * POST /api/processes
 * Create new process
 */
router.post('/processes', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const body = await request.json();
    
    // Validate
    const errors = validateProcessData(body);
    if (errors.length > 0) {
      return createResponse({
        success: false,
        error: errors.join(', '),
      }, 400);
    }
    
    const processId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Insert process
    await db.prepare(`
      INSERT INTO processes (
        process_id, tenant_id, name, type, description, 
        status, owner_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      processId,
      request.user.tenantId,
      body.name,
      body.type,
      body.description || null,
      body.status || 'pending',
      body.ownerId || request.user.userId,
      now,
      now
    ).run();
    
    // Insert steps if provided
    if (body.steps && Array.isArray(body.steps)) {
      for (const [index, step] of body.steps.entries()) {
        await db.prepare(`
          INSERT INTO process_steps (
            process_id, step_id, step_name, step_order,
            status, estimated_minutes, assignee_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          processId,
          step.id || crypto.randomUUID(),
          step.name || step.title,
          index,
          step.status || 'pending',
          step.estimated_minutes || step.estimatedTime || null,
          step.assignee_id || step.assignee || null
        ).run();
      }
    }
    
    return createResponse({
      success: true,
      data: { processId },
      message: 'Process created successfully',
    }, 201);
  } catch (error) {
    return handleError(error, 'Failed to create process');
  }
});

/**
 * PUT /api/processes/:id
 * Update process
 */
router.put('/processes/:id', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const { id } = request.params;
    const body = await request.json();
    
    // Check if process exists
    const existing = await db.prepare(`
      SELECT * FROM processes
      WHERE process_id = ? AND tenant_id = ?
    `).bind(id, request.user.tenantId).first();
    
    if (!existing) {
      return createResponse({
        success: false,
        error: 'Process not found',
      }, 404);
    }
    
    // Update process
    const fields = [];
    const params = [];
    
    if (body.name) {
      fields.push('name = ?');
      params.push(body.name);
    }
    
    if (body.description !== undefined) {
      fields.push('description = ?');
      params.push(body.description);
    }
    
    if (body.status) {
      fields.push('status = ?');
      params.push(body.status);
    }
    
    if (body.ownerId) {
      fields.push('owner_id = ?');
      params.push(body.ownerId);
    }
    
    fields.push('updated_at = ?');
    params.push(new Date().toISOString());
    
    params.push(id, request.user.tenantId);
    
    await db.prepare(`
      UPDATE processes
      SET ${fields.join(', ')}
      WHERE process_id = ? AND tenant_id = ?
    `).bind(...params).run();
    
    return createResponse({
      success: true,
      message: 'Process updated successfully',
    });
  } catch (error) {
    return handleError(error, 'Failed to update process');
  }
});

/**
 * DELETE /api/processes/:id
 * Delete process
 */
router.delete('/processes/:id', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const { id } = request.params;
    
    // Delete steps first (cascade)
    await db.prepare(`
      DELETE FROM process_steps
      WHERE process_id = ?
    `).bind(id).run();
    
    // Delete process
    await db.prepare(`
      DELETE FROM processes
      WHERE process_id = ? AND tenant_id = ?
    `).bind(id, request.user.tenantId).run();
    
    return createResponse({
      success: true,
      message: 'Process deleted successfully',
    });
  } catch (error) {
    return handleError(error, 'Failed to delete process');
  }
});

/**
 * POST /api/processes/:id/advance
 * Advance to next step
 */
router.post('/processes/:id/advance', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const { id } = request.params;
    
    // Get current active step
    const currentStep = await db.prepare(`
      SELECT * FROM process_steps
      WHERE process_id = ? AND status = 'in_progress'
      ORDER BY step_order ASC
      LIMIT 1
    `).bind(id).first();
    
    if (!currentStep) {
      return createResponse({
        success: false,
        error: 'No active step found',
      }, 400);
    }
    
    // Mark current as completed
    await db.prepare(`
      UPDATE process_steps
      SET status = 'completed', completed_at = ?
      WHERE step_id = ?
    `).bind(new Date().toISOString(), currentStep.step_id).run();
    
    // Get next step
    const nextStep = await db.prepare(`
      SELECT * FROM process_steps
      WHERE process_id = ? AND step_order > ?
      ORDER BY step_order ASC
      LIMIT 1
    `).bind(id, currentStep.step_order).first();
    
    if (nextStep) {
      // Activate next step
      await db.prepare(`
        UPDATE process_steps
        SET status = 'in_progress', started_at = ?
        WHERE step_id = ?
      `).bind(new Date().toISOString(), nextStep.step_id).run();
      
      return createResponse({
        success: true,
        data: {
          previousStep: currentStep.step_id,
          currentStep: nextStep.step_id,
          completed: true,
        },
      });
    } else {
      // Process complete
      await db.prepare(`
        UPDATE processes
        SET status = 'completed', completed_at = ?
        WHERE process_id = ?
      `).bind(new Date().toISOString(), id).run();
      
      return createResponse({
        success: true,
        data: {
          previousStep: currentStep.step_id,
          currentStep: null,
          completed: true,
        },
        message: 'Process completed!',
      });
    }
  } catch (error) {
    return handleError(error, 'Failed to advance process');
  }
});

/**
 * POST /api/processes/:id/retreat
 * Go back to previous step
 */
router.post('/processes/:id/retreat', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const { id } = request.params;
    
    // Get current active step
    const currentStep = await db.prepare(`
      SELECT * FROM process_steps
      WHERE process_id = ? AND status = 'in_progress'
      ORDER BY step_order ASC
      LIMIT 1
    `).bind(id).first();
    
    if (!currentStep) {
      return createResponse({
        success: false,
        error: 'No active step found',
      }, 400);
    }
    
    // Get previous step
    const previousStep = await db.prepare(`
      SELECT * FROM process_steps
      WHERE process_id = ? AND step_order < ?
      ORDER BY step_order DESC
      LIMIT 1
    `).bind(id, currentStep.step_order).first();
    
    if (!previousStep) {
      return createResponse({
        success: false,
        error: 'Already at first step',
      }, 400);
    }
    
    // Mark current as pending
    await db.prepare(`
      UPDATE process_steps
      SET status = 'pending', started_at = NULL
      WHERE step_id = ?
    `).bind(currentStep.step_id).run();
    
    // Activate previous step
    await db.prepare(`
      UPDATE process_steps
      SET status = 'in_progress', started_at = ?
      WHERE step_id = ?
    `).bind(new Date().toISOString(), previousStep.step_id).run();
    
    return createResponse({
      success: true,
      data: {
        previousStep: previousStep.step_id,
        currentStep: previousStep.step_id,
      },
    });
  } catch (error) {
    return handleError(error, 'Failed to retreat process');
  }
});

/**
 * GET /api/processes/:id/metrics
 * Get process metrics
 */
router.get('/processes/:id/metrics', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const { id } = request.params;
    
    const metrics = await calculateProcessMetrics(db, id);
    
    return createResponse({
      success: true,
      data: metrics,
    });
  } catch (error) {
    return handleError(error, 'Failed to get metrics');
  }
});

/**
 * GET /api/processes/:id/history
 * Get process history/audit log
 */
router.get('/processes/:id/history', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const { id } = request.params;
    
    const history = await db.prepare(`
      SELECT * FROM process_history
      WHERE process_id = ?
      ORDER BY timestamp DESC
      LIMIT 100
    `).bind(id).all();
    
    return createResponse({
      success: true,
      data: history.results || [],
    });
  } catch (error) {
    return handleError(error, 'Failed to get history');
  }
});

/**
 * PATCH /api/processes/:id/steps/:stepId/status
 * Update step status
 */
router.patch('/processes/:id/steps/:stepId/status', authenticate, async (request, env) => {
  try {
    const db = getDB(env);
    const { id, stepId } = request.params;
    const body = await request.json();
    
    if (!body.status) {
      return createResponse({
        success: false,
        error: 'Status is required',
      }, 400);
    }
    
    const validStatuses = ['pending', 'in_progress', 'completed', 'blocked', 'error', 'warning'];
    if (!validStatuses.includes(body.status)) {
      return createResponse({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      }, 400);
    }
    
    await db.prepare(`
      UPDATE process_steps
      SET status = ?, updated_at = ?
      WHERE step_id = ? AND process_id = ?
    `).bind(body.status, new Date().toISOString(), stepId, id).run();
    
    // Log to history
    await db.prepare(`
      INSERT INTO process_history (
        process_id, step_id, action, old_value, new_value, timestamp, user_id
      ) VALUES (?, ?, 'status_change', ?, ?, ?, ?)
    `).bind(
      id,
      stepId,
      body.previousStatus || null,
      body.status,
      new Date().toISOString(),
      request.user.userId
    ).run();
    
    return createResponse({
      success: true,
      message: 'Step status updated',
    });
  } catch (error) {
    return handleError(error, 'Failed to update step status');
  }
});

export default router;
