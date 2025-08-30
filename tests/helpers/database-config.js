// Database configuration for tests
const TEST_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'investment_tracker_dev',
  user: process.env.DB_USER || 'dev_user',
  password: process.env.DB_PASSWORD || 'dev_password',
};

// Helper to create database client
const { Client } = require('pg');

async function createTestClient() {
  const client = new Client(TEST_DB_CONFIG);
  await client.connect();
  return client;
}

// Helper to safely close client
async function closeTestClient(client) {
  if (client) {
    await client.end();
  }
}

module.exports = {
  TEST_DB_CONFIG,
  createTestClient,
  closeTestClient
};
