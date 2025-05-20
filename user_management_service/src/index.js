const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const { initializeMessaging } = require('./messaging/setup');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'user-management-service' });
});

// Start server
const PORT = config.port;
app.listen(PORT, async () => {
  console.log(`User Management Service running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
  
  // Initialize the messaging system after server has started
  try {
    await initializeMessaging();
  } catch (error) {
    console.error('Failed to initialize messaging:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  // Close RabbitMQ connection
  const { publisher } = require('./messaging/setup');
  await publisher.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Shutting down gracefully...');
  // Close RabbitMQ connection
  const { publisher } = require('./messaging/setup');
  await publisher.close();
  process.exit(0);
});

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

module.exports = app;