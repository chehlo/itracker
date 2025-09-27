const CONTAINER_NAMES = {
  development: 'investment_tracker_db',
  test: 'investment_tracker_test_db',
};

const DATABASE_CONFIGS = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'investment_tracker_dev',
    user: process.env.DB_USER || 'dev_user',
    password: process.env.DB_PASSWORD || 'dev_password',
  },
  test: {
    host: process.env.AUTH_DB_HOST || 'localhost',
    port: parseInt(process.env.AUTH_DB_PORT) || 5433,
    database: process.env.AUTH_DB_NAME || 'investment_tracker_test',
    user: process.env.AUTH_DB_USER || 'test_user',
    password: process.env.AUTH_DB_PASSWORD || 'test_password',
  },
};

const TEST_SETTINGS = {
  timeout: 10000, // 10 seconds timeout for async operations
  retries: 3,     // Retry failed tests up to 3 times
};

module.exports = {
  CONTAINER_NAMES,
  DATABASE_CONFIGS,
  TEST_SETTINGS,
};

