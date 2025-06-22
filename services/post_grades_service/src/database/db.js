const { Pool } = require('pg');

// Configure your PostgreSQL connection details.
// It's highly recommended to use environment variables for sensitive data.
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'your_db_user', // Replace 'your_db_user' or set POSTGRES_USER env var
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'post_grades_db', // Database name for this service
  password: process.env.POSTGRES_PASSWORD || 'your_db_password', // Replace 'your_db_password' or set POSTGRES_PASSWORD env var
  port: process.env.POSTGRES_PORT || 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};