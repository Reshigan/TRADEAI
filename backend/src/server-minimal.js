const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');

const app = express();

// Basic configuration
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/trade_ai_production';

console.log('🚀 Starting TRADEAI Backend (Minimal Mode)...');
console.log('📊 Environment:', process.env.NODE_ENV || 'production');
console.log('🔌 Port:', PORT);
console.log('🗄️ MongoDB:', MONGODB_URI);

// Quick middleware setup
app.use(helmet({ 
  contentSecurityPolicy: false, 
  crossOriginEmbedderPolicy: false 
}));

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
    version: '2.1.3',
    mode: 'minimal'
  });
});

// Basic API endpoint for testing
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'TRADEAI Backend is running (minimal mode)',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mode: 'minimal'
  });
});

// Basic auth endpoint for testing
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login endpoint available',
    token: 'demo-token-' + Date.now(),
    user: {
      id: 1,
      email: 'admin@tradeai.com',
      name: 'Admin User',
      role: 'admin'
    }
  });
});

// Basic dashboard endpoint
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 1,
      totalCompanies: 1,
      totalProducts: 0,
      totalPromotions: 0,
      revenue: 0,
      growth: 0
    }
  });
});

// Connect to MongoDB (optional)
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log('📍 Host:', mongoose.connection.host);
    console.log('📂 Database:', mongoose.connection.name);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️ Continuing without database connection...');
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
    path: req.originalUrl,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/status',
      'POST /api/auth/login',
      'GET /api/dashboard/stats'
    ]
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
      console.log(`🔐 Login test: POST http://localhost:${PORT}/api/auth/login`);
    });

    // Connect to database after server starts (optional)
    setTimeout(connectDB, 2000);

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