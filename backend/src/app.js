const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const { tenantIsolation, tenantCleanup } = require('./middleware/tenantIsolation');
const { initSentry, getHandlers } = require('./config/sentry');

console.log('[App.js] tenantIsolation type:', typeof tenantIsolation);
console.log('[App.js] tenantCleanup type:', typeof tenantCleanup);

// Load all models to ensure they are registered with Mongoose
require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const securityRoutes = require('./routes/security');
const userRoutes = require('./routes/user');
const companyRoutes = require('./routes/companyRoutes');
const tradingTermsRoutes = require('./routes/tradingTermsRoutes');
const customerRoutes = require('./routes/customer');
const productRoutes = require('./routes/product');
const vendorRoutes = require('./routes/vendor');
const budgetRoutes = require('./routes/budget');
const promotionRoutes = require('./routes/promotion');
const campaignRoutes = require('./routes/campaign');
const tradeSpendRoutes = require('./routes/tradeSpend');
const activityGridRoutes = require('./routes/activityGrid');
const activitiesRoutes = require('./routes/activities');
const authEnhancedRoutes = require('./routes/auth-enhanced');
const salesHistoryRoutes = require('./routes/salesHistory');
const masterDataRoutes = require('./routes/masterData');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/report');
const analyticsRoutes = require('./routes/analytics');
const advancedAnalyticsRoutes = require('./routes/advancedAnalytics');
const integrationRoutes = require('./routes/integration');
const mlRoutes = require('./routes/ml');
const aiRoutes = require('./routes/ai');
const aiPromotionRoutes = require('./routes/aiPromotion');
const aiChatbotRoutes = require('./routes/aiChatbot');
const aiOrchestratorRoutes = require('./routes/aiOrchestrator');
const ollamaRoutes = require('./routes/ollama');
const salesRoutes = require('./routes/sales');
const inventoryRoutes = require('./routes/inventory');
const tenantRoutes = require('./routes/tenantRoutes');
const healthRoutes = require('./routes/health');
const enterpriseRoutes = require('./routes/enterprise');
const missingRoutesFixRoutes = require('./routes/missing-routes-fix');
const transactionRoutes = require('./routes/transaction');
const baselineRoutes = require('./routes/baseline');
const cannibalizationRoutes = require('./routes/cannibalization');
const forwardBuyRoutes = require('./routes/forwardBuy');
const currencyRoutes = require('./routes/currency');
const rebateRoutes = require('./routes/rebate');
const tradeSpendAnalyticsRoutes = require('./routes/tradeSpendAnalytics');
const simulationsRoutes = require('./routes/simulations');
const recommendationsRoutes = require('./routes/recommendations');
const optimizerRoutes = require('./routes/optimizer');
const conflictsRoutes = require('./routes/conflicts');
const approvalsRoutes = require('./routes/approvals');
const claimsRoutes = require('./routes/claims');
const deductionsRoutes = require('./routes/deductions');
const hierarchyRoutes = require('./routes/hierarchy');

// Create Express app
const app = express();

// Initialize Sentry BEFORE all other middleware
initSentry(app);
const sentryHandlers = getHandlers();

// Track server start time for uptime calculation
const serverStartTime = Date.now();

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

// Trust proxy
app.set('trust proxy', 1);

// Sentry request handler MUST be first middleware
app.use(sentryHandlers.requestHandler);

// Sentry tracing handler
app.use(sentryHandlers.tracingHandler);

// Security middleware - Enhanced with comprehensive security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

// CORS - Production-ready configuration
const corsOptions = {
  origin(origin, callback) {
    // Get allowed origins from environment variable
    const allowedOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
      : ['http://localhost:3000', 'http://localhost:3001'];

    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);

    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // In production, check against whitelist
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`❌ CORS blocked request from origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Body parsing with reduced payload limits for security
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// MongoDB sanitization
app.use(mongoSanitize());

// Compression
app.use(compression());

// Logging
app.use(morgan('combined', { stream: logger.stream }));

// Request logging (only in development)
if (process.env.NODE_ENV === 'development' && process.env.DEBUG_REQUESTS === 'true') {
  app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
  });
}

// Rate limiting - Production security
const {
  apiLimiter,
  authLimiter,
  speedLimiter,
  exportLimiter,
  passwordResetLimiter,
  requestLogger
} = require('./middleware/rateLimiter');

// Apply request logger for security monitoring
app.use(requestLogger);

// Apply general rate limiting to all API routes
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMITING === 'true') {
  app.use('/api/', apiLimiter);
  app.use('/api/', speedLimiter);
  logger.info('✅ Rate limiting enabled');
} else {
  logger.warn('⚠️  Rate limiting disabled (development mode)');
}

// Test middleware to verify middleware execution
app.use('/api', (req, res, next) => {
  console.log('[TEST MIDDLEWARE] Request received:', req.method, req.originalUrl);
  next();
});

// Tenant isolation middleware (before authentication)
console.log('[App.js] About to apply tenantCleanup middleware');
app.use(tenantCleanup);
console.log('[App.js] About to apply tenantIsolation to /api');
app.use('/api', tenantIsolation);
console.log('[App.js] Tenant middlewares applied');

// API Documentation
const swaggerOptions = {
  definition: config.swagger.definition,
  apis: config.swagger.apis
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check routes
app.use('/', healthRoutes);
app.use('/api', healthRoutes);

// Legacy health check support
app.get('/api/health', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Trade AI Backend API',
    version: '1.0.0',
    uptime: uptimeSeconds
  });
});

// Public version endpoint (no authentication required)
app.get('/api/version', (req, res) => {
  res.json({
    version: '2.1.3',
    environment: process.env.NODE_ENV || 'development',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// API Routes
// Auth routes with strict rate limiting (protect against brute force)
app.use('/api/auth', authLimiter, authRoutes);

// Tenant routes
app.use('/api/tenants', tenantRoutes);

// Security routes (router handles its own auth for specific endpoints)
app.use('/api/security', securityRoutes);

// Protected routes with authentication
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/companies', authenticateToken, companyRoutes);
app.use('/api/trading-terms', authenticateToken, tradingTermsRoutes);
app.use('/api/customers', authenticateToken, customerRoutes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/vendors', authenticateToken, vendorRoutes);
app.use('/api/budgets', authenticateToken, budgetRoutes);
app.use('/api/promotions', authenticateToken, promotionRoutes);
app.use('/api/rebates', authenticateToken, rebateRoutes);
app.use('/api/campaigns', authenticateToken, campaignRoutes);
app.use('/api/trade-spends', authenticateToken, tradeSpendRoutes);
app.use('/api/trade-spend-analytics', authenticateToken, tradeSpendAnalyticsRoutes);
app.use('/api/activity-grid', authenticateToken, activityGridRoutes);
app.use('/api/activities', authenticateToken, activitiesRoutes);
app.use('/api/auth-enhanced', authEnhancedRoutes);
app.use('/api/sales-history', authenticateToken, salesHistoryRoutes);
app.use('/api/master-data', authenticateToken, masterDataRoutes);
app.use('/api/dashboards', authenticateToken, dashboardRoutes);

// Reports with export rate limiting (prevent data scraping)
app.use('/api/reports', authenticateToken, exportLimiter, reportRoutes);

// Analytics and ML routes
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/advanced', advancedAnalyticsRoutes); // Phase 2 - Advanced Analytics (has own auth)
app.use('/api/integration', authenticateToken, integrationRoutes);
app.use('/api/ml', authenticateToken, mlRoutes);
app.use('/api/ai', aiRoutes); // AI routes have their own auth middleware
app.use('/api/ai-promotion', authenticateToken, aiPromotionRoutes);
app.use('/api/ai-chatbot', authenticateToken, aiChatbotRoutes);
app.use('/api/ai-orchestrator', aiOrchestratorRoutes); // AI orchestrator with Ollama
app.use('/api/ollama', ollamaRoutes); // Ollama LLM endpoints

// Currency conversion routes
app.use('/api', authenticateToken, currencyRoutes);

// Sales and inventory
app.use('/api/sales', authenticateToken, salesRoutes);
app.use('/api/inventory', authenticateToken, inventoryRoutes);

// Enterprise routes (advanced dashboards, CRUD, simulations, transactions)
app.use('/api/enterprise', authenticateToken, enterpriseRoutes);

// Transaction management
app.use('/api/transactions', authenticateToken, transactionRoutes);

// Analytics routes (baseline, cannibalization, forward buy)
app.use('/api/baseline', authenticateToken, baselineRoutes);
app.use('/api/cannibalization', authenticateToken, cannibalizationRoutes);
app.use('/api/forward-buy', authenticateToken, forwardBuyRoutes);

// Simulation and optimization routes
app.use('/api/simulations', authenticateToken, simulationsRoutes);
app.use('/api/recommendations', authenticateToken, recommendationsRoutes);
app.use('/api/optimizer', authenticateToken, optimizerRoutes);
app.use('/api/promotions/conflicts', authenticateToken, conflictsRoutes);

app.use('/api/approvals', authenticateToken, approvalsRoutes);
app.use('/api/claims', authenticateToken, claimsRoutes);
app.use('/api/deductions', authenticateToken, deductionsRoutes);
app.use('/api/hierarchy', authenticateToken, hierarchyRoutes);

// ⚠️ DISABLED: Mock/placeholder routes - Use real implementations instead
// app.use('/api', authenticateToken, missingRoutesFixRoutes);

// Socket.IO middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    // Verify token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, config.jwt.secret);
    socket.userId = decoded._id;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('Socket connected', {
    socketId: socket.id,
    userId: socket.userId
  });

  // Join user-specific room
  socket.join(`user:${socket.userId}`);

  // Join role-specific room
  socket.join(`role:${socket.userRole}`);

  // Handle custom events
  socket.on('join:customer', (customerId) => {
    socket.join(`customer:${customerId}`);
  });

  socket.on('join:vendor', (vendorId) => {
    socket.join(`vendor:${vendorId}`);
  });

  socket.on('subscribe:dashboard', (dashboardType) => {
    socket.join(`dashboard:${dashboardType}`);
  });

  socket.on('disconnect', () => {
    logger.info('Socket disconnected', {
      socketId: socket.id,
      userId: socket.userId
    });
  });
});

// Make io accessible to routes
app.set('io', io);

// 404 handler - Must be defined after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    error: {
      code: 'RESOURCE_NOT_FOUND',
      path: req.originalUrl,
      method: req.method
    }
  });
});

// Sentry error handler MUST be before custom error handler
app.use(sentryHandlers.errorHandler);

// Custom error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
const { closeRedis } = require('./config/redis');

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');

  // Close Redis connection
  await closeRedis();

  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');

  // Close Redis connection
  await closeRedis();

  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
