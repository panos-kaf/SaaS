// This file is the entry point of the application. It initializes the Express app, sets up middleware, and imports routes.

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/config');
const { initializeMessaging } = require('./messaging/setup');
const setRoutes = require('./routes/statisticsRoutes');
const attachUserFromHeader = require('./middleware/attachUser');

const app = express();
const PORT = config.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(attachUserFromHeader);

// Set routes
setRoutes(app);

// Start the server
const server = app.listen(PORT, async () => {
  console.log(`Grade Statistics Service is running on port ${PORT}`);
  try {
    await initializeMessaging();
  } catch (error) {
    console.error('Failed to initialize messaging:', error);
  }
});

// Graceful shutdown
const shutdown = () => {
  console.log('Received shutdown signal, closing server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    // If you have DB connections or messaging, close them here
    process.exit(0);
  });
  // Force exit if not closed in 10 seconds
  setTimeout(() => {
    console.error('Forcing shutdown...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);