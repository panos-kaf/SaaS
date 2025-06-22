const { Pool } = require('pg');

// Create a connection pool to the postgres database
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'user_management_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Test the connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully');
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};