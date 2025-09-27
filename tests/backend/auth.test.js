const request = require('../../backend/node_modules/supertest');
const app = require('../../backend/src/app.js');
const { createAuthTestClient, closeAuthTestClient } = require('../helpers/database-config.js')

// Add beforeAll setup in auth test file to ensure test database exists and is running
// Check if test database container is running, start if needed
// Ensure test database has schema but starts empty for each test run
// Add error handling for database connection failures with helpful messages

let client;
beforeAll(async () => {
  client = await createAuthTestClient().catch(async (err) => {
    console.error('Error connecting to test database:', err.message);
    console.error('Make sure the test database is running and accessible.');
    process.exit(1);
  });

  if (client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

});

beforeEach(async () => {
  // Clean up users table before each test
  await client.query('DELETE FROM users');
});

afterAll(async () => {
  await closeAuthTestClient(client);
});

describe('Authentication Endpoints', () => {
const userData = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(userData.email);
    expect(res.body.user.name).toBe(userData.name);
  });

  it('should not register with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: userData.email, password: userData.password });
    expect(res.statusCode).toEqual(400);
  });

  it('should not register duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(userData);
    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);
    expect(res.statusCode).toEqual(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send(userData);
  });

  it('should login an existing user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: userData.password });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body.user.name).toBe(userData.name);
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: 'wrongpassword' });
      expect(res.statusCode).toEqual(401);
    });

    it('should not login non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wronguser@mail.com', password: 'password123' });
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);
      token = res.body.token;
    });

    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.email).toBe(userData.email);
      expect(res.body.name).toBe(userData.name);
    });

    it('should not get profile without token', async () => {
      const res = await request(app)
        .get('/api/auth/profile');
      expect(res.statusCode).toEqual(401);
    });

    it('should not get profile with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.statusCode).toEqual(401);
    });
  });
});

