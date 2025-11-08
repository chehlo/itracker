const pool = require("../../backend/src/config/database");
const { Client } = require("pg");
const { DATABASE_CONFIGS } = require("../config/test-config");

async function clearTestDatabase() {
  try {
    await pool.query("DELETE FROM transactions");
    await pool.query("DELETE FROM investments");
    await pool.query("DELETE FROM portfolios");
    await pool.query("DELETE FROM users");
    console.log("Test database cleared.");
  } catch (err) {
    console.error("Error clearing test database:", err);
    throw err;
  }
}

async function closeTestConnections() {
  try {
    await pool.end();
    console.log("Test database connections closed.");
  } catch (err) {
    console.error("Error closing test database connections:", err);
    throw err;
  }
}

async function createTestClient() {
  const config = process.env.NODE_ENV === 'test'
    ? DATABASE_CONFIGS.test 
    : DATABASE_CONFIGS.development;
  const client = new Client(config);
  await client.connect();
  return client;
}

async function closeTestClient(client) {
  if (client) {
    await client.end();
  }
}

module.exports = {
  createTestClient,
  closeTestClient,
  clearTestDatabase,
  closeTestConnections,
};
