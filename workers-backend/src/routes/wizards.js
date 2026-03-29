/**
 * Wizard Routes
 * API endpoints for multi-step wizard draft management
 */
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { apiError } from '../utils/apiError.js';

const wizardRoutes = new Hono();

function getDB(env) {
  return env.TRADEAI_DB || env.DB;
}

// POST /wizards/:wizardId/draft - Save wizard draft
wizardRoutes.post('/:wizardId/draft', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const wizardId = c.req.param('wizardId');
    const body = await c.req.json();
    const userId = c.get('userId');
    const now = new Date().toISOString();

    // Upsert draft
    await db.prepare(`
      INSERT INTO wizard_drafts (wizard_id, user_id, data, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(wizard_id, user_id) DO UPDATE SET data = ?, updated_at = ?
    `).bind(wizardId, userId, JSON.stringify(body), now, JSON.stringify(body), now).run();

    return c.json({ success: true, message: 'Draft saved' });
  } catch (error) {
    return apiError(c, error, 'wizards.saveDraft');
  }
});

// GET /wizards/:wizardId/draft - Load wizard draft
wizardRoutes.get('/:wizardId/draft', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const wizardId = c.req.param('wizardId');
    const userId = c.get('userId');

    const draft = await db.prepare(`
      SELECT data FROM wizard_drafts WHERE wizard_id = ? AND user_id = ?
    `).bind(wizardId, userId).first();

    if (!draft) {
      return c.json({ success: false, message: 'No draft found' }, 404);
    }

    return c.json({ success: true, data: JSON.parse(draft.data) });
  } catch (error) {
    return apiError(c, error, 'wizards.loadDraft');
  }
});

// POST /wizards/:wizardId/submit - Submit completed wizard
wizardRoutes.post('/:wizardId/submit', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const wizardId = c.req.param('wizardId');
    const body = await c.req.json();
    const userId = c.get('userId');

    // Delete draft on submit
    await db.prepare(`
      DELETE FROM wizard_drafts WHERE wizard_id = ? AND user_id = ?
    `).bind(wizardId, userId).run();

    return c.json({ success: true, message: 'Wizard submitted successfully', data: { wizardId } });
  } catch (error) {
    return apiError(c, error, 'wizards.submit');
  }
});

// POST /wizards/:wizardId/steps/:stepId/validate - Validate wizard step
wizardRoutes.post('/:wizardId/steps/:stepId/validate', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    // Basic validation - all fields present and non-empty
    const errors = [];
    if (body && typeof body === 'object') {
      for (const [key, value] of Object.entries(body)) {
        if (value === null || value === undefined || value === '') {
          errors.push(`${key} is required`);
        }
      }
    }

    return c.json({ success: true, valid: errors.length === 0, errors });
  } catch (error) {
    return apiError(c, error, 'wizards.validateStep');
  }
});

// DELETE /wizards/:wizardId/draft - Delete wizard draft
wizardRoutes.delete('/:wizardId/draft', authMiddleware, async (c) => {
  try {
    const db = getDB(c.env);
    const wizardId = c.req.param('wizardId');
    const userId = c.get('userId');

    await db.prepare(`
      DELETE FROM wizard_drafts WHERE wizard_id = ? AND user_id = ?
    `).bind(wizardId, userId).run();

    return c.json({ success: true, message: 'Draft deleted' });
  } catch (error) {
    return apiError(c, error, 'wizards.deleteDraft');
  }
});

export { wizardRoutes };
