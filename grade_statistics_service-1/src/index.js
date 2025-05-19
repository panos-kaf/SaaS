// This file is the entry point of the application. It initializes the Express app, sets up middleware, and imports routes.

const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config/config');
const { initializeMessaging } = require('./messaging/setup');
const setRoutes = require('./routes/statisticsRoutes');

const app = express();
const PORT = config.PORT || 3000;

// Initialize middleware
app.use(bodyParser.json());

// Set routes
setRoutes(app);

// Start the server
app.listen(PORT, async () => {
    console.log(`Grade Statistics Service is running on port ${PORT}`);
    
    // Initialize messaging after server is started
    try {
        await initializeMessaging();
    } catch (error) {
        console.error('Failed to initialize messaging:', error);
    }
});