const pool = require("../../backend/src/config/database");
const { Client } = require("pg");
const { DATABASE_CONFIGS } = require("../config/test-config");

async function clearTestDatabase() {
  try {
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
  const client = new Client(DATABASE_CONFIGS.development);
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
