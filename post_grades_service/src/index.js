const express = require('express');
const gradesRoutes = require('./routes/gradesRoutes');

const app = express();
// It's good practice to use a different port for each microservice.
// Consider using environment variables for port configuration in a real app.
const port = process.env.POST_GRADES_PORT || 3002;

app.use(express.json()); // Middleware to parse JSON bodies

// All routes for this service will be prefixed with /api
app.use('/api', gradesRoutes);

app.listen(port, () => {
  console.log(`Post Grades Service running on port ${port}`);
});