/**
 * AI Service - Wraps Cloudflare Workers AI for LLM inference
 * Provides text generation, summarization, and classification
 */

const AI_MODEL = '@cf/meta/llama-3.1-8b-instruct';
const AI_MODEL_FAST = '@cf/meta/llama-3.1-8b-instruct';

/**
 * Run LLM text generation with Workers AI
 * Falls back to heuristic response if AI binding unavailable
 */
export async function runAIInference(env, { prompt, systemPrompt, maxTokens = 512 }) {
  if (!env.AI) {
    return { response: null, fallback: true, reason: 'AI binding not available' };
  }

  try {
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const result = await env.AI.run(AI_MODEL, {
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    return {
      response: result.response || result.result || (typeof result === 'string' ? result : null),
      fallback: false,
      model: AI_MODEL,
    };
  } catch (error) {
    console.error('Workers AI inference error:', error);
    return { response: null, fallback: true, reason: error.message };
  }
}

/**
 * Generate AI-powered trade promotion insights from data context
 */
export async function generateTradeInsights(env, { dataContext, question }) {
  const systemPrompt = `You are TradeAI, an intelligent trade promotion management assistant for FMCG/CPG companies in South Africa. You analyze trade spend, promotions, budgets, claims, and deductions data. Provide concise, actionable insights with specific numbers. Use ZAR (R) for currency. Be direct and business-focused. Keep responses under 200 words.`;

  const prompt = `Business Data Context:
${dataContext}

User Question: ${question}

Provide a clear, data-driven answer with specific recommendations.`;

  return runAIInference(env, { prompt, systemPrompt, maxTokens: 400 });
}

/**
 * Generate AI-powered promotion recommendations
 */
export async function generatePromoRecommendation(env, { historicalData, customerData, productData }) {
  const systemPrompt = `You are a trade promotion optimization AI. Based on historical promotion performance, customer behavior, and product data, recommend the optimal promotion strategy. Include: promotion type, discount level, duration, expected ROI, and confidence level. Be specific with numbers.`;

  const prompt = `Historical Performance:
${historicalData}

Customer Profile:
${customerData}

Product Data:
${productData}

Recommend the optimal next promotion with specific parameters.`;

  return runAIInference(env, { prompt, systemPrompt, maxTokens: 500 });
}

/**
 * Generate AI-powered anomaly explanation
 */
export async function explainAnomaly(env, { anomalyData, context }) {
  const systemPrompt = `You are a financial anomaly detection AI for trade promotion management. Explain detected anomalies in plain business language and suggest corrective actions. Be concise.`;

  const prompt = `Detected Anomaly:
${anomalyData}

Business Context:
${context}

Explain this anomaly and recommend corrective actions.`;

  return runAIInference(env, { prompt, systemPrompt, maxTokens: 300 });
}

/**
 * Classify user intent for the AI copilot
 */
export async function classifyIntent(env, question) {
  const systemPrompt = `Classify the user's question into one category. Reply with ONLY the category name, nothing else.
Categories: budget, promotion, claim, deduction, approval, customer, product, trade_spend, forecast, anomaly, recommendation, general`;

  return runAIInference(env, { prompt: question, systemPrompt, maxTokens: 20 });
}

/**
 * Generate a natural language summary of data
 */
export async function summarizeData(env, { dataType, data }) {
  const systemPrompt = `You are a business data analyst. Summarize the following ${dataType} data in 2-3 concise sentences with key metrics and trends. Use ZAR (R) for currency.`;

  return runAIInference(env, { prompt: JSON.stringify(data), systemPrompt, maxTokens: 200 });
}
