import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

// Import routes
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { customerRoutes } from './routes/customers.js';
import { productRoutes } from './routes/products.js';
import { promotionRoutes } from './routes/promotions.js';
import { budgetRoutes } from './routes/budgets.js';
import { tradeSpendRoutes } from './routes/tradeSpends.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { reportingRoutes } from './routes/reporting.js';
import { analyticsRoutes } from './routes/analytics.js';
import { simulationsRoutes } from './routes/simulations.js';
import { aiOrchestratorRoutes } from './routes/aiOrchestrator.js';
import { optimizerRoutes } from './routes/optimizer.js';
import { recommendationsRoutes } from './routes/recommendations.js';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());

// CORS configuration
app.use('*', cors({
  origin: [
    'https://tradeai.vantax.co.za',
    'https://tradeai-frontend.pages.dev',
    'http://localhost:3000',
    'http://localhost:12000'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Company-Code', 'X-Tenant-Id'],
  credentials: true,
  maxAge: 86400,
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    platform: 'cloudflare-workers'
  });
});

app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    platform: 'cloudflare-workers'
  });
});

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/customers', customerRoutes);
app.route('/api/products', productRoutes);
app.route('/api/promotions', promotionRoutes);
app.route('/api/budgets', budgetRoutes);
app.route('/api/trade-spends', tradeSpendRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/reporting', reportingRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/simulations', simulationsRoutes);
app.route('/api/ai-orchestrator', aiOrchestratorRoutes);
app.route('/api/optimizer', optimizerRoutes);
app.route('/api/recommendations', recommendationsRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    message: 'Route not found',
    path: c.req.path
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    success: false,
    message: err.message || 'Internal server error',
    ...(c.env.ENVIRONMENT !== 'production' && { stack: err.stack })
  }, 500);
});

export default app;
