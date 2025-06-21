const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/config');
const db = require('./database/db');
const { initializeMessaging, closeMessaging } = require('./messaging/setup');
const institutionRoutes = require('./routes/institutionRoutes');
const attachUserFromHeader = require('./middleware/attachUser');

// Initialize express app
const app = express();
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(attachUserFromHeader);

// Routes
app.use('/', institutionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: config.SERVICE_NAME,
    status: 'up',
    timestamp: new Date(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start the server
const startServer = async () => {
  try {
    // Initialize database
    const dbInitialized = await db.initDatabase();
    if (!dbInitialized) {
      console.error('Failed to initialize database');
      process.exit(1);
    }
    
    // Initialize messaging system
    const messagingInitialized = await initializeMessaging();
    if (!messagingInitialized) {
      console.error('Failed to initialize messaging');
      // Continue without messaging for now
    }
    
    // Start the server
    app.listen(config.PORT, () => {
      console.log(`Institution service listening on port ${config.PORT}`);
      console.log(`Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash the server
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Exit with error
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  await closeMessaging();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Shutting down gracefully...');
  await closeMessaging();
  process.exit(0);
});

// Start the server
startServer();
