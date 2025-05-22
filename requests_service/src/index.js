const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/config');
const requestsRoutes = require('./routes/requestsRoutes');
const { initializeMessaging } = require('./messaging/setup');

// Load environment variables handled by dotenv in config

const app = express();
const PORT = config.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use(requestsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Requests service running on port ${PORT}`);
  
  // Initialize the messaging system
  try {
    await initializeMessaging();
    console.log('Messaging system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize messaging system:', error);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  // Close RabbitMQ connection
  const { subscriber } = require('./messaging/setup');
  await subscriber.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Shutting down gracefully...');
  // Close RabbitMQ connection
  const { subscriber } = require('./messaging/setup');
  await subscriber.close();
  process.exit(0);
});