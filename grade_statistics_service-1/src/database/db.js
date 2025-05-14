const { Pool } = require('pg');

const pool = new Pool({
    user: 'your_username',
    host: 'db', // This should match the service name in docker-compose.yml
    database: 'grade_statistics',
    password: 'your_password',
    port: 5432,
});

const query = (text, params) => pool.query(text, params);

module.exports = {
    query,
};