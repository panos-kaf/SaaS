const express = require('express');
const config = require('./config/config');
const gradesRoutes = require('./routes/grades');
const { initializeMessaging } = require('./messaging/setup');

// Initialize Express app
const app = express();
const PORT = config.server.port;


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/api', gradesRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Service is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Students Courses Service running on port ${PORT}`);
  
  // Initialize messaging system
  try {
    await initializeMessaging();
  } catch (error) {
    console.error('Failed to initialize messaging system:', error);
  }
});
