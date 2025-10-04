const { Pool } = require('pg');
const { DATABASE_CONFIGS } = require('../../../tests/config/test-config');

const env = process.env.NODE_ENV || 'development';
const config = DATABASE_CONFIGS[env];

if (!config) {
  throw new Error(`No database configuration found for environment: ${env}`);
}

const pool = new Pool({
  ...config,
  max: env === 'test'? 5 : 20, // Lower max connections for test environment
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
