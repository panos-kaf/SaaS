const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read database configuration from environment variables
const config = {
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'db',
  database: process.env.POSTGRES_DB || 'institution_db',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
};

// Create a new Pool instance with the configuration
const pool = new Pool(config);

// Initialize database function
const initDatabase = async () => {
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');
    
    // Read and execute the schema.sql file
    const schemaFile = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaFile, 'utf8');
    
    await client.query(schema);
    console.log('Database schema initialized successfully');
    
    client.release();
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initDatabase,
};
