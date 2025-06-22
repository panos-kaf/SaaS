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
app.listen(PORT, async () => {
  console.log(`Grade Statistics Service is running on port ${PORT}`);
  try {
    await initializeMessaging();
  } catch (error) {
    console.error('Failed to initialize messaging:', error);
  }
});