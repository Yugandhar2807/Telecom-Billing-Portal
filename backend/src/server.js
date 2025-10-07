// backend/src/server.js

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const errorHandler = require('../middleware/errorHandler'); 

// Database utilities
const {
  initializeDatabase,
  healthCheck,
  closeConnection
} = require('../utils/database');

// Route modules
const authRoutes     = require('../routes/auth');
const reportRoutes   = require('../routes/reports');
const planRoutes     = require('../routes/plans');
const invoiceRoutes  = require('../routes/invoices');
const paymentRoutes  = require('../routes/payments');
const usageRoutes    = require('../routes/usage');

const app = express();

// Security headers
app.use(helmet());

// Enable trust proxy for correct IP detection behind proxies (e.g., Nginx, React dev server)
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max:     parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
});
app.use(limiter);

// CORS setup for development and Codespaces
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  /^https:\/\/.*\.app\.github\.dev$/,
  /^https:\/\/.*\.github\.dev$/,
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origin ${origin} not allowed`);
      callback(null, true); // Allow in development
    }
  },
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploads
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'))
);

// Health-check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    const ok       = dbHealth.status === 'healthy';
    res
      .status(ok ? 200 : 503)
      .json({
        status:      ok ? 'OK' : 'ERROR',
        timestamp:   new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database:    dbHealth
      });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

// API root
app.get('/', (req, res) => {
  const v = process.env.API_VERSION || 'v1';
  res.json({
    message:   'Telecom Billing Portal API',
    version:   '1.0.0',
    status:    'healthy',
    endpoints: {
      health:   '/health',
      auth:     `/api/${v}/auth`,
      reports:  `/api/${v}/reports`,
      plans:    `/api/${v}/plans`,
      invoices: `/api/${v}/invoices`,
      payments: `/api/${v}/payments`,
      usage:    `/api/${v}/usage`
    }
  });
});

// Mount all API routers under /api/:version
const API_VERSION = process.env.API_VERSION || 'v1';
app.use(`/api/${API_VERSION}/auth`,     authRoutes);
app.use(`/api/${API_VERSION}/reports`,  reportRoutes);
app.use(`/api/${API_VERSION}/plans`,    planRoutes);
app.use(`/api/${API_VERSION}/invoices`, invoiceRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
app.use(`/api/${API_VERSION}/usage`,    usageRoutes);

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error:   'Route not found',
    path:    req.originalUrl,
    method:  req.method
  });
});

// Global error handler
app.use(errorHandler);

// Bootstrap: initialize DB then start server
const PORT = process.env.PORT || 8000;
async function startServer() {
  try {
    console.log('🔄 Starting Telecom Billing Portal API...');
    const connected = await initializeDatabase();
    if (!connected) {
      console.warn('⚠️ Database initialization failed – proceeding without DB.');
    }
    const server = app.listen(PORT, () => {
      console.log(
        `🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\n🔄 Shutdown signal received, closing server...');
      server.close(async () => {
        console.log('✅ HTTP server closed');
        await closeConnection();
        process.exit(0);
      });
      setTimeout(() => {
        console.error('❌ Forced shutdown');
        process.exit(1);
      }, 10000);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT',  shutdown);

    // Catch unhandled rejections
    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Promise Rejection:', err);
      shutdown();
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;