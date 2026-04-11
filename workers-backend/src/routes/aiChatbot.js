import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { apiError } from '../utils/apiError.js';
import { generateTradeInsights, summarizeData } from '../services/ai.js';
import { rowToDocument } from '../services/d1.js';

const aiChatbotRoutes = new Hono();

aiChatbotRoutes.use('*', authMiddleware);

// In-memory session store for simplicity (should be moved to KV for production)
const sessions = new Map();

// Post a message to the AI chatbot
aiChatbotRoutes.post('/message', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const body = await c.req.json();
    const { message, session_id } = body;

    if (!message) {
      return c.json({ success: false, message: 'Message is required' }, 400);
    }

    const db = c.env.DB;
    
    // 1. Load conversation history from D1
    const history = await db.prepare(`
      SELECT role, content, created_at 
      FROM ai_chat_history 
      WHERE tenant_id = ? AND session_id = ? 
      ORDER BY created_at ASC 
      LIMIT 10
    `).bind(tenantId, session_id || 'default').all();

    const contextMessages = (history.results || []).map(h => ({
      role: h.role,
      content: h.content
    }));

    // 2. Build Data Context for the AI
    const dataContext = await buildDataContext(c);

    // 3L. Call AI service to generate insights
    const aiResult = await generateTradeInsights(c.env, {
      dataContext: `Current Tenant Data Summary: ${dataContext}\nConversation History: ${JSON.stringify(contextMessages)}`,
      question: message
    });

    if (aiResult.fallback) {
      return c.json({
      success: true,
      data: {
        reply: 'I can help you with trade promotions, budgets, claims, and analytics. What would you like to know?',
        suggestions: [
          'Show me pending approvals',
          'What are my top performing promotions?',
          'Help me create a new trade spend',
        ],
      }
    });
    }

    const reply = aiResult.response;

    // 4. Persist both user and assistant messages
    await db.prepare(`
      INSERT INTO ai_chat_history (tenant_id, user_id, message, role, session_id, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(tenantId, userId, message, 'user', session_id || 'default').run();

    await db.prepare(`
      INSERT INTO ai_chat_history (tenant_id, user_id, message, role, session_id, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(tenantId, userId, reply, 'assistant', session_id || 'default').run();

    return c.json({
      success: true,
      data: {
        reply: reply,
        suggestions: generateSuggestions(reply)
      }
    });
  } catch (error) {
    return apiError(c, error, 'aiChatbot.message');
  }
});

// Get conversation history
aiChatbotRoutes.get('/history', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const { session_id = 'default', limit = 20, offset = 0 } = c.req.query();

    const history = await c.env.DB.prepare(`
      SELECT id, message, role, created_at 
      FROM ai_chat_history 
      WHERE tenant_id = ? AND user_id = ? AND session_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(tenantId, userId, session_id, limit, offset).all();

    return c.json({
      success: true,
      data: (history.results || []).map(h => ({
        id: h.id,
        message: h.content || h.message,
        role: h.role,
        createdAt: h.created_at
      }))
    });
  } catch (error) {
    return apiError(c, error, 'aiChatbot.history');
  }
});

// Get contextual suggestions
aiChatbotRoutes.get('/suggestions', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');

    const data = await buildDataContext(c);
    const suggestions = await generateSuggestionsFromAI(c.env, data);

    return c.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    return apiError(c, error, 'aiChatbot.suggestions');
  }
});

async function buildDataContext(c) {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');

  const promoCount = await db.prepare('SELECT COUNT(*) as count FROM promotions WHERE tenant_id = ? AND status = \'active\'').bind(tenantId).first();
  const budgetCount = await db.prepare('SELECT COUNT(*) as count FROM budgets WHERE tenant_id = ?').bind(tenantId).first();
  const claimsCount = await db.prepare('SELECT COUNT(*) as count FROM claims WHERE tenant_id = ? AND status = \'pending\'').bind(tenantId).first();

  return `Promotions: ${promoCount?.count || 0}, Budgets: ${budgetCount?.count || 0}, Pending Claims: ${claimsCount?.count || 0}`;
}

async function generateSuggestionsFromAI(env, context) {
  const result = await generateTradeInsights(env, {
    dataContext: context,
    question: 'Generate 3 concise, actionable suggestions for the user based on this data. Return them as a JSON array of strings.'
  });
  
  try {
    const parsed = JSON.parse(result.response);
    return Array.isArray(parsed) ? parsed : ['Review pending claims', 'Check budget utilization', 'Analyze promotion ROI'];
  } catch {
    return ['Review pending claims', 'Check budget utilization', 'Analyze promotion ROI'];
  }
}

function generateSuggestions(reply) {
  const patterns = {
    'approval': ['Show me pending approvals', 'How do I approve a promotion?'],
    'budget': ['Check budget utilization', 'What is my remaining budget?'],
    'claim': ['Review pending claims', 'How to settle a claim?'],
    'promotion': ['Analyze promotion ROI', 'Compare top promotions'],
    'general': ['Help me create a new trade spend', 'What can TradeAI do?']
  };

  for (const [key, suggestions] of Object.entries(patterns)) {
    if (reply.toLowerCase().includes(key)) return suggestions;
  }
  return patterns.general;
}

export { aiChatbotRoutes };
