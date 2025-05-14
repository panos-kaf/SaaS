// This file is the entry point of the application. It initializes the Express app, sets up middleware, and imports routes.

const express = require('express');
const bodyParser = require('body-parser');
const setRoutes = require('./routes/statisticsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

setRoutes(app);

app.listen(PORT, () => {
    console.log(`Grade Statistics Service is running on port ${PORT}`);
});