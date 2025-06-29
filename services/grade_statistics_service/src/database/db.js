const { Pool } = require('pg');
const config = require('../config/config');

const pool = new Pool({
    user: config.DB_USER,
    host: config.DB_HOST,
    database: config.DB_NAME,
    password: config.DB_PASSWORD,
    port: config.DB_PORT,
});

// Log connection status
pool.on('connect', () => {
    console.log('Connected to the database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

const query = (text, params) => pool.query(text, params);

module.exports = {
    query,
    pool,
};