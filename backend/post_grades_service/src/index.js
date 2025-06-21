const express = require('express');
const gradesRoutes = require('./routes/gradesRoutes');
const { initializeMessaging } = require('./messaging/setup');
const config = require('./config/config');
const attachUserFromHeader = require('./middleware/attachUser');

const app = express();
// Using config for port
const port = config.PORT || 3002;

app.use(express.json()); // Middleware to parse JSON bodies
app.use(attachUserFromHeader);

// Routes
app.use('/', gradesRoutes);

// Initialize the messaging system
initializeMessaging().catch(err => {
  console.error('Failed to initialize messaging:', err);
  // Continue starting the server even if messaging fails
});

app.listen(port, () => {
  console.log(`Post Grades Service running on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  // Close RabbitMQ connection
  const publisher = require('./messaging/publisher');
  await publisher.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Shutting down gracefully...');
  // Close RabbitMQ connection
  const publisher = require('./messaging/publisher');
  await publisher.close();
  process.exit(0);
});