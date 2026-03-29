/**
 * Process Model Routes
 * API endpoints for process model definitions by module and company type
 */
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { apiError } from '../utils/apiError.js';

const processModelRoutes = new Hono();

function getDB(env) {
  return env.TRADEAI_DB || env.DB;
}

// GET /process-model/:module/:companyType - Get process model
processModelRoutes.get('/:module/:companyType', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const module = c.req.param('module');
    const companyType = c.req.param('companyType');
    const user = c.get('user');
    const tenantId = user.companyId || c.get('tenantId');

    const model = await db.prepare(`
      SELECT * FROM process_models
      WHERE module = ? AND company_type = ? AND tenant_id = ?
    `).bind(module, companyType, tenantId).first();

    if (!model) {
      // Return default model structure
      return c.json({
        success: true,
        data: {
          module,
          companyType,
          stages: [],
          transitions: [],
        }
      });
    }

    return c.json({
      success: true,
      data: {
        ...model,
        stages: model.stages ? JSON.parse(model.stages) : [],
        transitions: model.transitions ? JSON.parse(model.transitions) : [],
      }
    });
  } catch (error) {
    return apiError(c, error, 'processModel.get');
  }
});

// GET /process-model/:module/:companyType/stage/:entityId - Get stage for entity
processModelRoutes.get('/:module/:companyType/stage/:entityId', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const module = c.req.param('module');
    const companyType = c.req.param('companyType');
    const entityId = c.req.param('entityId');

    // Try to get the current stage for this entity
    const stage = await db.prepare(`
      SELECT * FROM process_stages
      WHERE entity_id = ? AND module = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).bind(entityId, module).first();

    return c.json({
      success: true,
      data: stage || { entityId, module, companyType, currentStage: 'draft', progress: 0 }
    });
  } catch (error) {
    return apiError(c, error, 'processModel.getStage');
  }
});

export { processModelRoutes };
