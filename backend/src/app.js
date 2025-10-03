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

// Load all models to ensure they are registered with Mongoose
require('./models');

// Import routes
const authRoutes = require('./routes/auth');
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
const salesHistoryRoutes = require('./routes/salesHistory');
const masterDataRoutes = require('./routes/masterData');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/report');
const analyticsRoutes = require('./routes/analytics');
const integrationRoutes = require('./routes/integration');
const mlRoutes = require('./routes/ml');
const salesRoutes = require('./routes/sales');
const tenantRoutes = require('./routes/tenantRoutes');

// Create Express app
const app = express();

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

// Security middleware - Enhanced with comprehensive security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
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

// CORS
app.use(cors(config.cors));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB sanitization
app.use(mongoSanitize());

// Compression
app.use(compression());

// Logging
app.use(morgan('combined', { stream: logger.stream }));

// Debug: Log all incoming requests
app.use((req, res, next) => {
  console.log(`[REQUEST DEBUG] ${req.method} ${req.url} - Headers:`, JSON.stringify(req.headers.authorization ? { authorization: req.headers.authorization } : {}));
  next();
});

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use('/api/', limiter);

// Tenant isolation middleware (before authentication)
app.use(tenantCleanup);
app.use('/api/', tenantIsolation);

// API Documentation
const swaggerOptions = {
  definition: config.swagger.definition,
  apis: config.swagger.apis,
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Trade AI Backend API',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/companies', authenticateToken, companyRoutes);
app.use('/api/trading-terms', authenticateToken, tradingTermsRoutes);
app.use('/api/customers', authenticateToken, customerRoutes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/vendors', authenticateToken, vendorRoutes);
app.use('/api/budgets', authenticateToken, budgetRoutes);
app.use('/api/promotions', authenticateToken, promotionRoutes);
app.use('/api/campaigns', authenticateToken, campaignRoutes);
app.use('/api/trade-spends', authenticateToken, tradeSpendRoutes);
app.use('/api/activity-grid', authenticateToken, activityGridRoutes);
app.use('/api/sales-history', authenticateToken, salesHistoryRoutes);
app.use('/api/master-data', authenticateToken, masterDataRoutes);
app.use('/api/dashboards', authenticateToken, dashboardRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/integration', authenticateToken, integrationRoutes);
app.use('/api/ml', authenticateToken, mlRoutes);
app.use('/api/sales', authenticateToken, salesRoutes);

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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

module.exports = { app, server, io };