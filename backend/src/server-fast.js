const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');

const app = express();

// Basic configuration
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/trade_ai_production';

console.log('🚀 Starting TRADEAI Backend...');
console.log('📊 Environment:', process.env.NODE_ENV || 'production');
console.log('🔌 Port:', PORT);
console.log('🗄️ MongoDB:', MONGODB_URI);

// Quick middleware setup
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Immediate health check (no dependencies)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'TRADEAI Backend',
    version: '2.1.3'
  });
});

// Basic API endpoint for testing
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'TRADEAI Backend is running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// Connect to MongoDB with timeout
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 5000
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log('📍 Host:', mongoose.connection.host);
    console.log('📂 Database:', mongoose.connection.name);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    // Don't exit - continue without database for health checks
    console.log('⚠️ Continuing without database connection...');
  }
};

// Load routes after basic setup
const loadRoutes = async () => {
  try {
    console.log('🔄 Loading API routes...');
    
    // Import routes dynamically to handle missing dependencies gracefully
    const authRoutes = require('./routes/auth');
    const userRoutes = require('./routes/user');
    const customerRoutes = require('./routes/customer');
    const productRoutes = require('./routes/product');
    const promotionRoutes = require('./routes/promotion');
    const budgetRoutes = require('./routes/budget');
    const dashboardRoutes = require('./routes/dashboard');
    
    // Register routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/customers', customerRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/promotions', promotionRoutes);
    app.use('/api/budgets', budgetRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    
    console.log('✅ API routes loaded successfully');
    
  } catch (error) {
    console.error('⚠️ Error loading routes:', error.message);
    console.log('🔄 Continuing with basic health check only...');
  }
};

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server immediately
const startServer = async () => {
  try {
    console.log('🚀 Starting HTTP server...');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('✅ Server started successfully!');
      console.log(`🌐 Server running on http://0.0.0.0:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Status check: http://localhost:${PORT}/api/status`);
    });

    // Connect to database after server starts
    setTimeout(connectDB, 1000);
    
    // Load routes after database connection
    setTimeout(loadRoutes, 2000);

    // Graceful shutdown
    const shutdown = () => {
      console.log('🔄 Shutting down gracefully...');
      server.close(() => {
        if (mongoose.connection.readyState === 1) {
          mongoose.connection.close();
        }
        console.log('✅ Server shutdown complete');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();