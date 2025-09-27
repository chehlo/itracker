const { CONTAINER_NAMES, DATABASE_CONFIGS } = require('../config/test-config');

// Helper to create database client
const { Client } = require('pg');

async function createAuthTestClient() {
    const client = new Client(DATABASE_CONFIGS.test);
  await client.connect();
  return client;
}

async function closeAuthTestClient(client) {
  if (client) {
    await client.end();
  }
}

async function createTestClient() {
  const client = new Client(DATABASE_CONFIGS.development);
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
  createTestClient,
  closeTestClient,
  createAuthTestClient,
  closeAuthTestClient,
};
